#!/bin/zsh
set -euo pipefail

ROOT="${0:A:h:h}"
cd "$ROOT"
export PATH="/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"

if ! git diff --cached --quiet; then
  print -u2 "Refusing to publish while the index already has staged changes."
  exit 1
fi

/opt/homebrew/bin/python3 build.py
git add -- content assets style.css site.js build.py .gitignore scripts com.beneke.site-morning.plist
git reset -- content/.obsidian
find . -maxdepth 1 -name '*.html' -print0 | xargs -0 git add --
git add -u -- '*.html'
[[ -d blog ]] && git add -- blog
[[ -d media ]] && git add -- media

git diff --cached --quiet && exit 0
git commit -m "Morning site update $(date +%F)"
git push origin main
