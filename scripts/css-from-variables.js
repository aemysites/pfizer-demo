const { readFile, writeFile } = require('node:fs/promises');

/**
 * npm run frontend:css-from-variables 'Xeljanz'
 */

const variableMappings = {
  primary: 'ref/primary/primary40',
  'on-primary': 'ref/primary/primary100',
  'primary-container': 'ref/primary/primary90',
  'on-primary-container': 'ref/primary/primary10',

  secondary: 'ref/secondary/secondary40',
  'on-secondary': 'ref/secondary/secondary100',
  'secondary-container': 'ref/secondary/secondary90',
  'on-secondary-container': 'ref/secondary/secondary10',

  tertiary: 'ref/tertiary/tertiary40',
  'on-tertiary': 'ref/tertiary/tertiary100',
  'tertiary-container': 'ref/tertiary/tertiary90',
  'on-tertiary-container': 'ref/tertiary/tertiary10',

  background: 'ref/neutral/neutral99',
  'on-background': 'ref/neutral/neutral10',

  surface: 'ref/neutral/neutral99',
  'surface-variant': 'ref/neutral-variant/neutral-variant90',
  'on-surface': 'ref/neutral/neutral10',
  'on-surface-variant': 'ref/neutral-variant/neutral-variant30',

  'system-surface-surface-1': 'surface/light/surface-1',
  'system-surface-surface-2': 'surface/light/surface-2',
  'system-surface-surface-3': 'surface/light/surface-3',
  'system-surface-surface-5': 'surface/light/surface-5',

  outline: 'ref/neutral-variant/neutral-variant50',

  'utility-error-error': 'ref/error/error40',
  'utility-error-on-error': 'ref/error/error100',
  'utility-error-error-container': 'ref/error/error90',
  'utility-error-on-error-container': 'ref/error/error10',

  'utility-warning-warning': 'ref/warning/warning40',
  'utility-success-success': 'ref/success/success40',

  'system-white': 'ref/neutral/neutral100',
  'system-black': 'ref/neutral/neutral0'
};

function asHex(num) {
  return Math.floor(num * 255)
    .toString(16)
    .padStart(2, '0');
}

async function createCssFileFromVariables(modeId, outputPath = './lib/styles/new-theme.css') {
  if (!modeId) {
    console.error('usage:\nnpm run frontend:css-from-variables <modeId> [outputPath]');
    return;
  }

  const { modes, variables } = JSON.parse(await readFile('./scripts/primitive-brands.json'));

  const entry = Object.entries(modes).find(([, value]) => value === modeId);
  const modeObject = entry ? { id: entry[0], name: entry[1] } : undefined;

  if (modeObject === undefined || !modeObject?.id || !modeObject?.name) {
    console.error(`"${modeId}" not found, options are:`);
    Object.values(modes).forEach((value) => {
      console.error(`- ${value}`);
    });

    return;
  }

  let output = ``;

  // add name to ouput
  output += `/* Brandkit colors for -- ${modeObject.name} */ \n \n`;
  output += ':root {\n';

  output += Object.entries(variableMappings)
    .map(([key, value]) => {
      const valueInRgb = variables.find((variable) => variable.name === value)?.valuesByMode[modeObject?.id];
      if(!valueInRgb) {
        console.log(`missing value for ${key} ${value}`)
      }

      return valueInRgb ? `  --lib-core--color-${key}: #${asHex(valueInRgb.r)}${asHex(valueInRgb.g)}${asHex(valueInRgb.b)};\n` : `  /* missing value for ${key} ${value} */\n`;
    })
    .filter(Boolean)
    .join('');

  output += '}';

  await writeFile(outputPath, output);
}

if (require.main === module) {
  if (!process.argv[2]) {
    console.error('missing brandName :\n npm run frontend:css-from-variables <modeId> [outputPath]');
  }
  const defaultOutputPath = './lib/styles/new-theme.css';

  createCssFileFromVariables(process.argv[2], process.argv[3] ?? defaultOutputPath);
}
