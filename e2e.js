import { FlatHtml } from "https://cdn.jsdelivr.net/gh/orstavik/making-a@25.07.20/FlatHtml.js";
// import { diff } from 'making-a/difference.js';

async function ready(win, ms = 100, i = 100) {
  for (; i; i--) {
    await new Promise(r => setTimeout(r, ms));
    if (win.document.readyState === 'complete') return;
  }
  throw new Error("alternate window does not get ready in time.");
}

async function importTxtCode(txt) {
  const blob = new Blob([txt], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  return await import(url).finally(() => URL.revokeObjectURL(url));
}

async function exec(win, fn) {
  const loader = win.Function("return " + importTxtCode.toString())();
  const fn2 = (await loader(fn))?.default;
  try {
    return await fn2.call(win);
  } catch (e) {
    console.error(e);
    return e;
  }
}

async function getAttributeOrElement(el, at) {
  const atUrl = el.getAttribute(at);
  if (atUrl)
    return await (await fetch(atUrl)).text();
  el = el.querySelector(`[${at}]`);
  return el instanceof HTMLTemplateElement ? el.innerHTML : el?.textContent;
}

const style = `
  .action2 { text-decoration: underline red; }
  .action1 { text-decoration: line-through red; }
  .ws {height: 1px; font-size: 4px; }
  .action0 {height: 1px; font-size: 4px; }
`;

const template = /*html*/`
<style>${style}</style>
<slot></slot>
<button>testName</button>
<div id="diff"></div>`;

class TestE2E extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <slot></slot>
      <div id="diff"></div>`;
    this.runTest();
  }

  async runTest() {
    const tst = await getAttributeOrElement(this, "test");
    this.setAttribute("state", "running");
    const otherWindow = window.open(this.getAttribute("page") ?? "/", '_blank');
    await ready(otherWindow);
    const result = await exec(otherWindow, tst);
    const expected = await getAttributeOrElement(this, "expected");
    if (result == expected)
      return (this.diff.innerText = result), this.setAttribute("state", "ok");
    else
      this.diffTest(result, expected);
    if (!this.hasAttribute("open") && this.getAttribute("state").startsWith("ok"))
      otherWindow?.window?.close();
  }
}

class E2eHtml extends TestE2E {
  diffTest(result, expected) {
    const diffs = FlatHtml.fromString(expected).diff(result).toArray();
    const error = diffs.find(({ action, word }) => action != 0 && word.trim());
    const state = error ? "error" : "ok2";
    const diffs2 = diffs.map(({ action, type, word }) =>
      `<div class="action${action}${!word.trim() ? " ws" : ""}">${word}</div>`);
    this.shadowRoot.querySelector("#diff").innerHTML = diffs2.join("\n");
    return this.setAttribute("state", state);
  }
}
customElements.define("e2e-html", E2eHtml);

// class E2eJson extends TestE2E {
//   diffTest(result, expected) {
//     result = JSON.stringify(result, null, 2);
//     expected = JSON.stringify(JSON.parse(expected), null, 2);
//     const diffs = diff(result, expected);
//     console.log("implemented check of diff");
//     // return this.setAttribute("state", state);
//   }
// }
// customElements.define("e2e-json", E2eJson);


// customElements.define("test-e2e", TestE2E);