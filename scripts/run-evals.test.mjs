import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, test } from 'node:test'

import { buildConfig, checkSuite, listSuites, renderTable, ruleBody, summarize } from './run-evals.mjs'

const SUITE = `- description: first
  vars:
    task: Do A
  assert:
    - type: javascript
      value: /a/.test(output)
- description: second
  vars:
    task: Do B
  assert:
    - type: contains
      value: b
- description: third
  vars:
    task: Do C
  assert:
    - type: contains
      value: c
`

describe('run-evals', () => {
  test('listSuites maps evals/<category>/<name>.yaml to rules/<category>/<name>.md', () => {
    const root = mkdtempSync(join(tmpdir(), 'evals-'))
    mkdirSync(join(root, 'evals', 'frontend'), { recursive: true })
    writeFileSync(join(root, 'evals', 'frontend', 'nextjs.yaml'), SUITE)
    writeFileSync(join(root, 'evals', 'promptfooconfig.yaml'), 'description: x\n')
    const [suite, ...rest] = listSuites(root)
    assert.equal(rest.length, 0)
    assert.equal(suite.id, 'frontend/nextjs')
    assert.equal(suite.ruleFile, join(root, 'rules', 'frontend', 'nextjs.md'))
  })

  test('checkSuite accepts complete tests and flags missing parts', () => {
    assert.deepEqual(checkSuite(SUITE), [])
    const problems = checkSuite('- description: only\n  vars:\n    task: x\n')
    assert.ok(problems.some(p => p.includes('at least 3')))
    assert.ok(problems.some(p => p.includes('no assert')))
  })

  test('ruleBody drops the frontmatter', () => {
    assert.equal(ruleBody('---\nid: a/b\n---\n\n# Title\n\nText\n'), '# Title\n\nText')
  })

  test('buildConfig runs each test with and without the rule', () => {
    const config = buildConfig({ suite: { id: 'a/b', suiteFile: '/r/evals/a/b.yaml' }, ruleText: 'RULE', providers: ['p1', 'p2'], promptsFile: '/r/evals/prompts.cjs' })
    assert.deepEqual(config.prompts.map(p => p.label), ['with-rule', 'without-rule'])
    assert.deepEqual(config.providers.map(p => p.id), ['p1', 'p2'])
    assert.equal(config.defaultTest.vars.rule_text, 'RULE')
    assert.deepEqual(config.tests, ['file:///r/evals/a/b.yaml'])
    assert.equal(config.sharing, false)
  })

  test('summarize and renderTable report pass rates and uplift', () => {
    const data = { results: { results: [
      { prompt: { label: 'with-rule' }, provider: { id: 'p1' }, success: true },
      { prompt: { label: 'with-rule' }, provider: { id: 'p1' }, success: true },
      { prompt: { label: 'without-rule' }, provider: { id: 'p1' }, success: true },
      { prompt: { label: 'without-rule' }, provider: { id: 'p1' }, success: false },
    ] } }
    const rows = summarize('a/b', data)
    assert.equal(rows.length, 1)
    assert.equal(rows[0]['with-rule'].rate, 1)
    assert.equal(rows[0]['without-rule'].rate, 0.5)
    assert.match(renderTable(rows), /\| a\/b \| p1 \| 100% \(2\/2\) \| 50% \(1\/2\) \| 50 pts \|/)
  })
})
