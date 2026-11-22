# To confirm before publishing

Everything on the site comes from the TeamUp README, docs/ARCHITECTURE.md and the v1.0.0 release notes, except the items below.
Each one needs a yes, a real value, or removal.
On a local preview (localhost or file://) each placeholder number has a dashed amber outline, so it is easy to find; the outline never shows on a published site.

## Book a demo

1. **`DEMO_URL`** at the top of `assets/js/main.js` is empty.
   Until it is set, submitting the demo form says "We could not send this yet" (with a developer note on a local preview).
   Set it to a `mailto:` address (the visitor's email app opens with the form filled in) or an `https:` booking page (it opens in a new tab with `?name=&email=` added).

## Customer figures on customers.html (marked `<!-- CONFIRM -->` and `data-confirm`)

2. **"40+ people in the morning stand-up"**: the real number of people in Cognecto's daily stand-up, or remove the card.
3. **"Nov 2026, on its own server since"**: the month Cognecto went live on its own TeamUp server.
4. **Using Cognecto's name at all**: the page heading is "Runs Cognecto every day" and the FAQ says Cognecto runs its working day on TeamUp. The wording follows the v1.0.0 release notes ("stand-ups every morning, dozens of people in calls, and the tasks and scrum that come out of them"). No logo, quote or person is used.

## Example numbers in the seat-cost estimate (index.html, "What would seats cost you?")

5. Defaults are 50 people, 15 per person per month for hosted tools, and 60 per month for the server, in dollars.
   They are labelled as an editable estimate, not a quote; change them if you prefer other starting values.

## Where the site will live

6. Canonical URLs, Open Graph image URLs, `sitemap.xml` and `robots.txt` assume `https://himanshu-kr-jha.github.io/teamup-site/`.
   If the site gets its own domain or another repository name, replace that prefix everywhere (`grep -rl "himanshu-kr-jha.github.io/teamup-site" .`).
