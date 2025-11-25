import StyleDictionary from 'style-dictionary';
// import { formattedVariables } from 'style-dictionary/utils';

// Define a type for the tokens
interface Token {
  name: string;
  value: any;
  type: string;
}

// You can use the .registerParser() method like this
StyleDictionary.registerParser({
  name: 'json-custom',
  pattern: /\.json$/,
  parser: ({ contents, filePath }) => {
    if (!filePath) {
      throw new Error('filePath is required');
    }

    return new Promise((resolve, reject) => {
      try {
        const object = JSON.parse(contents);
        const output: Record<string, unknown> = {};

        for (const key in object) {
          if (object.hasOwnProperty(key)) {
            const element = object[key];
            output[`${key}`] = element;
          }
        }

        return output;
      } catch (error) {
        console.error(error);
        reject(error);
      }
    });
  },
});

// Primitives //////////////////////////////////////////////////////////////////////
StyleDictionary.registerFormat({
  name: 'scss/variables-for-primitives',
  format: function ({ dictionary, options, file }) {
    const tokenTierOne: Token[] = [];

    dictionary.allTokens.forEach((token: any) => {
      if (token.isPrimitive) {
        tokenTierOne.push(token);
      }
    });

    // Sort primitives alphabetically by name
    const sortByName = (a: Token, b: Token) => a.name.localeCompare(b.name);
    tokenTierOne.sort(sortByName);

    // Generate SCSS variables for primitives with color grouping
    const scss_Tier_One = tokenTierOne
      .reduce((acc, token) => {
        const qualifiedName = (token as { originalName?: string }).originalName || token?.name;
        let modifiedValue = token?.value;
        if (token?.type === 'number' && !token?.name.includes('letter-space') && !token?.name.includes('font-weight')) {
          modifiedValue = `${token.value}px`;
        }
        return acc + `$${qualifiedName}: ${modifiedValue};\n`;
      }, '')
      .trim();

    // Return only primitives tokens
    return `// ${`Generated on ${new Date().toUTCString()}`}\n\n// ::  T I E R - O N E  - is "primitives"  ::::::::::::::::::::::::::::::: \n
${scss_Tier_One}`;
  },
});

StyleDictionary.registerFormat({
  name: 'css/variables-for-primitives',
  format: function ({ dictionary, options, file }) {
    const tokenTierOne: Token[] = [];

    dictionary.allTokens.forEach((token: any) => {
      if (token.isPrimitive) {
        tokenTierOne.push(token);
      }
    });

    // Sort primitives alphabetically by name
    const sortByName = (a: Token, b: Token) => a.name.localeCompare(b.name);
    tokenTierOne.sort(sortByName);

    // Generate SCSS variables for primitives with color grouping
    const scss_Tier_One = tokenTierOne
      .reduce((acc, token) => {
        const qualifiedName = (token as { originalName?: string }).originalName || token.name;
        let modifiedValue = token.value;
        if (token.type === 'number' && !token.name.includes('letter-space') && !token.name.includes('font-weight')) {
          modifiedValue = `${token.value}px`;
        }
        return acc + `  --${qualifiedName}: ${modifiedValue};\n`;
      }, '')
      .trim();

    // Return only primitives tokens
    return `/* ${`Generated on ${new Date().toUTCString()}`}*/\n\n/* ::  T I E R - O N E  - is "primitives"  :::::::::::::::::::::::::::::::*/ \n:root {\n  ${scss_Tier_One} \n }`;
  },
});

/**
 * Standardizes a collection name by converting to lowercase, removing special characters,
 * replacing spaces and dots with hyphens, and ensuring consistent hyphen usage
 * @param collectionName - The collection name to standardize
 * @returns The standardized collection name
 */
const standardizeCollectionName = (collectionName: string = '') => {
  const updatedCollectionName = collectionName
    .toLowerCase() // Convert to lowercase
    .replace(/[^a-z0-9\s.-]/g, '') // Remove any chars except letters, numbers, spaces, dots and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/\.+/g, '-') // Replace dots with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim(); // Remove leading/trailing spaces

  // Replace multiple consecutive hyphens with a single hyphen
  return updatedCollectionName.replace(/-{2,}/g, '-');
};

/**
 * Validates that a CSS property key follows the required format:
 * Must start with $ followed by letters/numbers, then ---, then letters/numbers/hyphens
 * @param cssPropKey - The CSS property key to validate
 * @throws Error if the key format is invalid
 */
const validateCssPropKey = (cssPropKey: string): void => {
  const keyRegex = /^\$[a-z0-9][-a-z0-9]*---[a-z0-9-]+$/;
  if (!keyRegex.test(cssPropKey)) {
    throw new Error(`Invalid prop [key] format: ${cssPropKey}.`);
  }
};

/**
 * Validates that a CSS property value contains only allowed characters:
 * Letters, numbers, #, spaces, single quotes, commas, and hyphens
 * @param cssPropValue - The CSS property value to validate
 * @throws Error if the value format is invalid
 */
const validateCssPropValue = (cssPropValue: string): void => {
  const valueRegex = /^[a-z0-9#\s',-]+$/;
  if (!valueRegex.test(cssPropValue.toLowerCase())) {
    throw new Error(`Invalid prop [value] format: ${cssPropValue}. Expected format: #RRGGBBAA or font name`);
  }
};

/**
 * Validates that a CSS property value contains only allowed characters:
 * Letters, numbers, #, spaces, single quotes, commas, and hyphens
 * @param cssPropValue - The CSS property value to validate
 * @throws Error if the value format is invalid
 */
const validateVarStackValues = (varStackValues: string): void => {
  const valueRegex = /^var\(--[a-z0-9-]+,\s*--[a-z0-9-]+\)$/;
  if (!valueRegex.test(varStackValues)) {
    throw new Error(`Invalid prop [validateVarStackValues] format: ${varStackValues} expected: var(--property-name, --fallback-name)`);
  }
};

/**
 * Converts a token name to kebab case by converting to lowercase
 * and replacing forward slashes and spaces with hyphens
 * @param tokenName - The token name to convert
 * @returns The converted token name in kebab case
 */
const convertTokenCaseToDashes = (tokenName: string) => {
  return tokenName?.toLowerCase().replace(/\//g, '-').replace(/\s+/g, '-');
};

// just a-z brands
// SCSS Variables for A-Z Brands
StyleDictionary.registerFormat({
  name: 'scss/variables-for-a-to-z-brands',
  format: function ({ dictionary, options, file }) {
    dictionary.allTokens.forEach((token: any) => {
      if (token.isTierTwo && token?.collectionParentModes) {
        const nestedModes: any = [];

        // loop over collectionParentModes
        token?.collectionParentModes.forEach((individualMode: any) => {
          const modeNameFriendly = standardizeCollectionName(individualMode.name);

          const commentReference = `${token.collectionParentName} || ${modeNameFriendly} || ${token.originalName}`;
          const referencedTokens = {
            modeColumnName: modeNameFriendly,
            originalName: individualMode.name,
            modeId: individualMode.modeId,
            commentReference,
            originalValue: token?.value,
            primitiveReferenceTokenName: individualMode?.primitiveReference?.name,
            primitiveReferenceTokenNameFormatted: convertTokenCaseToDashes(individualMode?.primitiveReference?.name),
          };
          nestedModes.push(referencedTokens);
        });

        // add to token...
        token.nestedModes = nestedModes;
      }

      if (token.isTierTwo && token?.nativeValue) {
        // throw new Error('token?.nativeValue', token);
      }
    });

    const scss_Tier_Two = dictionary.allTokens
      .filter((token: any) => {
        if (token.isTierTwo) {
          if (token?.collectionParentModeName?.includes('- Brand Name')) {
            if (token?.collectionParentModeName?.includes('[A')) {
              return true;
            }
            return false;
          }
          return true;
        }
      })
      .reduce((acc: string, token: any) => {
        if (token.name.includes('delete')) return acc;

        let modeVariables = '';

        if (token?.nestedModes) {
          token?.nestedModes?.forEach((mode: any) => {
            const brandName = mode.modeColumnName;
            const varName = `$${brandName}`;
            const primitiveVarName = mode.primitiveReferenceTokenNameFormatted;
            const tokenOriginalValue = token.value;

            const cssPropKey = `$${token.originalName}`;
            const cssPropValue = tokenOriginalValue;

            // Allow syntax for cssPropKey: '$z-brand-name-2---color-extended-extended-seed-60'
            // validateCssPropKey(cssPropKey);

            // Allow syntax for cssPropValue: '#RRGGBBAA'
            validateCssPropValue(cssPropValue);

            modeVariables += `// ${mode.commentReference}\n${cssPropKey}: var(--${primitiveVarName}, ${cssPropValue});\n`;
          });
        }

        if (token?.nativeValue) {
          if (token?.staticModeValues) {
            token.staticModeValues.forEach((mode: any, index: number) => {
              const brandName = mode.name;
              const varName = `$` + standardizeCollectionName(brandName);
              const tokenOriginalValue = token.value;

              const cssPropKey = `${varName}---${token.originalName}`;
              const cssPropValue = tokenOriginalValue;

              // Allow syntax for cssPropKey: '$z-brand-name-2---color-extended-extended-seed-60'
              validateCssPropKey(cssPropKey);

              // Allow syntax for cssPropValue: '#RRGGBBAA'
              validateCssPropValue(cssPropValue);

              modeVariables += `// ${token.collectionParentName} || ${mode?.name} || [nativeValue]\n${cssPropKey}: var(${cssPropValue});\n`;
            });
          }
        }

        return acc + modeVariables;
      }, '')
      .trim();

    // Return only primitives tokens
    return `// ${`Generated on ${new Date().toUTCString()}`}\n\n// ::  T I E R - T W O is - "2. A-Z Brands"  ::::::::::::::::::::::::::::::: \n
${scss_Tier_Two}`;
  },
});

// CSS Variables for A-Z Brands
StyleDictionary.registerFormat({
  name: 'css/variables-for-a-to-z-brands',
  format: function ({ dictionary, options, file }) {
    dictionary.allTokens.forEach((token: any) => {
      if (token.isTierTwo && token?.collectionParentModes) {
        const nestedModes: any = [];

        // loop over collectionParentModes
        token?.collectionParentModes.forEach((individualMode: any) => {
          const modeNameFriendly = standardizeCollectionName(individualMode.name);

          const commentReference = `${token.collectionParentName} || ${modeNameFriendly} || ${token.originalName}`;
          const referencedTokens = {
            modeColumnName: modeNameFriendly,
            originalName: individualMode.name,
            modeId: individualMode.modeId,
            commentReference,
            originalValue: token?.value,
            primitiveReferenceTokenName: individualMode?.primitiveReference?.name,
            primitiveReferenceTokenNameFormatted: convertTokenCaseToDashes(individualMode?.primitiveReference?.name),
          };
          nestedModes.push(referencedTokens);
        });

        // add to token...
        token.nestedModes = nestedModes;
      }

      if (token.isTierTwo && token?.nativeValue) {
        // throw new Error('token?.nativeValue', token);
      }
    });

    const scss_Tier_Two = dictionary.allTokens
      .filter((token: any) => {
        if (token.isTierTwo) {
          if (token.collectionParentModeName.includes('- Brand Name')) {
            if (token.collectionParentModeName.includes('[A')) {
              return true;
            }
            return false;
          }
          return true;
        }
      })
      .reduce((acc: string, token: any) => {
        if (token.name.includes('delete')) return acc;

        let modeVariables = '';

        if (token?.nestedModes) {
          token.nestedModes.forEach((mode: any) => {
            const brandName = mode.modeColumnName;
            const varName = `  --${brandName}`;
            const primitiveVarName = mode.primitiveReferenceTokenNameFormatted;
            const tokenOriginalValue = token.value;

            const cssPropKey = `${varName}---${token.originalName}`;
            const cssPropValue = tokenOriginalValue;

            // Allow syntax for cssPropKey: '$z-brand-name-2---color-extended-extended-seed-60'
            // validateCssPropKey(cssPropKey);

            // Allow syntax for cssPropValue: '#RRGGBBAA'
            validateCssPropValue(cssPropValue);

            modeVariables += `  /* ${mode.commentReference}*/ \n${cssPropKey}: var(--${primitiveVarName}, ${cssPropValue});\n`;
          });
        }

        if (token?.nativeValue) {
          if (token?.staticModeValues) {
            token.staticModeValues.forEach((mode: any, index: number) => {
              const brandName = mode.name;
              const varName = `  --` + standardizeCollectionName(brandName);
              const tokenOriginalValue = token.value;

              const cssPropKey = `${varName}---${token.originalName}`;
              const cssPropValue = tokenOriginalValue;

              // Allow syntax for cssPropKey: '$z-brand-name-2---color-extended-extended-seed-60'
              // validateCssPropKey(cssPropKey);

              // Allow syntax for cssPropValue: '#RRGGBBAA'
              validateCssPropValue(cssPropValue);

              modeVariables += `  /* ${token.collectionParentName} || ${mode?.name} || [nativeValue]*/\n${cssPropKey}: ${cssPropValue};\n`;
            });
          }
        }

        return acc + modeVariables;
      }, '')
      .trim();

    // Return only primitives tokens
    return `/* ${`Generated on ${new Date().toUTCString()}`}*/\n\n/* ::  T I E R - T W O is - "2. A-Z Brands"  :::::::::::::::::::::::::::::::*/ \n:root {\n  ${scss_Tier_Two} \n }`;
  },
});

// for tier 3 which is "1. Select Brand Initial"
StyleDictionary.registerFormat({
  name: 'scss/variables-third-tier',
  format: function ({ dictionary }) {
    dictionary.allTokens.forEach((token: any) => {
      if (token.isTierThree && token?.collectionParentModes) {
        const nestedModes: any = [];

        // loop over collectionParentModes
        token?.collectionParentModes.forEach((individualMode: any) => {
          const modeNameFriendly = standardizeCollectionName(individualMode.name);

          const commentReference = `${token?.collectionParentName} || ${modeNameFriendly} || ${token.originalName}`;
          const referencedTokens = {
            modeColumnName: modeNameFriendly,
            originalName: individualMode?.name,
            modeId: individualMode?.modeId,
            commentReference,
            originalValue: token?.value,
            primitiveReferenceTokenName: individualMode?.primitiveReference?.name,
            primitiveReferenceTokenNameFormatted: convertTokenCaseToDashes(individualMode?.primitiveReference?.name),
            correctPrimitiveName: individualMode?.primitiveReference?.correctPrimitiveName,
          };
          nestedModes.push(referencedTokens);
        });

        // add to token...
        token.nestedModes = nestedModes;
      }
    });

    const scss_Tier_Three = dictionary.allTokens
      .filter((token: any) => token.isTierThree)
      .reduce((acc: string, token: any) => {
        if (token.name.includes('delete')) return acc;

        // for Tier 3 we require nestedModes
        if (!token?.nestedModes) {
          console.error('no Nesting Available :: ', token?.id);
          throw new Error('no Nesting Available');
        }

        let modeVariables = '';

        if (token?.nestedModes) {
          token.nestedModes.forEach((mode: any) => {
            // >>> Important we are filtering for ONLY column "A" <<<<<
            if (mode.originalName !== 'A') return;

            const brandName = mode.modeColumnName;
            const varName = `--${brandName}`;
            const referencedTokenName = mode?.primitiveReferenceTokenNameFormatted;
            const localTokenName = token?.originalName;
            const cssPropKey = `$${token?.originalName}`;
            const varCombinations = `var(${varName}--${localTokenName}, --${mode?.correctPrimitiveName}---${referencedTokenName})`;

            // if (token.id == 'VariableID:76:641') throw new Error('validate');

            // Allow syntax for cssPropKey
            // validateCssPropKey(cssPropKey);

            // Allow syntax for varCombinations
            validateVarStackValues(varCombinations);

            modeVariables += `/* ${mode?.commentReference}*/\n${cssPropKey}: ${varCombinations};\n`;
          });
        }

        // not using: if (token?.nativeValue) ...

        return acc + modeVariables;
      }, '')
      .trim();

    // Return only primitives tokens
    return `// ${`Generated on ${new Date().toUTCString()}`}\n\n// ::  T I E R - T H R E E is - "1. Select Brand Initial"  ::::::::::::::::::::::::::::::: \n
${scss_Tier_Three}`;
  },
});

StyleDictionary.registerFormat({
  name: 'css/variables-third-tier',
  format: function ({ dictionary, options, file }) {
    const prependName = standardizeCollectionName(options?.platforms?.css?.additionalParameters);
    dictionary.allTokens.forEach((token: any) => {
      if (token.isTierThree && token?.collectionParentModes) {
        const nestedModes: any = [];

        // loop over collectionParentModes
        token?.collectionParentModes.forEach((individualMode: any) => {
          const modeNameFriendly = standardizeCollectionName(individualMode.name);

          const commentReference = `${token?.collectionParentName} || ${modeNameFriendly} || ${token?.originalName}`;
          const referencedTokens = {
            modeColumnName: modeNameFriendly,
            originalName: individualMode.name,
            modeId: individualMode?.modeId,
            commentReference,
            originalValue: token?.value,
            primitiveReferenceTokenName: individualMode?.primitiveReference?.name,
            primitiveReferenceTokenNameFormatted: convertTokenCaseToDashes(individualMode?.primitiveReference?.name),
            correctPrimitiveName: individualMode?.primitiveReference?.correctPrimitiveName,
          };
          nestedModes.push(referencedTokens);
        });

        // add to token...
        token.nestedModes = nestedModes;
      }
    });

    const scss_Tier_Three = dictionary.allTokens
      .filter((token: any) => token.isTierThree)
      .reduce((acc: string, token: any) => {
        if (token.name.includes('delete')) return acc;

        // for Tier 3 we require nestedModes
        if (!token?.nestedModes) {
          console.error('no Nesting Available :: ', token?.id);
          throw new Error('no Nesting Available');
        }

        let modeVariables = '';

        if (token?.nestedModes) {
          token.nestedModes.forEach((mode: any, index: any) => {
            // >>> Important we are filtering for ONLY column "A" <<<<<
            if (mode.originalName !== 'A') return;

            const brandName = mode?.modeColumnName;
            const varName = `--${brandName}`;
            const referencedTokenName = mode?.primitiveReferenceTokenNameFormatted;
            const localTokenName = token?.originalName;
            const cssPropKey = `  --${token?.originalName}`;
            const varCombinations = `var(${varName}--${localTokenName}, var(--${mode?.correctPrimitiveName}---${referencedTokenName}))`;

            // if (token.id == 'VariableID:76:641') throw new Error('validate');

            // Allow syntax for cssPropKey
            // validateCssPropKey(cssPropKey);

            // Allow syntax for varCombinations
            // validateVarStackValues(varCombinations);

            modeVariables += `  /* ${mode.commentReference}*/\n${cssPropKey}: ${varCombinations};\n`;
          });
        }

        // not using: if (token?.nativeValue) ...

        return acc + modeVariables;
      }, '')
      .trim();

    // Return only primitives tokens
    return `/* ${`Generated on ${new Date().toUTCString()}`}*/\n\n/*::  T I E R - T H R E E is - "1. Select Brand Initial"  :::::::::::::::::::::::::::::::*/ \n
:root {\n  ${scss_Tier_Three} \n }`;
  },
});

// all tokens still runs but we are not using in the same way, but keeping for now
export const configJson = {
  source: ['build/tokens_generated/**/*.json'],
  platforms: {
    scss: {
      transformGroup: 'custom/scss',
      buildPath: '../../lib/styles/figma/',
      files: [
        {
          destination: '_variables.scss',
          format: 'scss/variables-sorted-for-branding',
          options: {
            outputReferences: true,
          },
        },
      ],
    },
  },
};

// Primitives :: build/tokens_generated/primitives.json ////////////////////////////
export const configJsonPrimitives = {
  // source: ['scripts/style-dictionary-figma/build/tokens_raw.json'],
  source: ['build/tokens_generated/primitives.json'],
  platforms: {
    scss: {
      transformGroup: 'custom/scss',
      buildPath: '../../lib/styles/figma/',
      files: [
        {
          destination: '_tier_one__primitives.scss',
          format: 'scss/variables-for-primitives',
          options: {
            outputReferences: true,
          },
        },
      ],
    },
    css: {
      transformGroup: 'custom/css',
      buildPath: '../../lib/styles/figma/',
      files: [
        {
          destination: '_tier_one__primitives.css',
          format: 'css/variables-for-primitives',
          options: {
            outputReferences: true,
          },
        },
      ],
    },
  },
};

// just 2. A Brandex ///////////////////////////////////////
export const configJsonAandZbrands = {
  source: ['build/tokens_generated/2-*-brands.json'],
  platforms: {
    scss: {
      transformGroup: 'custom/scss',
      buildPath: '../../lib/styles/figma/',
      files: [
        {
          destination: '_tier_2__atoz_brands.scss',
          format: 'scss/variables-for-a-to-z-brands',
          options: {
            outputReferences: true,
          },
        },
      ],
    },
    css: {
      transformGroup: 'custom/css',
      buildPath: '../../lib/styles/figma/',
      files: [
        {
          destination: '_tier_2__atoz_brands.css',
          format: 'css/variables-for-a-to-z-brands',
          options: {
            outputReferences: true,
          },
        },
      ],
    },
  },
  // log: {
  //   verbosity: 'verbose' as 'verbose' | 'default' | 'silent',
  // },
};

// just 2. A Brandex ///////////////////////////////////////
export const configJsonThirdTier = {
  source: ['build/tokens_generated/1-select-brand-initial.json'],
  platforms: {
    scss: {
      transformGroup: 'custom/scss',
      buildPath: '../../lib/styles/figma/',
      files: [
        {
          destination: '_tier_3__select_brand_initial.scss',
          format: 'scss/variables-third-tier',
          options: {
            outputReferences: true,
          },
        },
      ],
    },
    css: {
      transformGroup: 'custom/css',
      buildPath: '../../lib/styles/figma/',
      files: [
        {
          destination: '_tier_3__select_brand_initial.css',
          format: 'css/variables-third-tier',
          options: {
            outputReferences: true,
          },
        },
      ],
    },
  },
  // log: {
  //   verbosity: 'verbose' as 'verbose' | 'default' | 'silent',
  // },
};

// just 3. Global Styles ///////////////////////////////////////
export const configJsonGlobalStyles = {
  source: ['build/tokens_generated/3-global-styles.json'],
  platforms: {
    scss: {
      transformGroup: 'custom/scss',
      buildPath: '../../lib/styles/figma/',
      files: [
        {
          destination: '_tier_2__global_styles.scss',
          format: 'scss/variables-for-a-to-z-brands', // <<< use same format as 2. A-Z Brands
          options: {
            outputReferences: true,
          },
        },
      ],
    },
    css: {
      transformGroup: 'custom/css',
      buildPath: '../../lib/styles/figma/',
      files: [
        {
          destination: '_tier_2__global_styles.css',
          format: 'css/variables-for-a-to-z-brands',
          options: {
            outputReferences: true,
          },
        },
      ],
    },
  },
};
