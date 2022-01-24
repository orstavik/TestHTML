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
<script src="https://cdn.jsdelivr.net/gh/orstavik/TestHTML@v1.0.0/TestHTML.js"></script>
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
<script src="https://cdn.jsdelivr.net/gh/orstavik/TestHTML@v1.0.0/TestHTML.js"></script>
```

The thing you are testing is the `console.log(..)` outputs from the `HelloWorld.html` file.

## Example: run several test files as one

You can run two or more test files together by making an aggregate file. You don't really need a framework for this, just do something like this:

```html
<h1>Test hello</h1>
<div href="Test_HelloWorld.html"></div>
<h1>Test goodbye</h1>
<div href="Test_GoodbyeWorld.html"></div>

<script src="https://cdn.jsdelivr.net/gh/orstavik/TestHTML@v1.0.0/TestHTML.js"></script>
<script>
  (async function () {
    for (let test of document.querySelectorAll("div:not([off])")) {
      const href = new URL(test.getAttribute('href'), location.href);
      test.innerHTML = await (await fetch(href)).text();
    }
  })();
</script>
```

## Example: make a self correcting test set

Sometimes you do changes that you alter the print of several tests. You therefore want to copy paste the new result into your test. To do so, add the following script at the end of your test.html file. 

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
<script src="https://cdn.jsdelivr.net/gh/orstavik/TestHTML@v1.0.0/TestHTML.js"></script>
<script>
  setTimeout(async function () {
    for (let el of document.querySelectorAll('test-html')) {
      el.shadowRoot.getElementById('clipboard').click();
      el.children[0].textContent = await navigator.clipboard.readText();
      el.removeAttribute('ok');
    }
    console.log(document.body.innerHTML);
  }, 1500);
</script>
```

> Att!! If the focus is not on the window, then this function will fail. That is useful, so to void this function, set focus inside devtools and rerun the page.
> 
> Simply copy paste the printed result to and from your test.html file. 


## Example:  `#` character in the Data URL

We often use the `#` characters inside our files. This can be as an id selector sor CSS, HTML code for Unicode characters, or part of a link for `<a>` element.
 
[HelloHash.html](demo/HelloHash.html)

```html
<h1 id="hash">Hello HASH </h1>

<style>
    h1#hash {
        color: blue;
    }

    h1:before {
        content: "#";
    }
</style>

<h1> &#9654 </h1>

<script>
  const h1 = document.querySelector("h1");
  console.log(h1.innerText);
  console.log("#");
</script>
```
 Using `<iframe>` and _Data URLs_ as sources can cause problems when interpreting the `#` character.  The browser interprets it as url hash and not as part of the code. 
 
[Test_HelloHash.html](demo/Test_HelloHash.html)

```html
<test-html test="HelloHash.html">
    <script expected>
      [
        "Hello HASH",
        "#"
      ]
    </script>
</test-html>

<!-- Note!! You must load the test-html component at the end -->
<script src="../TestHTML.js"></script>
```

 To fix this behavior, the `#` character must be encoded using `.encodeURIComponent()` before being added to the Data URL. It replaces each `"#"` character with `"%23"`.
