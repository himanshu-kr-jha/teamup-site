# TeamUp website

The marketing site for TeamUp: plain HTML, CSS and JavaScript with no build step, so it works from any static host and from a sub-path such as `/teamup-site/`.
No trackers, analytics or cookies; everything is served from this folder.

## Preview

```bash
python3 -m http.server 4174
```

Then open http://localhost:4174/.
This is the second design, on the `redesign` branch; [INSPIRATION.md](INSPIRATION.md) says where its ideas come from.
Before publishing, go through [CONFIRM.md](CONFIRM.md).

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | Home page, with the interactive demos |
| `customers.html` | Cognecto and the five team types |
| `404.html` | Not found page, which works at any depth on GitHub Pages |
| `assets/js/main.js` | `DEMO_URL`, the booking page behind "Book a demo" and "Get a quote" (also in the HTML links), theme, the product window's tabs, video loading |
| `assets/js/demos.js` | Chat, call, meeting notes, scrum, calendar and data-flow demos, and the per-person cost estimate |
| `assets/video/` | Product recordings, re-encoded by `tools/encode-videos.sh` |
| `tools/review.cjs` | Screenshots every section at 375, 768 and 1440 in both themes, checks eight widths for sideways scrolling, in-page links, console errors and drives each demo |
| `tools/og.cjs` | Renders `tools/og.html` into the social card `assets/img/og.png` |

All product screens show the made-up company Nimbus Labs from the demo server.
The tools need ffmpeg and the `playwright` package (`PW=/path/to/playwright node tools/review.cjs`).
