const fs = require('fs');
const path = require('path');

/**
 * Currently only designated for "Material Design Icons"
 * 
 * This script copies specified Material Design icons from the source directory 
 * (node_modules/@material-design-icons/svg) to the destination directory (lib/icons).
 * 
 * Functions:
 * - iconNameToPath(iconName): Converts an icon name to its corresponding file path.
 * - getIcon(iconName): Copies a single icon file from the source to the destination.
 * - getIcons(icons): Copies multiple icon files by calling getIcon for each icon name.
 * 
 * Usage:
 * - Install the dependency: @material-design-icons/svg
 *   npm i -D @material-design-icons/svg
 * - Run the script with icon names and styles as arguments:
 *   npm run mat-icons -- <icon name>-<icon style> <icon name>-<icon style> ...
 *   Example: npm run mat-icons -- thunderstorm phone_disabled bike_scooter-outlined boy-round diamond-sharp apps-two-tone
 */


const source = path.join(__dirname, '../node_modules/@material-design-icons/svg');
const destination = path.join(__dirname, '../lib/icons/'); 
const iconTypes = ['filled', 'outlined', 'round', 'sharp', 'two-tone'];

function iconNameToPath(iconName) {
  const style = iconTypes.find((el) => iconName.includes(el)) || iconTypes[0];
  const name = iconName.replace(`-${style}`, '').replace('mat-', '');
  return `${style}/${name}.svg`;
}

function getIcon(iconName) {
  return new Promise((res) => {
    const iconPath = iconNameToPath(iconName);
    fs.copyFile(`${source}/${iconPath}`, `${destination}mat-${iconName.replace(/_/g, '-')}.svg`, (err) => {
      if (err) {
        console.error(`Failed to get icon ${iconName}, ${err}\nInstall @material-design-icons/svg as a dev dependency`);
        res(false);
      }
      res(true);
    });
  });
}

function getIcons(icons) {
  const iconsToGet = Array.isArray(icons) ? icons: [icons];
  const promises = iconsToGet.map(getIcon);
  Promise.all(promises).then((results) => {
    const done = results.filter((r) => r).length;
    console.log(`${done} of ${promises.length} icons copied successfully to ${destination}.`);
  });
}

const icons = process.argv.slice(2);

getIcons(icons);

