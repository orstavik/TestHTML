# TestHTML

`TestHTML` is a web component unit test framework.

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
<script src="https://cdn.jsdelivr.net/gh/orstavik/TestHTML/TestHTML.js"></script>
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
<script src="https://cdn.jsdelivr.net/gh/orstavik/TestHTML/TestHTML.js"></script>
```

The thing you are testing is the `console.log(..)` outputs from the `HelloWorld.html` file.

## Example: run several test files as one

You can run two or more test files together by making an aggregate file. You don't really need a framework for this, just do something like this:

```html
<h1>Test hello</h1>
<div href="Test_HelloWorld.html"></div>
<h1>Test goodbye</h1>
<div href="Test_GoodbyeWorld.html"></div>

<script src="https://cdn.jsdelivr.net/gh/orstavik/TestHTML/TestHTML.js"></script>
<script>
  (async function () {
    for (let test of document.querySelectorAll("div:not([off])")) {
      const href = new URL(test.getAttribute('href'), location.href);
      test.innerHTML = await (await fetch(href)).text();
    }
  })();
</script>
```