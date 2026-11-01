#!/usr/bin/env node
// Usage: node scripts/build.mjs [--preset <name>] [--out <dir>] [--root <dir>] [--json]
//        node scripts/build.mjs --catalog [--check] [--root <dir>]

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { listFiles, parseFrontmatter, splitFrontmatter } from './lint-rules.mjs'
import { parseArgs } from './lib/automation.mjs'

export const SOURCE_REPO = 'Phaedra-Solutions/cursor-rules'
const SKILL_NAME_MAX = 64
const CORE_ORDER = ['core/behavior', 'core/security-baseline', 'core/supply-chain', 'core/agent-safety']
const SKILL_DESCRIPTION_MAX = 1024

export function expandBraces (pattern) {
  const match = pattern.match(/\{([^{}]*)\}/)
  if (!match) return [pattern]
  const [whole, inner] = match
  const before = pattern.slice(0, match.index)
  const after = pattern.slice(match.index + whole.length)
  return inner.split(',').flatMap(option => expandBraces(`${before}${option}${after}`))
}

export function demoteHeadings (markdown, levels) {
  let fence = null
  return markdown.split('\n').map(line => {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/)
    if (fenceMatch) {
      if (!fence) fence = fenceMatch[1][0]
      else if (fenceMatch[1][0] === fence) fence = null
      return line
    }
    if (fence) return line
    const heading = line.match(/^(#{1,6})(\s.*)$/)
    if (!heading) return line
    return '#'.repeat(Math.min(6, heading[1].length + levels)) + heading[2]
  }).join('\n')
}

function stripTitle (body) {
  return body.replace(/^\s*#\s[^\n]*\n+/, '')
}

function yamlString (value) {
  return JSON.stringify(String(value))
}

function cell (value) {
  return String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

function sha256 (data) {
  return createHash('sha256').update(data).digest('hex')
}

export function loadSources (root) {
  const files = listFiles(root)
  const rules = new Map()
  const skills = new Map()
  const warnings = []

  for (const file of files) {
    const isRule = /^rules\/[^/]+\/[^/]+\.md$/.test(file)
    const isConvention = /^conventions\/[^/]+\.md$/.test(file)
    if (!isRule && !isConvention) continue
    const fm = splitFrontmatter(readFileSync(join(root, file), 'utf8'))
    if (!fm) {
      warnings.push(`${file}: no frontmatter; skipped`)
      continue
    }
    const { data } = parseFrontmatter(fm.yaml)
    const id = isRule ? file.slice('rules/'.length, -3) : file.slice(0, -3)
    rules.set(id, { id, file, kind: isRule ? 'rule' : 'convention', category: id.split('/')[0], name: id.split('/')[1], data, body: fm.body })
  }

  for (const file of files) {
    const match = file.match(/^skills\/([^/]+)\/SKILL\.md$/)
    if (!match) continue
    const name = match[1]
    const fm = splitFrontmatter(readFileSync(join(root, file), 'utf8'))
    const data = fm ? parseFrontmatter(fm.yaml).data : {}
    const skillFiles = files.filter(f => f.startsWith(`skills/${name}/`))
    skills.set(name, { name, dir: `skills/${name}`, files: skillFiles, data })
  }

  return { rules, skills, warnings }
}

export function loadPreset (root, name) {
  const file = join(root, 'presets', `${name}.yml`)
  if (!existsSync(file)) throw new Error(`preset "${name}" not found (expected presets/${name}.yml)`)
  const { data, errors } = parseFrontmatter(readFileSync(file, 'utf8'))
  if (errors.length) throw new Error(`presets/${name}.yml: ${errors.map(e => `line ${e.line}: ${e.message}`).join('; ')}`)
  const list = key => (data[key] == null ? [] : Array.isArray(data[key]) ? data[key].map(String) : [String(data[key])])
  return { name: data.name ?? name, description: data.description ?? '', rules: list('rules'), skills: list('skills'), conventions: list('conventions') }
}

function matchIds (pattern, ids) {
  if (!pattern.includes('*')) return ids.includes(pattern) ? [pattern] : []
  const re = new RegExp('^' + pattern.split('*').map(s => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*') + '$')
  return ids.filter(id => re.test(id))
}

export function selectSources (sources, preset) {
  const warnings = []
  const ruleIds = [...sources.rules.keys()].filter(id => sources.rules.get(id).kind === 'rule')
  const conventionIds = [...sources.rules.keys()].filter(id => sources.rules.get(id).kind === 'convention')

  if (!preset) {
    return {
      rules: ruleIds.sort().map(id => sources.rules.get(id)),
      conventions: conventionIds.sort().map(id => sources.rules.get(id)),
      skills: [...sources.skills.keys()].sort().map(name => sources.skills.get(name)),
      warnings,
    }
  }

  const pick = (patterns, ids, label) => {
    const chosen = new Set()
    for (const pattern of patterns) {
      const found = matchIds(pattern, ids)
      if (found.length === 0) warnings.push(`preset ${preset.name}: ${label} "${pattern}" doesn't exist yet; skipped`)
      found.forEach(id => chosen.add(id))
    }
    return [...chosen].sort()
  }

  const rules = pick(preset.rules, ruleIds, 'rule').map(id => sources.rules.get(id))
  const conventions = pick(preset.conventions, conventionIds, 'convention').map(id => sources.rules.get(id))
  const skills = []
  for (const name of preset.skills) {
    if (sources.skills.has(name)) skills.push(sources.skills.get(name))
    else warnings.push(`preset ${preset.name}: skill "${name}" doesn't exist yet; skipped`)
  }
  return { rules, conventions, skills, warnings }
}

export function cursorGlobs (globs) {
  return (Array.isArray(globs) ? globs : []).flatMap(expandBraces)
}

export function renderMdc (rule) {
  const lines = ['---', `description: ${yamlString(rule.data.description ?? rule.data.title ?? rule.id)}`]
  const globs = cursorGlobs(rule.data.globs)
  if (globs.length) lines.push(`globs: ${globs.join(', ')}`)
  lines.push(`alwaysApply: ${rule.data.alwaysApply === true}`, '---')
  return lines.join('\n') + '\n\n' + rule.body.replace(/^\n+/, '')
}

export function conventionsSkillName (rule) {
  return `${rule.category}-${rule.name}-conventions`
}

export function renderConventionsSkill (rule, warnings = []) {
  let name = conventionsSkillName(rule)
  if (name.length > SKILL_NAME_MAX) {
    warnings.push(`${rule.id}: generated skill name "${name}" is over ${SKILL_NAME_MAX} characters; truncated`)
    name = name.slice(0, SKILL_NAME_MAX).replace(/-+$/, '')
  }
  const globs = cursorGlobs(rule.data.globs)
  let description = String(rule.data.description ?? rule.data.title ?? rule.id).trim()
  if (globs.length) description += ` Load before editing files that match: ${globs.join(', ')}.`
  if (description.length > SKILL_DESCRIPTION_MAX) description = description.slice(0, SKILL_DESCRIPTION_MAX - 1).trimEnd() + '…'
  const sources = Array.isArray(rule.data.sources) ? rule.data.sources.join(' ') : ''
  const frontmatter = [
    '---',
    `name: ${name}`,
    `description: ${yamlString(description)}`,
    'license: MIT',
    'metadata:',
    `  owner: ${yamlString(rule.data.owner ?? '')}`,
    `  last_reviewed: ${yamlString(rule.data.last_reviewed ?? '')}`,
    `  sources: ${yamlString(sources)}`,
    `  generated_from: ${yamlString(rule.file)}`,
    '---',
  ].join('\n')
  return { name, text: frontmatter + '\n\n' + rule.body.replace(/^\n+/, '') }
}

function firstSentence (text) {
  const match = String(text ?? '').match(/^.*?[.!?](\s|$)/)
  return (match ? match[0] : String(text ?? '')).trim()
}

export function renderAgentsMd ({ selection, preset, version, conventionsSkills }) {
  const rank = id => (CORE_ORDER.includes(id) ? CORE_ORDER.indexOf(id) : CORE_ORDER.length)
  const always = selection.rules
    .filter(r => r.category === 'core' && r.data.alwaysApply === true)
    .sort((a, b) => rank(a.id) - rank(b.id) || a.id.localeCompare(b.id))
  const onDemand = selection.rules.filter(r => !(r.category === 'core' && r.data.alwaysApply === true))
  const out = []
  out.push('# Agent instructions', '')
  out.push(`Generated by ${SOURCE_REPO} (preset: ${preset ?? 'all'}, version: ${version}). Don't edit this file by hand: change the source rules and rebuild.`, '')

  out.push('## Core rules', '')
  if (always.length === 0) out.push('No core rules were selected.', '')
  for (const rule of always) {
    out.push(`### ${rule.data.title ?? rule.id} (\`${rule.id}\`)`, '')
    out.push(demoteHeadings(stripTitle(rule.body), 2).trim(), '')
  }

  if (selection.conventions.length) {
    out.push('## House conventions', '')
    for (const rule of selection.conventions) {
      out.push(`### ${rule.data.title ?? rule.id} (\`${rule.id}\`)`, '')
      out.push(demoteHeadings(stripTitle(rule.body), 2).trim(), '')
    }
  }

  out.push('## Stack guidance', '')
  if (onDemand.length === 0) {
    out.push('No stack rules were selected.', '')
  } else {
    out.push('Before you edit files that match a row below (or when its "Use when" applies), load the skill in the last column and follow it. Stack skills start with a version check; if the project is outside the supported range, follow `core/legacy-mode`.', '')
    out.push('| Rule | Use when | Files | Skill |', '|---|---|---|---|')
    for (const rule of onDemand) {
      const globs = cursorGlobs(rule.data.globs)
      out.push(`| \`${rule.id}\` | ${cell(rule.data.description ?? '')} | ${globs.length ? globs.map(g => `\`${cell(g)}\``).join(', ') : 'any, when the description applies'} | \`${conventionsSkills.get(rule.id)}\` |`)
    }
    out.push('')
  }

  if (selection.skills.length) {
    out.push('## Task skills', '')
    out.push('Load a skill when its trigger applies:', '')
    for (const skill of selection.skills) out.push(`- \`${skill.name}\`: ${cell(firstSentence(skill.data.description))}`)
    out.push('')
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
}

export function renderClaudeMd () {
  return [
    '# Claude Code instructions',
    '',
    `The shared agent instructions from ${SOURCE_REPO} live in AGENTS.md:`,
    '',
    '@AGENTS.md',
    '',
  ].join('\n')
}

export function gitVersion (root) {
  try {
    return execFileSync('git', ['describe', '--tags', '--always', '--dirty'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return 'unknown'
  }
}

export const CATALOG_START = '<!-- catalog:start (generated by node scripts/build.mjs --catalog; do not edit) -->'
export const CATALOG_END = '<!-- catalog:end -->'
export const PRESETS_START = '<!-- presets:start (generated by node scripts/build.mjs --catalog; do not edit) -->'
export const PRESETS_END = '<!-- presets:end -->'
const CATEGORY_ORDER = ['core', 'languages', 'frontend', 'backend', 'data', 'mobile', 'testing', 'devops', 'ai', 'cms-commerce', 'legacy']
const CATEGORY_LABELS = {
  core: 'Core', languages: 'Languages', frontend: 'Frontend', backend: 'Backend', data: 'Data', mobile: 'Mobile',
  testing: 'Testing', devops: 'DevOps and cloud', ai: 'AI', 'cms-commerce': 'CMS and commerce', legacy: 'Legacy',
}

function shorten (text, max = 220) {
  const value = firstSentence(text)
  return value.length > max ? value.slice(0, max - 1).trimEnd() + '…' : value
}

export function renderCatalog (root) {
  root = resolve(root)
  const sources = loadSources(root)
  const rules = [...sources.rules.values()].filter(r => r.kind === 'rule')
  const conventions = [...sources.rules.values()].filter(r => r.kind === 'convention')
  const skills = [...sources.skills.values()].sort((a, b) => a.name.localeCompare(b.name))
  const legacyCount = rules.filter(r => r.category === 'legacy').length
  const out = []
  out.push(CATALOG_START, '')
  out.push(`${rules.length} rules (${legacyCount} of them for legacy versions), ${skills.length} skills and ${conventions.length} optional convention overlay${conventions.length === 1 ? '' : 's'}. "Evals" marks rules with a promptfoo suite in [evals/](./evals/README.md).`, '')

  const categories = [...new Set(rules.map(r => r.category))]
    .sort((a, b) => (CATEGORY_ORDER.indexOf(a) + 1 || 99) - (CATEGORY_ORDER.indexOf(b) + 1 || 99) || a.localeCompare(b))
  for (const category of categories) {
    out.push(`### ${CATEGORY_LABELS[category] ?? category}`, '')
    out.push('| Rule | Covers | Applies to | Tier | Status | Evals |', '|---|---|---|---|---|---|')
    for (const rule of rules.filter(r => r.category === category).sort((a, b) => a.id.localeCompare(b.id))) {
      const hasEvals = existsSync(join(root, 'evals', `${rule.id}.yaml`))
      const status = category === 'legacy' ? 'legacy' : rule.data.alwaysApply === true ? 'always on' : 'active'
      out.push(`| [\`${rule.id}\`](./${rule.file}) | ${cell(rule.data.title ?? '')} | ${cell(rule.data.applies_to ?? 'any')} | ${cell(rule.data.tier ?? '')} | ${status} | ${hasEvals ? 'yes' : ''} |`)
    }
    out.push('')
  }

  out.push('### Skills', '')
  out.push('| Skill | What it does |', '|---|---|')
  for (const skill of skills) out.push(`| [\`${skill.name}\`](./${skill.dir}/SKILL.md) | ${cell(shorten(skill.data.description))} |`)
  out.push('')

  const ruleIds = new Set(rules.map(r => r.id))
  const planned = new Map()
  for (const file of listFiles(root).filter(f => /^presets\/[^/]+\.yml$/.test(f)).sort()) {
    const preset = loadPreset(root, file.slice('presets/'.length, -'.yml'.length))
    for (const id of preset.rules.filter(p => !p.includes('*') && !ruleIds.has(p))) {
      if (!planned.has(id)) planned.set(id, new Set())
      planned.get(id).add(`preset \`${preset.name}\``)
    }
  }
  for (const rule of rules) {
    const id = rule.data.legacy_rule
    if (typeof id !== 'string' || ruleIds.has(id)) continue
    if (!planned.has(id)) planned.set(id, new Set())
    planned.get(id).add(`\`${rule.id}\``)
  }
  if (planned.size) {
    out.push('### Planned', '')
    out.push('Referenced but not written yet; until they exist, the build skips them.', '')
    out.push('| Rule | Referenced by |', '|---|---|')
    for (const [id, refs] of [...planned.entries()].sort(([a], [b]) => a.localeCompare(b))) out.push(`| \`${id}\` | ${[...refs].sort().join(', ')} |`)
    out.push('')
  }

  if (conventions.length) {
    out.push('### Conventions', '')
    out.push('| Overlay | Covers |', '|---|---|')
    for (const rule of conventions) out.push(`| [\`${rule.id}\`](./${rule.file}) | ${cell(rule.data.title ?? '')} |`)
    out.push('')
  }

  out.push(CATALOG_END)
  return out.join('\n') + '\n'
}

export function renderPresets (root) {
  root = resolve(root)
  const sources = loadSources(root)
  const out = [PRESETS_START, '', '| Preset | Stack | Rules | Skills |', '|---|---|---|---|']
  for (const file of listFiles(root).filter(f => /^presets\/[^/]+\.yml$/.test(f)).sort()) {
    const preset = loadPreset(root, file.slice('presets/'.length, -'.yml'.length))
    const selection = selectSources(sources, preset)
    out.push(`| [\`${preset.name}\`](./${file}) | ${cell(preset.description)} | ${selection.rules.length} | ${selection.skills.length} |`)
  }
  out.push('', PRESETS_END)
  return out.join('\n') + '\n'
}

export function replaceBlock (readme, startMarker, endMarker, content) {
  const start = readme.indexOf(startMarker)
  const end = readme.indexOf(endMarker)
  if (start === -1 || end === -1 || end < start) throw new Error(`README.md has no ${startMarker.slice(5, startMarker.indexOf(':'))} markers`)
  return readme.slice(0, start) + content.trimEnd() + readme.slice(end + endMarker.length)
}

export function updateReadme (readme, root) {
  const withCatalog = replaceBlock(readme, CATALOG_START, CATALOG_END, renderCatalog(root))
  return replaceBlock(withCatalog, PRESETS_START, PRESETS_END, renderPresets(root))
}

export function build ({ root = process.cwd(), out, preset: presetName, version } = {}) {
  root = resolve(root)
  out = resolve(out ?? join(root, 'dist'))
  const sources = loadSources(root)
  const preset = presetName ? loadPreset(root, presetName) : null
  const selection = selectSources(sources, preset)
  const warnings = [...sources.warnings, ...selection.warnings]
  version = version ?? gitVersion(root)

  const outputs = new Map()
  const put = (path, content, mode) => outputs.set(path, { content: Buffer.isBuffer(content) ? content : Buffer.from(content), mode })

  for (const rule of [...selection.rules, ...selection.conventions]) {
    put(`cursor/.cursor/rules/${rule.category}/${rule.name}.mdc`, renderMdc(rule))
  }

  for (const skill of selection.skills) {
    for (const file of skill.files) {
      const rel = file.slice('skills/'.length)
      const full = join(root, file)
      const content = readFileSync(full)
      const mode = statSync(full).mode & 0o777
      for (const base of ['cursor/.cursor/skills', 'agents/.agents/skills', 'claude/.claude/skills']) put(`${base}/${rel}`, content, mode)
    }
  }

  const conventionsSkills = new Map()
  for (const rule of selection.rules.filter(r => !(r.category === 'core' && r.data.alwaysApply === true))) {
    const skill = renderConventionsSkill(rule, warnings)
    conventionsSkills.set(rule.id, skill.name)
    if (selection.skills.some(s => s.name === skill.name)) warnings.push(`${rule.id}: generated skill "${skill.name}" clashes with a hand-written skill; kept the hand-written one`)
    else for (const base of ['agents/.agents/skills', 'claude/.claude/skills']) put(`${base}/${skill.name}/SKILL.md`, skill.text)
  }

  const agentsMd = renderAgentsMd({ selection, preset: preset?.name, version, conventionsSkills })
  put('agents/AGENTS.md', agentsMd)
  put('claude/AGENTS.md', agentsMd)
  put('claude/CLAUDE.md', renderClaudeMd())

  rmSync(out, { recursive: true, force: true })
  const files = []
  for (const [path, { content, mode }] of [...outputs.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const target = join(out, path)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, content)
    if (mode) chmodSync(target, mode)
    files.push({ path, sha256: sha256(content), bytes: content.length })
  }

  const manifest = {
    generator: `${SOURCE_REPO} scripts/build.mjs`,
    version,
    preset: preset?.name ?? null,
    rules: selection.rules.map(r => r.id),
    conventions: selection.conventions.map(r => r.id),
    skills: selection.skills.map(s => s.name),
    generatedSkills: [...conventionsSkills.values()],
    warnings,
    files,
  }
  const manifestText = JSON.stringify(manifest, null, 2) + '\n'
  writeFileSync(join(out, 'manifest.json'), manifestText)
  return { out, manifest, manifestSha256: sha256(manifestText), warnings }
}

function main (argv) {
  const options = parseArgs(argv, ['json', 'catalog', 'check'], ['preset', 'out', 'root'])
  if (options._unknown.length) {
    console.error(`Unknown argument: ${options._unknown[0]}`)
    return 2
  }
  if (options.catalog) {
    const root = resolve(options.root ?? process.cwd())
    const readmePath = join(root, 'README.md')
    const current = readFileSync(readmePath, 'utf8')
    const next = updateReadme(current, root)
    if (options.check) {
      if (next !== current) {
        console.error('README.md catalog or preset table is out of date; run: node scripts/build.mjs --catalog')
        return 1
      }
      console.log('README.md catalog is up to date')
      return 0
    }
    writeFileSync(readmePath, next)
    console.log(next === current ? 'README.md catalog already up to date' : 'Updated the README.md catalog')
    return 0
  }
  const result = build({ root: options.root ?? process.cwd(), out: options.out, preset: options.preset })
  if (options.json) {
    console.log(JSON.stringify({ out: result.out, manifestSha256: result.manifestSha256, ...result.manifest }, null, 2))
    return 0
  }
  for (const warning of result.warnings) console.warn(`warning: ${warning}`)
  const m = result.manifest
  console.log(`Built ${m.files.length} files into ${result.out} (preset: ${m.preset ?? 'all'}, version: ${m.version})`)
  console.log(`  rules: ${m.rules.length}, conventions: ${m.conventions.length}, skills: ${m.skills.length}, generated stack skills: ${m.generatedSkills.length}`)
  console.log(`  manifest sha256: ${result.manifestSha256}`)
  return 0
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main(process.argv)
  } catch (error) {
    console.error(`error: ${error.message}`)
    process.exitCode = 1
  }
}
