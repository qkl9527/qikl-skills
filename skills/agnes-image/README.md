# Agnes Image 2.1 Flash

Generate images via the Agnes Image 2.1 Flash API with a CLI script.

## Features

- **Text-to-Image**: Generate images from text prompts
- **Image-to-Image**: Transform existing images using URL or local file references
- **Auto prompt expansion**: Short prompts are automatically expanded with contextual detail
- **Local image upload**: Upload local files to the API, with Data URI Base64 fallback
- **Flexible output**: Save directly to file (`--output`) or print URL/Base64 to stdout

## Setup

### 1. Get an API Key

Sign up at https://apihub.agnes-ai.com and obtain an API key.

### 2. Install Dependencies

```bash
# tsx is required to run the script
npm install -g tsx
```

### 3. Set API Key

```bash
export AGNES_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
```

## Usage

### Basic (text-to-image)

```bash
tsx $(SKILL_DIR)/scripts/image.tsx --prompt "a cat sitting on a windowsill" --output cat.png
```

### Image-to-image (from URL)

```bash
tsx $(SKILL_DIR)/scripts/image.tsx --prompt "transform to cyberpunk" --image "https://example.com/photo.jpg" --output result.png
```

### Image-to-image (from local file)

```bash
tsx $(SKILL_DIR)/scripts/image.tsx --prompt "redesign this" --local-image "/path/to/img.png" --output result.png
```

### Multiple local images

```bash
tsx $(SKILL_DIR)/scripts/image.tsx --prompt "redesign this" --local-image "/path/img1.png" --local-image "/path/img2.png"
```

## CLI Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `--prompt` | Yes | The image generation prompt |
| `--size` | No | Resolution, e.g. `1024x1024`. Default: `1024x1024` |
| `--output` | No | Save result to file path |
| `--image` | No | Image URL for image-to-image |
| `--local-image` | No | Local file path for image-to-image (repeatable) |
| `--timeout` | No | API timeout in seconds. Default: `120` |

## Output

On success, the script outputs the image URL or Base64 data to stdout. If `--output` is provided, the image is also saved to the specified file path.

## Pricing

$0.003 per image.
