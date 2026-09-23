const themeButtons = document.querySelectorAll("[data-theme-choice]");
const setTheme = (theme) => {
  if (theme !== "light" && theme !== "dark") return;
  document.documentElement.dataset.theme = theme;
  themeButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.themeChoice === theme));
  });
  const mobileViewport = window.matchMedia("(max-width: 800px)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll("[data-dark-src]").forEach((image) => {
    if (mobileViewport || (reducedMotion && image.classList.contains("planet-gif-source"))) return;
    const source = image.dataset[theme === "light" ? "lightSrc" : "darkSrc"] || image.dataset.darkSrc;
    const attribute = image.tagName === "SOURCE" ? "srcset" : "src";
    if (source && image.getAttribute(attribute) !== source) image.setAttribute(attribute, source);
  });
  try {
    localStorage.setItem("site-theme", theme);
  } catch {}
};

themeButtons.forEach((button) => {
  button.addEventListener("click", () => setTheme(button.dataset.themeChoice));
});
setTheme(document.documentElement.dataset.theme || "dark");

const flickerStars = document.querySelectorAll(".space .star-k, .space .star-l, .space .star-m");
if (flickerStars.length && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const flickerRandomStar = () => {
    const star = flickerStars[Math.floor(Math.random() * flickerStars.length)];
    star.classList.add("flicker");
    window.setTimeout(() => star.classList.remove("flicker"), 120);
    window.setTimeout(flickerRandomStar, 7500 + Math.random() * 5000);
  };
  window.setTimeout(flickerRandomStar, 3000 + Math.random() * 7000);
}

const musicPage = document.querySelector(".music-page");
if (musicPage) {
  const albumList = musicPage.querySelector("#album-reviews + ul");
  if (albumList) {
    const records = Array.from(albumList.children);
    for (let index = records.length - 1; index > 0; index--) {
      const otherIndex = Math.floor(Math.random() * (index + 1));
      [records[index], records[otherIndex]] = [records[otherIndex], records[index]];
    }
    records.forEach((record) => albumList.append(record));
  }

  const lightbox = document.createElement("dialog");
  lightbox.className = "cover-lightbox";
  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Close enlarged album cover");
  closeButton.textContent = "×";
  const enlargedCover = document.createElement("img");
  lightbox.append(closeButton, enlargedCover);
  document.body.append(lightbox);

  musicPage.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    const cover = link?.querySelector("img");
    if (!cover || link.closest("figure") || !link.closest("ul")) return;
    event.preventDefault();
    enlargedCover.src = link.href;
    enlargedCover.alt = cover.alt;
    lightbox.showModal();
  });
  closeButton.addEventListener("click", () => lightbox.close());
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) lightbox.close();
  });
  lightbox.addEventListener("close", () => enlargedCover.removeAttribute("src"));
  musicPage.querySelectorAll("ul img").forEach((image) => { image.loading = "lazy"; });
}

document.querySelectorAll(".markdown-content h2, .markdown-content h3, .markdown-content h4, .markdown-content h5, .markdown-content h6").forEach((heading, index) => {
  const level = Number(heading.tagName.slice(1));
  const title = heading.textContent.trim();
  const content = document.createElement("div");
  content.id = `fold-${heading.id || index}`;
  let sibling = heading.nextElementSibling;

  while (sibling) {
    const nextHeading = /^H([1-6])$/.exec(sibling.tagName);
    if (nextHeading && Number(nextHeading[1]) <= level) break;
    const nextSibling = sibling.nextElementSibling;
    content.append(sibling);
    sibling = nextSibling;
  }

  const toggle = document.createElement("button");
  toggle.className = "heading-toggle";
  toggle.type = "button";
  const initiallyExpanded = !(musicPage && heading.id === "story-of-the-album");
  toggle.textContent = initiallyExpanded ? "▾" : "▸";
  toggle.setAttribute("aria-expanded", String(initiallyExpanded));
  toggle.setAttribute("aria-controls", content.id);
  toggle.setAttribute("aria-label", `${initiallyExpanded ? "Collapse" : "Expand"} ${title}`);
  const label = document.createElement("span");
  label.className = "heading-text";
  while (heading.firstChild) label.append(heading.firstChild);
  heading.append(toggle, label);
  heading.after(content);
  content.hidden = !initiallyExpanded;

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    toggle.setAttribute("aria-label", `${expanded ? "Expand" : "Collapse"} ${title}`);
    toggle.textContent = expanded ? "▸" : "▾";
    content.hidden = expanded;
  });
});
