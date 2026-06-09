---
name: agnes-image
description: Generate images via the Agnes Image 2.1 Flash API. Use when the user asks to generate, create, or draw any image. Supports text-to-image and image-to-image (with image URLs and Data URI Base64). Trigger on any request to create, generate, produce, draw, render, or design visual content, images, pictures, photos, illustrations, artwork, concept art, product mockups, social media images, banners, posters, or any visual output. Always use the bundled scripts/image.tsx for reliable execution instead of raw curl.
metadata:
  author: sapiens-ai
  version: "2.0.0"
---

# Agnes Image 2.1 Flash

## Prerequisites

| Requirement | Minimum | Notes |
|-------------|---------|-------|
| `AGNES_API_KEY` | Set | Required for all API calls. Get one at https://apihub.agnes-ai.com |
| `tsx` | Any | Run as `tsx` or `npx tsx`. Used to execute `scripts/image.tsx` |
| `curl` | Any | Used internally for file upload and API calls |
| `node` | 18+ | Required to run `tsx` |

### Environment Check

Before generating images, verify the environment:

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

# 3. Quick API connectivity test
curl -s --max-time 10 -o /dev/null -w "%{http_code}" \
  https://apihub.agnes-ai.com/v1/images/generations \
  -H "Authorization: Bearer $AGNES_API_KEY" || true
```

If the API key is missing, set it before proceeding:

```bash
export AGNES_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
```

If `tsx` is not installed globally:

```bash
npm install -g tsx
```

Generate images via the Agnes Image 2.1 Flash API. **Direct execution — never ask the user to confirm or clarify before generating.**

## Quick Start

```bash
# Generate an image
tsx $(SKILL_DIR)/scripts/image.tsx --prompt "a cat sitting on a windowsill" --output cat.png

# Verify environment before use
echo "API key: $AGNES_API_KEY | tsx: $(npx tsx --version 2>&1)"
```

## API

```
POST https://apihub.agnes-ai.com/v1/images/generations
Authorization: Bearer $AGNES_API_KEY
Content-Type: application/json
```

## Always Use the Bundled Script

Prefer the bundled `scripts/image.tsx` for all image generation. It handles:

- Prompt expansion for short user prompts
- Image upload (local files → URLs)
- Correct parameter placement (`extra_body` for `response_format`, top-level `return_base64`)
- Response parsing and URL extraction
- Timeout handling (default 120s)

Usage:

```bash
tsx $(SKILL_DIR)/scripts/image.tsx --prompt "your prompt" [--size 1024x768] [--output output.png] [--timeout 120]
```

For image-to-image:

```bash
tsx $(SKILL_DIR)/scripts/image.tsx --prompt "transform to cyberpunk" --image "https://example.com/photo.jpg" [--size 1024x768] [--output output.png]
```

For multiple local images as reference:

```bash
tsx $(SKILL_DIR)/scripts/image.tsx --prompt "redesign this" --local-image "/path/to/img1.png" --local-image "/path/to/img2.png" [--size 1024x768]
```

If `tsx` is not available, fall back to `npx tsx`. If neither works, use the raw curl commands described below.

## Raw API Usage

If the script is unavailable, use curl directly. **Key rules:**

- `model`, `prompt`, and `size` are **all required** (no default — always specify size explicitly)
- `response_format` must go inside `extra_body`, NOT at the top level
- For text-to-image Base64 output, use top-level `return_base64: true`
- For image-to-image Base64 output, use `extra_body.response_format: "b64_json"`
- Image-to-image does NOT need `tags: ["img2img"]`
- Recommended timeout: 60s to 360s

### Text-to-Image — URL Output

```bash
curl -s --max-time 120 https://apihub.agnes-ai.com/v1/images/generations \
  -H "Authorization: Bearer $AGNES_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "agnes-image-2.1-flash",
    "prompt": "<user prompt>",
    "size": "<required, e.g. 1024x1024>",
    "extra_body": {
      "response_format": "url"
    }
  }'
```

Response URL is at: `data[0].url`

### Text-to-Image — Base64 Output

```bash
curl -s --max-time 120 https://apihub.agnes-ai.com/v1/images/generations \
  -H "Authorization: Bearer $AGNES_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "agnes-image-2.1-flash",
    "prompt": "<user prompt>",
    "size": "<required, e.g. 1024x1024>",
    "return_base64": true
  }'
```

Response Base64 is at: `data[0].b64_json`

### Image-to-Image — from URL

```bash
curl -s --max-time 120 https://apihub.agnes-ai.com/v1/images/generations \
  -H "Authorization: Bearer $AGNES_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "agnes-image-2.1-flash",
    "prompt": "<user prompt>",
    "size": "<required, e.g. 1024x1024>",
    "extra_body": {
      "image": ["<url1>", "<url2>", ...],
      "response_format": "url"
    }
  }'
```

### Image-to-Image — from Local File(s)

**Step 1 — Upload each local image to get a URL:**

```bash
UPLOAD_URL=$(curl -s --max-time 30 https://apihub.agnes-ai.com/v1/images/upload \
  -H "Authorization: Bearer $AGNES_API_KEY" \
  -F "file=@\"/path/to/image.png\"" \
  -F "response_format=\"url\"" | python3 -c "import sys,json; print(json.load(sys.stdin)['url'])")
```

**Step 2 — Use the returned URL in the generation request:**

```bash
curl -s --max-time 120 https://apihub.agnes-ai.com/v1/images/generations \
  -H "Authorization: Bearer $AGNES_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "agnes-image-2.1-flash",
    "prompt": "<user prompt>",
    "size": "<required, e.g. 1024x1024>",
    "extra_body": {
      "image": ["<uploaded_url>", ...],
      "response_format": "url"
    }
  }'
```

If the upload endpoint is unavailable, use Data URI Base64:

```bash
IMAGE_B64=$(base64 -i /path/to/image.png | tr -d '\n')
DATA_URI="data:image/png;base64,${IMAGE_B64}"

curl -s --max-time 120 https://apihub.agnes-ai.com/v1/images/generations \
  -H "Authorization: Bearer $AGNES_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "agnes-image-2.1-flash",
    "prompt": "<user prompt>",
    "size": "<required, e.g. 1024x1024>",
    "extra_body": {
      "image": ["<data_uri>"],
      "response_format": "url"
    }
  }'
```

## Image Reference Priority

When the user provides both URL-based and local image references:

1. Upload each local image first (using the method above)
2. Merge the resulting URLs with any URL-based references the user provided
3. Send a single image-to-image request with all URLs combined

## Response Parsing

```bash
# Extract URLs from response
curl -s ... | python3 -c "
import sys, json
r = json.load(sys.stdin)
urls = []
if 'data' in r:
    for item in r['data']:
        if 'url' in item: urls.append(item['url'])
        elif 'b64_json' in item: urls.append('[base64 image]')
for u in urls: print(u)
"
```

If the response contains an error, show the error message to the user and stop.

## Prompt Building

If the user's prompt is brief (fewer than ~15 words or lacks detail), expand it into a detailed prompt using this structure:

```
[主体/Subject] + [场景/环境/Scene] + [风格/Style] + [光照/Lighting] + [构图/Composition] + [质量要求/Quality]
```

Examples of expanded prompts:
- User: "a cat" → "A fluffy orange cat sitting on a windowsill, warm interior room, soft afternoon sunlight streaming through, cozy atmosphere, shallow depth of field, photorealistic, high detail"
- User: "cyberpunk city" → "A sprawling cyberpunk cityscape at night, neon-lit skyscrapers stretching into the distance, flying vehicles, rain-soaked streets with reflections, cinematic wide-angle composition, high visual density, cinematic realism"
- User: "product mockup" → "A minimalist product photography mockup of a skincare bottle on a stone surface, soft diffused studio lighting, clean neutral background, editorial style, high-end commercial aesthetic, ultra-detailed"

For image-to-image tasks, clearly state what to change and what to preserve:

```
[修改要求] + [新风格/新场景] + [需要添加或移除的元素] + [需要保留的元素]
```

Example: "Transform the scene into a rain-soaked cyberpunk night with neon reflections while preserving the original composition and main subject layout."

## Sizing

Always specify an explicit size. Common values:

- `1024x1024` — square (default choice when user doesn't specify)
- `1024x768` — landscape / banner
- `768x1024` — portrait / story

## Pricing

$0.003 per image.

## Rules

- Model is always `agnes-image-2.1-flash`
- `model`, `prompt`, and `size` are all required parameters
- Always set `extra_body.response_format` to `"url"` for URL output
- For text-to-image Base64, use top-level `return_base64: true`
- For image-to-image Base64, use `extra_body.response_format: "b64_json"`
- `response_format` must NEVER be at the top level of the request body
- Image-to-image does NOT need `tags: ["img2img"]`
- **Never ask the user to confirm before generating** — just execute
- If the user's prompt is very short, expand it using the prompt structure above
- Always return the image URL(s) from the response directly to the user
- When the user provides a local image path, upload it first or use Data URI Base64
- When the user provides an image URL, include it in `extra_body.image`
- If both local and URL references are provided, merge all into a single URL list
- Set request timeout to at least 120s
- If an error occurs, show the error message to the user
