import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { after, describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  checkDate,
  extractPackages,
  isHiddenCodePoint,
  lint,
  parseFrontmatter,
  splitFrontmatter,
} from './lint-rules.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const fixtures = join(here, 'fixtures')
const script = join(here, 'lint-rules.mjs')
const today = new Date('2026-10-29T12:00:00Z')

const temps = []
function tempCopy (name) {
  const dir = mkdtempSync(join(tmpdir(), 'lint-rules-'))
  temps.push(dir)
  cpSync(join(fixtures, name), dir, { recursive: true })
  return dir
}
function tempRepo (files) {
  const dir = mkdtempSync(join(tmpdir(), 'lint-rules-'))
  temps.push(dir)
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true })
    writeFileSync(join(dir, path), content)
  }
  return dir
}
after(() => temps.forEach(dir => rmSync(dir, { recursive: true, force: true })))

const rulesOf = (issues, rule) => issues.filter(issue => issue.rule === rule)

describe('fixtures', () => {
  test('a valid rule, core rule and skill pass with no issues', async () => {
    const result = await lint({ root: join(fixtures, 'valid'), today })
    assert.deepEqual(result.errors, [])
    assert.deepEqual(result.warnings, [])
    assert.equal(result.filesChecked, 3)
  })

  test('a missing required heading is an error', async () => {
    const result = await lint({ root: join(fixtures, 'missing-heading'), today })
    const headings = rulesOf(result.errors, 'headings')
    assert.equal(headings.length, 1)
    assert.match(headings[0].message, /## Security/)
    assert.equal(headings[0].file, 'rules/backend/example.md')
  })

  test('an unresolved legacy_rule is only a warning', async () => {
    const result = await lint({ root: join(fixtures, 'missing-heading'), today })
    const refs = rulesOf(result.warnings, 'cross-reference')
    assert.ok(refs.some(ref => ref.message.includes('legacy/missing-rule')))
    assert.deepEqual(rulesOf(result.errors, 'cross-reference'), [])
  })

  test('hidden Unicode is reported with file, line and code point', async () => {
    const dir = tempCopy('hidden-unicode')
    const file = join(dir, 'rules/frontend/example.md')
    writeFileSync(file, readFileSync(file, 'utf8').replace('{{U+200B}}', String.fromCodePoint(0x200b)))
    const result = await lint({ root: dir, today })
    const hidden = rulesOf(result.errors, 'hidden-unicode')
    assert.equal(hidden.length, 1)
    assert.equal(hidden[0].file, 'rules/frontend/example.md')
    assert.equal(hidden[0].line, 24)
    assert.match(hidden[0].message, /U\+200B at column 13/)
  })

  test('hidden Unicode is caught in any text file, including tag characters', async () => {
    const dir = tempRepo({
      'README.md': `ok\nbad${String.fromCodePoint(0xe0041)}\n`,
      'scripts/tool.sh': `echo ${String.fromCodePoint(0x202e)}hi\n`,
    })
    const result = await lint({ root: dir, today })
    const hidden = rulesOf(result.errors, 'hidden-unicode')
    assert.deepEqual(hidden.map(h => [h.file, h.line]), [['README.md', 2], ['scripts/tool.sh', 1]])
    assert.match(hidden[0].message, /U\+E0041/)
  })

  test('a bad skill name is an error', async () => {
    const result = await lint({ root: join(fixtures, 'bad-skill-name'), today })
    const names = rulesOf(result.errors, 'skill-name')
    assert.equal(names.length, 1)
    assert.match(names[0].message, /a-z, 0-9/)
  })

  test('an oversized rule is an error', async () => {
    const result = await lint({ root: join(fixtures, 'oversized'), today })
    const size = rulesOf(result.errors, 'size')
    assert.equal(size.length, 1)
    assert.match(size[0].message, /514 lines/)
  })
})

describe('rule checks', () => {
  const rule = (overrides = '') => `---
id: frontend/thing
title: Thing
description: A thing.
applies_to: "any"
globs: []
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-01
sources:
  - https://example.com
${overrides}---

## Version check
## Conventions
## Security
## Known vulnerabilities
This list goes stale.
## Testing
## Before you finish
`

  test('alwaysApply outside rules/core is an error', async () => {
    const dir = tempRepo({ 'rules/frontend/thing.md': rule().replace('alwaysApply: false', 'alwaysApply: true') })
    const result = await lint({ root: dir, today })
    assert.equal(rulesOf(result.errors, 'always-apply').length, 1)
  })

  test('id must match the path, tier must be P0-P3, sources must be URLs', async () => {
    const text = rule()
      .replace('id: frontend/thing', 'id: frontend/other')
      .replace('tier: P2', 'tier: P5')
      .replace('  - https://example.com', '  - not a url')
    const dir = tempRepo({ 'rules/frontend/thing.md': text })
    const result = await lint({ root: dir, today })
    assert.equal(rulesOf(result.errors, 'id').length, 1)
    assert.equal(rulesOf(result.errors, 'tier').length, 1)
    assert.equal(rulesOf(result.errors, 'sources').length, 1)
  })

  test('missing keys, bad dates and stale reviews are reported', async () => {
    const dir = tempRepo({
      'rules/frontend/thing.md': rule().replace('owner: "@Phaedra-Solutions/maintainers"\n', ''),
      'rules/frontend/dated.md': rule().replace('frontend/thing', 'frontend/dated').replace('2026-10-01', '2026-02-30'),
      'rules/frontend/old.md': rule().replace('frontend/thing', 'frontend/old').replace('2026-10-01', '2026-01-01'),
    })
    const result = await lint({ root: dir, today })
    assert.ok(result.errors.some(e => e.file === 'rules/frontend/thing.md' && /missing required key "owner"/.test(e.message)))
    assert.ok(result.errors.some(e => e.file === 'rules/frontend/dated.md' && e.rule === 'last-reviewed'))
    assert.ok(result.warnings.some(w => w.file === 'rules/frontend/old.md' && /301 days old/.test(w.message)))
  })

  test('legacy rules also need a Migration path heading', async () => {
    const dir = tempRepo({ 'rules/legacy/thing.md': rule().replace('frontend/thing', 'legacy/thing') })
    const result = await lint({ root: dir, today })
    assert.ok(result.errors.some(e => /Migration path/.test(e.message)))
  })

  test('headings inside code fences do not count', async () => {
    const text = rule().replace('## Security\n', '```md\n## Security\n```\n')
    const dir = tempRepo({ 'rules/frontend/thing.md': text })
    const result = await lint({ root: dir, today })
    assert.ok(result.errors.some(e => /## Security/.test(e.message)))
  })
})

describe('frontmatter parser', () => {
  test('parses scalars, inline arrays, block lists, maps and comments', () => {
    const fm = splitFrontmatter(`---
id: frontend/x
applies_to: "next >=16.0 <17"          # comment
globs: ["app/**/*.{ts,tsx}", 'proxy.ts']
alwaysApply: false
note: value # trailing comment
hash: "a # not a comment"
sources:
  - https://a.example
  - "https://b.example"
metadata:
  owner: "@team"
  last_reviewed: "2026-10-29"
---
body
`)
    assert.equal(fm.body, 'body\n')
    const { data, errors } = parseFrontmatter(fm.yaml)
    assert.deepEqual(errors, [])
    assert.equal(data.applies_to, 'next >=16.0 <17')
    assert.deepEqual(data.globs, ['app/**/*.{ts,tsx}', 'proxy.ts'])
    assert.equal(data.alwaysApply, false)
    assert.equal(data.note, 'value')
    assert.equal(data.hash, 'a # not a comment')
    assert.deepEqual(data.sources, ['https://a.example', 'https://b.example'])
    assert.deepEqual(data.metadata, { owner: '@team', last_reviewed: '2026-10-29' })
  })

  test('reports malformed lines and duplicate keys', () => {
    const { errors } = parseFrontmatter('id: a\nid: b\nnot valid\n')
    assert.equal(errors.length, 2)
  })

  test('checkDate validates real calendar dates', () => {
    assert.equal(checkDate('2026-02-29').valid, false)
    assert.equal(checkDate('2026-10-29', today).days, 0)
    assert.equal(checkDate('29/10/2026').valid, false)
  })

  test('isHiddenCodePoint covers every listed range', () => {
    for (const cp of [0x200b, 0x200d, 0x2060, 0xfeff, 0x202a, 0x202e, 0x2066, 0x2069, 0xe0000, 0xe007f]) {
      assert.equal(isHiddenCodePoint(cp), true, cp.toString(16))
    }
    for (const cp of [0x20, 0xa0, 0x2192, 0x2264, 0x200e]) {
      assert.equal(isHiddenCodePoint(cp), false, cp.toString(16))
    }
  })
})

describe('install command extraction', () => {
  test('finds packages and skips flags, versions and placeholders', () => {
    const found = extractPackages([
      'Run `npm i -D zod@3 @scope/pkg@^1.0.0` then `pnpm add <pkg>`.',
      'pip install --require-hashes -r requirements.txt',
      '`pip install "requests[socks]>=2.31" PACKAGE`',
      '`composer require monolog/monolog:^3.0`',
      '`cargo add serde@1 --features derive`',
      '`go get golang.org/x/vuln/cmd/govulncheck@latest`',
      '`dotnet add package Newtonsoft.Json --version 13.0.4`',
      '`uv add httpx`',
      '`npm install-scripts approve <pkg>`',
    ].join('\n'))
    assert.deepEqual(found.map(f => `${f.registry}:${f.name}`), [
      'npm:zod',
      'npm:@scope/pkg',
      'pypi:requests',
      'packagist:monolog/monolog',
      'crates:serde',
      'go:golang.org/x/vuln/cmd/govulncheck',
      'nuget:Newtonsoft.Json',
      'pypi:httpx',
    ])
  })
})

describe('CLI', () => {
  test('exits 0 on a clean tree and 1 on errors, with --json output', () => {
    const ok = spawnSync(process.execPath, [script, '--root', join(fixtures, 'valid')], { encoding: 'utf8' })
    assert.equal(ok.status, 0, ok.stdout + ok.stderr)
    assert.match(ok.stdout, /0 errors/)

    const bad = spawnSync(process.execPath, [script, '--json', '--root', join(fixtures, 'oversized')], { encoding: 'utf8' })
    assert.equal(bad.status, 1)
    const json = JSON.parse(bad.stdout)
    assert.equal(json.errors[0].rule, 'size')
  })

  test('rejects unknown arguments', () => {
    const result = spawnSync(process.execPath, [script, '--nope'], { encoding: 'utf8' })
    assert.equal(result.status, 2)
  })
})
