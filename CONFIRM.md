# To confirm before publishing

Everything on the site comes from the TeamUp README, docs/ARCHITECTURE.md, the 1.0 release notes and the owner's business model (one-time licence, updates and server care priced separately), except the items below.
Each one needs a yes, a real value, or removal.
On a local preview (localhost or file://) each placeholder has a dashed amber outline, so it is easy to find; the outline never shows on a published site.

## Book a demo and Get a quote

1. **`DEMO_URL`** at the top of `assets/js/main.js` is empty.
   Both buttons open the same form; "Get a quote" changes its heading and adds `Request: a quote` to the request.
   Until `DEMO_URL` is set, submitting says "We could not send this yet" (with a developer note on a local preview).
   Set it to a `mailto:` address (the visitor's email app opens with the form filled in, subject "TeamUp demo for ..." or "TeamUp quote for ...") or an `https:` booking page (it opens in a new tab with `?name=&email=`, plus `&intent=quote` for a quote).

## How you buy TeamUp (index.html, section `#buy`, and the FAQ)

2. The three parts, with no prices: a one-time licence for the company; updates priced separately ("quoted per release or as a plan", "no forced upgrades", "the version you have keeps running"); setup and maintenance by us or by the customer's IT, priced separately.
   Check that "No forced upgrades" and "the version you have keeps running" match what you will promise.

## Example amounts in the cost estimate (index.html, "One payment, or paying per person every month?")

3. **One-time licence: 10,000** (marked "example" and `<!-- CONFIRM -->`).
4. **Maintenance: 2,000 per year** (marked "example" and `<!-- CONFIRM -->`).
5. Other defaults: 50 people, 3 years, 15 per person per month for per-person tools, 60 per month for the server, in dollars.
   The estimate says these are examples, not prices, and links to Get a quote. Updates are left out of the sum, and the note says so.

## Customer figures on customers.html (marked `<!-- CONFIRM -->` and `data-confirm`)

6. **"40+ people in the morning stand-up"**: the real number of people in Cognecto's daily stand-up, or remove the card.
7. **"Nov 2026, on its own server since"**: the month Cognecto went live on its own TeamUp server.
8. **Using Cognecto's name at all**: the page heading is "Runs Cognecto every day" and the FAQ says Cognecto runs its working day on TeamUp 1.0. No logo, quote or person is used.

## Where the site will live

9. Canonical URLs, Open Graph image URLs, the JSON-LD `url`, `sitemap.xml` and `robots.txt` assume `https://himanshu-kr-jha.github.io/teamup-site/`.
    If the site gets its own domain, replace that prefix everywhere (`grep -rl "himanshu-kr-jha.github.io/teamup-site" .`).
    No page links to the TeamUp source repository any more.
