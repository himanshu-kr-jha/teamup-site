# TeamUp website

The marketing site for TeamUp: plain HTML, CSS and JavaScript with no build step, so it works from any static host and from a sub-path such as `/teamup-site/`.
No trackers, analytics or cookies; everything is served from this folder.

## Preview

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173/.
Before publishing, go through [CONFIRM.md](CONFIRM.md).

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | Home page, with the interactive demos |
| `customers.html` | Cognecto and the five team types |
| `404.html` | Not found page, which works at any depth on GitHub Pages |
| `assets/js/main.js` | `DEMO_URL` for "Book a demo" and "Get a quote", theme, video loading, dialogs |
| `assets/js/demos.js` | Chat, call, meeting notes, scrum, calendar, data-flow demos and the one-payment cost estimate |
| `assets/video/` | Product recordings, re-encoded by `tools/encode-videos.sh` |
| `tools/review.cjs` | Screenshots every section at 375, 768 and 1440 in both themes, checks for sideways scrolling and console errors |
| `tools/og.cjs` | Renders `tools/og.html` into the social card `assets/img/og.png` |

All product screens show the made-up company Nimbus Labs from the demo server.
The tools need ffmpeg and the `playwright` package (`PW=/path/to/playwright node tools/review.cjs`).
