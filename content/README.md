# Site content

Open this folder as an Obsidian vault. Edit the Markdown pages here, then run `python3 build.py` from the repository root to regenerate the HTML served by GitHub Pages. Local generation requires Pandoc.

The root `.html` files and `blog/` pages are generated output; edit the Markdown sources instead. Markdown and generated HTML use UTF-8, so Hungarian characters such as `áéíóöőúüű` can be typed directly. Pages default to English; add `lang: hu` to frontmatter on Hungarian-language pages for language-aware pronunciation and hyphenation.
`about.md` generates the site root (`index.html`); there is no separate index page.

Use `#` through `######` for titles and section headings. Create a post as `posts/YYYY-MM-DD-short-title.md`, starting with:

```markdown
---
title: Post title
---
# Post title
```

The date in the filename controls the post date and ordering; an optional `date: YYYY-MM-DD` frontmatter value must be a real ISO date, not the placeholder. Posts are listed automatically on the Blog page and each gets its own HTML page. Put figures in `media/` and use `![caption](media/file.png)` or `![[file.png]]`; raw HTML figures in posts use paths like `../media/file.png`. Cross-link site pages with `[[Music]]`, `[[Projects|my projects]]`, or `[[music.md]]`; link to a post by its filename slug or title, such as `[[2026-09-25-slug]]`, and the post's title is used as the link text. Build from the repository root with `python3 build.py`.

For Music, add one list item per album: `- ![[cover.jpg|Cover of album]] **Artist — [Album](URL).** One-sentence review.` Keep the image and text in the same item so the cover floats beside its review. Click a cover to enlarge it; album reviews shuffle each time the page loads.

Use `$...$` for inline math and `$$...$$` for display math; MathJax typesets both in New Computer Modern.
