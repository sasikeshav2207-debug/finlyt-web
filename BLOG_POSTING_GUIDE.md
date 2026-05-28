# How to publish a blog post on finlyt.net

The blog is built with Jekyll (the same engine GitHub Pages uses natively). To
publish a new post, you create a single Markdown file in `_posts/` and push it
to `main`. GitHub Pages builds and deploys the site within ~1 minute.

You do **not** need to install anything. Everything happens in the GitHub web
editor or your usual git workflow.

---

## Quick start (re-post a LinkedIn article in 3 minutes)

1. Go to your LinkedIn article, click **More → Edit**, and copy the text.
   (Plain text or rich text is fine — Markdown also accepts ordinary text.)
2. In the `finlyt-web` repo, open the `_posts/` folder and click **Add file → Create new file**.
3. Name the file using this pattern (the date is required and goes in the filename):
   ```
   _posts/2026-06-15-five-mis-mistakes-indian-smes-make.md
   ```
   - `YYYY-MM-DD-` is the publish date.
   - The rest is the URL slug — lowercase, words separated by hyphens.
   - Keep it short and descriptive (this becomes the URL: `finlyt.net/blog/five-mis-mistakes-indian-smes-make/`).
4. Paste this template at the top, fill in the details, then paste your article below the second `---`:

   ```markdown
   ---
   title: "Five MIS mistakes Indian SMEs make"
   description: "A short summary in one sentence — this becomes the meta description Google shows in search results."
   date: 2026-06-15 09:00:00 +0530
   tags: [mis, sme, finance]
   linkedin: "https://www.linkedin.com/pulse/your-article-url"
   ---

   Your article content here, in Markdown.

   ## A section heading

   A paragraph. **Bold** and *italic* work the obvious way.

   - bullet one
   - bullet two

   > A pull quote shows up as a teal-accented blockquote.

   [A link](https://finlyt.net) looks like this.
   ```

5. Commit the file (the default "Create file via web" message is fine).
6. Wait ~60 seconds. The post is live at `https://finlyt.net/blog/your-slug/`.

That's it.

---

## What each front-matter field does

The block between the two `---` lines at the top of the file is called the
"front matter." Only `title` and `date` are strictly required.

| Field | Required | Purpose |
|---|---|---|
| `title` | yes | Headline. Also used in `<title>` and Open Graph. |
| `description` | recommended | One-sentence summary. Used as meta description (Google SERP) + LinkedIn/Twitter card preview. **Keep under ~155 characters.** |
| `date` | yes | When the post was published. Format `YYYY-MM-DD HH:MM:SS +0530`. |
| `tags` | optional | Short list of topic tags (lowercase). Used for the chips on each post and for "related reads." |
| `linkedin` | optional | If this is a re-post of a LinkedIn article, paste the LinkedIn URL here. Adds an "Originally published on LinkedIn" credit at the bottom. |
| `image` | optional | A wider image for social previews. Path like `/assets/posts/my-image.jpg`. Upload the image to `assets/posts/` first. |

---

## Markdown cheat sheet

```markdown
## Heading 2
### Heading 3

A paragraph with **bold**, *italic*, and `inline code`.

- bullet
- bullet

1. numbered
2. numbered

> A blockquote.

[Link text](https://finlyt.net)

![Image alt text](/assets/posts/my-image.jpg)

| Col A | Col B |
|---|---|
| 1     | 2     |
```

You can also paste raw HTML where Markdown isn't expressive enough (e.g.
embedding a YouTube `<iframe>`).

---

## Where things live

```
Web/
├── _config.yml              ← site-wide settings (rarely edited)
├── _layouts/                ← templates (don't edit unless redesigning)
│   ├── default.html         ← nav + footer wrapper
│   ├── post.html            ← single-post layout
│   └── blog-list.html       ← /blog/ index layout
├── _posts/                  ← ← ← YOUR POSTS GO HERE
│   └── YYYY-MM-DD-slug.md
├── assets/
│   ├── blog.css             ← blog styling (matches the main site)
│   └── posts/               ← put post images here
├── blog.html                ← the /blog/ landing page
├── index.html               ← the main /index page (unchanged)
├── privacy.html, terms.html ← unchanged
└── CNAME                    ← finlyt.net
```

---

## SEO — what's already taken care of

Every post automatically gets:

- A proper `<title>` and `<meta description>` (from front-matter).
- **Open Graph** + Twitter card tags so LinkedIn / Twitter / WhatsApp link previews look right.
- **JSON-LD** structured data (BlogPosting schema) so Google understands it's an article.
- A **canonical URL** so duplicate posting on LinkedIn doesn't hurt rankings.
- An entry in `sitemap.xml` (auto-submitted to Google).
- An entry in `feed.xml` (RSS).
- A clean URL: `finlyt.net/blog/your-slug/`.

The first time you publish, **submit `https://finlyt.net/sitemap.xml` to**
[**Google Search Console**](https://search.google.com/search-console) **and**
[**Bing Webmaster Tools**](https://www.bing.com/webmasters). After that, new
posts are crawled automatically.

---

## Re-using a LinkedIn article verbatim

When you re-post a LinkedIn article here, do these three things to protect SEO:

1. **Set `linkedin:`** in the front matter (adds the "originally published on LinkedIn" credit).
2. **Optionally update the article on LinkedIn** to add at the top: "This piece is mirrored on the [Finlyt blog](https://finlyt.net/blog/your-slug/)." This nudges Google to treat *your* domain as the canonical source.
3. **Wait a few days before re-posting** to LinkedIn so Google indexes the finlyt.net version first.

---

## Previewing locally (optional)

If you want to preview a post before pushing, install Ruby + Jekyll once, then:

```bash
cd Web
bundle install      # only the first time
bundle exec jekyll serve
```

Visit `http://localhost:4000/blog/`. You don't need this — pushing directly to
`main` and letting GitHub Pages build is the simpler workflow.
