/**
 * These scripts are just utility scripts for some tasks that are not part of the build process.
 */

const fs = require('fs');
const path = require('path');

// Path to blocks directory
const blocksDir = path.join(__dirname, '../lib/blocks');

try {
  // Read directory contents
  const blockFolders = fs.readdirSync(blocksDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  // Output results
  const excludedWords = ['poc', 'demo', "icon"];
  const filteredFolders = blockFolders.filter(folder => !excludedWords.some(word => folder.toLowerCase().includes(word)));
  const prefixedBlocks = filteredFolders.map(folder => `core-${folder}`);
  console.log('\nBlock folders found:');
  console.log('------------------');
  console.log(JSON.stringify(prefixedBlocks, null, 2));
  console.log(`\nTotal blocks: ${filteredFolders.length}`);

} catch (err) {
  console.error('Error reading blocks directory:', err);
  process.exit(1);
}
