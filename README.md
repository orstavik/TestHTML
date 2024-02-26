# TestHTML

[`TestHTML`](https://orstavik.github.io/TestHTML) is a web component unit test framework.

To run the tests, you simply need to create a new `.html` file that contains one or more `<test-html>` elements and a script referencing `TestHTML.js`. When you open that `.html` file in a browser, the browser will run the test and show you the result in a webpage.

The tests work by adding a series of `<test-html>` custom elements. Each custom elements will get the html code from the file referenced in the `test` attribute. The elements then load the raw html text as the content of an internal `<iframe>` that will then run the html template.

When the html test text is run, the `<test-html>` element will listen for all `console.log` messages inside the iframe. It will then compare that content with the content of the `<script expected>` inside (the lightDom) of the `<test-html>` element. If the two match, then then test will be marked green as successful, if not, the `<test-html>` element will be marked red as faulty.

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
<script src="https://cdn.jsdelivr.net/gh/orstavik/TestHTML@v1.0.3/TestHTML.js"></script>
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
<script src="https://cdn.jsdelivr.net/gh/orstavik/TestHTML@v1.0.3/TestHTML.js"></script>
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
<script src="https://cdn.jsdelivr.net/gh/orstavik/TestHTML@v1.0.3/TestHTML.js"></script>
```

## FAQ

#### 1. `Failed to load resource: the server responded with a status of 404 (Not Found)`

The problem here is likely to do with the server not reacting kindly to js files (or other resources) being loaded from within the iframe. 
To make the test work in isolate, we use an `<iframe src="data:..">`. This means that it is a nice clean room for the test to run, but 
also that local development servers on the localhost doesn't know what to do.

If the problem is `localhost`, then the solution is:

```bash
npx http-server -p 6666 --cors
```

If the problem is an external script, then you should consider whether or not the script really needs to be cors protected. Maybe it is already freely available and cors readable via `jsdelivr.net` or `unpkg.com`? Or maybe you can only run tests against these scripts if you have them in a local development environment.

#### 2. `#` character in the Data URL

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
<script src="https://cdn.jsdelivr.net/gh/orstavik/TestHTML@v1.0.3/TestHTML.js"></script>
```

To fix this behavior, the `#` character must be encoded using `.encodeURIComponent()` before being added to the Data URL. It replaces each `"#"` character with `"%23"`.

## More information?

[OLD_IDEAS](OLD_IDEAS)