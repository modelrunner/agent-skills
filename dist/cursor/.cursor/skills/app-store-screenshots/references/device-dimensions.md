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
