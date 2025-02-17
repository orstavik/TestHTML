import("https://unpkg.com/diff@5.2.0/dist/diff.js");

function expectedTester() {
  const mo = new MutationObserver(([{ target }]) =>
    parent.postMessage(JSON.stringify([_TestHTML_id, target.textContent]), '*'));
  for (let expected of document.querySelectorAll("[expected]"))
    mo.observe(expected, { childList: true, characterData: true });
}

//todo 2. make a better view per element.  Make the link on the iframe? then, make the diff something you see when you click on it.
//todo make the view as a little grid?
//language=HTML
const template = /*html*/`
  <style>
    :host { 
      display: block; 
      height: 1em; 
      overflow: hidden;
    }
    :host { border-left: 5px solid orange; }
    :host([state="ok"]) { border-left-color: green; }
    :host([state="error"]) { border-left-color: red; }

    #diff, #code { white-space: pre-wrap; border: 4px double lightblue; }
    .added {color: green}
    .removed {color: red}
    iframe { height: 10px; width: 10px; display: inline-block; }

    :host([active]) { height: 60vh; overflow: scroll; }
    :host([active]) iframe { height: auto; width: auto; display: block;}
    /*:host([active]) #diff, #code { display: block;}*/
  </style>
  <span id="title"></span>
  <a id="link" target="_blank">(=> new tab)</a> <a id="clipboard">[copy JSON-result]</a>
  <iframe id="iframe"></iframe>
  <pre id="expected"></pre>
  <pre id="result"></pre>
  <div id="diff"></div>
`;

class TestHTML extends HTMLElement {

  static stringify(ar) {
    return `[\n${ar.map(row => `      ${JSON.stringify(row)}`).join(',\n')}\n]`;
  }

  static #count = 0;
  #id = TestHTML.#count++;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = template;
    this.shadowRoot.addEventListener('dblclick', e => this.toggleAttribute('active'));
    window.addEventListener('message', e => this.onMessage(e));
    this.clipboard.addEventListener('click', _ =>
      navigator.clipboard.writeText(this.result.textContent));
    this.onTest();
  }

  get expected() { return this.shadowRoot.getElementById("expected"); }
  get result() { return this.shadowRoot.getElementById("result"); }
  get diff() { return this.shadowRoot.getElementById("diff"); }
  get code() { return this.shadowRoot.getElementById("code"); }
  get title() { return this.shadowRoot.getElementById("title"); }
  get iframe() { return this.shadowRoot.getElementById("iframe"); }
  get link() { return this.shadowRoot.getElementById("link"); }
  get clipboard() { return this.shadowRoot.getElementById("clipboard"); }

  onMessage(e) {
    const res = JSON.parse(e.data);
    if ((res instanceof Array) && res.shift() === this.#id)
      this.setAttribute("state",
        this.expected.textContent.trim() == (this.result.textContent = res[0].trim()) ? "ok" : "error");
  }

  onActive() {
    const diffs = Diff.diffWords(this.expected.textContent, this.result.textContent);
    this.shadowRoot.getElementById("diff").innerHTML = diffs
      .map(p => `<span class="${p.added ? 'added' : p.removed ? 'removed' : ''}">${p.value}</span>`)
      .join('');
  }

  onTest() {
    //clean up the text in <script expected>s.
    this.expected.textContent = this.querySelector("[expected]").textContent;
    this.title.textContent = this.querySelector("h1,h2,h3,h4,h5,h6").textContent;

    const testTxt = this.innerHTML.replaceAll(`type="test"`, `type="module"`);
    const txt = `
    <base href='${document.location}'/>
    ${testTxt}
    <script>_TestHTML_id=${this.#id};(${expectedTester.toString()})();</script>
    `;
    this.iframe.src = `data:text/html;charset=utf-8,${encodeURIComponent(txt)}`;
    this.link.setAttribute('href', URL.createObjectURL(new Blob([txt], { type: 'text/html' })));
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'active' && newValue != null)
      this.onActive();
  }

  static get observedAttributes() {
    return ['active'];
  }
}

try {
  customElements.define('test-html', TestHTML);
} catch (err) {
  //test-html already defined.
}
