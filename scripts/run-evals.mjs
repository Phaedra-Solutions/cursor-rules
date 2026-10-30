#!/usr/bin/env node
// Usage: node scripts/run-evals.mjs [--rule <id>] [--providers <ids>] [--out <dir>] [--dry-run] [--validate] [--json]
//
// Runs the promptfoo suites in evals/<category>/<name>.yaml twice per test: with the matching
// rules/<category>/<name>.md as system context and without it, then prints pass rates per rule.
// Makes paid model calls: run it only when you mean to (locally or through the manual
// "evals" workflow). Never runs in pull-request CI. --dry-run and --validate make no model calls.

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { splitFrontmatter } from './lint-rules.mjs'
import { parseArgs } from './lib/automation.mjs'

export const PROMPTFOO_VERSION = '0.124.1'
export const DEFAULT_PROVIDERS = ['anthropic:messages:claude-opus-5']
const LABELS = ['with-rule', 'without-rule']

const here = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(here, '..')

export function listSuites (root) {
  const evalsDir = join(root, 'evals')
  if (!existsSync(evalsDir)) return []
  const suites = []
  for (const category of readdirSync(evalsDir, { withFileTypes: true })) {
    if (!category.isDirectory()) continue
    for (const file of readdirSync(join(evalsDir, category.name))) {
      if (!/\.ya?ml$/.test(file)) continue
      const name = file.replace(/\.ya?ml$/, '')
      suites.push({
        id: `${category.name}/${name}`,
        suiteFile: join(evalsDir, category.name, file),
        ruleFile: join(root, 'rules', category.name, `${name}.md`),
      })
    }
  }
  return suites.sort((a, b) => a.id.localeCompare(b.id))
}

export function ruleBody (text) {
  const parts = splitFrontmatter(text)
  return (parts ? parts.body : text).trim()
}

// Line-based checks so the wrapper stays dependency-free; promptfoo validates the full schema.
export function checkSuite (text) {
  const problems = []
  const tests = text.split(/^- /m).slice(1)
  if (tests.length < 3) problems.push(`has ${tests.length} tests; add at least 3`)
  tests.forEach((test, index) => {
    if (!/^description:/m.test(test) && !/^description:/.test(test)) problems.push(`test ${index + 1} has no description`)
    if (!/\n\s+task:/.test(test)) problems.push(`test ${index + 1} has no vars.task`)
    if (!/\n\s+assert:/.test(test)) problems.push(`test ${index + 1} has no assert list`)
  })
  return problems
}

export function buildConfig ({ suite, ruleText, providers, promptsFile }) {
  return {
    description: `${suite.id} uplift (with vs without the rule)`,
    prompts: [
      { id: `file://${promptsFile}:withRule`, label: LABELS[0] },
      { id: `file://${promptsFile}:withoutRule`, label: LABELS[1] },
    ],
    providers: providers.map(id => ({ id, config: { max_tokens: 4096 } })),
    defaultTest: { vars: { rule_text: ruleText } },
    tests: [`file://${suite.suiteFile}`],
    evaluateOptions: { maxConcurrency: 4 },
    sharing: false,
  }
}

function resultRows (data) {
  if (Array.isArray(data?.results?.results)) return data.results.results
  if (Array.isArray(data?.results)) return data.results
  return []
}

export function summarize (id, data) {
  const counts = {}
  for (const row of resultRows(data)) {
    const label = row.prompt?.label ?? row.promptLabel ?? 'unknown'
    const provider = typeof row.provider === 'string' ? row.provider : (row.provider?.id ?? row.provider?.label ?? 'unknown')
    const key = `${provider}\u0000${label}`
    counts[key] ??= { provider, label, pass: 0, total: 0 }
    counts[key].total += 1
    if (row.success) counts[key].pass += 1
  }
  const byProvider = {}
  for (const { provider, label, pass, total } of Object.values(counts)) {
    byProvider[provider] ??= { rule: id, provider }
    byProvider[provider][label] = { pass, total, rate: total ? pass / total : 0 }
  }
  return Object.values(byProvider)
}

function percent (entry) {
  return entry ? `${Math.round(entry.rate * 100)}% (${entry.pass}/${entry.total})` : 'n/a'
}

export function renderTable (rows) {
  const lines = ['| Rule | Provider | With rule | Without rule | Uplift |', '|---|---|---|---|---|']
  for (const row of rows) {
    const withRule = row['with-rule']
    const without = row['without-rule']
    const uplift = withRule && without ? `${Math.round((withRule.rate - without.rate) * 100)} pts` : 'n/a'
    lines.push(`| ${row.rule} | ${row.provider} | ${percent(withRule)} | ${percent(without)} | ${uplift} |`)
  }
  return lines.join('\n')
}

function runPromptfoo (args) {
  execFileSync('npx', ['--yes', `promptfoo@${PROMPTFOO_VERSION}`, ...args], { stdio: 'inherit', env: { ...process.env, PROMPTFOO_DISABLE_TELEMETRY: '1' } })
}

export function main (argv = process.argv) {
  const options = parseArgs(argv, ['dry-run', 'validate', 'json'], ['rule', 'providers', 'out'])
  if (options._unknown.length) {
    console.error(`Unknown argument: ${options._unknown[0]}`)
    return 2
  }
  const providers = (options.providers ?? process.env.EVAL_PROVIDERS ?? DEFAULT_PROVIDERS.join(','))
    .split(',').map(value => value.trim()).filter(Boolean)
  const outDir = resolve(options.out ?? join(ROOT, 'dist', 'evals'))
  const promptsFile = join(ROOT, 'evals', 'prompts.cjs')

  let suites = listSuites(ROOT)
  if (options.rule) suites = suites.filter(suite => suite.id === options.rule)
  if (suites.length === 0) {
    console.error(options.rule ? `No suite for ${options.rule}` : 'No suites in evals/')
    return 1
  }

  mkdirSync(outDir, { recursive: true })
  let failed = false
  const summary = []
  for (const suite of suites) {
    if (!existsSync(suite.ruleFile)) {
      console.error(`${suite.id}: no rule at ${relative(ROOT, suite.ruleFile)}; skipping`)
      failed = true
      continue
    }
    const problems = checkSuite(readFileSync(suite.suiteFile, 'utf8'))
    if (problems.length) {
      for (const problem of problems) console.error(`${suite.id}: ${problem}`)
      failed = true
      continue
    }
    const config = buildConfig({ suite, ruleText: ruleBody(readFileSync(suite.ruleFile, 'utf8')), providers, promptsFile })
    const configPath = join(outDir, `${suite.id.replace('/', '__')}.config.json`)
    writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`)
    if (options['dry-run']) {
      console.log(`${suite.id}: ${relative(ROOT, configPath)}`)
      continue
    }
    if (options.validate) {
      runPromptfoo(['validate', '-c', configPath])
      continue
    }
    const resultPath = join(outDir, `${suite.id.replace('/', '__')}.results.json`)
    try {
      runPromptfoo(['eval', '-c', configPath, '-o', resultPath, '--no-share', '--no-table', '--no-progress-bar'])
    } catch {
      // promptfoo exits non-zero when assertions fail; the results file still has the details.
    }
    if (existsSync(resultPath)) summary.push(...summarize(suite.id, JSON.parse(readFileSync(resultPath, 'utf8'))))
  }

  if (summary.length) {
    const table = renderTable(summary)
    writeFileSync(join(outDir, 'summary.md'), `# Eval summary\n\n${table}\n`)
    writeFileSync(join(outDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
    console.log(options.json ? JSON.stringify(summary, null, 2) : table)
  }
  return failed ? 1 : 0
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main()
}
