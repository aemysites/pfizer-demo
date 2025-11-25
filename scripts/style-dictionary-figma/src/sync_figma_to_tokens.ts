// @ts-nocheck1
import 'dotenv/config';
import * as fs from 'fs';
import { green, getArgs } from './utils.js';
import StyleDictionary from 'style-dictionary';
import FigmaApi from './figma_api.js';
import { tokenFilesFromLocalVariables } from './token_export.js';
import { configJsonPrimitives, configJsonAandZbrands, configJsonGlobalStyles, configJsonThirdTier } from '../sd.config.js';
// @ts-ignore
import currentFigmaLocalParameters from '../build/token.json' assert { type: 'json' };

/**
 * Usage:
 *
 * // Defaults to writing to the build/tokens_generated directory
 * npm run sync-figma-to-tokens
 *
 * // Writes to the specified directory
 * npm run sync-figma-to-tokens -- --output directory_name
 */

// >>
function writeFileSyncRecursive(filename: any, content?: any, charset?: any) {
  // -- normalize path separator to '/' instead of path.sep,
  // -- as / works in node for Windows as well, and mixed \\ and / can appear in the path
  let filepath = filename.replace(/\\/g, '/');

  // Add .json extension if not present
  if (!filepath.endsWith('.json')) {
    filepath = filepath + '.json';
  }

  // -- preparation to allow absolute paths as well
  let root = '';
  if (filepath[0] === '/') {
    root = '/';
    filepath = filepath.slice(1);
  } else if (filepath[1] === ':') {
    root = filepath.slice(0, 3); // c:\
    filepath = filepath.slice(3);
  }

  // -- create folders all the way down
  const folders = filepath.split('/').slice(0, -1); // remove last item, file
  folders.reduce(
    (acc: any, folder: any) => {
      const folderPath = acc + folder + '/';
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
      }
      return folderPath;
    },
    root // first 'acc', important
  );

  if (content) {
    // -- write file
    fs.writeFileSync(root + filepath, content, charset);
  }
}

async function main() {
  if (!process.env.PERSONAL_ACCESS_TOKEN || !process.env.FILE_KEY) {
    throw new Error('PERSONAL_ACCESS_TOKEN and FILE_KEY environemnt variables are required');
  }

  // create /build/tokens_generated directory if it doesn't exist
  if (!fs.existsSync('build/tokens_generated/')) {
    writeFileSyncRecursive('build/tokens_generated/', null, null);
  }
  const fileKey = process.env.FILE_KEY;

  const args = getArgs();

  let localVariables: any = currentFigmaLocalParameters;

  if (args['call-api']) {
    // //////////////////////////////////////////////////////
    // Fetch local variables from Figma API based on the local variables endpoint
    // //////////////////////////////////////////////////////
    const api = new FigmaApi(process.env.PERSONAL_ACCESS_TOKEN);
    localVariables = await api.getLocalVariables(fileKey);
    if (localVariables.status !== 200) {
      console.error('Figma API error:', localVariables);
      return;
    }
    // print length while testing
    console.log(
      `🚀🚀 \nFigma API results fetched from ${localVariables.figmaUrlLocation}\n` +
        `variableCollections count: ${Object.keys(localVariables?.meta?.variableCollections).length}\n` +
        `variables count: ${Object.keys(localVariables?.meta?.variables).length} \n🚀🚀`
    );
  }

  /**
   * The `tokenFilesFromLocalVariables` function transforms Figma API local variable responses into a structured token file format.
   * It initializes a storage object, extracts necessary data, and iterates over special-cases with local variables to skip remote ones.
   * For each mode in a variable's collection, it generates filenames and structures the tokens within those files based on variable names and modes.
   */

  // Define desired collection order
  const collectionOrder = ['Primitives', '3. Global Styles'];

  // Sort collections by putting specified ones first, then rest alphabetically
  localVariables.meta.variableCollections = Object.fromEntries(
    Object.entries(localVariables.meta.variableCollections).sort(([, a], [, b]) => {
      const aIndex = collectionOrder.indexOf((a as { name: string }).name);
      const bIndex = collectionOrder.indexOf((b as { name: string }).name);
      if (aIndex === -1 && bIndex === -1) {
        return (a as { name: string }).name.localeCompare((b as { name: string }).name);
      }
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    })
  );

  await new Promise((resolve) => setTimeout(resolve, 200));

  // //////////////////////////////////////////////////////
  // Converts local variables from Figma API to token files
  // //////////////////////////////////////////////////////
  const tokensFiles = await tokenFilesFromLocalVariables(localVariables);
  if (!tokensFiles) {
    throw new Error('tokensFiles is undefined');
  }

  fs.writeFileSync('build/tokens_generated/tokens_raw.json', JSON.stringify(tokensFiles, null, 2), 'utf8');

  // not used currently:
  // const getTokenFileRaw = () => {
  //   return fs.readFileSync('build/tokens_generated/tokens_raw.json', 'utf8');
  // };

  //////////////////

  // //////////////////////////////////////////////////////
  // Setup for writing token files to the output directory by creating the directory if it doesn't exist
  // //////////////////////////////////////////////////////
  let outputDir = 'build/tokens_generated';
  const outputArgIdx = process.argv.indexOf('--output');

  // Empty directory to avoid old json files when switching between files
  fs.readdirSync(outputDir).forEach((f) => fs.rmSync(`${outputDir}/${f}`));

  if (outputArgIdx !== -1) {
    outputDir = process.argv[outputArgIdx + 1];
  }
  if (!fs.existsSync(outputDir)) {
    writeFileSyncRecursive(outputDir);
  }
  console.log(`Output directory set to '${outputDir}'. Directory ${fs.existsSync(outputDir) ? 'already exists' : 'created'}.`);

  /**
   * Writes a JSON file named "build/token.json" with the content of `tokensFiles`, then it iterates over each entry in `tokensFiles`.
   * Converts the file content to a JSON string with a 2-space indentation and removes all dollar signs ('$') from the string.
   * It also sanitizes the file name by trimming spaces and replacing any remaining spaces and writes the sanitized content to a new file in a specified output directory.
   */

  fs.writeFileSync('build/token.json', JSON.stringify(localVariables, null, 2), 'utf8');

  // set the proper order according to 2.0 Figma, it's a bit odd since the structure is in this order:
  // Tier 1 --> Primitives
  // Tier 2 --> "2. ... Brands" and 3. Global
  // Tier 3 --> "1. Select Brand Initial"
  const order = ['Primitives', '3. Global', '2. '];
  const entries = Object.entries(tokensFiles);

  entries.sort(([fileNameA], [fileNameB]) => {
    const getOrderIndex = (fileName: string) => order.findIndex((orderItem) => fileName.startsWith(orderItem));
    const orderIndexA = getOrderIndex(fileNameA);
    const orderIndexB = getOrderIndex(fileNameB);
    if (orderIndexA === -1 && orderIndexB === -1) return 0;
    if (orderIndexA === -1) return 1;
    if (orderIndexB === -1) return -1;
    return orderIndexA - orderIndexB;
  });

  const tokensFilesSorted = Object.fromEntries(entries);

  Object.entries(tokensFilesSorted).forEach(([fileName, fileContent]) => {
    const fileNameWithoutSpaces = fileName.trim();
    let arrayOfPaths = fileNameWithoutSpaces.split('/');
    let outputFileName = arrayOfPaths[arrayOfPaths.length - 1];

    const fileContentStructure = fileContent;
    const friendlyOutputFileName = arrayOfPaths[arrayOfPaths.length - 1];

    // throw exception if file name does not start with a number
    if (!/^\d/.test(friendlyOutputFileName) && !friendlyOutputFileName.startsWith('primitives')) {
      throw new Error(`File name must start with a number: ${friendlyOutputFileName}`);
    }

    const nestedAsFileName = {
      [friendlyOutputFileName]: fileContentStructure,
    };

    writeFileSyncRecursive(`${outputDir.trim().replace(/\s/g, '')}/${outputFileName}`, JSON.stringify(nestedAsFileName, null, 2).replace(/\$/g, ''), 'utf8');
    console.log(`Wrote Figma Tokens File: ${outputFileName}`);
  });

  /**
   * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * StyleDictionary.registerTransform
   * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   */

  StyleDictionary.registerTransform({
    name: 'size/px',
    type: 'value',
    filter: function (token: any) {
      console.log(token);
      return token?.attributes?.category === 'font' || token?.attributes?.category === 'margin' || token?.type === 'number' || token?.type === 'string';
    },
    transform: function (token: any) {
      console.log('here');
      const removedRem = String(token.value).replace('rem', '');
      if (token.name.includes('weight')) {
        return String(token.value);
      }
      const isNumber = !isNaN(Number(removedRem));
      return isNumber ? `${removedRem}px` : token.value;
    },
  });

  StyleDictionary.registerTransform({
    name: 'double-quote-string',
    type: 'value',
    filter: function (token: any) {
      return token?.attributes?.category === 'font' || typeof token.type === 'string';
    },
    transform: function (token: any) {
      const isNumber = typeof token.value === 'number';
      const value = String(token.value);
      if (value.includes('px') || value.includes('rem') || value.includes('#') || !isNaN(Number(value))) {
        return token.value;
      }

      return !isNumber ? `'${token.value}'` : token.value;
    },
  });

  StyleDictionary.registerTransformGroup({
    name: 'custom/scss',
    transforms: ['size/px', 'attribute/cti', 'double-quote-string'],
  });

  StyleDictionary.registerTransformGroup({
    name: 'custom/css',
    transforms: ['size/px', 'attribute/cti', 'double-quote-string'],
  });

  /**
   * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * StyleDictionary.buildAllPlatforms()
   * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   */

  // all (existing)
  // const styleDictionary = new StyleDictionary(configJson);
  // await styleDictionary.buildAllPlatforms();

  // just primitives...
  const styleDictionaryPrimitives = new StyleDictionary(configJsonPrimitives);
  await styleDictionaryPrimitives.buildAllPlatforms();

  // just a-z brands...
  const styleDictionaryAtoZBrands = new StyleDictionary(configJsonAandZbrands);
  await styleDictionaryAtoZBrands.buildAllPlatforms();

  // just global styles...
  const styleDictionaryGlobalStyles = new StyleDictionary(configJsonGlobalStyles);
  await styleDictionaryGlobalStyles.buildAllPlatforms();

  // just tier 3...
  const styleDictionaryThirdTier = new StyleDictionary(configJsonThirdTier);
  await styleDictionaryThirdTier.buildAllPlatforms();

  console.log(green(`✅ Tokens files have been written to the ${outputDir} directory`));

  /**
   * * * * * * * * * * * * * * * * * * *
   * To avoid tracking changes in "build/scss/_variables.scss",
   * we parse the file to extract all SCSS variables and write them to a JSON file.
   * * * * * * * * * * * * * * * * * * *
   */

  const scssFilePath = '../../lib/styles/figma/_variables.scss';
  const scssFileContent = fs.readFileSync(scssFilePath, 'utf8');

  // add report.json in root for tracking
  const jsonFilePath = `report.json`;
  // fs.writeFileSync(jsonFilePath, JSON.stringify('', null, 2), 'utf8');

  const variables: Record<string, string> = {};
  const regex = /\$([-\w]+):\s*([^;]+);/gm;
  let match;

  while ((match = regex.exec(scssFileContent))) {
    if (match.length >= 3) {
      const [_, key, value] = match;
      variables[key] = value;
    }
  }

  const variableArray = Object.entries(variables)
    .map(([key, value]) => ({
      name: key,
      value: value,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Write the sorted array of objects to the JSON file
  fs.writeFileSync(jsonFilePath, JSON.stringify(variableArray, null, 2), 'utf8');

  console.log(green(`✅ Variables have been parsed and sorted. JSON file written to ${jsonFilePath}`));
}

main();
