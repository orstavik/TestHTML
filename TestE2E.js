import { myersDiff } from 'https://cdn.jsdelivr.net/gh/orstavik/mymy@v1/src/myerLifting2.js';

class WindowWrapper {
  constructor(win) {
    this.window = win;
  }

  document() {
    return this.window.document;
  }

  async navigate(el) {
    el = typeof el === "string" ? this.window.document.querySelector(el) : el;
    this.window.document.querySelector(el).click();
    await this.ready();
  }

  async click(el, observeElement) {
    el = typeof el === "string" ? this.window.document.querySelector(el) : el;
    observeElement = typeof observeElement === "string" ? this.window.document.querySelector(observeElement) : observeElement;
    const p = this.observeChange(observeElement);
    queueMicrotask(_ => el.click());
    return p;
  }

  async goto(path) {
    this.window.location = path;
    await this.ready();
  }

  async openExternal(url) {
    const otherWindow = window.open(url, "_blank");
    for (let i = 0; i < 10 && !otherWindow.closed; i++)
      await new Promise(r => setTimeout(r, i + 1000));
  }

  async transferFile(inputEl, file) {
    inputEl = typeof inputEl === "string" ? this.window.document.querySelector(inputEl) : inputEl;
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    inputEl.files = dataTransfer.files;
    inputEl.dispatchEvent(new Event("change", { bubbles: true }));
    await new Promise(r => setTimeout(r, 0));
  }

  async observeChange(el) {
    el = typeof el === "string" ? this.window.document.querySelector(el) : el;
    let r;
    const p = new Promise(resolve => r = resolve);
    const mo = new MutationObserver(_ => { r(); mo.disconnect(); });
    mo.observe(el, {
      attributes: true,
      childList: true,
      subtree: true
    });
    await p;
    return el;
  }

  async ready(ms = 100, i = 100) {
    await new Promise(r => setTimeout(r, ms));
    for (; i; i--) {
      try {
        if (this.window.document.readyState === 'complete') return true;
      } catch (err) {
        console.error('Error accessing document.readyState:', err);
      }
      await new Promise(r => setTimeout(r, ms));
    }
    return false;
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
<div id="diff"></div>`;

export class TestHTMLe2e extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = template;
    this.button = this.shadowRoot.querySelector("button");
    this.diff = this.shadowRoot.querySelector("#diff");
    this.button.addEventListener("click", this.runTest.bind(this));
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

  async runTest() {
    const scriptEl = this.querySelector("script[test]");
    if (!scriptEl)
      return;
    this.setAttribute("state", "running");
    let result, win;
    try {
      const TestName = /window\s*\.\s*([a-zA-Z$][a-zA-Z$0-9]+)\s*=/;//do i need to ignore \n?
      const name = scriptEl.textContent.match(TestName)[1];
      const run = window[name];
      const page = this.getAttribute("page") ?? "/";
      win = new WindowWrapper(window.open(page, '_blank'))
      await win.ready();
      result = await run(win);
    } catch (e) {
      console.error(e);
      result = e;
    }
    let expected = await this.getExpected();
    if (typeof result === "object") {
      result = JSON.stringify(result, null, 2);
      expected = JSON.stringify(JSON.parse(expected), null, 2);
    }
    this.diffTest(result.trim(), expected.trim());
    if (!this.hasAttribute("open") && this.getAttribute("state").startsWith("ok"))
      win?.window?.close();
  }

  async getExpected() {
    const expectedAt = this.getAttribute("expected");
    if (expectedAt)
      return await (await fetch(expectedAt)).text();
    const expectedEl = this.querySelector("[expected]");
    return expectedEl instanceof HTMLTemplateElement ? expectedEl.innerHTML : expectedEl.textContent;
  }

  diffTest(result, expected) {
    if (result == expected)
      return (this.diff.innerText = result), this.setAttribute("state", "ok");
    let diffs = myersDiff(expected, result);
    diffs = diffs.map(([, , type, , value]) =>
      ({ type: type === "-" ? "added" : type === "+" ? "removed" : "", value }));
    const state = diffs.some(({ type, value }) => type && value.trim()) ? "error" : "ok2";
    this.diff.innerHTML = diffs
      .map(({ type, value }) => `<span class="${type}">${value}</span>`)
      .join("");
    return this.setAttribute("state", state);
  }
}

customElements.define("test-e2e", TestHTMLe2e);
