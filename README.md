# Beacon

Beacon is a lightweight browser-based smart route selector.

It measures the availability and latency of multiple HTTP and HTTPS endpoints directly in the user's browser, ranks them using real-time probing, and automatically recommends the best available route.

Beacon requires no backend service and can be deployed on any static hosting platform.

[简体中文](README.zh-CN.md)

---

## Features

- Browser-side latency testing
- Automatic route selection
- No backend required
- Static deployment
- JSON-driven configuration
- Responsive interface
- Light and dark mode support

---

## Quick Start

Clone the repository:

```bash
git clone https://github.com/edgeval/Beacon.git
cd Beacon
```

Start a local web server:

```bash
python3 -m http.server 8080
```

or

```bash
npx serve .
```

Then open:

```
http://localhost:8080
```

---

## Project Structure

```text
Beacon/
├── index.html
├── engine.js
├── README.md
└── data/
    ├── announcement.json
    ├── config.json
    ├── language.json
    ├── routes.json
    └── theme.json
```

---

## Configuration

Most deployments only require editing the files under the `data` directory.

| File | Description |
|------|-------------|
| `routes.json` | Route list |
| `config.json` | Application settings |
| `language.json` | Interface language |
| `theme.json` | Theme configuration |
| `announcement.json` | Footer information |

---

## Deployment

Beacon is a static web application and can be deployed on any static hosting platform, including:

- GitHub Pages
- Cloudflare Pages
- Netlify
- Vercel
- Nginx
- Apache

HTTPS is recommended for production deployments.

---

## Browser Compatibility

Beacon is designed for modern browsers supporting the Fetch API.

The latest versions of Chrome, Edge, Safari and Firefox are recommended.

---

## License

Beacon is released under the MIT License.

Copyright © 2026 Colton Flynn
