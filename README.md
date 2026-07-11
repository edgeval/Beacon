# Beacon

Beacon is a lightweight, browser-based smart route selector.

It probes multiple HTTP and HTTPS endpoints directly from the user's browser, measures availability and latency, and recommends the best available route in real time.

Beacon is fully static. It requires no backend service, no database, and no build process.

---

## Features

- Browser-side route probing
- Automatic best-route selection
- Latency ranking with multiple samples
- CORS and no-cors probing support
- JSON-driven configuration
- Responsive interface
- Light and dark mode support
- Static deployment friendly

---

## Files

Beacon uses a simple static structure:

- `index.html` — main page and interface
- `engine.js` — route probing and scoring engine
- `data/routes.json` — route list
- `data/config.json` — application and probing settings
- `data/language.json` — interface text
- `data/theme.json` — visual theme
- `data/announcement.json` — footer and notice content
- `LICENSE` — MIT license

---

## Configuration

Most customization is done through the files in the `data` directory.

The most important file is `routes.json`, which defines the available routes.

Application behavior, probing options, latency levels, interface text, theme, and footer notices can also be adjusted through the JSON files in `data`.

---

## Deployment

Beacon can be deployed on any static hosting platform, including GitHub Pages, Cloudflare Pages, Netlify, Vercel, Nginx, or Apache.

HTTPS is recommended for production use.

---

## Notes

Beacon runs entirely in the browser. Its probing results reflect the user's current browser and network environment.

When `no-cors` probing is used, the browser can confirm that a request was sent, but it cannot expose the full HTTP response status.

Beacon is intended to be a lightweight route selection portal, not a full observability or uptime monitoring platform.

---

## Browser Compatibility

Beacon is designed for modern browsers with Fetch API support.

The latest versions of Chrome, Edge, Safari, and Firefox are recommended.

---

## License

Beacon is released under the MIT License.

Copyright © 2026 Colton Flynn
