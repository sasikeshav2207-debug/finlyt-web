# finlyt-web — the FinLytTech marketing site

This repo **is** `finlyt.net`. Everything here is public-facing.

---

## 1. Deployment topology — read this first

FinLytTech spans three hosts, and it is easy to conflate them. Each domain has
exactly one host:

| Surface | Domain | Host | Repo | Local path |
|---|---|---|---|---|
| **Marketing site (this repo)** | `finlyt.net` | **GitHub Pages** | `sasikeshav2207-debug/finlyt-web` | `C:/Users/sasik/OneDrive/Trading/FinLyt/Web` |
| Dashboard app | `dashboard.finlyt.net` | Vercel (team `fin-lyt-s-projects`) | `sasikeshav2207-debug/finlyt-app` | `C:/Users/sasik/OneDrive/Trading/FinLyt/App` |
| Backend API | `finlyt-backend.onrender.com` | Render | part of `finlyt-app` | — |
| Shakti vertical | `shakti.finlyt.net` | GitHub Pages | `finlyt-shakti-web` | — |

**The load-bearing fact:** `finlyt.net` is served by **GitHub Pages**, from
branch `main`, path `/`. The `CNAME` file is what binds the domain. Namecheap
provides DNS only.

> Deploying this site to Vercel or Render does **not** change what `finlyt.net`
> serves. `vercel.json` and `render.yaml` exist as optional mirrors, backed by a
> `Gemfile` pinned to the `github-pages` gem so all three hosts build
> identically. They are mirrors, not the live path. **Never** repoint DNS or
> delete `CNAME` without being asked explicitly.

Pages build config: `build_type: legacy` (classic Jekyll). It ignores the
`Gemfile` and uses GitHub's own gem set — which is why the `Gemfile` is safe to
keep for the mirrors.

---

## 2. Deploying

```bash
./deploy.sh "commit message"    # validate → commit → push → wait → verify
./deploy.sh --check             # validate only, changes nothing
./deploy.sh --verify            # check the live site only
./deploy.sh --dry-run "msg"     # everything except the push
```

`deploy.sh` refuses to run if origin is not `finlyt-web`, if the branch is not
`main`, or if `CNAME` is not `finlyt.net`. It rebases on the remote first, then
re-validates, because the remote often has new blog posts pushed from the GitHub
web UI.

### Why validation is not optional

**There is no local Ruby or Jekyll on this machine.** The build only ever
happens on GitHub's servers after a push. A Liquid syntax error or a broken
permalink is therefore invisible until the site is already broken.

`tools/validate_site.py` is the substitute. It checks:

- YAML front matter present, with a `layout`
- Liquid tags balanced (`if`/`endif`, `for`/`endfor`, `{{ }}`)
- Every internal link resolves to a page that will actually exist
- Every `#anchor` exists on its target page
- Referenced assets exist on disk
- `CNAME` still says `finlyt.net`

Files **without** front matter (`privacy.html`, `terms.html`,
`implementation.html`) are copied verbatim by Jekyll and never see Liquid, so
they are exempt from the template checks. Do not "fix" `{{ }}` in them.

Run it directly with `python tools/validate_site.py`.

---

## 3. Site structure

One full-scroll page per nav item. The nav and footer live in **one** place —
`_layouts/finlyt.html` — so a link is never defined twice.

```
_layouts/finlyt.html     shell: head, nav, dropdowns, footer, script tags
_layouts/default.html    thin passthrough to finlyt (kept for compatibility)
_layouts/blog-list.html  /blog/ index
_layouts/post.html       individual article

index.html        /              Home
condition.html    /condition/    The Condition
products.html     /products/     MIS tiers · ERP · CED · API · sources
pricing.html      /pricing/
for-cas.html      /for-cas/      Partner programme · implementation · economics
why.html          /why/
founder.html      /founder/
faq.html          /faq/
contact.html      /contact/      all CTA anchors land here
blog.html         /blog/         Jekyll-generated from _posts/
privacy.html  terms.html  implementation.html   standalone, no front matter

assets/colors_and_type.css   design tokens + Google Fonts (source of truth)
assets/finlyt.css            shell, nav, buttons, responsive layer
assets/finlyt.js             nav dropdowns, mobile menu, home selector
assets/blog.css              article + list typography
tools/validate_site.py       pre-push checker
```

**Anchors are contracts.** The nav dropdowns deep-link into
`/products/#mis-essentials`, `#fin-ops`, `#forecasting`, `#capital-suite`,
`#erp`, `#ced`, `#api`, `#sources` and `/for-cas/#partner`, `#implementation`,
`#economics`. `/contact/` owns `#demo`, `#early-access`, `#enterprise`, `#erp`,
`#api`, `#partner`, `#deck`, `#roadmap`. Renaming any of these breaks the nav —
the validator will catch it.

---

## 4. Design system

The approved design is `FinLytTech Home - final.html` from the *Finlyt.net UI
Mockups* bundle. It was authored in a design-canvas tool, so page bodies are
**100% inline styles**. That is deliberate and preserved — do not refactor it
into classes.

Consequences:

- Inline styles beat any stylesheet, so the responsive layer in `finlyt.css`
  uses `!important` inside media queries. This is correct here, not sloppy.
- Grids carry a class (`g2` / `g3` / `g4` / `split`) purely so those media
  queries can collapse them. Add the right class to any new grid.
- Colours, type and spacing come from `colors_and_type.css` custom properties
  (`--brand-navy`, `--brand-emerald`, `--font-display`, `--r-xl`, …). Use the
  tokens; do not hard-code hex values outside SVG fills.

### Copy conventions

- **No emojis or decorative dingbats anywhere.** Plain text, SVG line icons, or
  coloured letter badges.
- Indian English, Indian number formats (`₹1.86 Cr`, `₹41,20,000`), IST.
- Numbers use `font-variant-numeric: tabular-nums` so columns align.
- Two removals were made deliberately and must stay gone: the hero roadmap
  kicker ("MIS, ERP, Custom Enterprise. Three products, one substrate. Aug
  2026") and all section eyebrows (the `§ 01 · …` series and "Provenance ·
  privacy · posture"). `deploy.sh --verify` asserts they have not returned.

---

## 5. Blog

Posts are Markdown or HTML in `_posts/`, named `YYYY-MM-DD-slug.md`, published
at `/blog/<slug>/` (date stripped by the `permalink` setting in `_config.yml`).

Front matter: `title`, `description`, `date`, `author`, `tags`, `image`
(cover, in `assets/posts/`). `layout` is applied automatically by the
`defaults` block in `_config.yml`.

The user often adds posts through the GitHub web UI, so **always `git fetch`
before starting work here** — `deploy.sh` does this for you.

---

## 6. Gotchas

- **OneDrive path.** The repo lives inside OneDrive. Sync can briefly lock
  files; if git reports a phantom modification, let sync settle and retry.
- **Line endings.** `core.autocrlf` rewrites LF to CRLF on checkout. The
  `warning: LF will be replaced by CRLF` noise on every `git add` is expected.
- **Windows Python paths.** `python` here is Windows Python, so it does not
  understand MSYS `/c/Users/...` paths. Use `C:/Users/...` in scripts.
- **Heredocs.** Large HTML/CSS heredocs through the Bash tool tend to break on
  quoting. Write files with the Write tool instead.
- **Legal pages.** `privacy.html` and `terms.html` are standalone documents on
  the previous visual design. They are functional and self-contained. Restyling
  them is a deliberate, separate task — not a side effect of a design change.
- **Contact form.** CTAs are prefilled `mailto:` links (`enquiry@`,
  `enterprise@`, `founder@finlyt.net`). There is no form backend yet.

---

## 7. Company facts

- **ACETRILLYTICS FINLYTTECH LLP** — LLPIN `ADA-4802`, PAN `ACPFA3922N`,
  TAN `PNEA62180G`, incorporated 2026-07-27. Use for real company data, never
  for demo tenants.
- Founder: **V. Sasidharan** — MBA, IIM Ahmedabad; 15+ years in corporate
  finance and FP&A; M&A and private equity; ex-Apollo, Garware, Ashok Leyland.
- Based in Chennai. Data hosted in the India region by default.
- Pricing: MIS Essentials ₹999, Fin Ops Intelligence ₹3,999, AI Cash Flow
  Forecasting ₹5,999 (all per month + GST, per company not per seat). Capital
  Suite is 2026 H2. ERP and CED are quoted.
- Trial: 30 days, no card, extra month for early sign-ups.
