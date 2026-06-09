# Agnes Video

通过 Agnes Video V2.0 API 使用命令行脚本生成视频。

## 功能

- **文生视频**: 根据文本提示词生成视频
- **图生视频**: 将单张图片动画化
- **多图 / 关键帧**: 在多个图片之间创建平滑过渡
- **本地图片上传**: 生成前上传本地图片文件
- **异步轮询**: 轮询任务状态直到完成或失败

## 环境配置

### 1. 获取 API Key

在 https://apihub.agnes-ai.com 注册并获取 API Key。

### 2. 安装依赖

```bash
npm install -g tsx
```

### 3. 设置 API Key

```bash
export AGNES_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
```

## 使用方法

### 文生视频

```bash
tsx $(SKILL_DIR)/scripts/generate_video.ts "一只猫在雨中行走的电影镜头" \
  --width 1152 --height 768 --num-frames 121 --frame-rate 24

# 轮询结果
tsx $(SKILL_DIR)/scripts/poll_video.ts "<task_id>"
```

### 图生视频（使用 URL）

```bash
tsx $(SKILL_DIR)/scripts/generate_video.ts "让云朵飘动" --image "https://example.com/photo.jpg"

tsx $(SKILL_DIR)/scripts/poll_video.ts "<task_id>"
```

### 图生视频（使用本地文件）

```bash
# 先上传图片
URLS=$(tsx $(SKILL_DIR)/scripts/upload_image.ts "/path/to/image.png")
URL=$(echo "$URLS" | python3 -c "import sys,json; print(json.load(sys.stdin)[0])")

# 生成视频
tsx $(SKILL_DIR)/scripts/generate_video.ts "动画化场景" --image "$URL"

tsx $(SKILL_DIR)/scripts/poll_video.ts "<task_id>"
```

### 多图 / 关键帧

```bash
URLS=$(tsx $(SKILL_DIR)/scripts/upload_image.ts "/path/img1.png" "/path/img2.png" "/path/img3.png")
# URLS 中包含 JSON 数组形式的 URL

tsx $(SKILL_DIR)/scripts/generate_video.ts "场景之间的平滑过渡" \
  --images "$URLS" --mode keyframes --num-frames 121 --frame-rate 24

tsx $(SKILL_DIR)/scripts/poll_video.ts "<task_id>"
```

## 脚本说明

| 脚本 | 用途 |
|------|------|
| `scripts/generate_video.ts` | 创建视频生成任务，返回 `task_id` |
| `scripts/poll_video.ts` | 轮询任务状态直到完成或失败 |
| `scripts/upload_image.ts` | 上传本地图片文件，返回 URL |

## 默认设置

| 参数 | 默认值 | 有效范围 |
|------|--------|----------|
| `width` | 1152 | - |
| `height` | 768 | - |
| `num_frames` | 121 | <= 441，必须满足 8n+1（81, 121, 161, 201, 241, 281, 321, 361, 441） |
| `frame_rate` | 24 | 1–60 |

## 推荐配置

| 时长 | num_frames | frame_rate |
|------|-----------|------------|
| ~5秒 | 121 | 24 |
| ~10秒 | 241 | 24 |
| ~18秒 | 441 | 24 |
