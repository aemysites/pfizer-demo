const util = require('util');
const glob = util.promisify(require('glob'));
const fs = require('fs').promises;

/**
 * core-library-version-2 
 * temporarily being changed while building
 */

/**
 * Rules associated with this script:
 * 1. All blocks must have a corresponding test file
 * 2. All blocks must import the core-utilities.js file << removed v2
 * 3. All blocks must use the platformFetchPage & platformCreateMarkup function
 * 4. All blocks must use one of the platformFetchPage or platformFetchBlock functions
 * 5. All test blocks must import the utilities.js file
 * 6. All test blocks must use the initLoad or initFetchLoad function
 */

// temporary while testing
const skipChecksLibrary = 'libraryfranklinpfizer-skip-checks';

// validate that all blocks have a corresponding test file
async function validateBlockTestMatch(blockFiles) {
  const errors = [];
  for (const blockFile of blockFiles) {
    // skip if the blockFile is in a 'template/' folder as we do migration
    if (blockFile.includes('template/')) {
      continue;
    }
    const correspondingTestFile = blockFile.replace('blocks', 'test/blocks').replace('.js', '.test.js');
    try {
      await fs.access(correspondingTestFile);
    } catch (err) {
      console.error(`\n❌ Missing test file: ${correspondingTestFile}`);
      process.exit(1);
    }
  }
}

// validate that all files import the correct functions
async function validateFiles(files, functionsToImport, fileToImportFrom, functionsFetchOptions) {
  const errors = [];

  for (const file of files) {
    // Skip if the file is in a 'template/' folder
    if (file.includes('template/')) {
      continue;
    }
    const content = await fs.readFile(file, 'utf8');

    // allow optional skip checks
    const skipChecks = content.indexOf(skipChecksLibrary);
    if (skipChecks > -1) {
      console.log(`🏳️ Skipping validation checks for file: ${file}`);
      continue;
    }

    // Check if the functions are imported from the correct file
    const importStatementIndex = content.indexOf(fileToImportFrom);
    if (importStatementIndex === -1) {
      errors.push(`File ${file} is not importing ${fileToImportFrom}`);
      continue; // skip further checks for this file
    }

    // enforce the minimal functions are used
    for (const functionRequired of functionsToImport) {
      const functionIndex = content.indexOf(functionRequired);
      if (functionIndex === -1) {
        errors.push(`File ${file} is not using required function: ${functionRequired}`);
      }
    }

    // enforce one of the two options are used for fetching
    if (functionsFetchOptions) {
      const atLeastOneOptionUsed = functionsFetchOptions.some((func) => content.includes(func));
      if (!atLeastOneOptionUsed) {
        errors.push(`File ${file} requires one of the fetch functions: ${functionsFetchOptions.join(', ')}`);
      }
    }
  }

  if (errors.length > 0) {
    console.error(`\n❌ Validation errors:\n${errors.join('\n')}`);
    process.exit(1);
  }
}

async function validate() {
  // disabled temporarily for now.... 
  // validate blocks
  // const blockFiles = await glob('lib/blocks/**/*.js');
  // const renderFunctionsToImport = ['platformCreateMarkup', 'platformOutputMarkup'];
  // const renderFunctionsFetchOptions = ['platformFetchPage', 'platformFetchBlock'];
  // const fileToImportFrom = '/scripts/core-utilities.js';
  // await validateBlockTestMatch(blockFiles);
  // await validateFiles(blockFiles, renderFunctionsToImport, fileToImportFrom, renderFunctionsFetchOptions);

  // validate test blocks
  const testFiles = await glob('lib/test/blocks/**/*.js');
  const testFunctionsToImport = ['basicBlockValidation'];//['initLoad', 'initFetchLoad', 'blocksChaiA11yAxe']; // 'consoleErrorSpy', 'getBlockHydrationAttribute', 'reportConsoleErrorSpy'
  const testFileToImportFrom = './basic-validation.js';//'/core-utilities/utilities.js';
  await validateFiles(testFiles, testFunctionsToImport, testFileToImportFrom);
}

// run validation with any catches
validate()
  .then(() => {
    console.log(`✅ All files have been validated`);
  })
  .catch((err) => {
    console.error('Error occurred during validation:', err);
    process.exit(1);
  });
