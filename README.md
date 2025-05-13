# TestHTML

[`TestHTML`](https://orstavik.github.io/TestHTML) is a web component unit test framework [`(github)`](https://github.com/orstavik/TestHTML).

To run the tests, you simply need to create a new `test.html` file that contains one or more `<test-html>` elements. Each `<test-html>` element will represent _one_ test. You then 1. start a local web server in the directory that contains the `test.html` file and 2. open that `test.html` file in a browser. The browser will run that test and show you the result as a webpage.

```bash
npx http-server -p 6666 --cors
```

(liveserver in VS_CODE also works).

Each `<test-html>` element works by getting another `to_be_tested.html` file. This is the `.html` code (with the potentially problematic js code) that you want to test. 

```html
<test-html test=`to_be_tested.html`>
```

Each `<test-html>` element works by 1. fetching the raw html text as the content from the link and then 2. running that html+js code inside a separate, internal `<iframe>`.
 
When the `to_be_tester.html` file runs, the parent `<test-html>` element will listen and extract all __`console.log`__ outputs given by the `to_be_tested.html` file, from inside the `<iframe>`. The `<test-html>` element will then compare that output with the content of a `<script expected>` child  element. The sequence of the `console.log` messages is preserved (within each test). If the output of the `console.log`s matches the content of the `<script expected>`, then the test is marked green. If mismatch, the test is marked red. While the test is still running, and the `console.log` are partially matching, the test is marked yellow.

```html
<test-html test=`to_be_tested.html`>
  <script expected>
    [
      "message 1 from console.log",
      "message 2 from console.log"
    ]
  </script>
</test-html>
```

## Example: Hello world

[HelloWorld.html](demo/HelloWorld.html)

```html
<h1>Hello WORLD</h1>
<script>
  const h1 = document.querySelector("h1");
  console.log(h1.innerText);
  console.log(1, 2, 3);
</script>
```

[Test_HelloWorld.html](demo/Test_HelloWorld.html)

```html
<test-html test="HelloWorld.html">
  <script expected>
    [
      "Hello WORLD",
      [1, 2, 3]
    ]
  </script>
</test-html>

<!-- Note!! You must load the test-html component at the end -->
<script src="https://cdn.jsdelivr.net/gh/orstavik/@2.1/TestHTML.js"></script>
```

The thing you are testing is the `console.log(..)` outputs from the `HelloWorld.html` file.

## Example: Hello and goodbye world

You can add more than one test in the same test file, of course.

[Test_HelloWorld2.html](demo/Test_HelloWorld2.html)

```html
<test-html test="HelloWorld.html">
  <script expected>
    [
      "Hello WORLD",
      [1, 2, 3]
    ]
  </script>
</test-html>

<test-html test="GoodbyeWorld.html">
  <script expected>
    ["wait for it"]
  </script>
</test-html>

<!-- Note!! You must load the test-html component at the end -->
<script src="https://cdn.jsdelivr.net/gh/orstavik/@2.1/TestHTML.js"></script>
```

The thing you are testing is the `console.log(..)` outputs from the `HelloWorld.html` file.

## Example: test set aggregate (the best way)

As each test component is running inside an `<iframe>`, if we use `<iframe>`s to place many test sets side by side, we will get nested `<iframe>`s. That can be a problem. Therefore, to run many smaller test sets as one big test, we instead cut and paste the code of each sub-test set into the aggregate test set in the browser. This is not conceptually pretty, but it works ok running actual aggregate tests.

[Test_many.html](demo/Test_many.html)

```html
<h1>Test hello</h1>
<div href="Test_HelloWorld.html"></div>
<h1>Test goodbye</h1>
<div href="Test_GoodbyeWorld.html"></div>
<h1>Test hello2</h1>
<div href="Test_HelloWorld2.html"></div>
<h1>Test splice</h1>
<div href="Test_HelloSplice.html"></div>

<script>
  (async function () {
    for (let test of document.querySelectorAll("div:not([off])")) {
      const href = new URL(test.getAttribute('href'), location.href);
      test.innerHTML = await (await fetch(href)).text();
    }
  })();
</script>
<script src="https://cdn.jsdelivr.net/gh/orstavik/@2.1/TestHTML.js"></script>
```

# TestHTMLexpected

Script that can be used to test directly within the html text. Simplifies the handling of base and references to other modules. The test will observe the first element with the `[expected]` attribute, and when this element changes, the test will see if the content of this element has changed or not.

```html
<test-html test="HelloWorld.html">
  <h1>Hello WORLD</h1>
  <pre expected>
    hello sunshine Hello Sunshine!
  </pre>
  <script type="test">
    import { helloSunshine } from "./HelloSunshine.js";
    const pre = document.querySelector("pre");
    pre.innerText = "hello sunshine " + helloSunshine();
  </script>
</test-html>


<!-- Note!! You must load the test-html component at the end -->
<script src="https://cdn.jsdelivr.net/gh/orstavik/TestHTML@v1.2.0/TestHTML.js"></script>
<!-- <script src="../TestHTML3.js"></script> -->
```

## FAQ

#### 1. `Failed to load resource: the server responded with a status of 404 (Not Found)`

The problem here is likely to do with the server not reacting kindly to js files (or other resources) being loaded from within the iframe.

To make the test work in isolate, we use an `<iframe src="data:..">`. This means that it is a nice clean room for the test to run, but also that local development servers on the localhost doesn't know what to do.

If the problem is `localhost`, then the solution is:

```bash
npx http-server -p 6666 --cors
```

If the problem is an external script, then you should consider whether or not the script really needs to be cors protected. Maybe it is already freely available and cors readable via `jsdelivr.net` or `unpkg.com`? Or maybe you can only run tests against these scripts if you have them in a local development environment.

#### 2. `TypeError: ... navigator.clipboard.write()`

If you get a `TypeError` referencing the call to `navigator.clipboard.write()`, this error is caused by security protections for `http://` sites. Setup a local `https://` server instead. Or run the tests from your remote library.

#### 3. `#` character in the Data URL

We often use the `#` characters inside our files. This can be as an id selector for CSS, HTML code for Unicode characters, or part of a link for `<a>` element.

[HelloHash.html](demo/HelloHash.html)

```html
<h1 id="hash">Hello HASH </h1>

<style>
  h1#hash { color: blue; }
  h1:before { content: "#"; }
</style>

<h1>&#9654</h1>

<script>
  const h1 = document.querySelector("h1");
  console.log(h1.innerText);
  console.log("#");
</script>
```

Using `<iframe>` and _Data URLs_ as sources can cause problems when interpreting the `#` character. The browser interprets it as a url hash and not as part of the code.

[Test_HelloHash.html](demo/Test_HelloHash.html)

```html
<test-html test="HelloHash.html">
  <script expected>[
    "Hello HASH",
    "#"
  ]</script>
</test-html>

<!-- Note!! You must load the test-html component at the end -->
<script src="https://cdn.jsdelivr.net/gh/orstavik/@2.1/TestHTML.js"></script>
```

To fix this behavior, the `#` character must be encoded using `.encodeURIComponent()` before being added to the Data URL. It replaces each `"#"` character with `"%23"`.

## End-2-end: `TestE2E.js`

`TestE2E.js` extends the testing capabilities of TestHTML with end-to-end (E2E) testing functionality. While the regular `<test-html>` component focuses on capturing console outputs, `<test-e2e>` enables testing actual user interactions and DOM state changes.

### Basic Usage

```html
<!DOCTYPE html>
<html lang="en">
<script type="module" src="/TestE2E.js"></script>

<body>
  <test-e2e name="myTest" page="PageToTest.html" auto>
    <script type="module" test>
      export default async function (frame) {
        // Perform interactions and return test result
        let result = await frame.click("#button", "#target");
        return result.getAttribute("data-state");
      }
    </script>
    <script expected>"completed"</script>
  </test-e2e>
</body>
</html>
```

### WindowWrapper API

The `frame` parameter in your test function provides these utility methods:

- `document()` - Access the document object
- `navigate(selector)` - Click an element and wait for page load
- `click(selector, target)` - Click element and observe changes in a target
- `goto(path)` - Navigate to a URL
- `openExternal(url)` - open a different window and wait until the user closes it
- `waitForEvent(type)` - Wait for a specific event
- `observeChange(selector)` - Watch for DOM mutations
- `ready(ms)` - Wait for document to fully load

### Example

The file `e2e/Test_HelloSunshine.html` demonstrates how to test if clicking a summary element opens a details element:

```html
<test-e2e name="helloSunshine" page="HelloSunshine.html" auto>
  <script test>
    window.testSunshine = async function (frame) {
      let result = await frame.click("#abracadabra", "#sesame");
      return result.hasAttribute("open");
    }
  </script>
  <script expected>true</script>
</test-e2e>
```

This tests `HelloSunshine.html`, which contains:

```html
<details id="sesame">
  <summary id="abracadabra">Hello</summary>
  <p>Sunshine</p>
</details>
```

When run, the test clicks on the summary element and verifies that the details element has received the "open" attribute.

## More information?

[OLD_IDEAS](OLD_IDEAS)
