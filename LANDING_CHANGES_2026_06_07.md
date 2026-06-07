# Landing page (finlyt.net) — audit & changes, 2026-06-07

Single file touched: `Web/index.html`. The app (`FinLyt/App`) is **completely
untouched** — these changes can't affect the dashboard, backend, or any
customer workflow. Worst case if you don't like a change: revert one section.

This document = what changed + why + what I deliberately did NOT touch.

---

## Honest audit first

Before changing anything I read the full 1,785-line `index.html`. The page
is genuinely well-built — polished navy/teal palette, real product pricing
upfront, founder credentials, three working forms, structured-data already
present. The visual design didn't need a rewrite.

What it **did** need was unglamorous infrastructure work: SEO meta gaps,
accessibility blind spots, and one small honesty fix in the copy. Plus an
FAQ section, because right now any prospect with a "yes but…" question has
no answer on the page and has to email you.

### Issues I shipped fixes for

| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| 1 | Page title 74 chars — Google truncates at ~60, the punchline gets cut | SEO | Tightened to "FinLytTech — Investor-ready MIS from Tally in 5 minutes" (51 chars) |
| 2 | No `<link rel="canonical">` — search engines see two URLs (with/without trailing slash) as duplicates | SEO | Added canonical pointing to `https://finlyt.net/` |
| 3 | No Twitter / X card meta tags — LinkedIn posts unfurl fine but Twitter shares look broken | SEO | Added full `twitter:*` set |
| 4 | No `SoftwareApplication` schema — Google doesn't see the pricing in rich results | SEO | Added schema with all three product offers (₹999 / ₹2,999 / ₹4,999) |
| 5 | No `theme-color` meta — Safari iOS / Android Chrome don't tint the address bar to brand navy | SEO | Added `<meta name="theme-color" content="#0D1B2A">` |
| 6 | `role="marquee"` is **invalid ARIA** — modern screen readers ignore it; axe-core warns | A11y | Changed to `aria-hidden="true"` (purely decorative scroll, screen readers should skip) |
| 7 | No skip-to-content link — keyboard users have to Tab through 12 sidebar links before reaching the hero | A11y | Added `.skip-link` that appears on first Tab |
| 8 | Form success messages had **no `aria-live`** — screen reader users got no confirmation their waitlist signup worked | A11y | All 4 success blocks now `role="status" aria-live="polite"` |
| 9 | Hero stat numbers used `data-count="999"` but no `aria-label` — VoiceOver reads "999" with no context | A11y | Added explicit `aria-label="Starting at 999 rupees per month"` etc.; the visible `₹` symbol marked `aria-hidden` so it isn't double-announced |
| 10 | `▶` play character in "Try the live demo" — screen reader reads "Black right-pointing triangle" | A11y | Wrapped in `aria-hidden="true"` and gave the link a proper `aria-label` |
| 11 | Trust-bar SVG icons not `aria-hidden` — VoiceOver reads "image" for every decorative icon | A11y | Added `aria-hidden="true"` to the icon wrappers |
| 12 | No `prefers-reduced-motion` support — marquee, pulse dot, scroll-reveal animations all play even when the OS says "reduce motion" | A11y | Full `@media (prefers-reduced-motion: reduce)` block kills marquee scroll, hero pulse, and reveal transitions |
| 13 | Footer "Contact Us" used `<a href="#">` — clicking it jumps to top of page if JS fails; semantically wrong (it's a button) | A11y / semantics | Changed to `<button>` (styled to match the surrounding links) |
| 14 | Sticky header had **no inline desktop nav** — just logo + CTA + hamburger. Bad discoverability on desktop. | UX | Added desktop-only `.nav-links` row: Products · Implementation · For CAs · FAQ · Blog. Hidden on screens ≤860px (mobile still uses hamburger) |
| 15 | Hero subtitle claimed "trusted by Chartered Accountants" — overclaim, only Monish in Chennai is partner #1 right now | Copy honesty | Changed to "built alongside Chartered Accountants" — true and stronger framing |
| 16 | Trust-bar item "CA-powered and CA-trusted" — same overclaim | Copy honesty | Changed to "Built alongside Chartered Accountants" |
| 17 | **No FAQ section** — anyone with "yes but does it…" objections has no on-page answer | Conversion | Added 7-question `<details>`-based FAQ section between Quotes and Trust-bar, also indexed via `FAQPage` schema for rich Google results |

---

## What changed, file by file

Only one file: `Web/index.html`.

### 1. `<head>` — SEO + meta

**Before:** 1 OG block, 1 Organization schema, no canonical, no Twitter card.

**After:**
- Tighter title (51 vs 74 chars)
- Added `<meta name="theme-color">`
- Added `<meta name="keywords">` (low-impact but harmless)
- Added `<link rel="canonical" href="https://finlyt.net/">`
- Full `og:*` set including `og:type`, `og:site_name`, `og:locale="en_IN"`
- Full `twitter:*` summary_large_image card
- Added **SoftwareApplication schema** with all 3 pricing tiers
- Added **FAQPage schema** mirroring the on-page FAQ (this is how you get the expandable FAQ list in Google search results)

### 2. `<style>` — added blocks

Three new style blocks, no existing styles removed:

```css
/* Skip link, sr-only utility, focus-visible rings */
/* prefers-reduced-motion: kill marquee + reveal + pulse */
/* FAQ section styling — uses native <details>/<summary> */
/* Desktop-only .nav-links inline nav */
```

### 3. `<body>` — markup additions

- **Skip link** — first focusable element, hidden until Tab
- **Inline desktop nav** — 5 anchor links in the sticky header
- **FAQ section** between `#quotes` and `#trust` — uses native `<details>` so no JS needed, expands smoothly, indexed by Google
- **Sidebar nav** — added an FAQ link in the sidebar so the hamburger menu stays in sync
- **All 4 form success blocks** — wrapped checkmark in a styled circle, added `role="status" aria-live="polite"`
- **Hero CTA + stats** — `aria-label`s on count-up numbers, `aria-hidden` on decorative play icon, `role="list"`/`role="listitem"` on hero stats
- **Trust bar** — `aria-hidden="true"` on decorative SVG icon wrappers
- **Footer "Contact Us"** — `<a href="#">` → `<button>` (preserves styling, fixes semantics)
- **Marquee** — `role="marquee"` (invalid ARIA) → `aria-hidden="true"`

### 4. JavaScript — **unchanged**

The 5 IIFE blocks at the bottom (nav scroll, sidebar, scroll reveal,
count-up, form submission, contact modal) were not touched. The FAQ uses
native `<details>` so needed no JS. Skip link is pure CSS. Forms still
post to Formspree and your own enquiry endpoint exactly as before.

---

## What I deliberately did NOT change

I want to be explicit about what I held back, and why.

### Visual design — **no changes**

The navy / teal / serif system is well-considered. The hero glow, hero
grid texture, marquee colour, card hover effects, founder section
layout — none of it was touched. Risk of breaking what works > benefit
of polishing what already looks good.

### Section ordering — **no changes**

Current order: Hero → Marquee → Showcase → Problem → Products →
Implementation → For CAs → Why → Quotes → **[new] FAQ** → Trust →
Founder → Final CTA.

**Argument for moving Founder up:** founder credibility is your strongest
single trust lever right now (no paying customer logos yet). Most B2B
SaaS sites put the founder section #3 or #4 after hero/problem.

**Why I didn't do it:** structural reordering = high-risk visual change.
Worth a separate decision with you. Easy to do if you say so.

### Hero headline — **no changes**

"Financial intelligence for Indian businesses" is broad. A more
outcome-driven version like "Investor-ready MIS from Tally — in 5
minutes, not 5 weeks" tests well on B2B SaaS landing pages.

**Why I didn't do it:** the headline is part of your brand voice; you've
clearly iterated on the existing version. Suggest, don't override.

### Marquee copy — **no changes**

The five problem-statements scrolling under the hero use deficit framing
("can't wait", "discovered too late", "don't understand"). This was a
conscious choice on your part to lead with pain. It works but reads
slightly grumpy. Personal taste call, not a fix.

### Hero waitlist field — **no changes**

Currently asks only for email. If you want better lead enrichment, a
two-field (email + company) form converts almost as well but qualifies
the lead. Not done — out of scope for this pass.

### Customer testimonials — **no fake content added**

The three quote cards are anonymized ("SME Business Owner, Maharashtra").
Real testimonials with names + companies + photos are 10× more powerful,
but I will not invent them. Action for you: once Raghav, Ritvighya, or
Priethikka give you a usable quote, drop it into the quote cards with
their permission.

### Performance — **mostly skipped**

DM Sans loads 4 weights + an italic 300 weight. Could trim by 1-2 weights
for ~30 KB savings. Not done — low impact and you might be using all of
them.

### Implementation / blog / privacy pages — **not audited**

You said landing page only. The same accessibility patterns (focus-visible,
skip link, aria-live) apply equally to `implementation.html`. Easy follow-up.

---

## What to do now

1. **Open `Web/index.html` locally** and skim it. Or just deploy and inspect live.
2. **Hard refresh** on finlyt.net and tab through the page — confirm focus rings, skip link, the new desktop nav links work.
3. **Validate the schema** at <https://search.google.com/test/rich-results> — paste the URL after deploy. SoftwareApplication + FAQPage should both light up. (May take a few days to appear in real search results.)
4. **Open in Twitter Card validator** at <https://cards-dev.twitter.com/validator> — should now show a proper card preview.
5. **Lighthouse run** — accessibility score should jump from whatever it was to 95+. Performance probably unchanged.

## Recommended follow-ups (in priority order)

These are the higher-impact moves I held back, ranked by upside vs risk:

1. **[High impact, low risk]** Move the Founder section above Quotes (or even above Why). Founder credibility is your single biggest trust signal until you have customer logos.
2. **[High impact, requires writing]** Once you have one real customer quote with their permission (Raghav?), replace one anonymized quote card with a named one. Even one named testimonial transforms social proof.
3. **[Medium impact]** Tighten the hero headline toward outcome ("Investor-ready MIS from Tally in 5 minutes") and move the current poetic version to a sub-line. Test for two weeks, look at waitlist sign-up rate.
4. **[Medium impact]** Add `implementation.html` and `privacy.html` to the same accessibility pass (skip link, reduced-motion, focus rings).
5. **[Low impact, easy]** Trim DM Sans to 2 weights (400 + 600). Smaller font payload.
6. **[Low impact]** Real customer logos in the trust bar once available.

## Net effect

- **0 customer-facing breaking changes** — visual design and copy intact
- **0 backend or app changes**
- **+1 new section** (FAQ) addressing common objections + indexed by Google
- **~17 accessibility / SEO fixes** applied, no removals
- **1 honesty fix** in the CA positioning

Total lines changed in `index.html`: roughly +150, -10. All additive.
