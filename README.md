# Beacon

**English** | [简体中文](README.zh-CN.md)

A lightweight, browser-based smart route selection portal.
A lightweight, browser-based smart route selection portal.

Beacon measures the availability and latency of multiple HTTP or HTTPS endpoints directly in the visitor’s browser, ranks them using current and historical results, and recommends the best available route.

- No backend required
- Ready for static hosting
- JSON-driven configuration
- Responsive interface
- Light and dark mode
- Browser-side route probing
- Automatic route ranking

---

Features

Smart Route Selection

Beacon tests multiple endpoints concurrently and automatically selects the route with the best effective score.

Resilient Browser-Side Probing

- Concurrent endpoint testing
- Multiple samples per route
- Median-based latency calculation
- Automatic outlier removal
- Configurable request timeout
- Automatic CORS and "no-cors" fallback
- Probe capability caching
- Cancellation of outdated test sessions

Weighted Scoring

The final route score can combine:

- Current latency
- Historical successful latency
- Consecutive timeout penalties

This helps prevent unnecessary route switching caused by temporary network fluctuations.

Configuration-Driven Interface

Routes, language strings, visual styles, latency levels, information cards, and footer announcements are stored in JSON files.

Most deployments can be customized without modifying JavaScript.

---

How It Works

1. The page loads route and interface configuration from the "data" directory.
2. "BeaconEngine" sends browser-side requests to configured probe resources.
3. Each route is tested multiple times.
4. Invalid samples and significant outliers are removed.
5. Beacon calculates the median latency and weighted score.
6. Available routes are sorted by score.
7. The best route becomes the default entry.
8. Users may manually select another route or start a new test.

«Beacon is not an ICMP ping tool. It measures the time required for the browser to request a resource from each endpoint.»

---

Quick Start

Clone the Repository

git clone https://github.com/edgeval/Beacon.git
cd Beacon

Start a Local Static Server

Using Python:

python3 -m http.server 8080

Using Node.js:

npx serve .

Open the following address in your browser:

http://localhost:8080

Do not rely on opening "index.html" directly through "file://" for testing. Browser security policies and JSON loading behavior differ from normal HTTP or HTTPS deployment.

---

Project Structure

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

File| Purpose
"index.html"| Page structure, styles, configuration loading, and interface logic
"engine.js"| Route probing and scoring engine
"data/config.json"| Core application and speed-test configuration
"data/routes.json"| Endpoints to test
"data/language.json"| Interface language strings
"data/theme.json"| Main card and button theme classes
"data/announcement.json"| Footer notices and legal text

---

Configuration

Route List

Edit "data/routes.json":

[
  "route-a.example.com",
  "route-b.example.com",
  "https://route-c.example.com/app/"
]

Routes may be written as domain names or complete HTTP or HTTPS URLs.

Examples:

[
  "example.com",
  "https://example.net/",
  "https://example.org/service/"
]

URLs containing embedded credentials are not supported:

https://user:password@example.com

Only HTTP and HTTPS routes are accepted.

---

Core Settings

Edit "data/config.json":

{
  "title": "Beacon · Smart Route",
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

General Fields

Field| Description
"title"| Browser page title
"defaultDomain"| Preferred route before testing or when no better route is available
"latencyLevels"| Labels and colors for different latency ranges
"infoCards"| Additional links displayed below the route list

Speed-Test Fields

Field| Description| Supported Range
"timeout"| Timeout for a single request, in milliseconds| "500" to "30000"
"concurrency"| Maximum number of routes tested concurrently| "1" to "12"
"sample"| Number of samples collected for each route| "1" to "10"
"protocolMode"| Default protocol mode: "https", "http", or "auto"| —
"probeMode"| Probe strategy: "auto", "cors", or "opaque"| —
"capabilityTtl"| Probe capability cache duration, in milliseconds| "60000" to "86400000"
"resources"| Resource paths used for latency requests| —
"currentWeight"| Weight assigned to the current result| "0" to "1"
"historyWeight"| Weight assigned to historical results| "0" to "1"
"timeoutPenalty"| Score penalty for consecutive failures| "0" to "10000"

"currentWeight" and "historyWeight" are normalized automatically.

For example:

{
  "currentWeight": 0.8,
  "historyWeight": 0.2
}

This produces an 80 percent current-result weight and a 20 percent historical-result weight.

---

Probe Modes

"auto"

Beacon first attempts a CORS request.

If CORS is unavailable, it falls back to a "no-cors" request and caches the detected capability.

This mode is recommended for most deployments.

"cors"

Only successful CORS-readable responses are accepted.

The target server must return an appropriate "Access-Control-Allow-Origin" header.

This mode is suitable when you control all target endpoints.

"opaque"

Beacon uses browser opaque-response probing through "no-cors".

The response body and status cannot be read, but Beacon can still measure whether the browser request completes.

This mode is suitable for third-party endpoints that do not provide CORS headers.

---

Probe Resources

Beacon appends a cache-busting query parameter to each configured resource path.

Choose resources that:

- Exist on every target route
- Are small and inexpensive to serve
- Do not require authentication
- Avoid redirects where possible
- Can safely receive repeated requests

Example:

{
  "resources": [
    "/favicon.ico",
    "/robots.txt",
    "/health.txt"
  ]
}

For more consistent results, deploy the same lightweight resource on every route.

---

Latency Levels

Latency labels are configured through "latencyLevels":

{
  "max": 250,
  "label": {
    "zh": "流畅",
    "en": "Good"
  },
  "color": "teal"
}

Each entry defines:

- "max": maximum latency in milliseconds
- "label.zh": Chinese label
- "label.en": English label
- "color": predefined interface color

Entries should be ordered from the lowest threshold to the highest threshold.

---

Information Cards

Additional links can be displayed using "infoCards":

{
  "iconClass": "fa-brands fa-github",
  "title": {
    "zh": "开源项目地址",
    "en": "Open Source Repository"
  },
  "value": "https://github.com/edgeval/Beacon",
  "color": "gray"
}

The "iconClass" field uses Font Awesome class names.

---

Localization

Edit "data/language.json" to customize interface text:

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

Beacon selects the interface language according to the visitor’s browser language.

---

Theme

Edit "data/theme.json" to customize the main route card and button:

{
  "cardGradient": "from-indigo-600 via-purple-600 to-violet-700",
  "btnColor": "bg-white text-purple-700 hover:bg-purple-50"
}

The values use Tailwind CSS utility classes.

Only use trusted configuration files.

---

Footer Announcement

Edit "data/announcement.json":

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

Announcement content may contain limited HTML formatting.

Do not load this file from an untrusted source.

---

Deployment

Beacon can be deployed on any static hosting service, including:

- GitHub Pages
- Cloudflare Pages
- Netlify
- Vercel
- Nginx
- Apache
- Object storage with static website hosting

No build command or server-side runtime is required.

GitHub Pages

1. Fork or upload the repository.
2. Open Settings → Pages.
3. Select Deploy from a branch.
4. Choose the branch containing Beacon.
5. Choose the "/ (root)" directory.
6. Save the configuration.

Cloudflare Pages

Recommended settings:

Framework preset: None
Build command:    Leave empty
Output directory: /

Nginx

Example configuration:

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

HTTPS is strongly recommended.

When Beacon is accessed through ordinary HTTP outside a local environment, the page attempts to redirect the visitor to HTTPS.

---

Browser and Network Limitations

Browser-side route testing is affected by browser security policies and target-server behavior.

CORS

A target without CORS support cannot expose its response status or content to Beacon.

In automatic mode, Beacon can fall back to an opaque response, but the result only confirms that the browser request completed.

Mixed Content

An HTTPS page may be blocked from requesting HTTP endpoints.

Use HTTPS for Beacon and all configured routes whenever possible.

Privacy Extensions and Filtering

Ad blockers, privacy extensions, DNS filtering, corporate proxies, and regional network restrictions may block individual domains or resources.

This can affect route availability and latency results.

Browser and CDN Caches

Service workers, browser caches, CDN edge caches, and redirects may influence browser-observed latency.

Beacon uses a changing query parameter and requests "no-store", but intermediary caching behavior cannot be fully controlled.

Latency Interpretation

Displayed latency may include:

- DNS resolution
- Connection establishment
- TLS negotiation
- Redirects
- Server response time
- Browser processing
- Local network conditions

Results should be treated as comparative route indicators rather than laboratory-grade network measurements.

---

Security Notes

- Configure only trusted HTTP and HTTPS endpoints.
- Do not place credentials, access tokens, or private data in route URLs.
- Keep all files in "data/" under your own control.
- Review the Content Security Policy before adding third-party resources.
- Do not use sensitive authenticated endpoints as probe resources.
- Consider target-server rate limits before increasing sample counts.
- Consider traffic volume before enabling frequent retests.

Beacon sends requests directly from each visitor’s browser.

Target services may receive the visitor’s IP address and normal browser request metadata.

---

Engine Usage

"engine.js" can also be used independently:

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

Main public methods:

engine.pingDomain(domain);
engine.testAll(domains);
engine.getScore(domain, currentLatency);
engine.getTargetUrl(domain);
engine.reset();
engine.destroy();

Call "destroy()" when the engine is no longer needed.

This cancels active requests and prevents subsequent work.

---

Customization Checklist

Before deploying your own instance:

1. Replace the example routes in "data/routes.json".
2. Set "defaultDomain" in "data/config.json".
3. Verify that the configured resources exist on every route.
4. Replace the repository and support links in "infoCards".
5. Update the footer copyright notice.
6. Test from the networks and regions used by your visitors.
7. Confirm that all production routes support HTTPS.
8. Review timeout, concurrency, and sample settings.

---

Development

Beacon currently uses:

- Vanilla JavaScript
- Browser Fetch API
- Tailwind CSS Browser CDN
- Font Awesome
- JSON configuration files

The project does not require a package manager or compilation step.

When modifying the route engine, test at least:

- Fully available routes
- Unreachable routes
- Routes without CORS headers
- Slow routes
- Redirecting routes
- Repeated retests
- Tests interrupted by a newer test session
- Mobile and desktop layouts
- Chinese and English browser languages
- Light and dark system themes

---

Contributing

Issues and pull requests are welcome.

When reporting a route-detection problem, include:

- Browser and version
- Operating system
- Beacon deployment address
- Example target route
- Whether the target supports CORS
- Relevant console errors
- Expected behavior
- Actual behavior

Do not include credentials or private endpoint information in public issues.

---

License

Beacon is released under the MIT License.

Copyright © 2026 Colton Flynn
