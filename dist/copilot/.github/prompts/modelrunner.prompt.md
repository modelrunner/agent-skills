---
description: "Generate or edit images, video, audio, speech, music and 3D, or run any AI model, through one API. Finds the right model for the job, reads its live input schema and price, runs it, and returns the output URLs. Powered by ModelRunner (https://modelrunner.ai). Use when the user asks to generate, edit, upscale, animate, voice, transcribe or otherwise produce media with AI, asks which AI model to use for a task or what it costs, or wants to run a specific model by name."
agent: agent
---

# ModelRunner

Find a model, read its schema, run it, return the result. **[ModelRunner](https://modelrunner.ai)**
puts hundreds of image, video, audio, 3D and language models behind one API and one balance, so
the same five tool calls work for every one of them.

> Powered by ModelRunner — one API for image, video, audio, 3D, and text. Browse the catalog at
> https://modelrunner.ai/models

## Prerequisites

**The ModelRunner MCP must be connected** (tools `search`, `get_model`, `run_model`,
`wait_for_request`). Installed as a Claude Code plugin, the server is already wired; authorize with
your ModelRunner account when prompted and keep a small balance at https://modelrunner.ai. To add it
by hand in Claude Code:
`claude mcp add --transport http modelrunner https://mcp.modelrunner.run/mcp --header "x-modelrunner-app: modelrunner-claude-code"`.
Other tools: connect `https://mcp.modelrunner.run/mcp` as an HTTP MCP server.

## Step 1 — Pick the model

Skip this step if the user named a model (`owner/alias`, e.g. from a modelrunner.ai URL).

- **`search({ q })`** with 2–4 use-case keywords ("product photo background removal", "lip sync
  video", "text to speech"), not a sentence. Narrow with `outputModality` / `inputModality`
  (`image`, `video`, `audio`, `text`, …), `capability` (e.g. `"edit"`, `"upscale"`) or `maxAvgCost`.
  If nothing comes back, retry with fewer, plainer words.
- **`recommended_models({ category })`** (`image`, `video` or `utility`) for a short curated list when
  the user just wants "a good one".
- `list_models` pages the whole catalog with modality/category filters when you need to compare.

Results carry `pricing.averageCost` (average USD per run) and `examplePrompts`. Entries sharing a
`rootModel` are speed/price variants of one family. Pick on fit first, then cost; tell the user the
pick, the reason and the expected price in one line. Never assume a model's name, inputs or price
from memory: the catalog changes, so read it live.

For a fuller description of one model, fetch its plain-text page:
`https://modelrunner.ai/models/<owner>/<alias>/llms.txt`.

## Step 2 — Read the schema

**`get_model({ endpoint: "<owner>/<alias>" })`** returns the inputs (types, enums, defaults,
required fields), the outputs and the pricing rule. Build `input` from exactly these field names and
enum values. `get_model_raw_schema` is the untruncated JSON Schema when you need exact constraints.
Wrappers (purpose-built presets over a model) use `get_wrapper` instead, and their description often
says how to sequence runs; follow it.

Pricing can depend on inputs (duration, resolution, megapixels, tokens). Work out the cost of the
call you are about to make and say it before a run that is expensive or part of a large batch.

## Step 3 — Provide files as URLs

File inputs (`format: uri`) take a **URL**, never base64 or a local path.

- Public URL already? Pass it as is.
- Local file: **`create_upload_url({ fileName })`**, then stream the bytes yourself with the returned
  command, e.g. `curl -X PUT -T ./photo.png -H "Content-Type: image/png" "<upload_url>"`. If that PUT
  is rejected with a 403 `host_not_allowed` (an egress allowlist), repeat it against
  `relay_upload_url`. Pass the returned `file_url` as the input.
- `upload_file` re-hosts a remote URL server-side at no extra cost. Its base64 mode carries the
  bytes through the conversation and is far more expensive; use it only where no PUT is possible.

## Step 4 — Run and wait

1. **`run_model({ endpoint, input, metadata })`** — returns a `requestId` immediately for media
   models. Language models answer in the same call (`input: { messages: [...] }`).
2. **`wait_for_request({ requestId })`** — returns at `COMPLETED`, `FAILED` or `CANCELLED`
   (default 120 s, up to `timeoutSeconds: 600`). Video and 3D can take minutes; call it again if it
   times out rather than re-running, which would bill twice. `get_request` reads the state once.
3. The result's `output` holds the generated file URLs. Download them with `curl -L -o <file> "<url>"`
   when the user wants files on disk.

**Batches:** submit every `run_model` first, then wait on each `requestId`; requests run in
parallel. A wrapper or workflow that needs a consistent set (an anchor image reused as a reference)
must run in order instead.

**Tag runs** with `metadata`, a flat string map stored on the request and never sent to the model,
e.g. `{ "purpose": "hero-images", "batch": "2026-11-07" }`. Find them again with
`list_my_requests({ metadata: { "batch": "2026-11-07" } })`. Use your own key names: `source` and
`app` are reserved.

## Cost and failures

- A run that completes is charged at the model's published rate; a failed run is not charged.
- An input that does not match the schema is refused at `run_model` with an error naming the field:
  re-read `get_model` and fix it rather than retrying blindly. A balance error means the account
  needs a top-up at https://modelrunner.ai. A `FAILED` request carries the model's error message.
- Report each result as: model, request ID, output URL(s), and the price from `list_my_requests`,
  so the run can be found and reproduced.
