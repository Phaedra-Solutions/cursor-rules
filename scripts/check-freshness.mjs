#!/usr/bin/env node
// Usage: node scripts/check-freshness.mjs [--dry-run] [--create-issues] [--json] [--stale-days 90] [--root <dir>]

import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { checkDate, listFiles, parseFrontmatter, splitFrontmatter } from './lint-rules.mjs'
import { compareVersions, fetchJson, fetchText, fileIssues, parseArgs } from './lib/automation.mjs'

export const RUNTIMES = {
  node: 'nodejs',
  nodejs: 'nodejs',
  python: 'python',
  php: 'php',
  ruby: 'ruby',
  go: 'go',
  dotnet: 'dotnet',
  java: 'oracle-jdk',
  deno: 'deno',
  bun: 'bun',
  postgresql: 'postgresql',
  postgres: 'postgresql',
}

const PREFIXES = ['npm', 'pypi', 'maven', 'nuget', 'packagist', 'runtime']

export function parseAppliesTo (value) {
  if (typeof value !== 'string') throw new Error('applies_to must be a string')
  const trimmed = value.trim()
  if (trimmed === '' || trimmed.toLowerCase() === 'any') return []

  return trimmed.split(/\s*[,;]\s*/).map(clause => {
    const tokens = clause.split(/\s+/)
    let name = tokens.shift()
    let ecosystem = 'npm'
    const prefix = name.match(/^([a-z]+):(.+)$/)
    if (prefix && PREFIXES.includes(prefix[1])) {
      ecosystem = prefix[1]
      name = prefix[2]
    } else if (RUNTIMES[name.toLowerCase()]) {
      ecosystem = 'runtime'
    }
    if (ecosystem === 'runtime') name = RUNTIMES[name.toLowerCase()] ?? name

    const range = { ecosystem, name, lower: null, upper: null, upperInclusive: false }
    for (const token of tokens) {
      const match = token.match(/^(>=|>|<=|<)v?(\d[\w.-]*)$/)
      if (!match) throw new Error(`can't parse "${token}" in applies_to "${value}"`)
      const [, op, version] = match
      if (op.startsWith('>')) range.lower = version
      else {
        range.upper = version
        range.upperInclusive = op === '<='
      }
    }
    return range
  })
}

export async function latestRelease (fetchImpl, range) {
  const { ecosystem, name } = range
  switch (ecosystem) {
    case 'npm':
      return { version: (await fetchJson(fetchImpl, `https://registry.npmjs.org/${name.replace('/', '%2f')}/latest`)).version }
    case 'pypi':
      return { version: (await fetchJson(fetchImpl, `https://pypi.org/pypi/${encodeURIComponent(name)}/json`)).info.version }
    case 'maven': {
      const [group, artifact] = name.split(':')
      const xml = await fetchText(fetchImpl, `https://repo1.maven.org/maven2/${group.replace(/\./g, '/')}/${artifact}/maven-metadata.xml`)
      const release = xml.match(/<release>([^<]+)<\/release>/)
      if (!release) throw new Error(`no <release> in Maven metadata for ${name}`)
      return { version: release[1] }
    }
    case 'nuget': {
      const index = await fetchJson(fetchImpl, `https://api.nuget.org/v3-flatcontainer/${name.toLowerCase()}/index.json`)
      const stable = index.versions.filter(v => !v.includes('-'))
      return { version: stable[stable.length - 1] }
    }
    case 'packagist': {
      const data = await fetchJson(fetchImpl, `https://repo.packagist.org/p2/${name}.json`)
      const stable = (data.packages?.[name] ?? []).map(p => p.version.replace(/^v/, '')).filter(v => /^\d+(\.\d+)*$/.test(v))
      return { version: stable.sort(compareVersions).pop() }
    }
    case 'runtime': {
      const data = await fetchJson(fetchImpl, `https://endoflife.date/api/v1/products/${name}`)
      const releases = data.result?.releases ?? []
      const latest = [...releases].sort((a, b) => compareVersions(b.name, a.name))[0]
      return { version: latest?.name, releases }
    }
    default:
      throw new Error(`unknown ecosystem "${ecosystem}"`)
  }
}

export function evaluateRange (range, latest) {
  const findings = []
  if (latest.version && range.upper) {
    const cmp = compareVersions(latest.version, range.upper)
    if (cmp > 0 || (cmp === 0 && !range.upperInclusive)) {
      const major = latest.version.split('.')[0]
      findings.push({
        kind: 'new-release',
        key: `${range.name} ${major}`,
        message: `${range.name} ${latest.version} is out, beyond the documented range (upper bound ${range.upperInclusive ? '<=' : '<'}${range.upper})`,
      })
    }
  }
  if (range.ecosystem === 'runtime' && latest.releases) {
    for (const release of latest.releases) {
      if (!release.isEol) continue
      if (range.lower && compareVersions(release.name, range.lower) < 0) continue
      if (range.upper && compareVersions(release.name, range.upper) >= 0) continue
      findings.push({
        kind: 'eol',
        key: `${range.name} ${release.name} EOL`,
        message: `${range.name} ${release.name} is inside the documented range but reached end of life on ${release.eolFrom}`,
      })
    }
  }
  return findings
}

function readDocs (root) {
  const docs = []
  for (const file of listFiles(root)) {
    const isRule = /^rules\/.+\.md$/.test(file) || /^conventions\/[^/]+\.md$/.test(file)
    const isSkill = /^skills\/[^/]+\/SKILL\.md$/.test(file)
    if (!isRule && !isSkill) continue
    const fm = splitFrontmatter(readFileSync(join(root, file), 'utf8'))
    if (!fm) continue
    const { data } = parseFrontmatter(fm.yaml)
    docs.push({
      file,
      id: isSkill ? `skills/${data.name ?? file.split('/')[1]}` : file.replace(/^rules\//, '').replace(/\.md$/, ''),
      appliesTo: isRule ? data.applies_to : undefined,
      lastReviewed: isSkill ? data.metadata?.last_reviewed : data.last_reviewed,
    })
  }
  return docs
}

export async function checkFreshness ({ root = process.cwd(), fetchImpl = fetch, today = new Date(), staleDays = 90, docs } = {}) {
  const items = docs ?? readDocs(root)
  const findings = []
  const errors = []
  const cache = new Map()

  for (const doc of items) {
    const review = checkDate(doc.lastReviewed, today)
    if (review.valid && review.days > staleDays) {
      findings.push({ id: doc.id, file: doc.file, kind: 'stale-review', key: `${doc.id} review ${doc.lastReviewed}`, message: `last reviewed ${doc.lastReviewed} (${review.days} days ago)` })
    }

    if (doc.appliesTo === undefined || doc.id.startsWith('legacy/')) continue
    let ranges
    try {
      ranges = parseAppliesTo(doc.appliesTo)
    } catch (error) {
      errors.push({ id: doc.id, file: doc.file, message: error.message })
      continue
    }
    for (const range of ranges) {
      const cacheKey = `${range.ecosystem}:${range.name}`
      try {
        if (!cache.has(cacheKey)) cache.set(cacheKey, latestRelease(fetchImpl, range))
        const latest = await cache.get(cacheKey)
        for (const finding of evaluateRange(range, latest)) {
          findings.push({ id: doc.id, file: doc.file, ...finding, key: `${doc.id} ${finding.key}` })
        }
      } catch (error) {
        errors.push({ id: doc.id, file: doc.file, message: `couldn't look up ${cacheKey}: ${error.message}` })
      }
    }
  }
  return { checked: items.length, withVersions: items.filter(d => d.appliesTo && d.appliesTo !== 'any' && !d.id.startsWith('legacy/')).length, findings, errors }
}

export function issueFor (finding) {
  const actions = {
    'new-release': '- [ ] Check the release notes and breaking changes\n- [ ] Update the rule (or add a legacy rule for the old range) and its `applies_to`\n- [ ] Update `last_reviewed` and `sources`',
    eol: '- [ ] Move guidance for the EOL version to `legacy/` and keep it for at least 12 months\n- [ ] Update the README matrix and `applies_to`',
    'stale-review': '- [ ] Re-verify versions, support dates and CVEs with web search and the `cve-check` skill\n- [ ] Update `last_reviewed` and `sources`',
  }
  return {
    key: finding.key,
    title: `[freshness] ${finding.key}: ${finding.message}`,
    body: `Freshness check for \`${finding.file}\`.\n\n${finding.message}.\n\n${actions[finding.kind] ?? ''}`,
  }
}

function formatText (result, issues) {
  const lines = [`Checked ${result.checked} rules and skills (${result.withVersions} with a version range).`]
  if (result.findings.length === 0) lines.push('Nothing to flag: all ranges cover the latest release and every review is recent.')
  for (const f of result.findings) lines.push(`- ${f.kind} ${f.id}: ${f.message}`)
  for (const e of result.errors) lines.push(`warning: ${e.id}: ${e.message}`)
  if (issues) lines.push(`Issues: ${issues.created.length} created, ${issues.wouldCreate.length} would be created (dry run), ${issues.skipped.length} already tracked.`)
  return lines.join('\n')
}

async function main (argv) {
  const options = parseArgs(argv, ['dry-run', 'create-issues', 'json'], ['stale-days', 'root'])
  if (options._unknown.length) {
    console.error(`Unknown argument: ${options._unknown[0]}`)
    return 2
  }
  const result = await checkFreshness({
    root: resolve(options.root ?? '.'),
    staleDays: options['stale-days'] ? Number(options['stale-days']) : 90,
  })
  const log = options.json ? () => {} : console.log
  const issues = options['create-issues'] || options['dry-run']
    ? fileIssues(result.findings.map(issueFor), { createIssues: true, dryRun: options['dry-run'], log })
    : null
  console.log(options.json ? JSON.stringify({ ...result, issues }, null, 2) : formatText(result, issues))
  return 0
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv).then(code => { process.exitCode = code }, error => {
    console.error(error.message)
    process.exitCode = 1
  })
}
