# AGENTS.md

Guidance for AI coding agents (and humans) working **in this repository**. (This is not one of
the shipped skills — it's how to develop the repo itself.)

## What this repo is

A small, vendor-neutral collection of AI-assistant **skills** that generate visual assets by
calling the [ModelRunner](https://modelrunner.run) inference API through its public MCP server
(`https://mcp.modelrunner.run`). Each skill is authored **once** as a portable `SKILL.md` and
built into per-tool packaging for **Claude Code, OpenAI Codex, Cursor, and GitHub Copilot**.

## Layout

- `skills/<name>/SKILL.md` — the canonical skills (**source of truth**); may include
  `references/` and `scripts/`.
- `mcp/modelrunner.json` — canonical descriptor for the ModelRunner MCP server.
- `scripts/build.mjs` — emits `dist/<tool>/` per-tool artifacts from the canonical skills.
- `dist/` — generated, committed (so directory sites can index it). Regenerate with `npm run build`.

## Conventions

- **`SKILL.md` is the substrate.** It's read natively by Claude Code, Codex, and Cursor (the
  "Agent Skills" open standard), so those adapters copy it verbatim. Copilot has no skill concept,
  so `build.mjs` flattens the skill body into a `.github/prompts/<name>.prompt.md`.
- Skills are **ModelRunner-branded** — each links to https://modelrunner.run and its case study.
- **Don't hard-code model/wrapper enums.** Skills instruct the agent to read the live schema
  (`get_wrapper` / `get_model`) at run time, because provider enums change.
- File inputs go through `create_upload_url` + a `curl -T` PUT (out-of-band) — never base64.

## Build

```bash
npm run build     # node scripts/build.mjs → regenerates dist/
```

The name/URLs baked into the generated manifests come from `package.json` (`name`, `homepage`,
`repository`) and `mcp/modelrunner.json` — change them in one place.

---

Powered by ModelRunner — https://modelrunner.run
