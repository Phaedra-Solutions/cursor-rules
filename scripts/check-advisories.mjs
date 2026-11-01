#!/usr/bin/env node
// Usage: node scripts/check-advisories.mjs [--dry-run] [--create-issues] [--json] [--min-severity high] [--watchlist security/watchlist.yml]

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { fetchJson, fileIssues, meetsSeverity, parseArgs, parseWatchlist, SEVERITY_RANK } from './lib/automation.mjs'

export const OSV_BATCH_URL = 'https://api.osv.dev/v1/querybatch'
export const OSV_VULN_URL = 'https://api.osv.dev/v1/vulns/'
export const KEV_URL = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json'

export function buildQueries (watchlist) {
  const queries = []
  for (const pkg of watchlist.packages) {
    for (const version of pkg.safe_versions) {
      queries.push({ pkg, version, query: { package: { ecosystem: pkg.ecosystem, name: pkg.name }, version } })
    }
  }
  return queries
}

async function queryBatch (fetchImpl, queries) {
  const ids = queries.map(() => new Set())
  let pending = queries.map((q, i) => ({ index: i, query: q.query }))
  while (pending.length) {
    const chunk = pending.slice(0, 1000)
    pending = pending.slice(1000)
    const body = await fetchJson(fetchImpl, OSV_BATCH_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ queries: chunk.map(c => c.query) }),
    })
    ;(body.results ?? []).forEach((result, i) => {
      const { index, query } = chunk[i]
      for (const vuln of result.vulns ?? []) ids[index].add(vuln.id)
      if (result.next_page_token) pending.push({ index, query: { ...query, page_token: result.next_page_token } })
    })
  }
  return ids
}

export function groupKey (vuln) {
  const ids = [vuln.id, ...(vuln.aliases ?? [])]
  return ids.find(id => id.startsWith('CVE-')) ?? ids.find(id => id.startsWith('GHSA-')) ?? vuln.id
}

export function severityOf (vulns) {
  let best = 'UNKNOWN'
  for (const vuln of vulns) {
    const severity = String(vuln.database_specific?.severity ?? '').toUpperCase()
    if ((SEVERITY_RANK[severity] ?? 0) > (SEVERITY_RANK[best] ?? 0)) best = severity
  }
  return best
}

export function fixedVersions (vulns, pkg) {
  const fixed = new Set()
  for (const vuln of vulns) {
    for (const affected of vuln.affected ?? []) {
      if (affected.package?.name !== pkg.name) continue
      for (const range of affected.ranges ?? []) {
        for (const event of range.events ?? []) if (event.fixed) fixed.add(event.fixed)
      }
    }
  }
  return [...fixed]
}

export function findNewAdvisories ({ queries, idSets, details, kevCves }) {
  const groups = new Map()
  queries.forEach(({ pkg, version }, i) => {
    const known = new Set(pkg.known.map(id => id.toUpperCase()))
    for (const id of idSets[i]) {
      const vuln = details.get(id)
      if (!vuln) continue
      const allIds = [vuln.id, ...(vuln.aliases ?? [])]
      if (allIds.some(a => known.has(a.toUpperCase()))) continue
      const key = `${groupKey(vuln)} ${pkg.ecosystem}:${pkg.name}`
      if (!groups.has(key)) groups.set(key, { key: groupKey(vuln), pkg, versions: new Set(), vulns: new Map() })
      const group = groups.get(key)
      group.versions.add(version)
      group.vulns.set(vuln.id, vuln)
    }
  })

  return [...groups.values()].map(group => {
    const vulns = [...group.vulns.values()]
    const ids = [...new Set(vulns.flatMap(v => [v.id, ...(v.aliases ?? [])]))].sort()
    const cves = ids.filter(id => id.startsWith('CVE-'))
    return {
      key: group.key,
      ids,
      ecosystem: group.pkg.ecosystem,
      package: group.pkg.name,
      rules: group.pkg.rules,
      affectedSafeVersions: [...group.versions],
      severity: severityOf(vulns),
      kev: cves.some(cve => kevCves.has(cve)),
      fixed: fixedVersions(vulns, group.pkg),
      summary: vulns.map(v => v.summary).find(Boolean) ?? '',
      url: `https://osv.dev/vulnerability/${vulns[0].id}`,
    }
  }).sort((a, b) => (b.kev - a.kev) || (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0) || a.key.localeCompare(b.key))
}

export function issueFor (advisory) {
  const title = `[advisory] ${advisory.key}: ${advisory.package} (${advisory.severity.toLowerCase()}${advisory.kev ? ', KEV' : ''})`
  const body = [
    `New advisory for a package in \`security/watchlist.yml\`.`,
    '',
    `| Field | Value |`,
    `|---|---|`,
    `| Package | ${advisory.ecosystem} \`${advisory.package}\` |`,
    `| Advisory IDs | ${advisory.ids.join(', ')} |`,
    `| Severity | ${advisory.severity} |`,
    `| CISA KEV | ${advisory.kev ? 'yes' : 'no'} |`,
    `| Affects documented safe versions | ${advisory.affectedSafeVersions.join(', ')} |`,
    `| Fixed in | ${advisory.fixed.join(', ') || 'no fix listed'} |`,
    `| Rules | ${advisory.rules.map(r => `\`${r}\``).join(', ') || 'none'} |`,
    '',
    advisory.summary,
    '',
    advisory.url,
    '',
    '- [ ] Verify the advisory with the `cve-check` skill',
    '- [ ] Update `safe_versions` and `known` in `security/watchlist.yml`',
    '- [ ] Update the "Known vulnerabilities" table in each rule listed',
  ].join('\n')
  return { key: advisory.key, title, body }
}

export async function checkAdvisories ({ watchlistText, fetchImpl = fetch }) {
  const watchlist = parseWatchlist(watchlistText)
  const queries = buildQueries(watchlist)
  const idSets = await queryBatch(fetchImpl, queries)

  const details = new Map()
  const allIds = [...new Set(idSets.flatMap(set => [...set]))]
  await Promise.all(allIds.map(async id => {
    details.set(id, await fetchJson(fetchImpl, OSV_VULN_URL + encodeURIComponent(id)))
  }))

  let kevCves = new Set()
  let kevError = null
  try {
    const kev = await fetchJson(fetchImpl, KEV_URL)
    kevCves = new Set((kev.vulnerabilities ?? []).map(v => v.cveID))
  } catch (error) {
    kevError = error.message
  }

  return {
    packages: watchlist.packages.length,
    queries: queries.length,
    advisoriesSeen: allIds.length,
    kevError,
    newAdvisories: findNewAdvisories({ queries, idSets, details, kevCves }),
  }
}

function formatText (result, issues) {
  const lines = [`Checked ${result.packages} packages (${result.queries} version queries); ${result.advisoriesSeen} advisories affect documented safe versions.`]
  if (result.kevError) lines.push(`warning: couldn't load the CISA KEV feed (${result.kevError}); KEV flags may be missing`)
  if (result.newAdvisories.length === 0) {
    lines.push('No new advisories: everything OSV reports for safe versions is already in the watchlist.')
  } else {
    lines.push(`${result.newAdvisories.length} new advisories not in the watchlist:`)
    for (const a of result.newAdvisories) {
      lines.push(`- ${a.key} ${a.severity}${a.kev ? ' KEV' : ''} ${a.ecosystem}:${a.package} @ ${a.affectedSafeVersions.join(', ')} -> fixed ${a.fixed.join(', ') || 'none'} :: ${a.summary}`)
    }
  }
  if (issues) lines.push(`Issues: ${issues.created.length} created, ${issues.wouldCreate.length} would be created (dry run), ${issues.skipped.length} already tracked.`)
  return lines.join('\n')
}

async function main (argv) {
  const options = parseArgs(argv, ['dry-run', 'create-issues', 'json'], ['min-severity', 'watchlist'])
  if (options._unknown.length) {
    console.error(`Unknown argument: ${options._unknown[0]}`)
    return 2
  }
  const watchlistPath = resolve(options.watchlist ?? 'security/watchlist.yml')
  const result = await checkAdvisories({ watchlistText: readFileSync(watchlistPath, 'utf8') })

  const minimum = options['min-severity'] ?? 'high'
  const eligible = result.newAdvisories.filter(a => a.kev || meetsSeverity(a.severity, minimum))
  const log = options.json ? () => {} : console.log
  const issues = options['create-issues'] || options['dry-run']
    ? fileIssues(eligible.map(issueFor), { createIssues: true, dryRun: options['dry-run'], log })
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
