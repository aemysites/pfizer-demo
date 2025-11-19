const fsp = require('fs/promises');
const path = require('path');
const terser = require('terser');

/**
 * Get a list of directories within a given root directory.
 * @param {string} root - The root directory to search within.
 * @returns {Promise<string[]>} - A promise that resolves to an array of directory names.
 */
async function getFolders(root) {
  const files = await fsp.readdir(root);
  const checkDirPromises = files.map((file) => fsp.stat(path.join(root, file)).then((stat) => (stat.isDirectory() ? file : null)));
  const results = await Promise.all(checkDirPromises);
  // Filters out null values, keeping only directories
  return results.filter(Boolean);
}

/**
 * Get a list of files within a given root directory, excluding collection containers.
 * @param {string} root - The root directory to search within.
 * @returns {Promise<string[]>} - A promise that resolves to an array of file paths.
 * @throws {Error} If the directory cannot be read or accessed.
 */
async function getFiles(root) {
  try {
    if (!root) {
      throw new Error('Root directory path is required');
    }

    await fsp.access(root).catch(() => {
      throw new Error(`Directory ${root} does not exist or cannot be accessed`);
    });

    const files = await fsp.readdir(root);
    const filePaths = files.filter((file) => !file.includes('collection-containers')).map((file) => path.join(root, file));
    return filePaths;
  } catch (error) {
    console.error(`Error getting files from ${root}:`, error);
    throw error;
  }
}

/**
 * Concatenate and compress JavaScript, JSON, and Mustache files within each block directory.
 * @returns {Promise<void>} - A promise that resolves when all files have been processed.
 */
async function concatAndCompress() {
  const root = path.join(__dirname, '../blocks');
  const folders = await getFolders(root);

  /**
   * Concatenate source files for a given block and compress the output.
   * @param {string} blockName - The name of the block to process.
   * @returns {Promise<void>} - A promise that resolves when the block has been processed.
   */
  async function concatSources(blockName) {
    try {
      const jsFile = path.join(root, blockName, `${blockName}.js`);
      const jsonFile = path.join(root, blockName, `${blockName}.json`);
      const smartCaptureFile = path.join(root, blockName, `smartcapture.json`);
      const mustacheFile = path.join(root, blockName, `${blockName}.mustache`);
      const filesExist = await Promise.all([
        fsp
          .access(jsonFile)
          .then(() => true)
          .catch(() => false),
        fsp
          .access(mustacheFile)
          .then(() => true)
          .catch(() => false),
      ]);

      if (!filesExist[0] || !filesExist[1]) {
        console.log(`Skipping ${blockName}: Required files are missing.`);
        return;
      }

      const [jsContent, jsonContent, mustacheContent, smartCaptureContent] = await Promise.all([
        fsp.readFile(jsFile, 'utf8'),
        fsp.readFile(jsonFile, 'utf8'),
        fsp.readFile(mustacheFile, 'utf8'),
        fsp.readFile(smartCaptureFile, 'utf8').catch((err) => {
          if (err.code === 'ENOENT') {
            console.warn(`Warning: ${smartCaptureFile} not found. Skipping.`);
            return '{}';
          }
          throw err;
        }),
      ]);

      const outputFile = `${root}/${blockName}/${blockName}-dist.js`;
      const output = `
                ${jsContent}
                export const schema = \`${jsonContent}\`;
                export const template = \` ${mustacheContent}\`;
                export const smartCaptureConfig = \` ${smartCaptureContent}\`;
            `;
      const minified = await terser.minify(output);

      await fsp.writeFile(outputFile, '/* eslint-disable */ \n'.concat(minified.code));
      console.log(`Successfully generated ${outputFile}`);
    } catch (error) {
      console.error(`Error processing ${blockName}:`, error);
    }
  }

  return Promise.all(folders.map(concatSources));
}

/**
 * Removes import statements from a file.
 * @param {string} filePath - Path to the file to process.
 * @returns {Promise<string>} - A promise that resolves to the file content with imports removed.
 */
async function removeImports(filePath) {
  try {
    const fileContent = await fsp.readFile(filePath, 'utf8');
    const updatedContent = fileContent.replace(/^import\s+.*;$/gm, '');
    return updatedContent;
  } catch (error) {
    console.error(`Error reading or processing file ${filePath}:`, error);
    return '';
  }
}

/**
 * Concatenates and minifies collection container files.
 * @returns {Promise<void>} - A promise that resolves when concatenation is complete.
 */
async function concatCollectionContainers() {
  try {
    const collectionsFilePath = path.join(__dirname, '../collection-containers/collection-containers.js');
    const collectionFilesContent = await removeImports(collectionsFilePath);

    const collectionsDir = path.join(__dirname, '../collection-containers');
    const files = await getFiles(collectionsDir);

    const fileContents = await Promise.all(
      files.map(async (file) => {
        const fileContent = await fsp.readFile(file, 'utf8');
        return fileContent.replace('export default', 'export');
      })
    );

    const concatenatedContent = fileContents.join('\n');

    const outputFilePath = path.join(collectionsDir, '../collection-containers/collection-containers-dist.js');
    const minified = await terser.minify(`
    ${concatenatedContent}
    ${collectionFilesContent}`);
    await fsp.writeFile(outputFilePath, '/* eslint-disable */ \n'.concat(minified.code));
    console.log(`Successfully created ${outputFilePath}`);
  } catch (error) {
    console.error('Error concatenating collections', error);
  }
}

async function changeImport(isDev) {
  const filePath = path.join(__dirname, '../scripts/lib-franklin/lib-franklin-helpers.js');
  const fileContent = await fsp.readFile(filePath, 'utf8');
  let updatedContent = isDev
    ? fileContent.replace(
        /import\s+createCollectionContainerFn from '..\/collection-containers\/collection-containers-dist.js';/g,
        "import createCollectionContainerFn from '../collection-containers/collection-containers.js';"
      )
    : fileContent.replace(
        /import\s+createCollectionContainerFn from '..\/collection-containers\/collection-containers.js';/g,
        "import createCollectionContainerFn from '../collection-containers/collection-containers-dist.js';"
      );
  updatedContent = isDev
    ? updatedContent.replace('const useConcatenatedSources = true;', 'const useConcatenatedSources = false;')
    : updatedContent.replace('const useConcatenatedSources = false;', 'const useConcatenatedSources = true;');
  await fsp.writeFile(filePath, updatedContent);
  console.log('Updated lib-franklin-helpers.js');
}

async function concat(isDev) {
  try {
    await (isDev ? changeImport(true) : changeImport(false));
    if (!isDev) {
      await Promise.all([concatAndCompress(), concatCollectionContainers()]);
    }
  } catch (error) {
    console.error('Error running concat:', error);
  }
}

module.exports = concat;
