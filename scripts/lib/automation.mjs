import { execFileSync } from 'node:child_process'

import { parseScalar, stripComment } from '../lint-rules.mjs'

export const USER_AGENT = 'cursor-rules-automation (+https://github.com/Phaedra-Solutions/cursor-rules)'

export function parseArgs (argv, flags, valued = []) {
  const options = { _unknown: [] }
  for (const flag of flags) options[flag] = false
  const args = argv.slice(2)
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    const name = arg.replace(/^--/, '')
    if (flags.includes(name)) options[name] = true
    else if (valued.includes(name)) options[name] = args[++i]
    else options._unknown.push(arg)
  }
  return options
}

export function parseWatchlist (text) {
  const result = { packages: [] }
  let current = null
  let inPackages = false

  text.replace(/\r\n/g, '\n').split('\n').forEach((raw, index) => {
    const line = raw.trim().startsWith('#') ? '' : stripComment(raw)
    if (line.trim() === '') return
    const indent = line.match(/^ */)[0].length
    const content = line.trim()
    const where = `watchlist line ${index + 1}`

    if (indent === 0) {
      const match = content.match(/^([\w-]+):(?:\s+(.*))?$/)
      if (!match) throw new Error(`${where}: expected "key: value"`)
      inPackages = match[1] === 'packages'
      if (!inPackages) result[match[1]] = parseScalar(match[2] ?? '')
      return
    }
    if (!inPackages) throw new Error(`${where}: unexpected indentation`)

    let entry = content
    if (content.startsWith('- ')) {
      current = {}
      result.packages.push(current)
      entry = content.slice(2)
    }
    if (!current) throw new Error(`${where}: list item expected`)
    const match = entry.match(/^([\w-]+):\s+(.*)$/)
    if (!match) throw new Error(`${where}: expected "key: value"`)
    current[match[1]] = parseScalar(match[2])
  })

  result.packages.forEach((pkg, i) => {
    for (const key of ['ecosystem', 'name']) {
      if (typeof pkg[key] !== 'string' || !pkg[key]) throw new Error(`watchlist package #${i + 1}: missing "${key}"`)
    }
    for (const key of ['safe_versions', 'known', 'rules']) {
      if (pkg[key] === undefined) pkg[key] = []
      if (!Array.isArray(pkg[key])) throw new Error(`watchlist package ${pkg.name}: "${key}" must be a list`)
      pkg[key] = pkg[key].map(String)
    }
  })
  return result
}

export function compareVersions (a, b) {
  const parse = v => String(v).replace(/^v/, '').split(/[-+]/)[0].split('.').map(n => Number.parseInt(n, 10) || 0)
  const x = parse(a)
  const y = parse(b)
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const diff = (x[i] ?? 0) - (y[i] ?? 0)
    if (diff !== 0) return Math.sign(diff)
  }
  return 0
}

export const SEVERITY_RANK = { UNKNOWN: 0, LOW: 1, MODERATE: 2, MEDIUM: 2, HIGH: 3, CRITICAL: 4 }

export function meetsSeverity (severity, minimum) {
  const rank = SEVERITY_RANK[String(severity).toUpperCase()] ?? 0
  if (rank === 0) return true
  return rank >= (SEVERITY_RANK[String(minimum).toUpperCase()] ?? 3)
}

export async function fetchJson (fetchImpl, url, init = {}) {
  const response = await fetchImpl(url, {
    ...init,
    headers: { 'user-agent': USER_AGENT, ...(init.headers ?? {}) },
    signal: init.signal ?? AbortSignal.timeout(30000),
  })
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status} for ${url}`)
    error.status = response.status
    throw error
  }
  return response.json()
}

export async function fetchText (fetchImpl, url) {
  const response = await fetchImpl(url, {
    headers: { 'user-agent': USER_AGENT },
    signal: AbortSignal.timeout(30000),
  })
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status} for ${url}`)
    error.status = response.status
    throw error
  }
  return response.text()
}

export function ghRunner (args) {
  return execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
}

export function fileIssues (items, { createIssues, dryRun, gh = ghRunner, log = console.log }) {
  const outcome = { created: [], skipped: [], wouldCreate: [] }
  if (!createIssues) return outcome
  for (const item of items) {
    let found
    try {
      found = JSON.parse(gh(['issue', 'list', '--state', 'all', '--search', `"${item.key}" in:title`, '--json', 'number,title', '--limit', '20']) || '[]')
    } catch (error) {
      if (!dryRun) throw error
      found = []
      log(`dry run: couldn't search existing issues (${String(error.message).split('\n')[0]})`)
    }
    const duplicate = found.find(issue => issue.title.includes(item.key))
    if (duplicate) {
      outcome.skipped.push({ key: item.key, number: duplicate.number })
      log(`skip: #${duplicate.number} already tracks ${item.key}`)
    } else if (dryRun) {
      outcome.wouldCreate.push(item.title)
      log(`dry run: would create "${item.title}"`)
    } else {
      const url = gh(['issue', 'create', '--title', item.title, '--body', item.body]).trim()
      outcome.created.push(url)
      log(`created: ${url}`)
    }
  }
  return outcome
}
