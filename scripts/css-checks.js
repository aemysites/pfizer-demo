const { validateColorDeclarations, validateColorMappings } = require('./colors.js');
const { cssparentValidation } = require('./css-parent-validation.js');
const { generateColorsJson } = require('./color-generator.js');

const blocksPath = '../lib/blocks/';
const colorTokensPath = '../lib/styles/tokens/color.scss';
const globalStylesPath = '../lib/styles/styles.css';
const themeStylesPath = '../lib/styles/tokens.css';

// exported from Figma
const variablesJSONPath = './variables.json';

/**
 * Validates the integrity of color variable declarations across the project.
 * The function ensures that color variables are only declared in designated files.
 * This is especially important when maintaining a single source of truth for color variables in regression testing.
 */
validateColorDeclarations(blocksPath, colorTokensPath, globalStylesPath, themeStylesPath);

/**
 * Ensures synchronization between CSS color variables and their corresponding Figma design tokens.
 * This function takes in brand and mode information, along with paths to global styles and a JSON file containing Figma variables.
 * It validates two main points:
 * 1) All CSS color variables should have an equivalent Figma variable.
 * 2) The values of these variables in both CSS and Figma should match.
 */
validateColorMappings('Meraki', 'light', themeStylesPath, variablesJSONPath);

/**
 * This module provides a set of functions to validate CSS selectors within a directory of CSS files.
 * Specifically, it checks whether each CSS selector includes a required "main component class" as part of its definition.
 * Each CSS file's content is parsed into a CSS tree. The module walks through this tree and validates each CSS selector
 * using the `validateSelector` function. This function checks if the selector includes the main component class,
 * which is dynamically generated based on the CSS file's name.
 *
 */
cssparentValidation('../lib/blocks', '.css');

/**
 * This function serves as the entry point for generating a JSON file containing color variables extracted
 * from a specified CSS or SCSS file. It initially checks if the file exists.
 * If so, it reads the file content and parses it into a CSS Abstract Syntax Tree (AST).
 * The parsed AST is then passed to the 'walkCssTree' function, which traverses the tree to collect color variable declarations.
 * The collected variables are saved in a JSON file for later use.
 */
generateColorsJson('../lib/styles/tokens/color.scss', '.scss');
