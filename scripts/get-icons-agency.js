const fs = require('fs');
const path = require('path');

// Constants
const source = path.join(__dirname, './icons-src-agency/');
const destination = path.join(__dirname, '../lib/icons/');
const acceptableIconTypes = ['100', '300', '500'];
const migrationExceptions = ['placeholder', 'social-facebook', 'social-instagram', 'social-x', 'star-filled'];

/**
 * Recursively reads a directory and its subdirectories to collect all file paths.
 *
 * @param {string} dir - The directory to read.
 * @returns {Promise<Array<string>>} - A promise that resolves to the list of file paths.
 */
async function readDirectoryRecursively(dir) {
  const files = await fs.promises.readdir(dir, { withFileTypes: true });
  const fileList = await Promise.all(files.map(async (file) => {
    const filePath = path.join(dir, file.name);
    if (file.isDirectory()) {
      return readDirectoryRecursively(filePath);
    } 
      return filePath;
    
  }));
  return fileList.flat();
}

/**
 * Removes all .DS_Store files from a directory and its subdirectories.
 *
 * @param {string} dir - The directory to clean.
 */
async function removeDSStoreFiles(dir) {
  const files = await readDirectoryRecursively(dir);
  await Promise.all(files.map(async (file) => {
    if (path.basename(file) === '.DS_Store') {
      await fs.promises.unlink(file);
      console.log(`Removed .DS_Store file: ${file}`);
    }
  }));
}

/**
 * Renames the icon names based on their weight and replaces underscores and spaces with hyphens.
 *
 * @param {string} iconPath - The path of the icon file.
 * @returns {string} - The renamed icon path.
 */
function renameIconNames(iconPath) {
  const iconName = path.basename(iconPath).replace(/[_\s]/g, '-');
  const weightMatch = iconName.match(/-(\d+)\.svg$/);
  const weight = weightMatch ? weightMatch[1] : null;
  const baseName = iconName.replace(/-\d+\.svg$/, '');
  const iconNameWithoutExtension = iconName.replace(/\.svg$/, '');

  // Original file if included in the migration exceptions
  if (migrationExceptions.includes(iconNameWithoutExtension)) return `${iconName}`;

  if (weight === '500') return `${baseName}-bold.svg`;
  if (weight === '100') return `${baseName}-light.svg`;
  return `${baseName}.svg`;
}

/**
 * Validates and processes a single icon file.
 *
 * @param {string} iconPath - The path of the icon file.
 * @returns {Promise<boolean>} - A promise that resolves to true if the icon was processed successfully, false otherwise.
 */
async function getIcon(iconPath) {
  const iconName = path.basename(iconPath).replace(/[_\s]/g, '-');
  const lastFolder = path.basename(path.dirname(iconPath)).replace(/[_\s]/g, '-');

  if (!iconName.endsWith('.svg') || !iconName.startsWith(lastFolder) || !acceptableIconTypes.some(type => iconName.endsWith(`-${type}.svg`))) {
    if (!migrationExceptions.includes(lastFolder)) {
      throw new Error(`Invalid icon file: ${iconName} ${lastFolder}`);
    }
  }

  const destinationRenamed = path.join(destination, renameIconNames(iconName));
  await fs.promises.mkdir(path.dirname(destinationRenamed), { recursive: true });

  try {
    const data = await fs.promises.readFile(iconPath, 'utf8');
    const updatedData = data.replace(/fill="black"/g, 'fill="currentcolor"');
    await fs.promises.writeFile(destinationRenamed, updatedData, 'utf8');
    return true;
  } catch (err) {
    console.error(`Failed to process icon ${iconName}: ${err.message}`);
    throw err;
  }
}

/**
 * Processes all icons in the source directory.
 */
async function getIconsAgency() {
  try {
    await removeDSStoreFiles(source);
    const allIcons = await readDirectoryRecursively(source);
    const promises = allIcons.map(icon => getIcon(icon));
    const results = await Promise.all(promises);
    const done = results.filter(Boolean).length;
    console.log(`${done} of ${promises.length} icons copied successfully to ${destination}.`);
  } catch (error) {
    console.error('Error processing icons:', error);
  }
}

// Start processing icons
getIconsAgency();