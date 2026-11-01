#!/usr/bin/env node
// Usage: node scripts/install.mjs --dest <path> [--preset <name>] [--tool cursor,agents,claude] [--dry-run] [--force]

import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { build, SOURCE_REPO } from './build.mjs'
import { parseArgs } from './lib/automation.mjs'

export const TOOLS = ['cursor', 'agents', 'claude']
const VERSION_MARKER = `source: ${SOURCE_REPO}`

function walk (dir) {
  if (!existsSync(dir)) return []
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (entry.isFile()) out.push(full)
  }
  return out
}

function toPosix (path) {
  return path.split(sep).join('/')
}

export function versionFilePath (tools) {
  if (tools.includes('cursor')) return '.cursor/rules/.cursor-rules-version'
  if (tools.includes('agents')) return '.agents/.cursor-rules-version'
  return '.claude/.cursor-rules-version'
}

export function planInstall ({ buildOut, dest, tools }) {
  const notes = []
  const entries = new Map()
  const add = (fromBase, toBase) => {
    const base = join(buildOut, fromBase)
    for (const file of walk(base)) {
      const to = toPosix(join(toBase, relative(base, file)))
      if (!entries.has(to)) entries.set(to, file)
    }
  }
  const addFile = (from, to) => {
    const full = join(buildOut, from)
    if (existsSync(full) && !entries.has(to)) entries.set(to, full)
  }

  if (tools.includes('cursor')) {
    add('cursor/.cursor/rules', '.cursor/rules')
    if (tools.includes('agents')) notes.push('Skipped .cursor/skills: Cursor also loads .agents/skills, so installing both would list each skill twice.')
    else add('cursor/.cursor/skills', '.cursor/skills')
  }
  if (tools.includes('agents')) {
    addFile('agents/AGENTS.md', 'AGENTS.md')
    add('agents/.agents/skills', '.agents/skills')
  }
  if (tools.includes('claude')) {
    addFile('claude/CLAUDE.md', 'CLAUDE.md')
    addFile('claude/AGENTS.md', 'AGENTS.md')
    add('claude/.claude/skills', '.claude/skills')
    if (tools.includes('cursor') || tools.includes('agents')) notes.push('Cursor also reads .claude/skills; if you use Cursor too, it may list these skills twice.')
  }

  const plan = []
  for (const [to, from] of [...entries.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const target = join(dest, to)
    const content = readFileSync(from)
    let status = 'new'
    if (existsSync(target)) status = readFileSync(target).equals(content) ? 'same' : 'conflict'
    plan.push({ to, from, status, mode: statSync(from).mode & 0o777 })
  }
  return { plan, notes }
}

export function versionFileContent ({ version, preset, tools, manifestSha256, date }) {
  return [
    VERSION_MARKER,
    `version: ${version}`,
    `preset: ${preset ?? 'all'}`,
    `tools: ${tools.join(',')}`,
    `manifest_sha256: ${manifestSha256}`,
    `installed: ${date}`,
    '',
  ].join('\n')
}

export function install ({ root, preset, tools, dest, dryRun = false, force = false, today = new Date(), log = console.log }) {
  if (!dest) throw new Error('--dest <path> is required')
  const unknown = tools.filter(t => !TOOLS.includes(t))
  if (unknown.length) throw new Error(`unknown tool(s): ${unknown.join(', ')} (use ${TOOLS.join(', ')})`)
  dest = resolve(dest)
  if (!existsSync(dest) || !statSync(dest).isDirectory()) throw new Error(`destination "${dest}" doesn't exist or isn't a directory`)

  const buildOut = mkdtempSync(join(tmpdir(), 'cursor-rules-build-'))
  try {
    const result = build({ root, out: buildOut, preset })
    for (const warning of result.warnings) log(`warning: ${warning}`)
    const { plan, notes } = planInstall({ buildOut, dest, tools })

    const versionPath = versionFilePath(tools)
    const versionText = versionFileContent({ version: result.manifest.version, preset, tools, manifestSha256: result.manifestSha256, date: today.toISOString().slice(0, 10) })
    const versionTarget = join(dest, versionPath)
    let versionStatus = 'new'
    if (existsSync(versionTarget)) {
      versionStatus = readFileSync(versionTarget, 'utf8').startsWith(VERSION_MARKER) ? 'update' : 'conflict'
    }

    const conflicts = plan.filter(p => p.status === 'conflict').map(p => p.to)
    if (versionStatus === 'conflict') conflicts.push(versionPath)
    const counts = {
      new: plan.filter(p => p.status === 'new').length + (versionStatus === 'new' ? 1 : 0),
      same: plan.filter(p => p.status === 'same').length,
      conflict: conflicts.length,
      update: versionStatus === 'update' ? 1 : 0,
    }

    log(`Install plan for ${dest} (preset: ${preset ?? 'all'}, tools: ${tools.join(', ')}, version: ${result.manifest.version})`)
    for (const p of plan) {
      const label = p.status === 'conflict' ? (force ? 'overwrite' : 'CONFLICT') : p.status
      log(`  ${label.padEnd(9)} ${p.to}`)
    }
    log(`  ${(versionStatus === 'conflict' ? (force ? 'overwrite' : 'CONFLICT') : versionStatus).padEnd(9)} ${versionPath}`)
    log(`Summary: ${counts.new} new, ${counts.same} unchanged, ${counts.update} updated, ${counts.conflict} ${force ? 'overwritten' : 'conflicting'}`)
    for (const note of notes) log(`note: ${note}`)
    if (conflicts.includes('CLAUDE.md') && !force) log('hint: instead of --force, add a line "@AGENTS.md" to your existing CLAUDE.md.')
    if (conflicts.includes('AGENTS.md') && !force) log('hint: AGENTS.md already exists; merge the generated sections by hand, or back it up and use --force.')

    if (conflicts.length && !force) {
      log('Nothing was written: existing files differ. Review the conflicts above, then rerun with --force to overwrite them.')
      return { written: [], plan, conflicts, counts, aborted: true }
    }
    if (dryRun) {
      log('Dry run: nothing was written.')
      return { written: [], plan, conflicts, counts, aborted: false }
    }

    const written = []
    for (const p of plan) {
      if (p.status === 'same') continue
      const target = join(dest, p.to)
      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(target, readFileSync(p.from))
      if (p.mode) chmodSync(target, p.mode)
      written.push(p.to)
    }
    mkdirSync(dirname(versionTarget), { recursive: true })
    writeFileSync(versionTarget, versionText)
    written.push(versionPath)
    log(`Wrote ${written.length} file${written.length === 1 ? '' : 's'}.`)
    return { written, plan, conflicts, counts, aborted: false }
  } finally {
    rmSync(buildOut, { recursive: true, force: true })
  }
}

function main (argv) {
  const options = parseArgs(argv, ['dry-run', 'force'], ['preset', 'tool', 'dest', 'root'])
  if (options._unknown.length) {
    console.error(`Unknown argument: ${options._unknown[0]}`)
    return 2
  }
  const root = resolve(options.root ?? join(dirname(fileURLToPath(import.meta.url)), '..'))
  const tools = (options.tool ?? 'cursor,agents').split(',').map(t => t.trim()).filter(Boolean)
  const result = install({ root, preset: options.preset, tools, dest: options.dest, dryRun: options['dry-run'], force: options.force })
  return result.aborted ? 1 : 0
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main(process.argv)
  } catch (error) {
    console.error(`error: ${error.message}`)
    process.exitCode = 2
  }
}
