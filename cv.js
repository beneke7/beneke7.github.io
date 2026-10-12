const resume = document.querySelector(".resume");
const status = document.querySelector(".status");
const pause = document.querySelector("#pause");
const replay = document.querySelector("#replay");
const read = document.querySelector("#read");
const scrollControl = document.querySelector("#scroll-control");
const position = document.querySelector("#position");
const music = document.querySelector("#music");
const soundtrack = document.querySelector("#soundtrack");
const staticView = window.matchMedia("(max-width: 800px), (prefers-reduced-motion: reduce)");

function addText(parent, tag, text, className) {
  if (!text) return;
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  parent.append(element);
}

function renderResume(data) {
  if (typeof data?.name !== "string" || !Array.isArray(data.sections) ||
      !data.sections.every(section => typeof section?.title === "string" &&
        Array.isArray(section.paragraphs) && section.paragraphs.every(paragraph => typeof paragraph === "string"))) {
    throw new Error("The CV needs a name and sections.");
  }
  resume.replaceChildren();
  addText(resume, "p", "Curriculum vitae", "kicker");
  addText(resume, "h1", data.name);
  addText(resume, "p", data.location, "contact");
  for (const section of data.sections) {
    const container = document.createElement("section");
    addText(container, "h2", section.title);
    for (const paragraph of section.paragraphs) addText(container, "p", paragraph);
    resume.append(container);
  }
}

function startCrawl() {
  document.body.classList.remove("is-crawling", "is-paused");
  void resume.offsetHeight;
  document.body.classList.add("is-crawling");
  resume.style.setProperty("--crawl-duration", `${Math.max(70, resume.scrollHeight / 18)}s`);
  pause.textContent = "Pause";
  pause.disabled = false;
  pause.hidden = false;
  replay.hidden = false;
  read.textContent = "Read CV";
  scrollControl.hidden = false;
  position.value = 0;
}

function seekCrawl(time) {
  if (!document.body.classList.contains("is-crawling")) return;
  const animation = resume.getAnimations()[0];
  if (!animation) return;
  document.body.classList.add("is-paused");
  const duration = animation.effect.getComputedTiming().duration;
  animation.currentTime = Math.max(0, Math.min(duration, time));
  position.value = 100 * animation.currentTime / duration;
  pause.disabled = false;
  pause.textContent = "Resume";
}

position.addEventListener("input", () => {
  const animation = resume.getAnimations()[0];
  if (animation) seekCrawl(position.value / 100 * animation.effect.getComputedTiming().duration);
});
document.querySelector(".stage").addEventListener("wheel", event => {
  const animation = resume.getAnimations()[0];
  if (!document.body.classList.contains("is-crawling") || !animation || event.ctrlKey) return;
  event.preventDefault();
  const pixels = event.deltaY * (event.deltaMode === 1 ? 20 : event.deltaMode === 2 ? window.innerHeight : 1);
  seekCrawl((animation.currentTime || 0) + pixels * 35);
}, { passive: false });
window.setInterval(() => {
  if (scrollControl.hidden) return;
  const animation = resume.getAnimations()[0];
  if (animation) position.value = 100 * (animation.currentTime || 0) / animation.effect.getComputedTiming().duration;
}, 250);

music.addEventListener("toggle", () => {
  if (music.open) {
    soundtrack.src = "https://www.youtube-nocookie.com/embed/e9lapdvLSGw?autoplay=1&rel=0";
  } else {
    soundtrack.removeAttribute("src");
  }
});

pause.addEventListener("click", () => {
  const paused = document.body.classList.toggle("is-paused");
  pause.textContent = paused ? "Resume" : "Pause";
});
replay.addEventListener("click", startCrawl);
resume.addEventListener("animationend", event => {
  if (event.animationName !== "crawl" || !document.body.classList.contains("is-crawling")) return;
  if (document.activeElement === pause) replay.focus();
  pause.disabled = true;
  pause.textContent = "Finished";
});
read.addEventListener("click", () => {
  if (document.body.classList.contains("is-crawling")) {
    document.body.classList.remove("is-crawling", "is-paused");
    pause.hidden = true;
    replay.hidden = true;
    scrollControl.hidden = true;
    read.textContent = "Play crawl";
    window.scrollTo(0, 0);
  } else {
    startCrawl();
  }
});
staticView.addEventListener("change", () => {
  if (staticView.matches) {
    if ([pause, replay, read, position].includes(document.activeElement)) document.querySelector(".controls a").focus();
    document.body.classList.remove("is-crawling", "is-paused");
    pause.hidden = true;
    replay.hidden = true;
    scrollControl.hidden = true;
  }
  read.hidden = staticView.matches || !resume.childElementCount;
  read.textContent = "Play crawl";
});

fetch("cv/resume.json")
  .then(response => {
    if (!response.ok) throw new Error("The CV is unavailable.");
    return response.json();
  })
  .then(data => {
    renderResume(data);
    status.hidden = true;
    read.hidden = staticView.matches;
    if (!staticView.matches) startCrawl();
  })
  .catch(() => {
    status.textContent = "The CV could not be loaded. Please return to About and try again later.";
  });
