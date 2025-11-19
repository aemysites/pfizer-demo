const fs = require('fs');
const path = require('path');

// review
function updateImports(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');

  // Replace all import paths from ./ to ./franklin-lib
  const updatedContent = fileContent.replaceAll(`from './`, `from './lib-franklin/`);

  // Write the updated content to the destination file
  fs.writeFileSync(filePath, updatedContent, 'utf8');
  console.log(`Successfully updated imports in ${filePath}`);
}

function copyIndex(isDev) {
  if (isDev) {
    const srcPath = path.join(__dirname, '../scripts/lib-franklin/index.js');
    const destPath = path.join(__dirname, '../scripts/lib-franklin.js');

    const mapPath = path.join(__dirname, '../scripts/lib-franklin.js.map');
    if (fs.existsSync(mapPath)) {
      fs.unlinkSync(mapPath);
    }

    fs.copyFile(srcPath, destPath, (err) => {
      if (err) {
        console.error(`Error copying file from ${srcPath} to ${destPath}:`, err);
      } else {
        updateImports(destPath);
        const appendContent = `/* GENERATED FILE DO NOT EDIT */\n/* EDIT scripts/lib-franklin/index.js */`;
        fs.appendFileSync(destPath, appendContent);

        console.log(`Successfully copied file from ${srcPath} to ${destPath}`);
      }
    });
  } else {
    const srcPathJs = path.join(__dirname, '../dist/lib-franklin.js');
    const destPathJs = path.join(__dirname, '../scripts/lib-franklin.js');
    const srcPathMap = path.join(__dirname, '../dist/lib-franklin.js.map');
    const destPathMap = path.join(__dirname, '../scripts/lib-franklin.js.map');

    fs.copyFile(srcPathJs, destPathJs, (err) => {
      if (err) {
        console.error(`Error copying file from ${srcPathJs} to ${destPathJs}:`, err);
      } else {
        console.log(`Successfully copied file from ${srcPathJs} to ${destPathJs}`);
      }
    });

    fs.copyFile(srcPathMap, destPathMap, (err) => {
      if (err) {
        console.error(`Error copying file from ${srcPathMap} to ${destPathMap}:`, err);
      } else {
        console.log(`Successfully copied file from ${srcPathMap} to ${destPathMap}`);
      }
    });
  }
}

// change all imports in index.js ./ to ./franklin-lib

module.exports = copyIndex;
