🌐 **中文** · [English](README_EN.md)

# qikl Skills Library

> *「说一句话。Agent 自动选对 Skill。拿到能用的结果。」*

**面向日常场景的 Agent Skills 集合——覆盖视觉提示词、图像生成、视频生成。**

在 Cursor / Claude Code 里直接说话，Skill 会自动激活：帮你写出极密线雕 Midjourney 提示词、调用 Agnes API 出图、或异步生成短视频。无需面板、无需插件——对话即工作流。

```
# 安装单个 Skill（推荐）
npx skills add qkl9527/qikl-skills --skill qikl-dankoe-illustration
npx skills add qkl9527/qikl-skills --skill agnes-image
npx skills add qkl9527/qikl-skills --skill agnes-video

# 或克隆整个仓库
git clone git@github.com:qkl9527/qikl-skills.git
```

跨 agent 通用——Cursor、Claude Code、Codex 等支持 Skills 的运行时均可安装。

[安装](#装上就能用) · [能做什么](#能做什么) · [Skills 目录](#skills-目录) · [仓库结构](#仓库结构) · [开发指南](#开发指南)

---

## 装上就能用

```bash
# 按需安装（--skill 指定 skills/ 下的 Skill 名称）
npx skills add qkl9527/qikl-skills --skill qikl-dankoe-illustration
npx skills add qkl9527/qikl-skills --skill agnes-image
npx skills add qkl9527/qikl-skills --skill agnes-video
```

**agnes-image / agnes-video** 需要先配置 API Key：

```bash
export AGNES_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
# 获取 Key：https://apihub.agnes-ai.com
npm install -g tsx   # 运行 bundled scripts 所需
```

然后在 agent 里直接说话：

```
「帮我做一张极密线雕风格的 DanKoe 配图，主题是 AI 取代人类劳动」
「用 Agnes 生成一张赛博朋克风格的猫咪插画，保存到 cat.png」
「把这张产品图做成 5 秒宣传短视频，1152×768，24fps」
```

没有按钮、没有面板——Skill 读到意图就开工。

---

## 能做什么


| Skill                        | 交付物                         | 典型场景                               | 依赖                      |
| ---------------------------- | --------------------------- | ---------------------------------- | ----------------------- |
| **qikl-dankoe-illustration** | 中英文 Midjourney 提示词 · 分步交互引导 | 线雕 / 木刻 / Gustave Doré / DanKoe 配图 | 无                       |
| **agnes-image**              | PNG / URL · 文生图 · 图生图       | 插画、概念图、社媒图、产品 mockup               | `AGNES_API_KEY` · `tsx` |
| **agnes-video**              | MP4 · 异步任务 + 轮询             | 文生视频、图生视频、多图关键帧                    | `AGNES_API_KEY` · `tsx` |


---

## Skills 目录

### qikl-dankoe-illustration · 极密线雕提示词生成器

**原创 Skill** · 专门生成极端密度细线雕刻风格的 Midjourney 提示词。

19 世纪天文木刻蚀刻美学——纯黑墨白底、超高对比、密集平行波浪线与曲线排线，Gustave Doré 遇上外道艺术家的混合气质。

**核心特性：**

- 极端密度细线雕刻美学铁律（100% 遵守，除非用户明确要求换风格）
- 理解 → 建议 → 确认 → 下一步的主动引导式交互
- 主题 / 视觉元素 / 氛围 / 底部文字 / 技术参数 五步工作流
- 中英文双语提示词输出

**触发关键词：** `极密线雕` · `Gustave Doré 风格` · `木刻蚀刻` · `DanKoe配图` · `配图`

示例对话

```
「帮我做一张 DanKoe 风格的配图，主题是孤独的知识工作者」
「生成 Gustave Doré 风格的线雕插画提示词，画面要有图书馆和古书」
```

---

### agnes-image · Agnes Image 2.1 Flash

**封装 Skill** · 通过 Agnes Image API 生成图像，内置 `scripts/image.tsx` 可靠执行。

- **文生图**：短 prompt 自动扩展后生成
- **图生图**：支持 URL、本地文件、Data URI Base64
- **灵活输出**：`--output` 存文件，或 stdout 输出 URL / Base64

```bash
tsx skills/agnes-image/scripts/image.tsx \
  --prompt "a cat sitting on a windowsill" \
  --output cat.png
```

详细参数见 `[skills/agnes-image/README.md](skills/agnes-image/README.md)` · 中文版 `[README_CN.md](skills/agnes-image/README_CN.md)`

---

### agnes-video · Agnes Video V2.0

**封装 Skill** · 通过 Agnes Video API 异步生成视频，任务创建 + 轮询分离。


| 模式       | 说明              |
| -------- | --------------- |
| 文生视频     | 纯文本 prompt 生成短片 |
| 图生视频     | 单张图片动画化         |
| 多图 / 关键帧 | 多图平滑过渡          |


```bash
# 1. 创建任务
tsx skills/agnes-video/scripts/generate_video.ts \
  "a cinematic shot of a cat walking in the rain"

# 2. 轮询结果
tsx skills/agnes-video/scripts/poll_video.ts "<task_id>"
```

详细参数见 `[skills/agnes-video/README.md](skills/agnes-video/README.md)` · 中文版 `[README_CN.md](skills/agnes-video/README_CN.md)`

---

## 项目理念


| 原则          | 说明                                  |
| ----------- | ----------------------------------- |
| **实践优先**    | 每个 Skill 可直接安装使用，聚焦触发机制与 agent 交互效果 |
| **场景驱动**    | 每个 Skill 对应真实使用场景，不是 demo 堆砌        |
| **原创 + 封装** | 原创工作流 Skill 与第三方 API 封装 Skill 并存    |
| **持续迭代**    | 根据使用反馈优化 SKILL.md 与 bundled scripts |


**Skill 分层：**

- **工作流型**（`qikl-dankoe-illustration`）：定义美学铁律 + 多步交互协议，agent 当「提示词导演」
- **工具型**（`agnes-image` / `agnes-video`）：bundled scripts 直连 API，agent 当「执行器」，不反复确认直接跑

---

## 仓库结构

```
qikl-skills/
├── README.md                              # 中文（默认）
├── README_EN.md                           # English
├── .gitignore
└── skills/
    ├── qikl-dankoe-illustration/
    │   └── SKILL.md                       # 极密线雕提示词 · 原创
    ├── agnes-image/
    │   ├── SKILL.md
    │   ├── README.md · README_CN.md
    │   └── scripts/
    │       └── image.tsx                  # 文生图 / 图生图 CLI
    └── agnes-video/
        ├── SKILL.md
        ├── README.md · README_CN.md
        └── scripts/
            ├── generate_video.ts          # 创建视频任务
            ├── poll_video.ts              # 轮询任务状态
            └── upload_image.ts            # 上传本地图片
```

> `md/private/`、`output/` 等本地目录已在 `.gitignore` 中，不纳入版本库。

---

## 开发指南

### 创建新 Skill

1. 在 `skills/` 下新建目录，编写 `SKILL.md`（含 `name` + `description` frontmatter）
2. 如需 CLI 工具，放入 `scripts/` 并在 SKILL.md 中引用绝对路径
3. 可选：添加 `README.md` 供人类阅读，`SKILL.md` 供 agent 读取
4. 更新本 README 的 [能做什么](#能做什么) 与 [Skills 目录](#skills-目录)

### SKILL.md 最低结构

```yaml
---
name: your-skill-name
description: 一句话说明 + 触发关键词（agent 靠这段决定是否激活）
---

# 标题

## 核心规则 / 工作流程
## 示例
```

### 本地调试

```bash
# 克隆后可直接引用路径
git clone git@github.com:qkl9527/qikl-skills.git
# 在 agent 设置中将 skills/ 子目录加入 Skill 搜索路径
```

---

## 注意事项

- **API Key**：`agnes-`* Skills 需要有效的 `AGNES_API_KEY`，请勿提交到仓库
- **私有文档**：本地 `md/private/` 存放系统提示词等私有内容，已 gitignore
- **第三方 Skill**：`agnes-image` / `agnes-video` 基于 [Agnes AI](https://apihub.agnes-ai.com) API，版权归原服务方

---

## 更新日志


| 日期         | 变更                                                                                |
| ---------- | --------------------------------------------------------------------------------- |
| 2026-06-10 | README 重构 版式 · 新增 README_EN.md · 补全 agnes-image / agnes-video 文档 |
| 2026-01-23 | 初始项目 · 添加 `qikl-dankoe-illustration`                                              |
| —          | 添加 `agnes-image` · `agnes-video` Skills                                           |


---

## 许可证

- **qikl-dankoe-illustration**：原创内容，可自由参考与使用
- **agnes-image / agnes-video**：遵循各自 upstream 与服务条款

---

## 作者 · qikl


|        |                                                               |
| ------ | ------------------------------------------------------------- |
| GitHub | [qkl9527/qikl-skills](https://github.com/qkl9527/qikl-skills) |


---

> 💡 这是一个持续更新的 Skills 集合。有新场景、新 Skill 想法？欢迎 Issue 或 PR。

