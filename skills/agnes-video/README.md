# Agnes Video

Generate videos via the Agnes Video V2.0 API with CLI scripts.

## Features

- **Text-to-Video**: Generate videos from text prompts
- **Image-to-Video**: Animate a single image
- **Multi-Image / Keyframe**: Smooth transitions between multiple images
- **Local image upload**: Upload local files to the API before generation
- **Async polling**: Poll task status until completion or failure

## Setup

### 1. Get an API Key

Sign up at https://apihub.agnes-ai.com and obtain an API key.

### 2. Install Dependencies

```bash
npm install -g tsx
```

### 3. Set API Key

```bash
export AGNES_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
```

## Usage

### Text-to-Video

```bash
tsx $(SKILL_DIR)/scripts/generate_video.ts "a cinematic shot of a cat walking in the rain" \
  --width 1152 --height 768 --num-frames 121 --frame-rate 24

# Poll for result
tsx $(SKILL_DIR)/scripts/poll_video.ts "<task_id>"
```

### Image-to-Video (from URL)

```bash
tsx $(SKILL_DIR)/scripts/generate_video.ts "animate the clouds moving" --image "https://example.com/photo.jpg"

tsx $(SKILL_DIR)/scripts/poll_video.ts "<task_id>"
```

### Image-to-Video (from local file)

```bash
# Upload first
URLS=$(tsx $(SKILL_DIR)/scripts/upload_image.ts "/path/to/image.png")
URL=$(echo "$URLS" | python3 -c "import sys,json; print(json.load(sys.stdin)[0])")

# Generate video
tsx $(SKILL_DIR)/scripts/generate_video.ts "animate the scene" --image "$URL"

tsx $(SKILL_DIR)/scripts/poll_video.ts "<task_id>"
```

### Multi-Image / Keyframe

```bash
URLS=$(tsx $(SKILL_DIR)/scripts/upload_image.ts "/path/img1.png" "/path/img2.png" "/path/img3.png")
# URLs are in $URLS as JSON array

tsx $(SKILL_DIR)/scripts/generate_video.ts "smooth transition between scenes" \
  --images "$URLS" --mode keyframes --num-frames 121 --frame-rate 24

tsx $(SKILL_DIR)/scripts/poll_video.ts "<task_id>"
```

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/generate_video.ts` | Create video generation task, return `task_id` |
| `scripts/poll_video.ts` | Poll task status until completed or failed |
| `scripts/upload_image.ts` | Upload local image file(s), return URL(s) |

## Default Settings

| Parameter | Default | Valid Range |
|-----------|---------|-------------|
| `width` | 1152 | - |
| `height` | 768 | - |
| `num_frames` | 121 | <= 441, must satisfy 8n+1 (81, 121, 161, 201, 241, 281, 321, 361, 441) |
| `frame_rate` | 24 | 1–60 |

## Recommended Configurations

| Duration | num_frames | frame_rate |
|----------|-----------|------------|
| ~5s | 121 | 24 |
| ~10s | 241 | 24 |
| ~18s | 441 | 24 |
