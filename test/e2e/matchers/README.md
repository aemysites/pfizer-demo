# Custom matchers
This directory contains the definitions of custom-defined matchers.

## IDE autocomplete feature supporting
To support a custom matcher by IDE autocomplete, its signature must be added to the _global.d.ts_ file.

## toHaveCSSStyles(styles: CSSProperties)
Used to check that [Locator] element CSS styles matches to a subset of the CSS properties.

### Sample usage:
```js
const expected = {
  fontSize: "16px",
  display: "inline",
  fontFamily: "Helvetica, Arial, sans-serif",
  color: "rgb(56, 56, 56)",
};

await expect(await page.locator('text=Title')).toHaveCSSStyles(expected);
```
