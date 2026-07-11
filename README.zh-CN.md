# Beacon

[English](README.md) | **简体中文**

一个轻量级、纯浏览器运行的智能线路优选门户。

Beacon 会直接在访问者的浏览器中检测多个 HTTP 或 HTTPS 线路的可用性与请求延迟，并结合当前结果、历史延迟和失败惩罚进行综合评分，最终推荐当前表现最佳的可用线路。

- 无需后端
- 支持静态部署
- JSON 配置驱动
- 响应式界面
- 支持深浅色模式
- 浏览器端线路检测
- 自动线路排序与推荐

---

功能特性

智能线路优选

Beacon 会并发检测多个目标线路，并根据综合评分自动选择表现最佳的可用线路。

稳健的浏览器端测速

- 并发检测多个线路
- 每条线路执行多次采样
- 使用中位数计算延迟
- 自动剔除明显异常值
- 支持自定义请求超时
- 自动进行 CORS 与 "no-cors" 回退
- 缓存线路探测能力
- 自动取消已经过期的测速任务

加权评分机制

线路最终评分可以综合考虑：

- 当前延迟
- 历史成功延迟
- 连续超时惩罚

这种方式可以减少因短时网络波动而产生的不必要线路切换。

配置驱动界面

线路列表、语言文案、界面主题、延迟等级、信息卡片和页脚公告均通过 JSON 文件配置。

大多数部署场景无需修改 JavaScript。

---

工作原理

1. 页面从 "data" 目录加载线路和界面配置。
2. "BeaconEngine" 在浏览器中向指定资源发起请求。
3. 每条线路执行多次测速采样。
4. 无效样本和明显异常值会被移除。
5. Beacon 计算中位数延迟和加权评分。
6. 可用线路按照评分排序。
7. 评分最佳的线路会成为默认入口。
8. 用户可以手动选择其他线路，也可以重新测速。

«Beacon 并不是 ICMP Ping 工具。它测量的是浏览器向目标线路请求资源所需的时间。»

---

快速开始

克隆仓库

git clone https://github.com/edgeval/Beacon.git
cd Beacon

启动本地静态服务器

使用 Python：

python3 -m http.server 8080

使用 Node.js：

npx serve .

然后在浏览器中打开：

http://localhost:8080

不建议直接通过 "file://" 打开 "index.html" 进行测试。

浏览器安全策略和 JSON 文件加载行为在 "file://"、HTTP 和 HTTPS 环境中可能存在差异。

---

项目结构

Beacon/
├── index.html
├── engine.js
├── README.md
└── data/
    ├── config.json
    ├── routes.json
    ├── language.json
    ├── theme.json
    └── announcement.json

文件| 作用
"index.html"| 页面结构、样式、配置加载和界面逻辑
"engine.js"| 线路测速与评分引擎
"data/config.json"| 核心应用与测速配置
"data/routes.json"| 待检测线路列表
"data/language.json"| 界面语言文案
"data/theme.json"| 主卡片和按钮主题样式
"data/announcement.json"| 页脚提示与版权信息

---

配置说明

线路列表

编辑 "data/routes.json"：

[
  "route-a.example.com",
  "route-b.example.com",
  "https://route-c.example.com/app/"
]

线路既可以填写域名，也可以填写完整的 HTTP 或 HTTPS 地址。

例如：

[
  "example.com",
  "https://example.net/",
  "https://example.org/service/"
]

不支持包含账号密码的地址：

https://user:password@example.com

仅支持 HTTP 和 HTTPS 线路。

---

核心配置

编辑 "data/config.json"：

{
  "title": "Beacon · 智能线路",
  "defaultDomain": "example.com",
  "speedTest": {
    "timeout": 5000,
    "concurrency": 4,
    "sample": 3,
    "protocolMode": "auto",
    "probeMode": "auto",
    "capabilityTtl": 3600000,
    "resources": [
      "/favicon.ico",
      "/robots.txt",
      "/apple-touch-icon.png",
      "/favicon.png"
    ],
    "currentWeight": 0.8,
    "historyWeight": 0.2,
    "timeoutPenalty": 500
  }
}

通用字段

字段| 说明
"title"| 浏览器页面标题
"defaultDomain"| 测速前或没有更优线路时使用的默认线路
"latencyLevels"| 不同延迟区间对应的标签和颜色
"infoCards"| 在线路列表下方显示的附加信息卡片

测速字段

字段| 说明| 支持范围
"timeout"| 单次请求超时时间，单位为毫秒| "500" 至 "30000"
"concurrency"| 同时测速的最大线路数量| "1" 至 "12"
"sample"| 每条线路的采样次数| "1" 至 "10"
"protocolMode"| 默认协议模式："https"、"http" 或 "auto"| —
"probeMode"| 探测模式："auto"、"cors" 或 "opaque"| —
"capabilityTtl"| 探测能力缓存时间，单位为毫秒| "60000" 至 "86400000"
"resources"| 用于测速的资源路径| —
"currentWeight"| 当前测速结果权重| "0" 至 "1"
"historyWeight"| 历史测速结果权重| "0" 至 "1"
"timeoutPenalty"| 连续失败时增加的评分惩罚| "0" 至 "10000"

"currentWeight" 和 "historyWeight" 会自动归一化。

例如：

{
  "currentWeight": 0.8,
  "historyWeight": 0.2
}

表示当前结果占 80%，历史结果占 20%。

---

探测模式

"auto"

Beacon 会优先尝试 CORS 请求。

如果目标线路不支持 CORS，则自动回退到 "no-cors" 请求，并缓存探测结果。

大多数部署场景推荐使用此模式。

"cors"

仅接受可以通过 CORS 正常读取的成功响应。

目标服务器必须返回正确的 "Access-Control-Allow-Origin" 响应头。

适用于你能够控制全部目标线路的场景。

"opaque"

通过 "no-cors" 发起浏览器不透明响应请求。

Beacon 无法读取响应正文和状态码，但仍可以测量请求是否完成以及大致耗时。

适用于不提供 CORS 响应头的第三方线路。

---

测速资源

Beacon 会在每个测速资源地址后添加随机查询参数，以降低浏览器缓存对结果的影响。

测速资源应满足以下条件：

- 每条目标线路上都存在
- 文件体积较小
- 不需要身份验证
- 尽量避免重定向
- 可以安全地被重复请求

例如：

{
  "resources": [
    "/favicon.ico",
    "/robots.txt",
    "/health.txt"
  ]
}

为了获得更加一致的结果，建议在所有线路上部署相同的轻量级测速资源。

---

延迟等级

延迟显示标签通过 "latencyLevels" 配置：

{
  "max": 250,
  "label": {
    "zh": "流畅",
    "en": "Good"
  },
  "color": "teal"
}

每个配置项包含：

- "max"：该等级允许的最大延迟，单位为毫秒
- "label.zh"：中文标签
- "label.en"：英文标签
- "color"：预设界面颜色

配置项应按照延迟阈值从低到高排列。

---

信息卡片

可以通过 "infoCards" 在线路列表下方显示附加链接：

{
  "iconClass": "fa-brands fa-github",
  "title": {
    "zh": "开源项目地址",
    "en": "Open Source Repository"
  },
  "value": "https://github.com/edgeval/Beacon",
  "color": "gray"
}

"iconClass" 使用 Font Awesome 图标类名。

---

多语言配置

编辑 "data/language.json" 可以修改界面文案：

{
  "zh": {
    "enterBtn": "进入最佳线路",
    "retestBtn": "重新测速"
  },
  "en": {
    "enterBtn": "Enter Best Route",
    "retestBtn": "Retest"
  }
}

Beacon 会根据访问者的浏览器语言自动选择界面语言。

---

主题配置

编辑 "data/theme.json" 可以修改主线路卡片和按钮样式：

{
  "cardGradient": "from-indigo-600 via-purple-600 to-violet-700",
  "btnColor": "bg-white text-purple-700 hover:bg-purple-50"
}

这些配置值使用 Tailwind CSS 工具类。

请仅使用可信的配置文件。

---

页脚公告

编辑 "data/announcement.json"：

{
  "zh": {
    "tipBox": "提示内容",
    "tipDesc": "补充说明",
    "tipLegal": "版权信息"
  },
  "en": {
    "tipBox": "Notice",
    "tipDesc": "Additional information",
    "tipLegal": "Copyright information"
  }
}

公告内容支持有限的 HTML 格式。

请勿从不可信来源加载该文件。

---

部署

Beacon 可以部署到任何静态托管平台，包括：

- GitHub Pages
- Cloudflare Pages
- Netlify
- Vercel
- Nginx
- Apache
- 支持静态网站托管的对象存储

项目不需要构建命令，也不需要服务端运行环境。

GitHub Pages

1. Fork 或上传本仓库。
2. 打开 Settings → Pages。
3. 选择 Deploy from a branch。
4. 选择包含 Beacon 文件的分支。
5. 目录选择 "/ (root)"。
6. 保存设置。

Cloudflare Pages

推荐配置：

Framework preset: None
Build command:    留空
Output directory: /

Nginx

示例配置：

server {
    listen 80;
    server_name beacon.example.com;

    root /var/www/beacon;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location /data/ {
        add_header Cache-Control "no-cache";
    }
}

强烈建议使用 HTTPS。

当 Beacon 在非本地环境中通过普通 HTTP 访问时，页面会尝试跳转到 HTTPS。

---

浏览器与网络限制

浏览器端测速会受到浏览器安全策略和目标服务器行为的影响。

CORS

如果目标线路不支持 CORS，Beacon 无法读取其响应状态和正文。

在自动模式下，Beacon 可以回退到不透明响应，但此时只能确认浏览器请求是否完成。

混合内容

HTTPS 页面请求 HTTP 线路时，可能会被浏览器作为混合内容拦截。

建议 Beacon 页面和所有目标线路都使用 HTTPS。

隐私扩展与网络过滤

广告拦截器、隐私扩展、DNS 过滤、企业代理和地区网络限制都可能阻止某些域名或资源。

这些因素会影响线路可用性和测速结果。

浏览器与 CDN 缓存

Service Worker、浏览器缓存、CDN 边缘缓存和重定向都可能影响浏览器测得的延迟。

Beacon 会添加随机查询参数，并使用 "no-store" 请求，但无法完全控制所有中间缓存行为。

延迟结果的含义

页面显示的延迟可能包含：

- DNS 解析
- 网络连接建立
- TLS 握手
- HTTP 重定向
- 服务器响应时间
- 浏览器处理时间
- 本地网络状况

因此，测速结果更适合用于线路之间的相对比较，而不应视为实验室级网络测试数据。

---

安全说明

- 仅配置可信的 HTTP 和 HTTPS 线路。
- 不要在线路地址中放置账号、密码、令牌或隐私数据。
- 确保 "data/" 目录中的配置文件完全受你控制。
- 添加第三方资源前应检查内容安全策略。
- 不要使用包含敏感认证信息的接口作为测速资源。
- 提高采样次数前应考虑目标服务器的访问频率限制。
- 开启频繁重新测速前应评估实际访问量。

Beacon 会直接从访问者的浏览器向目标线路发送请求。

目标服务可能会接收到访问者的 IP 地址和正常浏览器请求信息。

---

独立使用测速引擎

"engine.js" 也可以独立使用：

<script src="./engine.js"></script>

<script>
  const engine = new BeaconEngine({
    timeoutMs: 5000,
    concurrency: 4,
    pingCount: 3,
    protocolMode: "auto",
    probeMode: "auto",
    currentWeight: 0.8,
    historyWeight: 0.2,
    timeoutPenalty: 500
  });

  const routes = [
    "route-a.example.com",
    "route-b.example.com"
  ];

  const results = await engine.testAll(routes);

  console.log(results);
</script>

主要公开方法：

engine.pingDomain(domain);
engine.testAll(domains);
engine.getScore(domain, currentLatency);
engine.getTargetUrl(domain);
engine.reset();
engine.destroy();

不再需要测速引擎时，应调用 "destroy()"。

该方法会取消当前正在进行的请求，并阻止后续任务继续执行。

---

部署前检查

部署自己的实例前，建议完成以下操作：

1. 替换 "data/routes.json" 中的示例线路。
2. 设置 "data/config.json" 中的 "defaultDomain"。
3. 确认所有线路上都存在配置的测速资源。
4. 修改 "infoCards" 中的仓库和支持链接。
5. 更新页脚版权信息。
6. 从实际用户所在地区和网络进行测试。
7. 确认所有生产线路均支持 HTTPS。
8. 根据实际流量调整超时、并发数和采样次数。

---

开发说明

Beacon 当前使用：

- 原生 JavaScript
- 浏览器 Fetch API
- Tailwind CSS 浏览器 CDN
- Font Awesome
- JSON 配置文件

项目不需要包管理器，也不需要编译步骤。

修改线路引擎后，至少应测试以下场景：

- 全部可用的线路
- 无法访问的线路
- 不支持 CORS 的线路
- 响应缓慢的线路
- 存在重定向的线路
- 多次连续重新测速
- 新测速任务中断旧任务
- 手机和桌面布局
- 中文和英文浏览器语言
- 深色和浅色系统主题

---

参与贡献

欢迎提交 Issue 和 Pull Request。

反馈线路检测问题时，建议提供：

- 浏览器名称和版本
- 操作系统
- Beacon 部署地址
- 示例目标线路
- 目标线路是否支持 CORS
- 相关控制台错误
- 预期行为
- 实际行为

请勿在公开 Issue 中提交账号、密码、令牌或私有接口信息。

---

开源协议

Beacon 使用 MIT License 开源。

Copyright © 2026 Colton Flynn
