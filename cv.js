const resume = document.querySelector(".resume");
const status = document.querySelector(".status");
const pause = document.querySelector("#pause");
const replay = document.querySelector("#replay");
const read = document.querySelector("#read");
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
  resume.style.setProperty("--crawl-duration", `${Math.max(90, resume.scrollHeight / 14)}s`);
  pause.textContent = "Pause";
  pause.disabled = false;
  pause.hidden = false;
  replay.hidden = false;
  read.textContent = "Read CV";
}

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
    read.textContent = "Play crawl";
    window.scrollTo(0, 0);
  } else {
    startCrawl();
  }
});
staticView.addEventListener("change", () => {
  if (staticView.matches) {
    if ([pause, replay, read].includes(document.activeElement)) document.querySelector(".controls a").focus();
    document.body.classList.remove("is-crawling", "is-paused");
    pause.hidden = true;
    replay.hidden = true;
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
