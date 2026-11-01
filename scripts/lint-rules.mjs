#!/usr/bin/env node
// Usage: node scripts/lint-rules.mjs [--json] [--network] [--root <dir>]

import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export const CATEGORIES = [
  'core', 'languages', 'frontend', 'mobile', 'backend', 'data',
  'testing', 'devops', 'ai', 'cms-commerce', 'legacy',
]

const RULE_KEYS = {
  id: 'string',
  title: 'string',
  description: 'string',
  applies_to: 'string',
  globs: 'array',
  alwaysApply: 'boolean',
  tier: 'string',
  owner: 'string',
  last_reviewed: 'string',
  sources: 'array',
}
const OPTIONAL_RULE_KEYS = { legacy_rule: 'string' }

const STACK_HEADINGS = [
  'Version check',
  'Conventions',
  'Security',
  'Known vulnerabilities',
  'Testing',
  'Before you finish',
]
const LEGACY_HEADINGS = ['Migration path']
const SKILL_HEADINGS = ['When to use', 'Before you start', 'Steps', 'Verify', 'Safety']
const STALE_LINE = 'This list goes stale'

const MAX_LINES = 500
const WARN_LINES = 250
const STALE_DAYS = 90
const SKILL_NAME_MAX = 64
const SKILL_DESCRIPTION_MAX = 1024

const HIDDEN_RANGES = [
  [0x200b, 0x200d],
  [0x2060, 0x2060],
  [0xfeff, 0xfeff],
  [0x202a, 0x202e],
  [0x2066, 0x2069],
  [0xe0000, 0xe007f],
]

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.pdf', '.zip', '.gz',
  '.tgz', '.woff', '.woff2', '.ttf', '.otf', '.mp4', '.mov', '.mp3',
])

const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist'])

export function splitFrontmatter (text) {
  const normalized = text.replace(/\r\n/g, '\n')
  if (!normalized.startsWith('---\n')) return null
  const end = normalized.indexOf('\n---', 4)
  if (end === -1) return null
  const after = normalized.indexOf('\n', end + 4)
  return {
    yaml: normalized.slice(4, end + 1),
    body: after === -1 ? '' : normalized.slice(after + 1),
    bodyStartLine: normalized.slice(0, after === -1 ? normalized.length : after + 1).split('\n').length,
  }
}

export function stripComment (raw) {
  let quote = null
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]
    if (quote) {
      if (ch === '\\' && quote === '"') { i++; continue }
      if (ch === quote) quote = null
    } else if (ch === '"' || ch === "'") {
      quote = ch
    } else if (ch === '#' && (i === 0 || /\s/.test(raw[i - 1]))) {
      return raw.slice(0, i).trimEnd()
    }
  }
  return raw.trimEnd()
}

function splitInlineArray (inner) {
  const items = []
  let current = ''
  let quote = null
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i]
    if (quote) {
      current += ch
      if (ch === '\\' && quote === '"') { current += inner[++i] ?? ''; continue }
      if (ch === quote) quote = null
    } else if (ch === '"' || ch === "'") {
      quote = ch
      current += ch
    } else if (ch === ',') {
      items.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  if (current.trim() !== '') items.push(current.trim())
  return items
}

export function parseScalar (raw) {
  const value = raw.trim()
  if (value === '') return ''
  if (value.startsWith('"')) {
    if (!value.endsWith('"') || value.length < 2) throw new Error(`unterminated string: ${value}`)
    return JSON.parse(value)
  }
  if (value.startsWith("'")) {
    if (!value.endsWith("'") || value.length < 2) throw new Error(`unterminated string: ${value}`)
    return value.slice(1, -1).replace(/''/g, "'")
  }
  if (value.startsWith('[')) {
    if (!value.endsWith(']')) throw new Error(`unterminated array: ${value}`)
    return splitInlineArray(value.slice(1, -1)).map(parseScalar)
  }
  if (value === 'true') return true
  if (value === 'false') return false
  if (value === 'null' || value === '~') return null
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value)
  return value
}

export function parseFrontmatter (yaml) {
  const data = {}
  const lines = {}
  const errors = []
  const rows = yaml.split('\n')
  let parent = null

  rows.forEach((row, index) => {
    const lineNo = index + 2
    if (row.trim() === '' || row.trim().startsWith('#')) return
    const indent = row.match(/^ */)[0].length
    const content = stripComment(row.slice(indent))
    if (content === '') return

    try {
      if (indent === 0) {
        const match = content.match(/^([A-Za-z_][\w-]*):(?:\s+(.*))?$/)
        if (!match) throw new Error(`expected "key: value", got "${content}"`)
        const [, key, rest = ''] = match
        if (key in data) throw new Error(`duplicate key "${key}"`)
        lines[key] = lineNo
        if (rest === '') {
          data[key] = undefined
          parent = key
        } else {
          data[key] = parseScalar(rest)
          parent = null
        }
        return
      }

      if (!parent) throw new Error(`unexpected indented line "${content}"`)
      if (content.startsWith('- ') || content === '-') {
        if (data[parent] === undefined) data[parent] = []
        if (!Array.isArray(data[parent])) throw new Error(`"${parent}" mixes a list and a map`)
        data[parent].push(parseScalar(content.slice(1)))
        return
      }
      const match = content.match(/^([A-Za-z_][\w-]*):(?:\s+(.*))?$/)
      if (!match) throw new Error(`expected "- item" or "key: value" under "${parent}"`)
      if (data[parent] === undefined) data[parent] = {}
      if (Array.isArray(data[parent]) || typeof data[parent] !== 'object') {
        throw new Error(`"${parent}" mixes a list and a map`)
      }
      data[parent][match[1]] = parseScalar(match[2] ?? '')
    } catch (error) {
      errors.push({ line: lineNo, message: error.message })
    }
  })

  for (const key of Object.keys(data)) {
    if (data[key] === undefined) data[key] = null
  }
  return { data, lines, errors }
}

function typeOf (value) {
  if (Array.isArray(value)) return 'array'
  if (value === null) return 'null'
  return typeof value
}

function isUrl (value) {
  if (typeof value !== 'string' || !/^https?:\/\/\S+$/.test(value)) return false
  try {
    return Boolean(new URL(value))
  } catch {
    return false
  }
}

export function checkDate (value, today = new Date()) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return { valid: false }
  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return { valid: false }
  const days = Math.floor((Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - date.getTime()) / 86400000)
  return { valid: true, days }
}

function headingsOf (body, bodyStartLine) {
  const headings = []
  let fence = null
  body.split('\n').forEach((line, index) => {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/)
    if (fenceMatch) {
      if (!fence) fence = fenceMatch[1][0]
      else if (fenceMatch[1][0] === fence) fence = null
      return
    }
    if (fence) return
    const match = line.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/)
    if (match) headings.push({ level: match[1].length, text: match[2], line: bodyStartLine + index })
  })
  return headings
}

function hasHeading (headings, name) {
  return headings.some(h => h.level === 2 && (h.text === name || h.text.startsWith(`${name} `)))
}

function toPosix (path) {
  return path.split(sep).join('/')
}

function walk (root, dir = root, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(root, full, out)
    else if (entry.isFile()) out.push(toPosix(relative(root, full)))
  }
  return out
}

export function listFiles (root) {
  try {
    const output = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    const top = execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    if (resolve(top) === resolve(root)) {
      return output.split('\0').filter(Boolean).filter(f => existsSync(join(root, f)))
    }
  } catch {}
  return walk(root)
}

function isText (path, buffer) {
  const dot = path.lastIndexOf('.')
  if (dot !== -1 && BINARY_EXTENSIONS.has(path.slice(dot).toLowerCase())) return false
  return !buffer.subarray(0, 8000).includes(0)
}

export function isHiddenCodePoint (codePoint) {
  return HIDDEN_RANGES.some(([low, high]) => codePoint >= low && codePoint <= high)
}

function scanHiddenUnicode (file, text, report) {
  text.split('\n').forEach((line, index) => {
    let column = 0
    for (const char of line) {
      column++
      const codePoint = char.codePointAt(0)
      if (isHiddenCodePoint(codePoint)) {
        const hex = codePoint.toString(16).toUpperCase().padStart(4, '0')
        report('error', file, index + 1, 'hidden-unicode', `hidden character U+${hex} at column ${column}`)
      }
    }
  })
}

function checkSize (file, text, report) {
  const lines = text.replace(/\n$/, '').split('\n').length
  if (lines > MAX_LINES) report('error', file, 1, 'size', `${lines} lines; the maximum is ${MAX_LINES}`)
  else if (lines > WARN_LINES) report('warning', file, 1, 'size', `${lines} lines; aim for ${WARN_LINES} or fewer`)
}

function checkSources (file, sources, line, report) {
  if (!Array.isArray(sources) || sources.length === 0) {
    report('error', file, line, 'sources', '"sources" must be a non-empty list of URLs')
    return
  }
  for (const source of sources) {
    if (!isUrl(source)) report('error', file, line, 'sources', `not a valid http(s) URL: ${JSON.stringify(source)}`)
  }
}

function checkReviewDate (file, value, line, today, report) {
  const result = checkDate(value, today)
  if (!result.valid) {
    report('error', file, line, 'last-reviewed', `"last_reviewed" must be a real YYYY-MM-DD date, got ${JSON.stringify(value)}`)
  } else if (result.days < 0) {
    report('warning', file, line, 'last-reviewed', `"last_reviewed" ${value} is in the future`)
  } else if (result.days > STALE_DAYS) {
    report('warning', file, line, 'last-reviewed', `"last_reviewed" ${value} is ${result.days} days old; review it`)
  }
}

function lintRule (file, text, context) {
  const { report, today, refs } = context
  const isConvention = file.startsWith('conventions/')
  const parts = file.split('/')
  const category = isConvention ? 'conventions' : parts[1]
  const name = parts[parts.length - 1].replace(/\.md$/, '')
  const expectedId = `${category}/${name}`

  if (!isConvention && (parts.length !== 3 || !CATEGORIES.includes(category))) {
    report('error', file, 1, 'path', `rules must live at rules/<category>/<name>.md with a category from: ${CATEGORIES.join(', ')}`)
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
    report('error', file, 1, 'path', `file name "${name}" must be kebab-case`)
  }

  const fm = splitFrontmatter(text)
  if (!fm) {
    report('error', file, 1, 'frontmatter', 'missing YAML frontmatter (--- ... ---) at the top of the file')
    return
  }
  const { data, lines, errors } = parseFrontmatter(fm.yaml)
  for (const error of errors) report('error', file, error.line, 'frontmatter', error.message)

  for (const [key, type] of Object.entries(RULE_KEYS)) {
    if (!(key in data)) {
      report('error', file, 1, 'frontmatter', `missing required key "${key}"`)
    } else if (typeOf(data[key]) !== type) {
      report('error', file, lines[key], 'frontmatter', `"${key}" must be a ${type}, got ${typeOf(data[key])}`)
    } else if (type === 'string' && data[key].trim() === '') {
      report('error', file, lines[key], 'frontmatter', `"${key}" must not be empty`)
    }
  }
  for (const key of Object.keys(data)) {
    if (!(key in RULE_KEYS) && !(key in OPTIONAL_RULE_KEYS)) {
      report('warning', file, lines[key], 'frontmatter', `unknown key "${key}"`)
    }
  }
  if ('legacy_rule' in data && typeOf(data.legacy_rule) !== 'string') {
    report('error', file, lines.legacy_rule, 'frontmatter', '"legacy_rule" must be a string rule id')
  }

  if (typeof data.id === 'string' && data.id !== expectedId) {
    report('error', file, lines.id, 'id', `"id" is "${data.id}" but the path requires "${expectedId}"`)
  }
  if (typeof data.tier === 'string' && !/^P[0-3]$/.test(data.tier)) {
    report('error', file, lines.tier, 'tier', `"tier" must be P0, P1, P2 or P3, got "${data.tier}"`)
  }
  if (Array.isArray(data.globs) && data.globs.some(g => typeof g !== 'string' || g.trim() === '')) {
    report('error', file, lines.globs, 'frontmatter', '"globs" must contain only non-empty strings')
  }
  if (data.alwaysApply === true && category !== 'core') {
    report('error', file, lines.alwaysApply, 'always-apply', '"alwaysApply: true" is only allowed in rules/core/')
  }
  if ('last_reviewed' in data) checkReviewDate(file, data.last_reviewed, lines.last_reviewed, today, report)
  if ('sources' in data) checkSources(file, data.sources, lines.sources, report)

  if (typeof data.legacy_rule === 'string') {
    refs.push({ file, line: lines.legacy_rule, id: data.legacy_rule, source: 'legacy_rule' })
  }

  if (category !== 'core' && !isConvention) {
    const headings = headingsOf(fm.body, fm.bodyStartLine)
    const required = category === 'legacy' ? [...STACK_HEADINGS, ...LEGACY_HEADINGS] : STACK_HEADINGS
    for (const heading of required) {
      if (!hasHeading(headings, heading)) {
        report('error', file, 1, 'headings', `missing required heading "## ${heading}"`)
      }
    }
    if (hasHeading(headings, 'Known vulnerabilities') && !fm.body.includes(STALE_LINE)) {
      report('warning', file, 1, 'headings', `"## Known vulnerabilities" should include the line "${STALE_LINE}; verify with the \`cve-check\` skill …"`)
    }
  }

  collectRuleRefs(file, text, refs)
  checkSize(file, text, report)
}

function lintSkill (file, text, context) {
  const { report, today, refs } = context
  const folder = file.split('/')[1]

  const fm = splitFrontmatter(text)
  if (!fm) {
    report('error', file, 1, 'frontmatter', 'missing YAML frontmatter (--- ... ---) at the top of the file')
    return
  }
  const { data, lines, errors } = parseFrontmatter(fm.yaml)
  for (const error of errors) report('error', file, error.line, 'frontmatter', error.message)

  if (typeof data.name !== 'string' || data.name === '') {
    report('error', file, lines.name ?? 1, 'skill-name', 'missing "name"')
  } else {
    if (data.name !== folder) {
      report('error', file, lines.name, 'skill-name', `"name" is "${data.name}" but the folder is "${folder}"`)
    }
    if (data.name.length > SKILL_NAME_MAX) {
      report('error', file, lines.name, 'skill-name', `"name" is ${data.name.length} characters; the maximum is ${SKILL_NAME_MAX}`)
    }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(data.name)) {
      report('error', file, lines.name, 'skill-name', '"name" may use only a-z, 0-9 and single hyphens, and must not start or end with a hyphen')
    }
  }

  if (typeof data.description !== 'string' || data.description.trim() === '') {
    report('error', file, lines.description ?? 1, 'skill-description', 'missing or empty "description"')
  } else if (data.description.length > SKILL_DESCRIPTION_MAX) {
    report('error', file, lines.description, 'skill-description', `"description" is ${data.description.length} characters; the maximum is ${SKILL_DESCRIPTION_MAX}`)
  }

  if (!('license' in data)) report('warning', file, 1, 'frontmatter', 'missing "license"')

  const metadata = data.metadata
  if (typeOf(metadata) !== 'object') {
    report('error', file, lines.metadata ?? 1, 'skill-metadata', '"metadata" must be a map with owner, last_reviewed and sources')
  } else {
    for (const [key, value] of Object.entries(metadata)) {
      if (typeof value !== 'string') {
        report('error', file, lines.metadata, 'skill-metadata', `metadata "${key}" must be a string (quote it)`)
      }
    }
    for (const key of ['owner', 'last_reviewed', 'sources']) {
      if (!(key in metadata)) report('error', file, lines.metadata, 'skill-metadata', `metadata is missing "${key}"`)
    }
    if (typeof metadata.last_reviewed === 'string') {
      checkReviewDate(file, metadata.last_reviewed, lines.metadata, today, report)
    }
    if (typeof metadata.sources === 'string') {
      checkSources(file, metadata.sources.split(/\s+/).filter(Boolean), lines.metadata, report)
    }
  }

  const headings = headingsOf(fm.body, fm.bodyStartLine)
  for (const heading of SKILL_HEADINGS) {
    if (!hasHeading(headings, heading)) {
      report('error', file, 1, 'headings', `missing required heading "## ${heading}"`)
    }
  }

  collectRuleRefs(file, text, refs)
  checkSize(file, text, report)
}

const REF_PATTERN = new RegExp('`((?:' + [...CATEGORIES, 'conventions'].join('|') + ')/[a-z0-9]+(?:-[a-z0-9]+)*)`', 'g')

function collectRuleRefs (file, text, refs) {
  text.split('\n').forEach((line, index) => {
    for (const match of line.matchAll(REF_PATTERN)) {
      refs.push({ file, line: index + 1, id: match[1], source: 'reference' })
    }
  })
}

function checkRefs (refs, knownIds, report) {
  for (const ref of refs) {
    if (!knownIds.has(ref.id)) {
      const what = ref.source === 'legacy_rule' ? '"legacy_rule"' : 'reference'
      report('warning', ref.file, ref.line, 'cross-reference', `${what} "${ref.id}" doesn't match any rule yet`)
    }
  }
}

const INSTALL_PATTERNS = [
  { registry: 'npm', re: /\bnpm\s+(?:i|install|add)(?=\s)([^`\n|;&#)]*)/g },
  { registry: 'npm', re: /\bpnpm\s+(?:add|install|i)(?=\s)([^`\n|;&#)]*)/g },
  { registry: 'npm', re: /\byarn\s+(?:global\s+)?add(?=\s)([^`\n|;&#)]*)/g },
  { registry: 'npm', re: /\bbun\s+(?:add|install|i)(?=\s)([^`\n|;&#)]*)/g },
  { registry: 'pypi', re: /\b(?:pip3?|uv\s+pip|python3?\s+-m\s+pip)\s+install(?=\s)([^`\n|;&#)]*)/g },
  { registry: 'pypi', re: /\buv\s+add(?=\s)([^`\n|;&#)]*)/g },
  { registry: 'packagist', re: /\bcomposer\s+require(?=\s)([^`\n|;&#)]*)/g },
  { registry: 'crates', re: /\bcargo\s+(?:add|install)(?=\s)([^`\n|;&#)]*)/g },
  { registry: 'go', re: /\bgo\s+(?:get|install)(?=\s)([^`\n|;&#)]*)/g },
  { registry: 'nuget', re: /\bdotnet\s+add\s+(?:\S+\s+)?package\s+([^`\n|;&#)]*)/g },
]

const FLAGS_WITH_VALUES = new Set([
  '-r', '--requirement', '-c', '--constraint', '-e', '--editable', '-i', '--index-url',
  '--extra-index-url', '-w', '--workspace', '--filter', '-v', '--version', '-s', '--source',
  '--features', '-F', '--registry', '--tag', '--git', '--path', '--branch', '--rev', '-f', '--framework',
  '--target', '-t', '--prefix', '--cwd', '--dir', '-C',
])

function packageTokens (args) {
  const tokens = args.trim().split(/\s+/).map(t => t.replace(/^['"]|['"]$/g, '')).filter(Boolean)
  const names = []
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token.startsWith('-')) {
      if (FLAGS_WITH_VALUES.has(token)) i++
      continue
    }
    names.push(token)
  }
  return names
}

function isPlaceholder (token) {
  return /<[^>\s]*>|[${}*…]|\.\.\.|^[A-Z_]+$|^\.|^\/|^~|:\/\/|^file:|^git[+:]|^link:|^workspace:|\.(txt|toml|json|lock)$/.test(token)
}

export function normalizePackage (registry, token) {
  if (isPlaceholder(token)) return null
  switch (registry) {
    case 'npm': {
      const match = token.match(/^(@[a-z0-9][\w.-]*\/[\w.-]+|[a-z0-9][\w.-]*)(?:@.*)?$/i)
      return match ? match[1] : null
    }
    case 'pypi': {
      const match = token.match(/^([A-Za-z0-9][A-Za-z0-9._-]*)/)
      return match ? match[1] : null
    }
    case 'packagist': {
      const match = token.match(/^([a-z0-9][\w.-]*\/[a-z0-9][\w.-]*)(?::.*)?$/i)
      return match ? match[1].toLowerCase() : null
    }
    case 'crates': {
      const match = token.match(/^([A-Za-z0-9][\w-]*)(?:@.*)?$/)
      return match ? match[1] : null
    }
    case 'go': {
      const match = token.match(/^([a-z0-9.-]+\.[a-z]{2,}\/[^@\s]+)(?:@.*)?$/i)
      return match ? match[1] : null
    }
    case 'nuget': {
      const match = token.match(/^([A-Za-z0-9][\w.-]*)$/)
      return match ? match[1] : null
    }
    default:
      return null
  }
}

export function extractPackages (text) {
  const found = []
  text.split('\n').forEach((line, index) => {
    for (const { registry, re } of INSTALL_PATTERNS) {
      for (const match of line.matchAll(re)) {
        for (const token of packageTokens(match[1])) {
          const name = normalizePackage(registry, token)
          if (name) found.push({ registry, name, line: index + 1 })
        }
      }
    }
  })
  return found
}

function goEscape (path) {
  return path.replace(/[A-Z]/g, c => `!${c.toLowerCase()}`)
}

async function exists (url, headers = {}) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'cursor-rules-lint (+https://github.com/Phaedra-Solutions/cursor-rules)', ...headers },
    signal: AbortSignal.timeout(15000),
  })
  if (response.ok) return true
  if (response.status === 404 || response.status === 410) return false
  throw new Error(`HTTP ${response.status}`)
}

async function packageExists (registry, name) {
  switch (registry) {
    case 'npm':
      return exists(`https://registry.npmjs.org/${name.replace('/', '%2f')}`, { accept: 'application/vnd.npm.install-v1+json' })
    case 'pypi':
      return exists(`https://pypi.org/pypi/${encodeURIComponent(name)}/json`)
    case 'packagist':
      return exists(`https://repo.packagist.org/p2/${name}.json`)
    case 'crates':
      return exists(`https://crates.io/api/v1/crates/${encodeURIComponent(name)}`)
    case 'nuget':
      return exists(`https://api.nuget.org/v3-flatcontainer/${name.toLowerCase()}/index.json`)
    case 'go': {
      const parts = name.split('/')
      for (let n = parts.length; n >= 2; n--) {
        if (await exists(`https://proxy.golang.org/${goEscape(parts.slice(0, n).join('/'))}/@latest`)) return true
      }
      return false
    }
    default:
      return true
  }
}

async function checkPackages (items, report) {
  const unique = new Map()
  for (const item of items) {
    const key = `${item.registry}:${item.name}`
    if (!unique.has(key)) unique.set(key, [])
    unique.get(key).push(item)
  }
  const entries = [...unique.entries()]
  const workers = Array.from({ length: Math.min(6, entries.length) }, async () => {
    while (entries.length) {
      const [, uses] = entries.shift()
      const { registry, name } = uses[0]
      try {
        if (!(await packageExists(registry, name))) {
          for (const use of uses) report('error', use.file, use.line, 'package-exists', `${registry} package "${name}" doesn't exist`)
        }
      } catch (error) {
        report('warning', uses[0].file, uses[0].line, 'package-exists', `couldn't check ${registry} package "${name}": ${error.message}`)
      }
    }
  })
  await Promise.all(workers)
}

export async function lint ({ root = process.cwd(), network = false, today = new Date() } = {}) {
  const issues = []
  const report = (severity, file, line, rule, message) => issues.push({ severity, file, line: line ?? 1, rule, message })
  const refs = []
  const knownIds = new Set()
  const packages = []
  const context = { report, today, refs }

  const files = listFiles(root).sort()
  let checked = 0

  for (const file of files) {
    const full = join(root, file)
    let buffer
    try {
      if (!statSync(full).isFile()) continue
      buffer = readFileSync(full)
    } catch {
      continue
    }
    if (!isText(file, buffer)) continue
    const text = buffer.toString('utf8')
    scanHiddenUnicode(file, text, report)

    const isRule = /^rules\/.+\.md$/.test(file)
    const isConvention = /^conventions\/[^/]+\.md$/.test(file)
    const isSkill = /^skills\/[^/]+\/SKILL\.md$/.test(file)
    if (isRule || isConvention) {
      knownIds.add(file.replace(/^rules\//, '').replace(/\.md$/, ''))
      lintRule(file, text, context)
      checked++
    } else if (isSkill) {
      lintSkill(file, text, context)
      checked++
    }
    if (network && (isRule || isConvention || isSkill)) {
      for (const pkg of extractPackages(text)) packages.push({ ...pkg, file })
    }
  }

  checkRefs(refs, knownIds, report)
  if (network) await checkPackages(packages, report)

  issues.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)
  return {
    filesScanned: files.length,
    filesChecked: checked,
    errors: issues.filter(i => i.severity === 'error'),
    warnings: issues.filter(i => i.severity === 'warning'),
  }
}

function formatText (result) {
  const out = []
  for (const issue of [...result.errors, ...result.warnings].sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)) {
    out.push(`${issue.file}:${issue.line}  ${issue.severity.padEnd(7)}  ${issue.rule.padEnd(17)}  ${issue.message}`)
  }
  out.push('')
  out.push(`${result.filesChecked} rules and skills checked, ${result.filesScanned} files scanned: ${result.errors.length} errors, ${result.warnings.length} warnings`)
  return out.join('\n')
}

async function main (argv) {
  const args = argv.slice(2)
  const options = { json: false, network: false, root: process.cwd() }
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--json') options.json = true
    else if (arg === '--network') options.network = true
    else if (arg === '--root') options.root = resolve(args[++i] ?? '.')
    else if (arg === '-h' || arg === '--help') {
      console.log('Usage: node scripts/lint-rules.mjs [--json] [--network] [--root <dir>]')
      return 0
    } else {
      console.error(`Unknown argument: ${arg}`)
      return 2
    }
  }
  const result = await lint({ root: options.root, network: options.network })
  console.log(options.json ? JSON.stringify(result, null, 2) : formatText(result))
  return result.errors.length > 0 ? 1 : 0
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv).then(code => { process.exitCode = code }, error => {
    console.error(error)
    process.exitCode = 2
  })
}

