import("https://unpkg.com/diff@5.0.0/dist/diff.js");

function consoleLogMonkey() {
  console.log = function consoleLogMonkey(...args) {
    return parent.postMessage(JSON.stringify([location.hash.substr(1), ...args]), '*');
  }
}

//todo 2. make a better view per element.  Make the link on the iframe? then, make the diff something you see when you click on it.
//todo make the view as a little grid?
//language=HTML
const template = `
  <style>
    :host { display: block; height: 1em; overflow: hidden; }
    :host([ok]) { border-left: 5px solid green; }
    :host([not-ok]) { border-left: 5px solid red; }

    #diff, #code { white-space: pre-wrap; border: 4px double lightblue; }
    .added {color: green}
    .removed {color: red}
    iframe { height: 10px; width: 10px; display: inline-block; }

    :host([active]) { height: 60vh; overflow: scroll; }
    :host([active]) iframe { height: auto; width: auto; display: block;}
    /*:host([active]) #diff, #code { display: block;}*/
  </style>
  <b id="alt"></b><span id="title"></span><a id="link" target="_blank">(=> new tab)</a> <a id="clipboard">[copy JSON-result]</a>
  <iframe id="iframe"></iframe>
  <div id="diff"></div>
  <div id="code"></div>
`;

class TestHTML extends HTMLElement {

  static stringify(ar) {
    return `[\n${ar.map(row => `      ${JSON.stringify(row)}`).join(',\n')}\n]`;
  }

  static #count = 0;
  #id = TestHTML.#count++;

  #resultObj = [];
  #result = document.createElement("script");

  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = template;
    this.#result.setAttribute("result", "");
    window.addEventListener('message', e => this.onMessage(e));
    this.shadowRoot.addEventListener('dblclick', e => this.onDblclick(e));
    const clipboard = this.shadowRoot.getElementById('clipboard');
    clipboard.addEventListener('click', _ => navigator.clipboard.writeText(this.#result.textContent));
  }

  onMessage(e) {
    const res = JSON.parse(e.data);
    if (!(res instanceof Array) || res.shift() !== this.#id + '')
      return;
    this.#resultObj.push(res.length === 1 ? res[0] : res);
    this.render();
  }

  render() {
    //clean up old result
    this.removeAttribute("ok");
    this.removeAttribute("not-ok");
    this.#result.textContent = TestHTML.stringify(this.#resultObj);
    this.#result.remove();
    for (let expect of this.querySelectorAll(":scope > script[expected]")) {
      if (expect.textContent === this.#result.textContent){
        const alt = expect.getAttribute("expected");
        this.shadowRoot.getElementById("alt").textContent = alt;
        this.setAttribute("ok", alt);
        return
      }
    }
    this.append(this.#result);
    this.setAttribute("not-ok", "");
  }

  onDblclick() {
    this.hasAttribute('active') ? this.removeAttribute('active') : this.setAttribute('active', '');
  }

  onActive() {
    if(this.hasAttribute("not-ok")){
      const e = this.querySelector("script[expected]").textContent;
      const r = this.querySelector("script[result]").textContent;
      this.shadowRoot.getElementById("diff").innerHTML =
        Diff.diffWords(e, r).map(p => `<span class="${p.added ? 'added' : p.removed ? 'removed' : ''}">${p.value}</span>`).join('');
    } else if(this.hasAttribute("ok")) {
      const ok = this.getAttribute('ok');
      this.shadowRoot.getElementById("diff").innerHTML = this.querySelector(`script[expected="${ok}"]`).textContent;
    }
  }

  async onTest(newValue) {
    //clean up the text in <script expected>s.
    for (let expect of this.querySelectorAll(":scope > script[expected]"))
      expect.textContent = TestHTML.stringify(JSON.parse(expect.textContent));
    //load the text content for the newValue of the test.
    this.shadowRoot.getElementById("title").textContent = newValue.substr(newValue.lastIndexOf('/') + 1);
    const testUrl = new URL(newValue, document.location);
    this.shadowRoot.getElementById("link").setAttribute('href', testUrl);
    const testTxt = await (await fetch(testUrl)).text();
    this.shadowRoot.getElementById("code").textContent = testTxt;
    const txt = `<base href='${testUrl}'/><script>(${consoleLogMonkey.toString()})();</script>${testTxt}`;
    this.shadowRoot.getElementById("iframe").src = `data:text/html;charset=utf-8,${encodeURIComponent(txt)}#${this.#id}`;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'test')
      this.onTest(newValue);
    else if (name === 'active' && newValue !== null)
      this.onActive();
  }

  static get observedAttributes() {
    return ['test', 'active'];
  }
}

try {
  customElements.define('test-html', TestHTML);
} catch (err) {
  //test-html already defined.
}