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
