const themeButtons = document.querySelectorAll("[data-theme-choice]");
const setTheme = (theme) => {
  if (theme !== "light" && theme !== "dark") return;
  document.documentElement.dataset.theme = theme;
  themeButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.themeChoice === theme));
  });
  document.querySelectorAll("[data-dark-src]").forEach((image) => {
    const source = image.dataset[theme === "light" ? "lightSrc" : "darkSrc"];
    if (source && image.getAttribute("src") !== source) image.src = source;
  });
  try {
    localStorage.setItem("site-theme", theme);
  } catch {}
};

themeButtons.forEach((button) => {
  button.addEventListener("click", () => setTheme(button.dataset.themeChoice));
});
setTheme(document.documentElement.dataset.theme || "dark");

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
  toggle.textContent = "▾";
  toggle.setAttribute("aria-expanded", "true");
  toggle.setAttribute("aria-controls", content.id);
  toggle.setAttribute("aria-label", `Collapse ${title}`);
  const label = document.createElement("span");
  label.className = "heading-text";
  while (heading.firstChild) label.append(heading.firstChild);
  heading.append(toggle, label);
  heading.after(content);

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    toggle.setAttribute("aria-label", `${expanded ? "Expand" : "Collapse"} ${title}`);
    toggle.textContent = expanded ? "▸" : "▾";
    content.hidden = expanded;
  });
});
