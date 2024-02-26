# Old ideas

This page contains old examples that are likely no longer useful.

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
<script src="https://cdn.jsdelivr.net/gh/orstavik/TestHTML@v1.0.3/TestHTML.js"></script>
<script>
  setTimeout(function () {
    for (let el of document.querySelectorAll('test-html')) {
      el.removeAttribute("ok");
      el.removeAttribute("not-ok");
    }
    console.log(document.body.innerHTML);
  }, 1500);
</script>
```

> Att!! If the focus is not on the window, then this function will fail. That is useful, so to void this function, set focus inside devtools and rerun the page.
>
> Simply copy paste the printed result to and from your test.html file.

