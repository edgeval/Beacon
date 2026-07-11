Beacon

Beacon is a lightweight, browser-based smart route selector.

It probes multiple HTTP and HTTPS endpoints directly from the user's browser, measures availability and latency, and recommends the best available route in real time.

Beacon is fully static. It requires no backend service, no database, and no build process.

---

Features

- Browser-side route probing
- Automatic best-route selection
- Latency ranking with multiple samples
- CORS and no-cors probing support
- JSON-driven configuration
- Responsive interface
- Light and dark mode support
- Static deployment friendly

---

Project Structure

Beacon/
├── index.html
├── engine.js
├── README.md
├── LICENSE
└── data/
    ├── announcement.json
    ├── config.json
    ├── language.json
    ├── routes.json
    └── theme.json

---

Configuration

Most customization is done through the files in the "data" directory.

File| Purpose
"routes.json"| Route list
"config.json"| Application and probing settings
"language.json"| Interface text
"theme.json"| Visual theme
"announcement.json"| Footer and notice content

---

Deployment

Beacon can be deployed on any static hosting platform, including:

- GitHub Pages
- Cloudflare Pages
- Netlify
- Vercel
- Nginx
- Apache

HTTPS is recommended for production use.

---

Notes

Beacon runs entirely in the browser. Its probing results reflect the user's current browser and network environment.

When "no-cors" probing is used, the browser can confirm that a request was sent, but it cannot expose the full HTTP response status. For precise service health checks, a backend monitoring system is still required.

Beacon is intended to be a lightweight route selection portal, not a full observability or uptime monitoring platform.

---

Browser Compatibility

Beacon is designed for modern browsers with Fetch API support.

The latest versions of Chrome, Edge, Safari, and Firefox are recommended.

---

License

Beacon is released under the MIT License.

Copyright © 2026 Colton Flynn
