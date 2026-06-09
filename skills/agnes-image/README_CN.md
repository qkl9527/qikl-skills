# Agnes Image 2.1 Flash

通过 Agnes Image 2.1 Flash API 使用命令行脚本生成图像。

## 功能

- **文生图**: 根据文本提示词生成图像
- **图生图**: 使用 URL 或本地文件引用转换现有图像
- **自动提示词扩展**: 简短提示词会自动扩展为更详细的描述
- **本地图片上传**: 将本地文件上传至 API，支持 Data URI Base64 降级方案
- **灵活输出**: 直接保存至文件（`--output`）或输出 URL/Base64 到标准输出

## 环境配置

### 1. 获取 API Key

在 https://apihub.agnes-ai.com 注册并获取 API Key。

### 2. 安装依赖

```bash
# 运行脚本需要 tsx
npm install -g tsx
```

### 3. 设置 API Key

```bash
export AGNES_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
```

## 使用方法

### 基础用法（文生图）

```bash
tsx $(SKILL_DIR)/scripts/image.tsx --prompt "一只坐在窗台上的猫" --output cat.png
```

### 图生图（使用 URL）

```bash
tsx $(SKILL_DIR)/scripts/image.tsx --prompt "转换成赛博朋克风格" --image "https://example.com/photo.jpg" --output result.png
```

### 图生图（使用本地文件）

```bash
tsx $(SKILL_DIR)/scripts/image.tsx --prompt "重新设计" --local-image "/path/to/img.png" --output result.png
```

### 多张本地图片

```bash
tsx $(SKILL_DIR)/scripts/image.tsx --prompt "重新设计" --local-image "/path/img1.png" --local-image "/path/img2.png"
```

## CLI 参数

| 参数 | 必填 | 说明 |
|------|------|------|
| `--prompt` | 是 | 图像生成提示词 |
| `--size` | 否 | 分辨率，如 `1024x1024`。默认：`1024x1024` |
| `--output` | 否 | 将结果保存到文件路径 |
| `--image` | 否 | 图生图使用的图片 URL |
| `--local-image` | 否 | 图生图使用的本地文件路径（可重复指定） |
| `--timeout` | 否 | API 超时时间（秒）。默认：`120` |

## 输出

成功后，脚本会将图像 URL 或 Base64 数据输出到标准输出。如果提供了 `--output`，图像也会保存到指定文件路径。

## 价格

每张图像 $0.003。
