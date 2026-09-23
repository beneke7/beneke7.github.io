const planetSpace = document.querySelector(".planet-space");
const planetVideo = planetSpace?.querySelector(".planet-video");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

if (planetSpace && !reducedMotion) {
  const clockKey = "pixel-planet-started-at";
  let startedAt = Number(sessionStorage.getItem(clockKey));
  if (!Number.isFinite(startedAt) || startedAt <= 0 || startedAt > Date.now()) {
    startedAt = Date.now();
    sessionStorage.setItem(clockKey, String(startedAt));
  }
  const phase = (Date.now() - startedAt) % 300000;
  (planetVideo || planetSpace.querySelector("picture")).style.animationDelay = `${-phase / 1000}s`;

  if (planetVideo) {
    const rotationSpeed = Number(planetVideo.dataset.speed) || 1;
    const elapsed = (Date.now() - startedAt) / 1000 * rotationSpeed;
    const startPlanet = () => {
      planetVideo.classList.add("is-ready");
      planetVideo.play().catch(() => {});
    };

    planetVideo.addEventListener("loadedmetadata", () => {
      if (Number.isFinite(planetVideo.duration) && planetVideo.duration > 0) {
        const resumeAt = elapsed % planetVideo.duration;
        if (resumeAt > 0.05) {
          planetVideo.addEventListener("seeked", startPlanet, { once: true });
          planetVideo.currentTime = resumeAt;
          return;
        }
      }
      startPlanet();
    }, { once: true });

    planetVideo.addEventListener("error", () => planetVideo.classList.add("is-error"), { once: true });
    planetVideo.playbackRate = rotationSpeed;
    planetVideo.src = planetVideo.dataset.src;

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        planetVideo.pause();
        return;
      }
      if (!Number.isFinite(planetVideo.duration) || planetVideo.duration <= 0) return;
      const resumeAt = ((Date.now() - startedAt) / 1000 * rotationSpeed) % planetVideo.duration;
      if (Math.abs(planetVideo.currentTime - resumeAt) > 0.25) {
        planetVideo.addEventListener("seeked", startPlanet, { once: true });
        planetVideo.currentTime = resumeAt;
        return;
      }
      startPlanet();
    });
  }
}

document.querySelectorAll(".markdown-content h2, .markdown-content h3").forEach((heading, index) => {
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

  if (!content.children.length) return;

  const toggle = document.createElement("button");
  toggle.className = "heading-toggle";
  toggle.type = "button";
  toggle.textContent = "▾";
  toggle.setAttribute("aria-expanded", "true");
  toggle.setAttribute("aria-controls", content.id);
  toggle.setAttribute("aria-label", `Collapse ${title}`);
  heading.prepend(toggle);
  heading.after(content);

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    toggle.setAttribute("aria-label", `${expanded ? "Expand" : "Collapse"} ${title}`);
    toggle.textContent = expanded ? "▸" : "▾";
    content.hidden = expanded;
  });
});
