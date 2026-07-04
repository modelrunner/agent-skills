---
description: "Generate polished App Store / Google Play marketing screenshots from raw app captures — device mockups, on-brand backgrounds, and ASO-aware headlines, kept visually consistent across the whole set. Powered by ModelRunner (https://modelrunner.run). Use when the user wants to turn app screenshots into store marketing images, create a cohesive screenshot set for an app listing, add device frames or headlines to captures, or prepare App Store / Google Play screenshot uploads."
agent: agent
---

# App Store Screenshots

Turn raw in-app captures into a **cohesive set** of App Store / Google Play marketing
screenshots — each a device mockup on a designed background with an ASO-aware headline, all
sharing one visual language. Runs on **[ModelRunner](https://modelrunner.run)** via its public
MCP, using the purpose-built `hakankaan/app-store-screenshot-composer` wrapper, which encodes
the consistency workflow so you don't have to hand-design each image.

> Powered by ModelRunner — the unified inference API. Case study:
> https://modelrunner.run/blog/generating-app-store-screenshots-with-ai-home-redesign-app-case-study

## Prerequisites

1. **The ModelRunner MCP must be connected.** These steps call the tools `create_upload_url`,
   `run_model`, `wait_for_request`, and `get_wrapper`. If they are unavailable, connect the
   server at `https://mcp.modelrunner.run/mcp` (authorize with your ModelRunner account when prompted; keep a small balance at
   https://modelrunner.run). In Claude Code: `claude mcp add --transport http modelrunner https://mcp.modelrunner.run/mcp`.
2. **A shell** for streaming file bytes (`curl`). Screenshots are uploaded out-of-band, never
   sent through the model as tokens.

## Inputs to gather

Ask the user for whatever is missing:

- **Raw screenshots** — file paths (clean in-app captures, e.g. 1242×2688). One per store slide.
- **App name** and a one-line **feature description per screen** (grounds styling + headlines).
- **Brand color** — hex (pull from the app's theme if available).
- **Target device(s)** — e.g. `iphone_6_5`, `ipad_13` (see `references/device-dimensions.md`).
- **Headlines/subheadlines** — optional; the wrapper auto-generates if omitted, but supplying
  ASO-aware copy is stronger (see `references/aso-copy-guide.md`).

## Before the first run: read the live schema

Call `get_wrapper` for `hakankaan/app-store-screenshot-composer` and confirm the current
**`device` enum**, `layout`, and `background_style` values. Enums can change; never hard-code
them blind. See `references/wrapper-schema.md` for the field guide + known gotchas (notably: the
`iphone_6_9` default value has 400'd when passed explicitly — prefer `iphone_6_5`).

## The workflow — anchor first, then style-reference the rest

This is the load-bearing pattern that makes the set consistent. **Do not parallelize the whole
batch** — the hero must exist first.

### Phase 0 — Upload each capture (parallel)
For every screenshot:
1. `create_upload_url({ fileName: "<meaningful-name>.png" })` → `{ upload_url, relay_upload_url, file_url }`.
2. `curl -X PUT -T <path> -H "Content-Type: image/png" "<upload_url>"` (on a 403
   `host_not_allowed`, retry the PUT against `relay_upload_url`).
3. Keep the returned `file_url`.

**Name files meaningfully** — `home-feed.png`, `redesign-config.png`, not `IMG_0042.png`. The
wrapper reads the filename as a semantic hint for styling and headline relevance.

### Phase 1 — Hero (sequential, one image, the anchor)
Run screenshot #1 with **NO** `style_reference`:
```
run_model({
  endpoint: "hakankaan/app-store-screenshot-composer",
  input: {
    screenshot: "<hero file_url>",
    headline: "<hero headline>",
    subheadline: "<hero subheadline>",
    device: "iphone_6_5",
    layout: "text_top",
    brand_color: "#0E9F94",
    background_style: "gradient_vibrant",
    variants: 1
    // base_model: "openai/gpt-image-2/edit"   // optional override; strong text + UI redraw
  }
})
```
`wait_for_request` → the terminal payload's `output` is a `string[]`; take `output[0]` as the
**anchor URL**. Phase 2 depends on it — hard barrier.

### Phase 2 — The rest (parallel)
For every remaining screenshot, run with `style_reference` set to the **anchor URL** — always
the same anchor, never chain to the previous output:
```
input: { screenshot: "<file_url>", headline: "…", subheadline: "…", device: "iphone_6_5",
         layout: "text_top", brand_color: "#0E9F94", background_style: "gradient_vibrant",
         variants: 1, style_reference: "<anchor URL>" }
```
`wait_for_request` each, then `curl -o <name>.png "<output[0]>"` to save. All of phase 2 can run
concurrently — total wall-clock ≈ the slowest single render.

### Repeat per device
Run the whole anchor→style-reference cycle once per target device (e.g. `iphone_6_5` then
`ipad_13`), so each device set is internally consistent.

## Writing the copy

Keep the same shared controls (`brand_color`, `background_style`, `layout`) across every render —
that is the cohesion lever. Lead each headline with a searchable benefit noun-phrase and spread
the app's keyword cluster across slides without repetition. Full guidance:
`references/aso-copy-guide.md`.

## Cost

~$0.035–0.15 per generated image depending on the base model (`gpt-image-2/edit` is the premium,
text-faithful option). Confirm live pricing from `get_wrapper` / the request's `totalPrice`.

## Output

Report the saved file paths + the ModelRunner request IDs (from each `wait_for_request`) so the
run is reproducible. Store dimensions are validated by App Store Connect — check the produced
sizes against `references/device-dimensions.md`.


---

# ASO-aware screenshot copy

App Store screenshot text does **not** directly rank (only the app name, subtitle, and 100-char
keyword field feed search) — but it drives **conversion** and keeps the listing coherent to both
browsers and Apple. Write the captions as one coordinated set, not six independent lines.

## Rules

1. **Lead each headline with a searchable benefit noun-phrase** that is also the value —
   "AI Interior Design in Seconds", not a feature name like "Style Picker".
2. **Spread the keyword cluster across slides** without repeating a term — each screen carries a
   distinct slice of the app's keywords.
3. **Tell one story across the set** — the headlines should read as a sequence.
4. **Subheadline = the concrete payoff** of the headline's promise.
5. **Ground each screen's copy in what it shows** — pass a per-screen feature description so the
   model can style + phrase in context.

## Worked example (from the case study)

| # | Headline | Subheadline | Keywords carried |
|---|---|---|---|
| 1 | AI Interior Design in Seconds | Snap a photo, pick a style, redesign any room instantly | ai interior design, room, redesign |
| 2 | Redesign Any Room, Any Style | Modern, Bohemian, Coastal & more — photorealistic results | redesign, room, style, photorealistic |
| 3 | Landscape & Garden Design | Reimagine balconies, patios & backyards with AI | landscape design, garden, balcony, patio |
| 4 | See Furniture Before You Buy | AI virtual staging drops real products into your space | virtual staging, furniture, product |
| 5 | Design Your Dream Garden | Add outdoor furniture & décor in a tap | garden, outdoor furniture, décor |
| 6 | Remove Clutter Instantly | Erase any object, reveal your space's true potential | remove object, erase, declutter |

Full case study:
https://modelrunner.run/blog/generating-app-store-screenshots-with-ai-home-redesign-app-case-study

---

# Device dimensions & the wrapper `device` enum

The `hakankaan/app-store-screenshot-composer` wrapper renders to fixed device canvases. Always
confirm the **live** `device` enum with `get_wrapper` before a run — the values below are a guide,
not a contract.

## Known enum values (verify with get_wrapper)

| `device` value | Orientation | Target store size | Wrapper output (observed) |
|---|---|---|---|
| `iphone_6_5` | portrait | 1242 × 2688 | ~1232 × 2688 (within ~10px) |
| `ipad_13`    | portrait | 2048 × 2732 | ~2048 × 2720 (within ~12px) |

Both observed outputs have passed App Store Connect's dimension validation.

## Gotcha: `iphone_6_9`

`iphone_6_9` (1290 × 2796) is the wrapper's schema **default** but has **not** been accepted when
passed explicitly (returns HTTP 400). Use `iphone_6_5` for the iPhone portrait slot. Re-check
against `get_wrapper` — this may change.

## App Store Connect (reference)

Apple's required screenshot set changes over time — check the current "screenshot specifications"
in App Store Connect. As of writing, a 6.9"/6.5" iPhone portrait set and a 13" iPad portrait set
cover current devices:

- iPhone 6.9" — 1290 × 2796
- iPhone 6.5" — 1242 × 2688
- iPad 13" — 2048 × 2732

## Google Play (reference)

Play Store phone screenshots: 320–3840px on any edge, 16:9 or 9:16 aspect, 2–8 images. A portrait
render at ~1242 × 2688 satisfies Play as-is.

---

# `hakankaan/app-store-screenshot-composer` — field guide

Confirm the live schema + enums with `get_wrapper` before running; the values here are a guide.
The wrapper composes a real app capture into a device mockup on a designed background sized to App
Store device dimensions. Base models: `openai/gpt-image-2/edit` (strong text + faithful UI redraw)
and the `bytedance/seedream` edit family. ~$0.035–0.15 per generated image.

## Inputs

| Field | Type | Notes |
|---|---|---|
| `screenshot` | file (url) | **Required.** The raw app capture. Name the upload meaningfully — the wrapper reads the filename as a semantic hint. |
| `headline` | string | Auto-generated if omitted. Lead with a searchable benefit phrase. |
| `subheadline` | string | Auto-generated if omitted. |
| `device` | enum | e.g. `iphone_6_5`, `ipad_13`. See `device-dimensions.md` (+ the `iphone_6_9` 400 gotcha). |
| `layout` | enum | `device_centered`, `device_angled`, `text_top`, `text_bottom`. |
| `brand_color` | hex string | Accent / gradient color. Keep the SAME value across the set for cohesion. |
| `background_style` | enum | `gradient_vibrant`, `soft_pastel`, `dark_premium`, `brand_solid`, `lifestyle_scene`. |
| `app_icon` | file (url) | Optional; composited as a badge. |
| `device_frame` | bool | Off for full-bleed pixel-exact UI. |
| `enhance_ui` | bool | Lightly cleans up the captured UI. |
| `variants` | int (1–4) | Billed per output. |
| `style_reference` | file (url) | The anchor/hero output URL — set on every screen after the first. |
| `base_model` | string | Optional override, e.g. `openai/gpt-image-2/edit`. |

## The consistency contract (do not skip)

Generate screenshot #1 with **no** `style_reference` (the anchor / hero), then pass **that anchor's
output URL** as `style_reference` for every remaining screen — always the same anchor, never
chaining to the previous output. This single rule is what keeps the whole set visually cohesive.