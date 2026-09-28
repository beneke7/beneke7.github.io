const themeButtons = document.querySelectorAll("[data-theme-choice]");
const space = document.querySelector(".space");
const planetArt = document.querySelector(".planet-art");
const planetGif = planetArt?.querySelector(".planet-gif");
const planetMotionButton = document.querySelector("[data-planet-motion]");
const planetAnimationAllowed = window.matchMedia("(min-width: 801px)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let planetMotionEnabled = false;
try {
  planetMotionEnabled = localStorage.getItem("planet-motion") === "true";
} catch {}

const updatePlanetGif = () => {
  if (!planetGif || !planetMotionButton) return;
  const theme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
  const source = planetGif.dataset[`${theme}Src`] || planetGif.dataset.darkSrc;
  if (planetGif.getAttribute("src") === source) return;
  planetArt.classList.remove("is-animated");
  planetMotionButton.setAttribute("aria-busy", "true");
  planetGif.dataset.activeSrc = source;
  planetGif.onload = () => {
    if (!planetMotionEnabled || planetGif.dataset.activeSrc !== source) return;
    planetArt.classList.add("is-animated");
    planetMotionButton.removeAttribute("aria-busy");
  };
  planetGif.onerror = () => {
    if (!planetMotionEnabled || planetGif.dataset.activeSrc !== source) return;
    planetMotionEnabled = false;
    try {
      localStorage.setItem("planet-motion", "false");
    } catch {}
    planetMotionButton.textContent = "▷";
    planetMotionButton.setAttribute("aria-pressed", "false");
    planetMotionButton.setAttribute("aria-label", "Start planet animation");
    planetMotionButton.removeAttribute("aria-busy");
    planetGif.removeAttribute("src");
  };
  planetGif.src = source;
  if (planetGif.complete && planetGif.naturalWidth) planetGif.onload();
};

const setPlanetMotion = (enabled) => {
  if (!planetMotionButton || !planetGif) return;
  planetMotionEnabled = enabled;
  try {
    localStorage.setItem("planet-motion", String(enabled));
  } catch {}
  planetMotionButton.textContent = enabled ? "Ⅱ" : "▷";
  planetMotionButton.setAttribute("aria-pressed", String(enabled));
  planetMotionButton.setAttribute("aria-label", `${enabled ? "Stop" : "Start"} planet animation`);
  if (enabled) {
    updatePlanetGif();
  } else {
    planetArt.classList.remove("is-animated");
    planetGif.removeAttribute("src");
    planetMotionButton.removeAttribute("aria-busy");
  }
};

const setTheme = (theme) => {
  if (theme !== "light" && theme !== "dark") return;
  document.documentElement.dataset.theme = theme;
  themeButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.themeChoice === theme));
  });
  const mobileViewport = window.matchMedia("(max-width: 800px)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll("[data-dark-src]").forEach((image) => {
    if (mobileViewport || image.classList.contains("planet-gif")) return;
    const source = image.dataset[theme === "light" ? "lightSrc" : "darkSrc"] || image.dataset.darkSrc;
    const attribute = image.tagName === "SOURCE" ? "srcset" : "src";
    if (source && image.getAttribute(attribute) !== source) image.setAttribute(attribute, source);
  });
  if (planetMotionEnabled && !mobileViewport && !reducedMotion) updatePlanetGif();
  try {
    localStorage.setItem("site-theme", theme);
  } catch {}
};

themeButtons.forEach((button) => {
  button.addEventListener("click", () => setTheme(button.dataset.themeChoice));
});
if (planetMotionButton) {
  if (!planetAnimationAllowed) {
    planetMotionButton.hidden = true;
  } else {
    planetMotionButton.addEventListener("click", () => setPlanetMotion(!planetMotionEnabled));
    if (planetMotionEnabled) setPlanetMotion(true);
  }
}
setTheme(document.documentElement.dataset.theme || "dark");

if (space?.dataset.planetGifs && planetAnimationAllowed) {
  window.addEventListener("load", () => {
    const theme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    const firstGif = planetGif?.dataset[`${theme}Src`] || planetGif?.dataset.darkSrc;
    const urls = [...new Set([firstGif, ...space.dataset.planetGifs.split("|")].filter(Boolean))];
    let index = 0;
    const preloadNext = () => {
      if (index >= urls.length) return;
      const image = new Image();
      image.fetchPriority = "low";
      image.onload = image.onerror = () => window.setTimeout(preloadNext, 0);
      image.src = urls[index++];
    };
    window.setTimeout(preloadNext, 500);
  }, { once: true });
}

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
  let albumList = musicPage.querySelector("#album-reviews")?.nextElementSibling;
  while (albumList && albumList.tagName !== "UL" && albumList.tagName !== "H2") {
    albumList = albumList.nextElementSibling;
  }
  if (albumList?.tagName !== "UL") albumList = null;
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
    const followingHeading = /^H([1-6])$/.exec(sibling.nextElementSibling?.tagName || "");
    if (sibling.tagName === "HR" && followingHeading && Number(followingHeading[1]) <= level) break;
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
