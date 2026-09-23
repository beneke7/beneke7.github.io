from datetime import date
from html import escape
from pathlib import Path
import hashlib
import os
import re
import shutil
import subprocess

ROOT = Path(__file__).resolve().parent
CONTENT = ROOT / "content"
NAV = (("About", "about"), ("Projects", "projects"), ("Blog", "blog"),
       ("Teaching", "teaching"), ("Music", "music"), ("Links", "links"))
PAGES = ("index", "about", "blog", "projects", "teaching", "music", "links")
PLANETS = {
    "original": "pixel-planet",
    "gas-giant": "gas-giant",
    "ice-world": "ice-world",
}


def cache_version():
    media = CONTENT / "media"
    media_files = media.rglob("*") if media.is_dir() else ()
    files = [ROOT / "style.css", ROOT / "site.js", *CONTENT.rglob("*.md"),
             *(path for path in media_files if path.is_file()),
             *(path for path in (ROOT / "assets").rglob("*") if path.is_file())]
    digest = hashlib.sha256()
    for path in sorted(files):
        digest.update(path.relative_to(ROOT).as_posix().encode())
        digest.update(path.read_bytes())
    return digest.hexdigest()[:12]


def read_document(path):
    text = path.read_text(encoding="utf-8")
    metadata = {}
    match = re.match(r"\A---\r?\n(.*?)\r?\n---\s*(.*)\Z", text, re.S)
    if match:
        for line in match.group(1).splitlines():
            key, separator, value = line.partition(":")
            if separator:
                metadata[key.strip()] = value.strip().strip("\"'")
        text = match.group(2)
    return metadata, text


def media_url(target, output):
    target = target.replace("\\", "/").lstrip("/")
    if not target.startswith("media/"):
        target = f"media/{target}"
    return relative_url(Path(target), output)


def convert_obsidian_syntax(text, output):
    def embed(match):
        value = match.group(1).strip()
        target, separator, label = value.partition("|")
        target = target.strip()
        label = label.strip() if separator else Path(target).stem
        url = target if target.startswith(("http://", "https://")) else media_url(target, output)
        return f"![{label}]({url})"

    text = re.sub(r"!\[\[([^\]]+)\]\]", embed, text)

    def link(match):
        value = match.group(1).strip()
        target, separator, label = value.partition("|")
        target = target.strip()
        label = label.strip() if separator else target
        if target.startswith(("http://", "https://", "#")):
            url = target
        else:
            target = target.removesuffix(".md")
            if target.startswith("posts/"):
                url = relative_url(Path("blog") / f"{Path(target).name}.html", output)
            elif target in PAGES:
                url = relative_url(Path(f"{target}.html"), output)
            else:
                return match.group(0)
        return f"[{label}]({url})"

    text = re.sub(r"(?<!!)\[\[([^\]]+)\]\]", link, text)

    def image_link(match):
        target = match.group(2)
        if target.startswith("media/"):
            target = relative_url(Path(target), output)
        return f"![{match.group(1)}]({target})"

    return re.sub(r"!\[([^\]]*)\]\(([^)\s]+)\)", image_link, text)


def convert_markdown(text, output):
    text = convert_obsidian_syntax(text, output)
    return subprocess.run(
        ["pandoc", "--from=markdown", "--to=html5", "--wrap=none"],
        input=text, text=True, capture_output=True, check=True,
    ).stdout


def copy_media():
    source = CONTENT / "media"
    if source.is_dir():
        shutil.copytree(source, ROOT / "media", dirs_exist_ok=True)


def document_title(metadata, markdown, fallback):
    if metadata.get("title"):
        return metadata["title"]
    heading = re.search(r"^#\s+(.+?)\s*#*\s*$", markdown, re.M)
    return heading.group(1) if heading else fallback.replace("-", " ").title()


def relative_url(target, output):
    return Path(os.path.relpath(ROOT / target, ROOT / output.parent)).as_posix()


def versioned_url(target, output, version):
    return escape(f"{relative_url(target, output)}?v={version}", quote=True)


def render_page(output, title, active, body, metadata, version):
    prefix = os.path.relpath(ROOT, ROOT / output.parent).replace(os.sep, "/")
    prefix = "" if prefix == "." else f"{prefix}/"
    nav_items = []
    for label, slug in NAV:
        current = ' aria-current="page"' if active == slug else ""
        nav_items.append(
            f'<a href="{versioned_url(Path(slug + ".html"), output, version)}"{current}>{label}</a>'
        )
    nav = "\n".join(nav_items)
    classes = ["space"]
    planet = metadata.get("planet", "")
    if planet in PLANETS:
        classes.extend(("planet-space", f"planet-{planet}"))
    elif metadata.get("stars") == "dim":
        classes.append("dim-stars")
    stars = "\n".join(f'<span class="pixel-star star-{letter}"></span>' for letter in "abcdefg")
    planet_markup = ""
    if planet in PLANETS:
        asset = PLANETS[planet]
        poster = Path("assets") / f"{asset}.png"
        planet_markup = f'''<img class="planet-gif" src="{versioned_url(Path('assets') / f'{asset}.gif', output, version)}" alt="">
    <picture><img src="{versioned_url(poster, output, version)}" alt=""></picture>'''
    html_title = title if active == "index" else f"{title} — Beneke’s corner of the web"
    document = f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#000000">
  <title>{escape(html_title)}</title>
  <link rel="stylesheet" href="{prefix}style.css?v={version}">
  <script src="{prefix}site.js?v={version}" defer></script>
</head>
<body>
  <div class="{' '.join(classes)}" aria-hidden="true">
    {stars}
    {planet_markup}
  </div>
  <nav class="top-nav" aria-label="Main navigation">
    {nav}
  </nav>
  <main class="markdown-content">
    {body}
  </main>
  <footer><small>vive la guerre éternelle — planets by <a href="https://github.com/Deep-Fold/PixelPlanets">PixelPlanets</a>.</small></footer>
</body>
</html>
'''
    document = "\n".join(line.rstrip() for line in document.splitlines()) + "\n"
    destination = ROOT / output
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(document, encoding="utf-8")


def build_posts(version):
    posts = []
    for source in (CONTENT / "posts").glob("*.md"):
        if source.name.startswith("_"):
            continue
        match = re.match(r"(\d{4}-\d{2}-\d{2})-.+", source.stem)
        if not match:
            raise ValueError(f"Blog post must be named YYYY-MM-DD-slug.md: {source.name}")
        metadata, markdown = read_document(source)
        published = date.fromisoformat(metadata.get("date", match.group(1)))
        title = document_title(metadata, markdown, source.stem)
        output = Path("blog") / f"{source.stem}.html"
        body = convert_markdown(markdown, output)
        if not re.search(r"<h1\b", body):
            body = f"<h1>{escape(title)}</h1>\n{body}"
        render_page(output, title, "blog", body, {"stars": "dim"}, version)
        posts.append((published, title, output))
    generated = {output.name for _, _, output in posts}
    for stale in (ROOT / "blog").glob("*.html"):
        if stale.name not in generated:
            stale.unlink()
    return sorted(posts, reverse=True)


def main():
    if not shutil.which("pandoc"):
        raise SystemExit("Pandoc is required to build the site.")
    copy_media()
    version = cache_version()
    posts = build_posts(version)
    for slug in PAGES:
        source = CONTENT / f"{slug}.md"
        metadata, markdown = read_document(source)
        output = Path(f"{slug}.html")
        body = convert_markdown(markdown, output)
        if slug == "blog" and posts:
            links = "\n".join(
                f'<li><time datetime="{published.isoformat()}">{published.isoformat()}</time> '
                f'<a href="{versioned_url(output, Path("blog.html"), version)}">{escape(title)}</a></li>'
                for published, title, output in posts
            )
            body += f"\n<section class=\"post-list\"><h2>Posts</h2><ul>{links}</ul></section>"
        title = document_title(metadata, markdown, slug)
        render_page(output, title, slug, body, metadata, version)
    print(f"Built {len(PAGES)} pages and {len(posts)} blog posts.")


if __name__ == "__main__":
    main()
