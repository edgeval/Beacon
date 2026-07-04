# Beacon

> Lightweight intelligent route selection portal.
>
> 轻量级智能线路优选门户。

---

## Overview | 项目简介

Beacon is a lightweight route selection portal designed for static website deployment. It automatically evaluates multiple endpoints and selects the optimal route based on real-time latency measurements.

Beacon 是一个适用于静态网站部署的轻量级线路优选门户，通过实时测速自动评估多个节点，并自动选择当前最佳线路。

---

## Features | 功能特性

- 🚀 Automatic route detection · 自动线路测速
- ⚡ Concurrent latency probing · 并发延迟探测
- 📊 Historical latency weighting · 历史延迟权重
- 🌐 Multi-language support · 中英文支持
- 🎨 Configurable UI theme · 可配置主题
- 📦 JSON-based configuration · JSON 配置驱动
- 🌙 Light / Dark mode · 深浅色模式
- 🔧 Zero backend required · 无需后端

---

## Project Structure | 项目结构

```text
Beacon/
├── index.html
├── engine.js
└── data/
    ├── config.json
    ├── routes.json
    ├── language.json
    ├── theme.json
    └── announcement.json
```

---

## Configuration | 配置说明

All runtime configurations are stored in the `data` directory.

所有运行时配置均位于 `data` 目录。

| File | Description | 说明 |
|------|-------------|------|
| config.json | Core configuration | 核心配置 |
| routes.json | Route list | 节点列表 |
| language.json | Localization | 多语言 |
| theme.json | Theme settings | 页面主题 |
| announcement.json | Footer content | 页脚公告 |

---

## Deployment | 部署

Supported static hosting platforms:

支持部署到以下静态托管平台：

- GitHub Pages
- Cloudflare Pages
- Netlify
- Vercel
- Any static web server

---

## Development Workflow | 开发流程

This project was developed using an AI-assisted workflow.

- **Google Gemini** — Primary implementation and feature development.
- **OpenAI ChatGPT** — Code review, optimization, documentation and quality assurance.

本项目采用 AI 辅助开发流程。

- **Google Gemini** —— 主要负责功能实现与代码开发。
- **OpenAI ChatGPT** —— 负责代码审查、优化、文档编写及质量检查。

---

## License | 开源协议

Licensed under the MIT License.

Copyright © 2026 Colton Flynn
