Beacon

Beacon 是一个轻量级、基于浏览器的智能线路选择工具。

它会直接在访问者的浏览器中检测多个 HTTP 或 HTTPS 线路的可用性和访问延迟，根据测速结果自动选择当前最佳线路，无需服务器参与计算。

Beacon 无需后端服务，可直接部署到任意支持静态网站托管的平台。

"English" (README.md)

---

功能特性

- 浏览器端线路测速
- 自动选择最佳线路
- 无需后端服务
- 支持静态部署
- JSON 配置驱动
- 响应式界面
- 支持深色与浅色模式

---

快速开始

克隆仓库：

git clone https://github.com/edgeval/Beacon.git
cd Beacon

启动本地 Web 服务器：

python3 -m http.server 8080

或：

npx serve .

然后在浏览器中访问：

http://localhost:8080

---

项目结构

Beacon/
├── index.html
├── engine.js
├── README.md
├── README.zh-CN.md
└── data/
    ├── announcement.json
    ├── config.json
    ├── language.json
    ├── routes.json
    └── theme.json

---

配置

大多数情况下，只需修改 "data" 目录中的配置文件即可完成部署。

文件| 说明
"routes.json"| 线路列表
"config.json"| 应用配置
"language.json"| 界面语言
"theme.json"| 主题配置
"announcement.json"| 页脚信息

---

部署

Beacon 是一个纯静态 Web 应用，可部署到任何支持静态网站托管的平台，例如：

- GitHub Pages
- Cloudflare Pages
- Netlify
- Vercel
- Nginx
- Apache

生产环境建议使用 HTTPS。

---

浏览器兼容性

Beacon 面向支持 Fetch API 的现代浏览器设计。

推荐使用最新版的 Chrome、Edge、Safari 或 Firefox。

---

开源协议

Beacon 使用 MIT License 开源。

Copyright © 2026 Colton Flynn
