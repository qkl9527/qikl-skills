🌐 [中文](README.md) · **English**

# qikl Skills Library

> *"Say one sentence. The agent picks the right Skill. You get something usable."*

<br>

**An Agent Skills collection for everyday workflows — covering visual prompts, image generation, and video generation.**

<br>

Talk directly in Cursor or Claude Code and Skills activate automatically: craft ultra-dense linocut Midjourney prompts, call the Agnes API for images, or generate short videos asynchronously. No panels, no plugins — conversation is the workflow.

```
# Install individual Skills (recommended)
npx skills add qkl9527/qikl-skills --skill qikl-dankoe-illustration
npx skills add qkl9527/qikl-skills --skill agnes-image
npx skills add qkl9527/qikl-skills --skill agnes-video

# Or clone the full repo
git clone git@github.com:qkl9527/qikl-skills.git
```

Works across agents — Cursor, Claude Code, Codex, and any runtime that supports Skills.

[Install](#ready-to-use) · [Capabilities](#capabilities) · [Skills Catalog](#skills-catalog) · [Repo Structure](#repo-structure) · [Development](#development)

<br>

---

## Ready to Use

```bash
# Install on demand (--skill selects a Skill under skills/)
npx skills add qkl9527/qikl-skills --skill qikl-dankoe-illustration
npx skills add qkl9527/qikl-skills --skill agnes-image
npx skills add qkl9527/qikl-skills --skill agnes-video
```

**agnes-image / agnes-video** require an API key first:

```bash
export AGNES_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
# Get a key: https://apihub.agnes-ai.com
npm install -g tsx   # Required to run bundled scripts
```

Then talk to your agent:

```
"Create a ultra-dense linocut DanKoe illustration about AI replacing human labor"
"Generate a cyberpunk cat illustration with Agnes and save it to cat.png"
"Turn this product shot into a 5-second promo video, 1152×768, 24fps"
```

No buttons, no panels — Skills start working as soon as they read your intent.

---

## Capabilities

| Skill | Deliverables | Typical Use Cases | Dependencies |
|-------|--------------|-------------------|--------------|
| **qikl-dankoe-illustration** | Bilingual Midjourney prompts · Step-by-step guided interaction | Linocut / woodcut / Gustave Doré / DanKoe illustrations | None |
| **agnes-image** | PNG / URL · Text-to-image · Image-to-image | Illustrations, concept art, social images, product mockups | `AGNES_API_KEY` · `tsx` |
| **agnes-video** | MP4 · Async task + polling | Text-to-video, image-to-video, multi-image keyframes | `AGNES_API_KEY` · `tsx` |

---

## Skills Catalog

### qikl-dankoe-illustration · Ultra-Dense Linocut Prompt Generator

**Original Skill** · Generates Midjourney prompts in an extreme-density fine-line engraving style.

19th-century astronomical woodcut aesthetic — pure black ink on white, ultra-high contrast, dense parallel wavy lines and curved hatching, Gustave Doré meets outsider-art intensity.

**Core features:**
- Non-negotiable ultra-dense linocut aesthetic rules (100% enforced unless the user explicitly requests a different style)
- Active guided interaction: understand → suggest → confirm → next step
- Five-step workflow: theme / visual elements / mood / bottom text / technical parameters
- Bilingual prompt output (Chinese and English)

**Trigger keywords:** `ultra-dense linocut` · `Gustave Doré style` · `woodcut engraving` · `DanKoe illustration` · `illustration`

<details>
<summary>Example prompts</summary>

```
"Create a DanKoe-style illustration about the lonely knowledge worker"
"Generate a Gustave Doré linocut prompt with a library and ancient books"
```

</details>

---

### agnes-image · Agnes Image 2.1 Flash

**Wrapper Skill** · Generates images via the Agnes Image API, with bundled `scripts/image.tsx` for reliable execution.

- **Text-to-image**: Short prompts are auto-expanded before generation
- **Image-to-image**: Supports URLs, local files, and Data URI Base64
- **Flexible output**: Save with `--output`, or print URL / Base64 to stdout

```bash
tsx skills/agnes-image/scripts/image.tsx \
  --prompt "a cat sitting on a windowsill" \
  --output cat.png
```

Full CLI reference: [`skills/agnes-image/README.md`](skills/agnes-image/README.md) · Chinese: [`README_CN.md`](skills/agnes-image/README_CN.md)

---

### agnes-video · Agnes Video V2.0

**Wrapper Skill** · Generates videos asynchronously via the Agnes Video API — task creation and polling are separate steps.

| Mode | Description |
|------|-------------|
| Text-to-video | Generate short clips from text prompts |
| Image-to-video | Animate a single image |
| Multi-image / keyframes | Smooth transitions between multiple images |

```bash
# 1. Create task
tsx skills/agnes-video/scripts/generate_video.ts \
  "a cinematic shot of a cat walking in the rain"

# 2. Poll for result
tsx skills/agnes-video/scripts/poll_video.ts "<task_id>"
```

Full CLI reference: [`skills/agnes-video/README.md`](skills/agnes-video/README.md) · Chinese: [`README_CN.md`](skills/agnes-video/README_CN.md)

---

## Project Philosophy

| Principle | Description |
|-----------|-------------|
| **Practical first** | Each Skill installs and runs out of the box — focused on triggers and agent interaction |
| **Scenario-driven** | Each Skill maps to a real use case, not a pile of demos |
| **Original + wrapped** | Original workflow Skills coexist with third-party API wrapper Skills |
| **Continuous iteration** | Improve SKILL.md and bundled scripts based on real usage feedback |

**Skill layers:**

- **Workflow Skills** (`qikl-dankoe-illustration`): Define aesthetic rules + multi-step interaction protocols — the agent acts as a "prompt director"
- **Tool Skills** (`agnes-image` / `agnes-video`): Bundled scripts call APIs directly — the agent acts as an "executor" and runs without repeated confirmation

---

## Repo Structure

```
qikl-skills/
├── README.md                              # Chinese (default)
├── README_EN.md                           # English
├── .gitignore
└── skills/
    ├── qikl-dankoe-illustration/
    │   └── SKILL.md                       # Ultra-dense linocut prompts · original
    ├── agnes-image/
    │   ├── SKILL.md
    │   ├── README.md · README_CN.md
    │   └── scripts/
    │       └── image.tsx                  # Text-to-image / image-to-image CLI
    └── agnes-video/
        ├── SKILL.md
        ├── README.md · README_CN.md
        └── scripts/
            ├── generate_video.ts          # Create video task
            ├── poll_video.ts              # Poll task status
            └── upload_image.ts            # Upload local images
```

> Local directories such as `md/private/` and `output/` are listed in `.gitignore` and not tracked in the repo.

---

## Development

### Create a New Skill

1. Create a directory under `skills/` and write `SKILL.md` (with `name` + `description` frontmatter)
2. If CLI tools are needed, put them in `scripts/` and reference absolute paths in SKILL.md
3. Optionally add `README.md` for humans; `SKILL.md` is for agents
4. Update [Capabilities](#capabilities) and [Skills Catalog](#skills-catalog) in both README files

### Minimum SKILL.md Structure

```yaml
---
name: your-skill-name
description: One-line summary + trigger keywords (agents use this to decide activation)
---

# Title

## Core rules / workflow
## Examples
```

### Local Debugging

```bash
# Clone and reference paths directly
git clone git@github.com:qkl9527/qikl-skills.git
# Add skills/ subdirectories to your agent's Skill search path in settings
```

---

## Notes

- **API Key**: `agnes-*` Skills require a valid `AGNES_API_KEY` — never commit it to the repo
- **Private docs**: Local `md/private/` holds system prompts and other private content (gitignored)
- **Third-party Skills**: `agnes-image` / `agnes-video` are built on the [Agnes AI](https://apihub.agnes-ai.com) API; rights belong to the respective service provider

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-10 | README restructure · Added README_EN.md · Documented agnes-image / agnes-video |
| 2026-01-23 | Initial project · Added `qikl-dankoe-illustration` |
| — | Added `agnes-image` · `agnes-video` Skills |

---

## License

- **qikl-dankoe-illustration**: Original content — free to reference and use
- **agnes-image / agnes-video**: Subject to respective upstream and service terms

---

## Author · qikl

| | |
|---|---|
| GitHub | [qkl9527/qikl-skills](https://github.com/qkl9527/qikl-skills) |

---

> 💡 This is an actively maintained Skills collection. Have a new scenario or Skill idea? Issues and PRs welcome.
