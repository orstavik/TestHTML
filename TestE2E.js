import { myersDiff } from 'https://cdn.jsdelivr.net/gh/orstavik/mymy@v1/src/myerLifting2.js';

class WindowWrapper {
  constructor(win) {
    this.window = win;
  }

  document() {
    return this.window.document;
  }

  async navigate(selector) {
    this.window.document.querySelector(selector).click();
    await this.ready();
  }

  async click(selector, target) {
    const p = this.observeChange(target);
    queueMicrotask(_ => this.window.document.querySelector(selector).click());
    return p;
  }

  async goto(path) {
    this.window.location = path;
    await this.ready();
  }

  waitForEvent(type) {
    return new Promise(r => this.window.addEventListener(type, r, { once: true, capture: true }));
  }

  async observeChange(selector) {
    const target = this.window.document.querySelector(selector);
    let r;
    const p = new Promise(resolve => r = resolve);
    const mo = new MutationObserver(_ => { r(); mo.disconnect(); });
    mo.observe(target, {
      attributes: true,
      childList: true,
      subtree: true
    });
    await p;
    return target;
  }

  async ready(ms = 100) {
    await new Promise(r => setTimeout(r, ms));
    while (this.window.document.readyState !== 'complete')
      await new Promise(r => setTimeout(r, ms));
  }
}

const template = /*html*/`
<style>
  :host { display: flex; border-left: 5px solid lightgray; }
  :host([state="ok"]) { border-left-color: green; }
  :host([state="ok2"]) { border-left-color: blue; }
  :host([state="error"]) { border-left-color: red; }
  :host([state="running"]) { border-left-color: orange; }
  :host([state="ok"]) :is(#diff,#expected) { display: none; }
  span.added { text-decoration: underline red; }
  span.removed { text-decoration: line-through red; }
</style>
<slot></slot>
<button>testName</button>
<div id="diff"></div>
<pre id="result"></pre>
<pre id="expected"></pre>`;

export class TestHTMLe2e extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = template;
    this.button = this.shadowRoot.querySelector("button");
    this.result = this.shadowRoot.querySelector("#result");
    this.expected = this.shadowRoot.querySelector("#expected");
    this.diff = this.shadowRoot.querySelector("#diff");
    this.button.addEventListener("click", this.runTest.bind(this));
    const expected = this.querySelector("script[expected]")?.textContent;
    if (expected)
      this.expected.textContent = JSON.stringify(JSON.parse(expected), null, 2);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "name")
      return this.button.textContent = newValue;
    if (name === "auto" && newValue !== null)
      return this.runTest();
  }

  static get observedAttributes() {
    return ["name", "auto"];
  }

  static #moduleCache = {};
  static async importSrcOrText(script) {
    return script.src ?
      this.#moduleCache[script.src] ??= await import(script.src) :
      this.#moduleCache[script.textContent] ??=
      await import(URL.createObjectURL(new Blob([script.textContent], { type: "text/javascript" })));
  }

  async runTest() {
    const scriptEl = this.querySelector("script[test]");
    if (!scriptEl)
      return;
    this.setAttribute("state", "running");
    let result, win;
    try {
      const run = (await TestHTMLe2e.importSrcOrText(scriptEl)).default;
      const page = this.getAttribute("page") ?? "/";
      win = new WindowWrapper(window.open(page, '_blank'))
      await win.ready();
      result = await run(win);
    } catch (e) {
      result = e;
    }
    try { result = JSON.stringify(result, null, 2); } catch (e) { result = e.toString(); }
    this.shadowRoot.querySelector("#result").textContent = result;
    this.diffTest();
    if (this.getAttribute("state").startsWith("ok") || this.hasAttribute("always-close"))
      win?.window?.close();
  }

  diffTest() {
    if (this.expected.textContent == this.result.textContent)
      return this.setAttribute("state", "ok");
    let diffs = myersDiff(this.expected.textContent, this.result.textContent);
    diffs = diffs.map(([, , type, , value]) =>
      ({ type: type === "-" ? "added" : type === "+" ? "removed" : "", value }));
    this.diff.innerHTML = diffs
      .map(({ type, value }) => `<span class="${type}">${value}</span>`)
      .join("");
    if (!diffs.some(({ type, value }) => type && value.trim()))
      return this.setAttribute("state", "ok2");
    return this.setAttribute("state", "error");
  }
}

customElements.define("test-e2e", TestHTMLe2e);