---
name: agnes-video
description: Generate videos via the Agnes Video V2.0 API. Use when the user asks to generate, create, or render any video. Supports text-to-video, image-to-video, multi-image, keyframe, local image, and URL workflows. Video generation is asynchronous — create task then poll for result. Trigger on any request to create, generate, produce, render, or animate any video content, animations, motion graphics, cinematic clips, social media videos, or moving visual content.
metadata:
  author: sapiens-ai
  version: "1.1.0"
---

# Agnes Video

## Prerequisites

| Requirement | Minimum | Notes |
|-------------|---------|-------|
| `AGNES_API_KEY` | Set | Required for all API calls. Get one at https://apihub.agnes-ai.com |
| `tsx` | Any | Run as `tsx` or `npx tsx`. Used to execute scripts in `scripts/` |
| `node` | 18+ | Required to run `tsx` (includes native `fetch`) |

### Environment Check

Before generating videos, verify the environment:

```bash
# 1. Check API key is set
if [ -z "$AGNES_API_KEY" ]; then
  echo "ERROR: AGNES_API_KEY is not set"
  echo "Set it with: export AGNES_API_KEY=your_key_here"
  exit 1
fi

# 2. Check tsx is available
if ! command -v tsx &>/dev/null && ! npx tsx --version &>/dev/null; then
  echo "ERROR: tsx is not installed. Run: npm install -g tsx"
  exit 1
fi
```

If the API key is missing, set it before proceeding:

```bash
export AGNES_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
```

If `tsx` is not installed globally:

```bash
npm install -g tsx
```

Generate videos via the Agnes Video V2.0 API. **Direct execution — never ask the user to confirm or clarify before generating.** Video generation is asynchronous: create a task, then poll until complete.

## Quick Start

```bash
# Generate a video from text
tsx $(SKILL_DIR)/scripts/generate_video.ts "a cinematic shot of a cat walking in the rain"
# Poll for result (task_id from above)
tsx $(SKILL_DIR)/scripts/poll_video.ts "<task_id>"
```

Bundled scripts in `scripts/` handle API calls. Run them with `tsx`.

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/upload_image.ts` | Upload local image file(s), return URL(s) |
| `scripts/generate_video.ts` | Create video generation task, return task_id |
| `scripts/poll_video.ts` | Poll task status until completed or failed |

All scripts require `AGNES_API_KEY` environment variable.

## Execution Workflow

### Case 1: Text-to-Video

```bash
tsx scripts/generate_video.ts "<prompt>" \
  [--width <int>] [--height <int>] \
  [--num-frames <int>] [--frame-rate <int>] \
  [--negative-prompt "<text>"] [--seed <int>] \
  [--config <file.json>]
```

### Case 2: Image-to-Video (URL)

```bash
tsx scripts/generate_video.ts "<prompt>" \
  --image "<image_url>" \
  [--num-frames <int>] [--frame-rate <int>]
```

### Case 3: Image-to-Video (Local File)

Upload the local image first, then pass the URL:

```bash
# Step 1: Upload local image
URLS=$(tsx scripts/upload_image.ts "/path/to/image.png")

# Step 2: Parse URL and create task (URL is in $URLS, JSON array)
URL=$(echo "$URLS" | python3 -c "import sys,json; urls=json.load(sys.stdin); print(urls[0])")

tsx scripts/generate_video.ts "<prompt>" \
  --image "$URL"
```

For multiple local images, upload them all and use as keyframes:

```bash
URLS=$(tsx scripts/upload_image.ts "/path/a.png" "/path/b.png")
# Then pass to generate_video.ts via --local-images or --images
```

### Case 4: Multi-Image / Keyframe (URL)

```bash
tsx scripts/generate_video.ts "<prompt>" \
  --images "url1,url2,url3" \
  --mode "keyframes" \
  --num-frames 121 --frame-rate 24
```

### Case 5: Multi-Image / Keyframe (Local Files)

Upload all local images first, then reference them:

```bash
URLS=$(tsx scripts/upload_image.ts "/path/img1.png" "/path/img2.png")
# URLS = '["https://...", "https://..."]'
# Pass the URLs to generate_video.ts
```

### Step 3: Poll for Result

```bash
tsx scripts/poll_video.ts "<task_id>" \
  [--interval <seconds>] [--max-retries <count>]
```

Polling defaults to 3-second intervals and up to 600 retries (~30 minutes).

### Config File (Alternative to CLI Args)

All scripts accept `--config <file.json>` with JSON:

```json
{
  "prompt": "A cinematic shot of a cat...",
  "image": "https://example.com/photo.png",
  "width": 1152,
  "height": 768,
  "num_frames": 121,
  "frame_rate": 24,
  "mode": "keyframes",
  "negative_prompt": "blurry, low quality",
  "seed": 42
}
```

## Generation Modes

| Mode | Parameters | Use Case |
|------|-----------|----------|
| Text-to-Video (default) | `prompt` only | Generate video from text |
| Image-to-Video | `prompt` + `image` (single URL) | Animate a single image |
| Multi-Image | `extra_body.image` (array) | Transition between multiple images |
| Keyframe Animation | `extra_body.mode: "keyframes"` + images | Smooth transitions between keyframe images |

Default settings: `width: 1152`, `height: 768`, `num_frames: 121`, `frame_rate: 24`.

`num_frames` must be ≤ 441 and satisfy `8n + 1` (e.g., 81, 121, 161, 241, 441).

Duration formula: `seconds = num_frames / frame_rate`.

Recommended durations:
- ~5 seconds: `num_frames: 121`, `frame_rate: 24`
- ~10 seconds: `num_frames: 241`, `frame_rate: 24`
- ~18 seconds: `num_frames: 441`, `frame_rate: 24`

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique task ID |
| `task_id` | string | Task ID for polling |
| `object` | string | Always `"video"` |
| `status` | string | `queued`, `in_progress`, `completed`, `failed` |
| `progress` | integer | Progress percentage (0–100) |
| `created_at` | integer | Task creation timestamp |
| `completed_at` | integer | Task completion timestamp (null if not done) |
| `video_url` | string | Generated video URL (when completed) |
| `remixed_from_video_id` | string | Alternative video URL field |
| `size` | string | Resolution `width x height` |
| `seconds` | string | Duration in seconds |
| `error` | object | Error info (when failed) |

## Prompt Building

Use these structures based on the generation mode:

**Text-to-Video:**
```
[Subject] + [Action] + [Scene] + [Camera Movement] + [Lighting] + [Style]
```
Example: `A young astronaut walking across a red desert planet, dust blowing in the wind, slow cinematic tracking shot, dramatic sunset lighting, realistic sci-fi style`

**Image-to-Video:**
Describe what should move while keeping the key subject stable.
Example: `Animate the character with subtle breathing motion, hair moving gently in the wind, background lights flickering softly, while keeping the face and outfit consistent`

**Multi-Image:**
Describe how the input images should relate to each other.
Example: `Use the first image as the starting scene and the second image as the target scene. Create a smooth transformation with consistent lighting, natural motion, and cinematic pacing`

**Keyframe:**
Describe the transition between frames clearly.
Example: `Create a smooth transition from the first keyframe to the second keyframe, maintaining character identity, consistent camera angle, and natural motion between scenes`

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Invalid request, check parameters |
| 401 | Unauthorized, check API Key |
| 404 | Task not found |
| 500 | Server error |
| 503 | Service busy, retry later |

## Rules

- Model is always `agnes-video-v2.0`
- Default settings: `width: 1152`, `height: 768`, `num_frames: 121`, `frame_rate: 24`
- `num_frames` must be ≤ 441 and satisfy `8n + 1` (e.g., 81, 121, 161, 241, 441)
- **Never ask the user to confirm before generating** — just execute
- Always poll in a loop until `completed` or `failed`
- Return the video URL (`remixed_from_video_id` or `video_url`) directly to the user
- When user provides a local image path, upload it with `scripts/upload_image.ts` first, then use the returned URL
- When user provides an image URL, pass it directly to `scripts/generate_video.ts`
- If both local and URL references are provided, upload local ones and merge all URLs
- If an error occurs, show the error message to the user
- Frame rate range: 1–60; for smoother motion use 24 or 30; for longer videos use lower frame_rate
