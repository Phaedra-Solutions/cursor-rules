import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { after, describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { build, demoteHeadings, expandBraces, renderMdc } from './build.mjs'
import { install, planInstall } from './install.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, 'fixtures', 'build')
const repo = join(here, '..')

const temps = []
const temp = () => {
  const dir = mkdtempSync(join(tmpdir(), 'build-test-'))
  temps.push(dir)
  return dir
}
after(() => temps.forEach(dir => rmSync(dir, { recursive: true, force: true })))

const read = (dir, path) => readFileSync(join(dir, path), 'utf8')

describe('helpers', () => {
  test('expandBraces splits brace groups so comma-separated globs stay valid', () => {
    assert.deepEqual(expandBraces('src/**/*.{ts,tsx}'), ['src/**/*.ts', 'src/**/*.tsx'])
    assert.deepEqual(expandBraces('{a,b}/*.{js,jsx}'), ['a/*.js', 'a/*.jsx', 'b/*.js', 'b/*.jsx'])
    assert.deepEqual(expandBraces('proxy.ts'), ['proxy.ts'])
  })

  test('demoteHeadings skips fenced code', () => {
    assert.equal(demoteHeadings('# A\n## B\n```\n# code\n```\n###### F', 2), '### A\n#### B\n```\n# code\n```\n###### F')
  })

  test('renderMdc omits globs when there are none', () => {
    const text = renderMdc({ id: 'core/x', data: { description: 'D: with colon', alwaysApply: true, globs: [] }, body: '\n# X\n' })
    assert.equal(text, '---\ndescription: "D: with colon"\nalwaysApply: true\n---\n\n# X\n')
  })
})

describe('build with a preset', () => {
  const out = temp()
  const result = build({ root, out, preset: 'example', version: 'test-1' })

  test('warns about missing rules and skills and keeps going', () => {
    assert.ok(result.warnings.some(w => w.includes('rule "backend/missing" doesn\'t exist yet')))
    assert.ok(result.warnings.some(w => w.includes('skill "missing-skill" doesn\'t exist yet')))
    assert.deepEqual(result.manifest.rules, ['core/example-core', 'frontend/example'])
    assert.deepEqual(result.manifest.conventions, ['conventions/house'])
    assert.deepEqual(result.manifest.skills, ['example-skill'])
  })

  test('writes every expected output path', () => {
    const paths = result.manifest.files.map(f => f.path)
    for (const expected of [
      'cursor/.cursor/rules/core/example-core.mdc',
      'cursor/.cursor/rules/frontend/example.mdc',
      'cursor/.cursor/rules/conventions/house.mdc',
      'cursor/.cursor/skills/example-skill/SKILL.md',
      'cursor/.cursor/skills/example-skill/scripts/run.sh',
      'agents/AGENTS.md',
      'agents/.agents/skills/example-skill/SKILL.md',
      'agents/.agents/skills/example-skill/scripts/run.sh',
      'agents/.agents/skills/frontend-example-conventions/SKILL.md',
      'claude/CLAUDE.md',
      'claude/AGENTS.md',
      'claude/.claude/skills/example-skill/SKILL.md',
      'claude/.claude/skills/frontend-example-conventions/SKILL.md',
    ]) assert.ok(paths.includes(expected), expected)
    assert.equal(paths.some(p => p.includes('core-example-core-conventions')), false)
    assert.ok(existsSync(join(out, 'manifest.json')))
  })

  test('the manifest lists a correct sha256 for every file', () => {
    const manifest = JSON.parse(read(out, 'manifest.json'))
    assert.equal(manifest.version, 'test-1')
    assert.equal(manifest.preset, 'example')
    for (const file of manifest.files) {
      const actual = createHash('sha256').update(readFileSync(join(out, file.path))).digest('hex')
      assert.equal(actual, file.sha256, file.path)
    }
  })

  test('.mdc frontmatter keeps only description, globs and alwaysApply', () => {
    const stack = read(out, 'cursor/.cursor/rules/frontend/example.mdc')
    const [, frontmatter] = stack.split('---\n')
    assert.equal(frontmatter, 'description: "Example stack rule for the build tests. Use when editing src/."\nglobs: src/**/*.ts, src/**/*.tsx, example.config.*\nalwaysApply: false\n')
    assert.match(stack, /\n# Example framework\n/)
    const core = read(out, 'cursor/.cursor/rules/core/example-core.mdc')
    assert.match(core, /^---\ndescription: "Always-on example rule for the build tests."\nalwaysApply: true\n---\n/)
    assert.doesNotMatch(core, /globs:|tier:|owner:|sources:/)
  })

  test('AGENTS.md has core rules, house conventions, stack guidance and task skills', () => {
    const agents = read(out, 'agents/AGENTS.md')
    assert.match(agents, /^# Agent instructions\n/)
    assert.match(agents, /preset: example, version: test-1/)
    const sections = agents.split('\n').filter(l => /^## /.test(l))
    assert.deepEqual(sections, ['## Core rules', '## House conventions', '## Stack guidance', '## Task skills'])
    assert.match(agents, /### Example core \(`core\/example-core`\)\n\n#### Behaviour\n\n- Core body line\./)
    assert.match(agents, /- House body line\./)
    assert.match(agents, /\| `frontend\/example` \| Example stack rule for the build tests\. Use when editing src\/\. \| `src\/\*\*\/\*\.ts`, `src\/\*\*\/\*\.tsx`, `example\.config\.\*` \| `frontend-example-conventions` \|/)
    assert.match(agents, /- `example-skill`: Example skill for the build tests\./)
    assert.doesNotMatch(agents, /Stack body line/)
    assert.equal(read(out, 'claude/AGENTS.md'), agents)
    assert.match(read(out, 'claude/CLAUDE.md'), /^@AGENTS\.md$/m)
  })

  test('the generated stack skill is a valid Agent Skill built from the rule', () => {
    const skill = read(out, 'agents/.agents/skills/frontend-example-conventions/SKILL.md')
    assert.match(skill, /^---\nname: frontend-example-conventions\n/)
    assert.match(skill, /description: "Example stack rule for the build tests\. Use when editing src\/\. Load before editing files that match: src\/\*\*\/\*\.ts, src\/\*\*\/\*\.tsx, example\.config\.\*\."/)
    assert.match(skill, /sources: "https:\/\/example\.com\/a https:\/\/example\.com\/b"/)
    assert.match(skill, /\n# Example framework\n/)
    assert.match(skill, /```md\n# not a heading\n```/)
  })

  test('skill scripts keep their executable bit', () => {
    const mode = statSync(join(out, 'agents/.agents/skills/example-skill/scripts/run.sh')).mode & 0o111
    assert.notEqual(mode, 0)
  })
})

describe('build without a preset', () => {
  test('includes every rule, convention and skill, with no warnings', () => {
    const result = build({ root, out: temp(), version: 'test-2' })
    assert.deepEqual(result.warnings, [])
    assert.deepEqual(result.manifest.rules, ['core/example-core', 'frontend/example'])
    assert.equal(result.manifest.preset, null)
  })

  test('an unknown preset is an error', () => {
    assert.throws(() => build({ root, out: temp(), preset: 'nope' }), /preset "nope" not found/)
  })

  test('the real repository builds', () => {
    const result = build({ root: repo, out: temp(), version: 'test-repo' })
    assert.ok(result.manifest.rules.includes('core/behavior'))
    assert.ok(result.manifest.skills.includes('security-audit'))
  })
})

describe('install', () => {
  const quiet = () => {}

  test('dry run plans every copy and writes nothing', () => {
    const dest = temp()
    const result = install({ root, preset: 'example', tools: ['cursor', 'agents', 'claude'], dest, dryRun: true, log: quiet })
    assert.equal(result.written.length, 0)
    const targets = result.plan.map(p => p.to)
    assert.ok(targets.includes('.cursor/rules/frontend/example.mdc'))
    assert.ok(targets.includes('.agents/skills/frontend-example-conventions/SKILL.md'))
    assert.ok(targets.includes('.claude/skills/example-skill/scripts/run.sh'))
    assert.ok(targets.includes('AGENTS.md'))
    assert.ok(targets.includes('CLAUDE.md'))
    assert.equal(targets.some(t => t.startsWith('.cursor/skills/')), false)
    assert.equal(existsSync(join(dest, 'AGENTS.md')), false)
  })

  test('installs, then reports unchanged files and refreshes the version file', () => {
    const dest = temp()
    const first = install({ root, preset: 'example', tools: ['cursor'], dest, log: quiet, today: new Date('2026-10-29T00:00:00Z') })
    assert.ok(first.written.includes('.cursor/rules/core/example-core.mdc'))
    assert.ok(first.written.includes('.cursor/skills/example-skill/SKILL.md'))
    const version = read(dest, '.cursor/rules/.cursor-rules-version')
    assert.match(version, /^source: Phaedra-Solutions\/cursor-rules\n/)
    assert.match(version, /preset: example\ntools: cursor\nmanifest_sha256: [0-9a-f]{64}\ninstalled: 2026-10-29\n/)

    const second = install({ root, preset: 'example', tools: ['cursor'], dest, log: quiet })
    assert.deepEqual(second.written, ['.cursor/rules/.cursor-rules-version'])
    assert.equal(second.counts.same, first.written.length - 1)
  })

  test('never overwrites a changed file without --force', () => {
    const dest = temp()
    writeFileSync(join(dest, 'AGENTS.md'), '# Mine\n')
    const logs = []
    const blocked = install({ root, preset: 'example', tools: ['agents'], dest, log: line => logs.push(line) })
    assert.equal(blocked.aborted, true)
    assert.deepEqual(blocked.conflicts, ['AGENTS.md'])
    assert.equal(read(dest, 'AGENTS.md'), '# Mine\n')
    assert.equal(existsSync(join(dest, '.agents')), false)
    assert.ok(logs.some(l => l.includes('CONFLICT  AGENTS.md')))

    const forced = install({ root, preset: 'example', tools: ['agents'], dest, force: true, log: quiet })
    assert.equal(forced.aborted, false)
    assert.match(read(dest, 'AGENTS.md'), /^# Agent instructions/)
  })

  test('planInstall dedupes AGENTS.md across agents and claude', () => {
    const out = temp()
    build({ root, out, preset: 'example', version: 'x' })
    const { plan } = planInstall({ buildOut: out, dest: temp(), tools: ['agents', 'claude'] })
    assert.equal(plan.filter(p => p.to === 'AGENTS.md').length, 1)
  })

  test('rejects unknown tools and a missing destination', () => {
    assert.throws(() => install({ root, tools: ['vim'], dest: temp(), log: quiet }), /unknown tool/)
    assert.throws(() => install({ root, tools: ['cursor'], dest: join(temp(), 'missing'), log: quiet }), /doesn't exist/)
  })

  test('the CLI dry run exits 0 and prints the plan', () => {
    const dest = temp()
    const run = spawnSync(process.execPath, [join(here, 'install.mjs'), '--root', root, '--preset', 'example', '--tool', 'cursor,agents', '--dest', dest, '--dry-run'], { encoding: 'utf8' })
    assert.equal(run.status, 0, run.stderr)
    assert.match(run.stdout, /new {7}\.cursor\/rules\/frontend\/example\.mdc/)
    assert.match(run.stdout, /Dry run: nothing was written\./)
  })
})
