# ModelRunner Agent Skills

[![version](https://img.shields.io/badge/version-1.0.0-2ea44f)](https://github.com/modelrunner/agent-skills)
[![skills](https://img.shields.io/badge/skills-2-3b82f6)](#whats-inside)
[![targets](https://img.shields.io/badge/targets-Claude_Codex_Cursor_Copilot-8957e5)](#install)
[![license](https://img.shields.io/badge/license-MIT-lightgrey)](LICENSE)

Portable AI-assistant **skills** for generating real product visuals — App Store screenshots and
iOS demo assets — powered by **[ModelRunner](https://modelrunner.ai)**, the unified AI inference
API. Authored once as [`SKILL.md`](https://modelrunner.ai) and built for **Claude Code, OpenAI
Codex, Cursor, and GitHub Copilot**.

> Each skill calls ModelRunner's public MCP server (`mcp.modelrunner.run`) — one API for image,
> video, audio, 3D, and text that you can use for anything else at **[modelrunner.ai »](https://modelrunner.ai)**

**Status:** v1.0.0 — published and live on the Claude Code plugin marketplace as
`modelrunner/agent-skills` (add it with the [command below](#claude-code)). Two skills across four
tool targets, built from the two [ModelRunner case studies](https://modelrunner.ai/blog).

## Sample outputs

Real, unretouched results from the two case studies these skills are built from — every image below
was generated through the **[ModelRunner](https://modelrunner.ai)** MCP.

**`app-store-screenshots`** — raw app captures → a cohesive, on-brand store set (device frames,
generated backgrounds, ASO headlines), kept consistent via an anchor→style-reference pass:

<p align="center">
  <img src="https://media.modelrunner.ai/fkliHuJtWLyj2vW7V2DKH.png" width="30%" alt="App Store screenshot — anchor/hero frame" />
  <img src="https://media.modelrunner.ai/41u9ifxUpl3jBQfgIXHP7.png" width="30%" alt="App Store screenshot — styled set frame" />
  <img src="https://media.modelrunner.ai/jBymV90Fplip3geqsNjwK.png" width="30%" alt="App Store screenshot — styled set frame" />
</p>

**`ios-demo-assets`** — bulk, on-spec demo images loaded straight into Xcode's `Assets.xcassets`
and the Simulator's Photos library:

<p align="center">
  <img src="https://media.modelrunner.ai/BSQAtgluDUFB7YyF1VpOo.png" width="30%" alt="iOS demo asset — interior room" />
  <img src="https://media.modelrunner.ai/agOlqhWF7rZvA0UxarHjM.png" width="30%" alt="iOS demo asset — interior room" />
  <img src="https://media.modelrunner.ai/P7MG6fy6tnZu2C7x-product-sectional-sofa.png" width="30%" alt="iOS demo asset — product shot" />
</p>

## What's inside

| Skill | What it does |
|---|---|
| **[`app-store-screenshots`](skills/app-store-screenshots/SKILL.md)** | Turns raw app captures into a cohesive set of App Store / Google Play marketing screenshots — device mockups, on-brand backgrounds, and ASO-aware headlines. Uses the `modelrunner/app-store-screenshot-composer` wrapper and the anchor→style-reference pattern for a consistent set. [Case study »](https://modelrunner.ai/blog/generating-app-store-screenshots-with-ai-home-redesign-app-case-study) |
| **[`ios-demo-assets`](skills/ios-demo-assets/SKILL.md)** | Bulk-generates on-spec demo images and loads them into Xcode's `Assets.xcassets` **and** the iOS Simulator's Photos library (`xcrun simctl addmedia`). [Case study »](https://modelrunner.ai/blog/generating-demo-assets-for-an-ios-app-with-ai) |

## Prerequisites

Both skills call the **ModelRunner MCP**. Create a ModelRunner account with a small balance at
**[modelrunner.ai](https://modelrunner.ai)**, then connect the server at `https://mcp.modelrunner.run/mcp`
and authorize with your account when prompted (OAuth).
In Claude Code, installing a plugin below wires the MCP for you; for other tools the MCP config
ships in `dist/<tool>/`.

## Install

### Claude Code
```bash
/plugin marketplace add modelrunner/agent-skills
/plugin install app-store-screenshots@modelrunner
/plugin install ios-demo-assets@modelrunner
```

### OpenAI Codex CLI
`SKILL.md` is read natively. Copy the skills and add the MCP server:
```bash
cp -R dist/codex/skills/* ~/.codex/skills/
cat dist/codex/config.toml.snippet >> ~/.codex/config.toml
```

### Cursor
Cursor reads the same Agent-Skills `SKILL.md`. Copy the generated `.cursor/` into your project:
```bash
cp -R dist/cursor/.cursor /path/to/your-project/
```

### GitHub Copilot (VS Code)
Copilot has no skill format, so each skill ships as a `/`-invokable prompt file:
```bash
cp -R dist/copilot/.github dist/copilot/.vscode /path/to/your-project/
```
Then run `/app-store-screenshots` or `/ios-demo-assets` in Copilot Chat.

## How it's built

`SKILL.md` is the single source of truth (read natively by Claude Code, Codex, and Cursor — the
["Agent Skills" open standard](https://modelrunner.ai)). A dependency-free build script emits each
tool's packaging into `dist/`:

```bash
npm run build      # node scripts/build.mjs
```

- `dist/claude/` — plugin marketplace (`.claude-plugin/marketplace.json` is at the repo root; plugin
  bodies + `.mcp.json` here)
- `dist/codex/` — `SKILL.md` skills + a `config.toml` MCP snippet
- `dist/cursor/` — `.cursor/skills/` + `.cursor/mcp.json`
- `dist/copilot/` — `.github/prompts/*.prompt.md` + `.vscode/mcp.json`

The name/URLs baked into the manifests come from `package.json` + `mcp/modelrunner.json`. Prefer a
turnkey multi-tool sync instead of the built-in script? [`rulesync`](https://www.npmjs.com/package/rulesync)
and [`ruler`](https://www.npmjs.com/package/@intellectronica/ruler) can emit the same targets from a
canonical source.

## License

[MIT](LICENSE) · Built by **[ModelRunner](https://modelrunner.ai)** — the unified AI inference API.
