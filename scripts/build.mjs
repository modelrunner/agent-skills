#!/usr/bin/env node
/**
 * build.mjs — author-once, emit per-tool.
 *
 * Reads the canonical skills in `skills/<name>/SKILL.md` (+ their `references/` and
 * `scripts/`) and the MCP descriptor in `mcp/modelrunner.json`, then regenerates `dist/`
 * with packaging for each target assistant:
 *
 *   dist/claude/   — a plugin marketplace: .claude-plugin/marketplace.json + one plugin per
 *                    skill (.claude-plugin/plugin.json + skills/<name>/…) + .mcp.json
 *   dist/codex/    — skills/<name>/… (drop into ~/.codex/skills/) + config.toml.snippet
 *   dist/cursor/   — .cursor/skills/<name>/… (Agent Skills) + .cursor/mcp.json
 *   dist/copilot/  — .github/prompts/<name>.prompt.md (down-converted) + .vscode/mcp.json
 *
 * SKILL.md is read natively by Claude Code, Codex, and Cursor (the "Agent Skills" open
 * standard), so those adapters copy it verbatim. Copilot has no skill concept, so its skill
 * body is flattened into a prompt file.
 *
 * No dependencies — plain Node ESM. Run with `npm run build`.
 */
import {
  readFileSync, writeFileSync, mkdirSync, rmSync, cpSync,
  existsSync, readdirSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS_DIR = join(ROOT, 'skills');
const DIST = join(ROOT, 'dist');

// ---- config (derived from package.json + the MCP descriptor) ---------------
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const mcp = JSON.parse(readFileSync(join(ROOT, 'mcp', 'modelrunner.json'), 'utf8'));
const REPO = (pkg.repository?.url ?? 'https://github.com/modelrunner/agent-skills').replace(/\.git$/, '');
const MARKETPLACE = 'modelrunner';
const HOMEPAGE = pkg.homepage ?? 'https://modelrunner.run';
const AUTHOR = { name: 'ModelRunner', url: HOMEPAGE };

// ---- helpers ---------------------------------------------------------------
const writeText = (p, s) => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, s); };
const writeJson = (p, o) => writeText(p, JSON.stringify(o, null, 2) + '\n');

/** Minimal YAML-frontmatter reader for our controlled SKILL.md files (name + folded description). */
function frontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return { data: {}, body: raw };
  const out = {};
  let key = null, folded = false, buf = [];
  const flush = () => {
    if (key) out[key] = (folded ? buf.join(' ') : buf.join('\n')).trim();
    key = null; buf = []; folded = false;
  };
  for (const line of m[1].split(/\r?\n/)) {
    const top = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
    if (top && !/^\s/.test(line)) {
      flush();
      key = top[1];
      const val = top[2];
      if (val === '>' || val === '>-' || val === '|' || val === '|-') folded = val[0] === '>';
      else buf = [val];
    } else if (key && (/^\s+/.test(line) || line.trim() === '')) {
      buf.push(line.trim());
    }
  }
  flush();
  const body = raw.slice(m[0].length).replace(/^\s*\n/, '');
  return { data: out, body };
}

function readSkills() {
  if (!existsSync(SKILLS_DIR)) return [];
  return readdirSync(SKILLS_DIR)
    .filter((n) => existsSync(join(SKILLS_DIR, n, 'SKILL.md')))
    .map((name) => {
      const dir = join(SKILLS_DIR, name);
      const { data, body } = frontmatter(readFileSync(join(dir, 'SKILL.md'), 'utf8'));
      return { name, dir, description: data.description ?? '', body };
    });
}

const keywordsFor = (name) => [
  ...new Set(['modelrunner', 'ai', 'skill', 'mcp', ...name.split('-')]),
];

// ---- adapters --------------------------------------------------------------
function buildClaude(skills) {
  const base = join(DIST, 'claude');
  const servers = { mcpServers: { [mcp.name]: { type: mcp.transport, url: mcp.url } } };
  const plugins = [];
  for (const s of skills) {
    const pluginDir = join(base, 'plugins', s.name);
    cpSync(s.dir, join(pluginDir, 'skills', s.name), { recursive: true });
    writeJson(join(pluginDir, '.claude-plugin', 'plugin.json'), {
      name: s.name,
      description: s.description,
      version: '0.1.0',
      author: AUTHOR,
      homepage: HOMEPAGE,
      repository: REPO,
      license: 'MIT',
      keywords: keywordsFor(s.name),
      mcpServers: servers.mcpServers,
    });
    plugins.push({ name: s.name, source: `./dist/claude/plugins/${s.name}`, description: s.description, category: 'Productivity' });
  }
  // marketplace.json must live at the REPO ROOT so `/plugin marketplace add <owner>/<repo>` finds it;
  // its plugin `source` paths point back into dist/claude/plugins/.
  writeJson(join(ROOT, '.claude-plugin', 'marketplace.json'), { name: MARKETPLACE, owner: AUTHOR, plugins });
  writeJson(join(base, '.mcp.json'), servers);
}

function buildCodex(skills) {
  const base = join(DIST, 'codex');
  for (const s of skills) cpSync(s.dir, join(base, 'skills', s.name), { recursive: true });
  writeText(join(base, 'config.toml.snippet'),
    `# Merge into ~/.codex/config.toml\n[mcp_servers.${mcp.name}]\ntype = "http"\nurl = "${mcp.url}"\n`);
}

function buildCursor(skills) {
  const base = join(DIST, 'cursor');
  for (const s of skills) cpSync(s.dir, join(base, '.cursor', 'skills', s.name), { recursive: true });
  writeJson(join(base, '.cursor', 'mcp.json'), { mcpServers: { [mcp.name]: { url: mcp.url } } });
}

function buildCopilot(skills) {
  const base = join(DIST, 'copilot');
  for (const s of skills) {
    // Copilot prompt files can't bundle references/scripts — inline the reference docs so the
    // prompt is self-contained; point at the repo for any scripts.
    const refsDir = join(s.dir, 'references');
    let refs = '';
    if (existsSync(refsDir)) {
      for (const f of readdirSync(refsDir).filter((f) => f.endsWith('.md'))) {
        refs += `\n\n---\n\n${readFileSync(join(refsDir, f), 'utf8').trim()}`;
      }
    }
    const scriptsNote = existsSync(join(s.dir, 'scripts'))
      ? `\n\n> Helper scripts for this skill live in the source repo under \`skills/${s.name}/scripts/\`: ${REPO}\n`
      : '';
    const fm = `---\ndescription: ${JSON.stringify(s.description)}\nagent: agent\n---\n\n`;
    writeText(join(base, '.github', 'prompts', `${s.name}.prompt.md`), fm + s.body + scriptsNote + refs);
  }
  writeJson(join(base, '.vscode', 'mcp.json'), { servers: { [mcp.name]: { type: 'http', url: mcp.url } } });
}

// ---- main ------------------------------------------------------------------
const skills = readSkills();
if (skills.length === 0) { console.error('no skills found under skills/'); process.exit(1); }
rmSync(DIST, { recursive: true, force: true });
buildClaude(skills);
buildCodex(skills);
buildCursor(skills);
buildCopilot(skills);
console.log(`built ${skills.length} skill(s) → dist/{claude,codex,cursor,copilot}: ${skills.map((s) => s.name).join(', ')}`);
