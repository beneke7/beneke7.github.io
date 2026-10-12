const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "cv.js"), "utf8");
const html = fs.readFileSync(path.join(root, "cv.html"), "utf8");
const data = JSON.parse(fs.readFileSync(path.join(__dirname, "resume.json"), "utf8"));

class Element {
  constructor(tag = "div") {
    this.tag = tag;
    this.children = [];
    this.events = {};
    this.hidden = false;
    this.textContent = "";
    this.scrollHeight = 1400;
    this.style = { setProperty: (name, value) => { this[name] = value; } };
    const classes = new Set();
    this.classList = {
      contains: name => classes.has(name),
      add: (...names) => names.forEach(name => classes.add(name)),
      remove: (...names) => names.forEach(name => classes.delete(name)),
      toggle: name => classes.has(name) ? (classes.delete(name), false) : (classes.add(name), true),
    };
  }
  append(...items) { this.children.push(...items); }
  replaceChildren() { this.children = []; }
  get childElementCount() { return this.children.length; }
  addEventListener(name, callback) { this.events[name] = callback; }
}

async function setup({ mobile = false, ok = true, value = data, offline = false } = {}) {
  const elements = Object.fromEntries([".resume", ".status", "#pause", "#replay", "#read", ".controls a"].map(key => [key, new Element()]));
  for (const id of ["pause", "replay", "read"]) elements[`#${id}`].hidden = true;
  const body = new Element();
  const document = { body, activeElement: body, querySelector: key => elements[key], createElement: tag => new Element(tag) };
  for (const element of Object.values(elements)) element.focus = () => { document.activeElement = element; };
  const media = { matches: mobile, addEventListener(name, callback) { this[name] = callback; } };
  let scrolled = false;
  const context = vm.createContext({
    document,
    window: { matchMedia: () => media, scrollTo: () => { scrolled = true; } },
    fetch: async url => {
      assert.equal(url, "cv/resume.json");
      if (offline) throw new Error("offline");
      return { ok, json: async () => value };
    },
  });
  vm.runInContext(source, context);
  await new Promise(resolve => setImmediate(resolve));
  return { elements, body, media, document, scrolled: () => scrolled };
}

const text = element => element.textContent + element.children.map(text).join(" ");
async function check() {
  for (const id of ["pause", "replay", "read"]) assert.match(html, new RegExp(`id="${id}" hidden`));
  const desktop = await setup();
  const { elements, body, media, document } = desktop;
  assert.equal(elements[".status"].hidden, true);
  for (const section of data.sections) for (const paragraph of section.paragraphs) assert.ok(text(elements[".resume"]).includes(paragraph));
  assert.equal(body.classList.contains("is-crawling"), true);
  for (const id of ["pause", "replay", "read"]) assert.equal(elements[`#${id}`].hidden, false);
  elements["#pause"].events.click();
  assert.equal(body.classList.contains("is-paused"), true);
  assert.equal(elements["#pause"].textContent, "Resume");
  elements["#pause"].events.click();
  assert.equal(body.classList.contains("is-paused"), false);
  assert.equal(elements["#pause"].textContent, "Pause");
  elements["#pause"].events.click();
  elements["#replay"].events.click();
  assert.equal(body.classList.contains("is-paused"), false);
  elements["#pause"].focus();
  elements[".resume"].events.animationend({ animationName: "unrelated" });
  assert.equal(elements["#pause"].disabled, false);
  elements[".resume"].events.animationend({ animationName: "crawl" });
  assert.equal(elements["#pause"].disabled, true);
  assert.equal(elements["#pause"].textContent, "Finished");
  assert.equal(document.activeElement, elements["#replay"]);
  elements["#replay"].events.click();
  assert.equal(elements["#pause"].disabled, false);
  elements["#read"].focus();
  elements["#read"].events.click();
  assert.equal(body.classList.contains("is-crawling"), false);
  assert.equal(desktop.scrolled(), true);
  assert.equal(elements["#pause"].hidden, true);
  assert.equal(elements["#replay"].hidden, true);
  assert.equal(elements["#read"].textContent, "Play crawl");
  assert.equal(document.activeElement, elements["#read"]);
  elements["#read"].events.click();
  assert.equal(body.classList.contains("is-crawling"), true);
  elements["#pause"].events.click();
  media.matches = true;
  media.change();
  assert.equal(body.classList.contains("is-crawling"), false);
  assert.equal(body.classList.contains("is-paused"), false);
  for (const id of ["pause", "replay", "read"]) assert.equal(elements[`#${id}`].hidden, true);
  assert.equal(document.activeElement, elements[".controls a"]);
  media.matches = false;
  media.change();
  assert.equal(elements["#read"].hidden, false);
  assert.equal(elements["#read"].textContent, "Play crawl");
  elements["#read"].events.click();
  assert.equal(body.classList.contains("is-crawling"), true);
  const staticResult = await setup({ mobile: true });
  assert.equal(staticResult.body.classList.contains("is-crawling"), false);
  for (const id of ["pause", "replay", "read"]) assert.equal(staticResult.elements[`#${id}`].hidden, true);
  for (const options of [{ ok: false }, { offline: true }, { value: null }, { value: { name: "Incomplete", sections: [{ title: "Work" }] } }]) {
    const failed = await setup(options);
    assert.match(failed.elements[".status"].textContent, /could not be loaded/);
    assert.equal(failed.elements[".resume"].childElementCount, 0);
    failed.media.matches = true;
    failed.media.change();
    failed.media.matches = false;
    failed.media.change();
    assert.equal(failed.elements["#read"].hidden, true);
  }
  const unsafe = await setup({ mobile: true, value: { ...data, name: "<img src=x onerror=alert(1)>", phone: "PRIVATE PHONE", address: "PRIVATE ADDRESS" } });
  assert.ok(text(unsafe.elements[".resume"]).includes("<img src=x onerror=alert(1)>"));
  assert.doesNotMatch(text(unsafe.elements[".resume"]), /PRIVATE/);
  console.log("CV self-check passed: rendering, controls, focus, animation end, static transitions, failures, safe text, privacy.");
}
check().catch(error => { console.error(error); process.exitCode = 1; });
