# qikl Skills Library

> 个人学习与原创的 Claude Skills 集合库

## 📖 项目简介

这是 **qikl** 的个人 Skills 学习与实践项目，专注于创建和分享实用的 Claude Skills。本项目包含日常场景中使用的原创 Skills，旨在提升 AI 交互效率和质量。

## 🎯 项目目标

- **学习与实践**：深入理解 Claude Skills 的创建和使用
- **场景驱动**：基于实际使用场景开发 Skills
- **原创分享**：创建高质量的原创 Skills 供日常使用
- **持续迭代**：根据使用反馈不断优化和改进

## 📦 当前 Skills

### 🎨 qikl-dankoe-illustration

**极密线雕提示词生成器**

一个专门用于生成极端密度细线雕刻风格 Midjourney 提示词的 Skill。采用 19 世纪天文木刻蚀刻风格，纯黑墨白底超高对比，密集平行波浪线和曲线排线。

**核心特性：**
- ✨ 极端密度细线雕刻美学
- 🎭 Gustave Doré 风格混合气质
- 📐 专业的工作流程指导
- 🔧 主动建议式交互模式
- 📝 中英文双语输出

**适用场景：**
- 创建线雕风格插画
- 生成版画风格图像
- 需要"极密线雕"、"Gustave Doré 风格"、"木刻蚀刻"、"DanKoe配图风格"时

**使用方法：**
在 Claude 中提及相关关键词或直接说明需要创建线雕风格图像，Skill 会自动激活并引导你完成提示词生成流程。

## 📁 项目结构

```
.
├── README.md                    # 项目说明文档
├── .gitignore                  # Git 忽略配置
├── skills/                      # Skills 目录
│   └── qikl-dankoe-illustration/
│       └── SKILL.md            # Skill 定义文件
├── md/                          # 文档目录
│   └── private/                # 私有文档
│       └── system_prompt.md    # 系统提示词
└── output/                      # 输出目录
```

## 🚀 快速开始

### 安装 Skills

1. 将 `skills/` 目录下的 Skill 文件复制到 Claude Skills 目录
2. 或在 Claude 中直接引用 Skill 文件路径

### 使用 Skills

在 Claude 对话中：
- 提及相关关键词（如"极密线雕"、"Gustave Doré 风格"）
- 或直接说明你的需求（如"帮我创建一个线雕风格的插画"）
- Skill 会自动激活并引导你完成交互流程

## 🛠️ 开发指南

### 创建新 Skill

1. 在 `skills/` 目录下创建新的 Skill 文件夹
2. 创建 `SKILL.md` 文件，遵循 Claude Skills 格式规范
3. 在 `md/private/` 中保存相关的系统提示词或文档
4. 更新本 README 添加新 Skill 的说明

### Skill 文件结构

每个 Skill 应包含：
- **元数据**：name、description 等
- **核心功能说明**：详细的功能描述
- **使用指南**：工作流程和交互模式
- **示例**：使用示例和输出样例

## 📝 注意事项

- `md/private/` 目录包含私有文档，不对外公开
- `output/` 目录用于存放生成的文件
- 请遵循 `.gitignore` 配置，不要提交敏感信息

## 🔄 更新日志

### 2026-01-23
- ✨ 初始项目创建
- 🎨 添加 `qikl-dankoe-illustration` Skill

## 📄 许可证

本项目为个人学习项目，Skills 内容为原创。

## 👤 作者

**qikl**

---

> 💡 **提示**：这是一个持续更新的项目，会根据实际使用场景不断添加新的 Skills。欢迎关注和反馈！
