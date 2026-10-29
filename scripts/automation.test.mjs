import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { checkAdvisories, findNewAdvisories, groupKey, issueFor as advisoryIssue, KEV_URL, OSV_BATCH_URL, OSV_VULN_URL } from './check-advisories.mjs'
import { checkFreshness, evaluateRange, parseAppliesTo } from './check-freshness.mjs'
import { compareVersions, fileIssues, meetsSeverity, parseWatchlist } from './lib/automation.mjs'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')
const today = new Date('2026-10-29T12:00:00Z')

function mockFetch (routes) {
  const calls = []
  const impl = async (url, init = {}) => {
    calls.push({ url, init })
    const handler = routes.find(([match]) => (typeof match === 'string' ? url === match : match.test(url)))
    if (!handler) return new Response('not found', { status: 404 })
    const value = typeof handler[1] === 'function' ? handler[1](url, init) : handler[1]
    if (value instanceof Response) return value
    return new Response(typeof value === 'string' ? value : JSON.stringify(value), { status: 200 })
  }
  impl.calls = calls
  return impl
}

const WATCHLIST = `
# comment
updated: 2026-10-29
packages:
  - ecosystem: npm
    name: "next"   # trailing comment
    safe_versions: ["16.4.1", "15.5.28"]
    known: [GHSA-aaaa-aaaa-aaaa, CVE-2025-0001]
    rules: [frontend/nextjs]
    note: "Known: fine, #not a comment"

  - ecosystem: PyPI
    name: django
    safe_versions: ["5.2.18"]
    known: []
`

describe('watchlist', () => {
  test('parses the subset we use', () => {
    const wl = parseWatchlist(WATCHLIST)
    assert.equal(wl.updated, '2026-10-29')
    assert.equal(wl.packages.length, 2)
    assert.deepEqual(wl.packages[0].safe_versions, ['16.4.1', '15.5.28'])
    assert.deepEqual(wl.packages[0].known, ['GHSA-aaaa-aaaa-aaaa', 'CVE-2025-0001'])
    assert.equal(wl.packages[0].note, 'Known: fine, #not a comment')
    assert.deepEqual(wl.packages[1].rules, [])
  })

  test('rejects entries without a name or with a scalar list', () => {
    assert.throws(() => parseWatchlist('packages:\n  - ecosystem: npm\n'), /missing "name"/)
    assert.throws(() => parseWatchlist('packages:\n  - ecosystem: npm\n    name: x\n    known: CVE-1\n'), /must be a list/)
  })

  test('the real watchlist parses and every entry has safe versions and rules', () => {
    const wl = parseWatchlist(readFileSync(join(repo, 'security/watchlist.yml'), 'utf8'))
    assert.ok(wl.packages.length > 10)
    for (const pkg of wl.packages) {
      assert.ok(pkg.safe_versions.length > 0, pkg.name)
      assert.ok(pkg.rules.length > 0, pkg.name)
      for (const id of pkg.known) assert.match(id, /^(CVE-\d{4}-\d+|GHSA(-[a-z0-9]{4}){3})$/, `${pkg.name}: ${id}`)
    }
  })
})

describe('helpers', () => {
  test('compareVersions handles majors, minors, prefixes and pre-releases', () => {
    assert.equal(compareVersions('16.4.1', '17'), -1)
    assert.equal(compareVersions('17.0.0', '17'), 0)
    assert.equal(compareVersions('v1.10.0', '1.9.9'), 1)
    assert.equal(compareVersions('0.88', '0.89'), -1)
    assert.equal(compareVersions('2.0.0-rc.1', '2.0.0'), 0)
  })

  test('meetsSeverity treats unknown as reportable', () => {
    assert.equal(meetsSeverity('CRITICAL', 'high'), true)
    assert.equal(meetsSeverity('MODERATE', 'high'), false)
    assert.equal(meetsSeverity('MEDIUM', 'moderate'), true)
    assert.equal(meetsSeverity('UNKNOWN', 'high'), true)
  })

  test('groupKey prefers CVE, then GHSA', () => {
    assert.equal(groupKey({ id: 'PYSEC-1', aliases: ['GHSA-x', 'CVE-2026-1'] }), 'CVE-2026-1')
    assert.equal(groupKey({ id: 'GO-1', aliases: ['GHSA-y'] }), 'GHSA-y')
    assert.equal(groupKey({ id: 'MAL-2026-1' }), 'MAL-2026-1')
  })
})

describe('check-advisories', () => {
  const vulns = {
    'GHSA-aaaa-aaaa-aaaa': { id: 'GHSA-aaaa-aaaa-aaaa', aliases: [], database_specific: { severity: 'HIGH' }, affected: [] },
    'GHSA-bbbb-bbbb-bbbb': {
      id: 'GHSA-bbbb-bbbb-bbbb',
      aliases: ['CVE-2026-1111'],
      summary: 'RCE in next',
      database_specific: { severity: 'CRITICAL' },
      affected: [{ package: { name: 'next' }, ranges: [{ events: [{ introduced: '0' }, { fixed: '16.4.2' }] }] }],
    },
    'PYSEC-2026-9': { id: 'PYSEC-2026-9', aliases: ['CVE-2026-2222'], summary: 'SQLi', affected: [{ package: { name: 'django' }, ranges: [{ events: [{ fixed: '5.2.19' }] }] }] },
    'GHSA-cccc-cccc-cccc': { id: 'GHSA-cccc-cccc-cccc', aliases: ['CVE-2026-2222'], summary: 'SQLi', database_specific: { severity: 'MODERATE' }, affected: [] },
  }

  const routes = () => [
    [OSV_BATCH_URL, (url, init) => {
      const { queries } = JSON.parse(init.body)
      return {
        results: queries.map(q => {
          if (q.package.name === 'next' && q.version === '16.4.1' && !q.page_token) return { vulns: [{ id: 'GHSA-aaaa-aaaa-aaaa' }], next_page_token: 'p2' }
          if (q.package.name === 'next' && q.page_token === 'p2') return { vulns: [{ id: 'GHSA-bbbb-bbbb-bbbb' }] }
          if (q.package.name === 'django') return { vulns: [{ id: 'PYSEC-2026-9' }, { id: 'GHSA-cccc-cccc-cccc' }] }
          return {}
        }),
      }
    }],
    [new RegExp('^' + OSV_VULN_URL.replace(/[.]/g, '\\.')), url => vulns[decodeURIComponent(url.split('/').pop())]],
    [KEV_URL, { vulnerabilities: [{ cveID: 'CVE-2026-1111' }] }],
  ]

  test('reports only advisories missing from the watchlist, grouped by CVE, with KEV and fixes', async () => {
    const fetchImpl = mockFetch(routes())
    const result = await checkAdvisories({ watchlistText: WATCHLIST, fetchImpl })
    assert.equal(result.queries, 3)
    assert.equal(result.advisoriesSeen, 4)
    assert.equal(result.newAdvisories.length, 2)

    const [first, second] = result.newAdvisories
    assert.equal(first.key, 'CVE-2026-1111')
    assert.equal(first.kev, true)
    assert.equal(first.severity, 'CRITICAL')
    assert.deepEqual(first.fixed, ['16.4.2'])
    assert.deepEqual(first.affectedSafeVersions, ['16.4.1'])

    assert.equal(second.key, 'CVE-2026-2222')
    assert.equal(second.package, 'django')
    assert.deepEqual(second.ids, ['CVE-2026-2222', 'GHSA-cccc-cccc-cccc', 'PYSEC-2026-9'])
    assert.equal(second.severity, 'MODERATE')
    assert.equal(second.kev, false)
  })

  test('a missing KEV feed is a warning, not a failure', async () => {
    const r = routes().filter(([m]) => m !== KEV_URL)
    const result = await checkAdvisories({ watchlistText: WATCHLIST, fetchImpl: mockFetch(r) })
    assert.match(result.kevError, /HTTP 404/)
    assert.equal(result.newAdvisories.length, 2)
  })

  test('a known alias suppresses the advisory', () => {
    const pkg = { ecosystem: 'npm', name: 'next', known: ['CVE-2026-1111'], rules: [] }
    const result = findNewAdvisories({
      queries: [{ pkg, version: '1.0.0' }],
      idSets: [new Set(['GHSA-bbbb-bbbb-bbbb'])],
      details: new Map([['GHSA-bbbb-bbbb-bbbb', vulns['GHSA-bbbb-bbbb-bbbb']]]),
      kevCves: new Set(),
    })
    assert.deepEqual(result, [])
  })

  test('issue titles carry the advisory key, severity and KEV flag', () => {
    const issue = advisoryIssue({ key: 'CVE-2026-1111', ids: ['CVE-2026-1111'], ecosystem: 'npm', package: 'next', rules: ['frontend/nextjs'], affectedSafeVersions: ['16.4.1'], severity: 'CRITICAL', kev: true, fixed: ['16.4.2'], summary: 'RCE', url: 'https://osv.dev/vulnerability/X' })
    assert.equal(issue.title, '[advisory] CVE-2026-1111: next (critical, KEV)')
    assert.match(issue.body, /\| Fixed in \| 16\.4\.2 \|/)
  })
})

describe('fileIssues', () => {
  const items = [
    { key: 'CVE-1', title: '[advisory] CVE-1: a', body: 'b' },
    { key: 'CVE-2', title: '[advisory] CVE-2: b', body: 'b' },
  ]

  test('skips duplicates and creates the rest', () => {
    const calls = []
    const gh = args => {
      calls.push(args)
      if (args[1] === 'list') return args[5].includes('CVE-1') ? JSON.stringify([{ number: 7, title: '[advisory] CVE-1: a' }]) : '[]'
      return 'https://github.com/o/r/issues/8\n'
    }
    const out = fileIssues(items, { createIssues: true, dryRun: false, gh, log: () => {} })
    assert.deepEqual(out.skipped, [{ key: 'CVE-1', number: 7 }])
    assert.deepEqual(out.created, ['https://github.com/o/r/issues/8'])
    assert.equal(calls.filter(c => c[1] === 'create').length, 1)
    assert.ok(calls[0].includes('all'))
  })

  test('dry run never creates and tolerates gh failures', () => {
    const gh = args => {
      if (args[1] === 'create') throw new Error('must not create')
      throw new Error('gh: not logged in')
    }
    const out = fileIssues(items, { createIssues: true, dryRun: true, gh, log: () => {} })
    assert.equal(out.wouldCreate.length, 2)
    assert.equal(out.created.length, 0)
  })

  test('does nothing without --create-issues', () => {
    const out = fileIssues(items, { createIssues: false, dryRun: false, gh: () => { throw new Error('no') } })
    assert.deepEqual(out, { created: [], skipped: [], wouldCreate: [] })
  })
})

describe('check-freshness', () => {
  test('parseAppliesTo handles any, prefixes, runtimes and several clauses', () => {
    assert.deepEqual(parseAppliesTo('any'), [])
    assert.deepEqual(parseAppliesTo('next >=16.0 <17'), [{ ecosystem: 'npm', name: 'next', lower: '16.0', upper: '17', upperInclusive: false }])
    const [laravel, php] = parseAppliesTo('packagist:laravel/framework >=13.0 <14, php >=8.3 <=8.5')
    assert.equal(laravel.ecosystem, 'packagist')
    assert.equal(laravel.name, 'laravel/framework')
    assert.deepEqual([php.ecosystem, php.name, php.upper, php.upperInclusive], ['runtime', 'php', '8.5', true])
    assert.equal(parseAppliesTo('maven:org.springframework.boot:spring-boot >=4.0 <5')[0].name, 'org.springframework.boot:spring-boot')
    assert.equal(parseAppliesTo('node >=24 <27')[0].name, 'nodejs')
    assert.equal(parseAppliesTo('@angular/core >=22.0 <23')[0].name, '@angular/core')
    assert.throws(() => parseAppliesTo('next ~16'), /can't parse/)
  })

  test('evaluateRange flags a new major and EOL cycles inside the range', () => {
    assert.deepEqual(evaluateRange({ ecosystem: 'npm', name: 'next', upper: '17' }, { version: '16.9.0' }), [])
    const [major] = evaluateRange({ ecosystem: 'npm', name: 'next', upper: '17' }, { version: '17.0.0' })
    assert.equal(major.kind, 'new-release')
    assert.equal(major.key, 'next 17')
    const eol = evaluateRange(
      { ecosystem: 'runtime', name: 'nodejs', lower: '22', upper: '27' },
      { version: '26', releases: [{ name: '26', isEol: false }, { name: '24', isEol: false }, { name: '22', isEol: true, eolFrom: '2027-04-30' }, { name: '20', isEol: true }] },
    )
    assert.deepEqual(eol.map(f => f.key), ['nodejs 22 EOL'])
  })

  test('checkFreshness looks up each registry once and flags stale reviews', async () => {
    const fetchImpl = mockFetch([
      ['https://registry.npmjs.org/next/latest', { version: '17.1.0' }],
      ['https://pypi.org/pypi/django/json', { info: { version: '5.2.18' } }],
      ['https://repo1.maven.org/maven2/org/springframework/boot/spring-boot/maven-metadata.xml', '<metadata><versioning><release>4.1.2</release></versioning></metadata>'],
      ['https://endoflife.date/api/v1/products/nodejs', { result: { releases: [{ name: '26', isEol: false }, { name: '24', isEol: false }] } }],
    ])
    const docs = [
      { id: 'frontend/nextjs', file: 'rules/frontend/nextjs.md', appliesTo: 'next >=16.0 <17', lastReviewed: '2026-10-01' },
      { id: 'frontend/next-extra', file: 'rules/frontend/next-extra.md', appliesTo: 'next >=16.0 <18', lastReviewed: '2026-10-01' },
      { id: 'backend/django', file: 'rules/backend/django.md', appliesTo: 'pypi:django >=5.2 <6', lastReviewed: '2026-01-01' },
      { id: 'backend/spring-boot', file: 'rules/backend/spring-boot.md', appliesTo: 'maven:org.springframework.boot:spring-boot >=4.0 <5', lastReviewed: '2026-10-01' },
      { id: 'languages/node', file: 'rules/languages/node.md', appliesTo: 'node >=24 <27', lastReviewed: '2026-10-01' },
      { id: 'legacy/next-old', file: 'rules/legacy/next-old.md', appliesTo: 'next >=12 <15', lastReviewed: '2026-10-01' },
      { id: 'skills/cve-check', file: 'skills/cve-check/SKILL.md', lastReviewed: '2026-10-29' },
      { id: 'frontend/bad', file: 'rules/frontend/bad.md', appliesTo: 'next ^16', lastReviewed: '2026-10-01' },
    ]
    const result = await checkFreshness({ docs, fetchImpl, today })
    assert.deepEqual(result.findings.map(f => [f.kind, f.id]), [
      ['new-release', 'frontend/nextjs'],
      ['stale-review', 'backend/django'],
    ])
    assert.equal(result.findings[0].key, 'frontend/nextjs next 17')
    assert.equal(result.errors.length, 1)
    assert.match(result.errors[0].message, /can't parse/)
    assert.equal(fetchImpl.calls.filter(c => c.url.includes('/next/latest')).length, 1)
    assert.equal(fetchImpl.calls.some(c => c.url.includes('legacy')), false)
  })

  test('registry failures become errors, not crashes', async () => {
    const result = await checkFreshness({
      docs: [{ id: 'frontend/x', file: 'rules/frontend/x.md', appliesTo: 'missing-pkg >=1 <2', lastReviewed: '2026-10-29' }],
      fetchImpl: mockFetch([]),
      today,
    })
    assert.equal(result.findings.length, 0)
    assert.match(result.errors[0].message, /HTTP 404/)
  })
})
