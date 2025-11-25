## Install

- This is currently located under `/libraryv2adobepfizer/scripts/style-dictionary-figma/` directory, so `cd scripts/style-dictionary-figma/` and run all these commands witin the context of that folder.
- make sure to create a `.env` file in the subfolder location with proper creditials.
- install packages if not added yet with `npm i` for this subfolder.
- run the script command `npm run sync-figma-to-tokens` to generate the files, most notably: `build/css/variables.css` `build/scss/_variables.scss` and `report.json`

---------

**Expected result**

```
🚀🚀
Figma API results fetched from https://api.figma.com/v1/files/65Oi0gLbhoDLUPp6Fimav6/variables/local
variableCollections count: 10
variables count: 348
🚀🚀
Output directory set to 'build/tokens_generated'. Directory already exists.

CSS
✔︎ build/css//variables.css

scss
✔︎ build/scss/_variables.scss
✅ Tokens files have been written to the build/tokens_generated directory
✅ Variables have been parsed and sorted. JSON file written to report.json
```

---

# figma-variables-to-styledictionary

- Install everything with `npm i`
- Create a .env file with two variables
  - PERSONAL_ACCESS_TOKEN=YOUR_KEY_HERE
  - FILE_KEY=FIGMA_KEY_HERE
- Run `npm run sync-figma-to-tokens` to create a build folder and the scss/css variables
