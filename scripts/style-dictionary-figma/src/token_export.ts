import { GetLocalVariablesResponse, LocalVariable, VariableAlias } from '@figma/rest-api-spec';
import { rgbToHex } from './color.js';
import { TokensFile } from './token_types.js';

function tokenTypeFromVariable(variable: LocalVariable) {
  switch (variable.resolvedType) {
    case 'BOOLEAN':
      return 'boolean';
    case 'COLOR':
      return 'color';
    case 'FLOAT':
      return 'number';
    case 'STRING':
      return 'string';
  }
}

function tokenValueFromVariable(variable: LocalVariable, modeId: string, localVariables: any, localVariableCollections: any) {
  if (variable) {
    const value = variable.valuesByMode[modeId];
    if (typeof value === 'object') {
      if ('type' in value && value.type === 'VARIABLE_ALIAS') {
        const aliasedVariable = localVariables[value.id];
        return tokenValueFromVariable(aliasedVariable, modeId, localVariables, localVariableCollections);
      } else if ('r' in value) {
        return rgbToHex(value);
      }

      throw new Error(`Format of variable value is invalid: ${value}`);
    } else {
      if (!value) {
        const newValue: any = Object.values(variable.valuesByMode)[0];
        if (!isNaN(Number(newValue))) {
          return Number(newValue);
        }
        if (typeof newValue === 'object') {
          if (newValue && 'r' in newValue) {
            return rgbToHex(newValue);
          } else if ('type' in newValue && newValue.type === 'VARIABLE_ALIAS') {
            const aliasedVariable = localVariables[newValue.id];
            return tokenValueFromVariable(aliasedVariable, modeId, localVariables, localVariableCollections);
          }
        }
        return String(newValue);
      }
      return value;
    }
  }
  return null;
}

const standardizeCollectionName = (collectionName: string) => {
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

export async function tokenFilesFromLocalVariables(localVariablesResponse: GetLocalVariablesResponse) {
  const tokensFiles: { [fileName: string]: TokensFile } = {};
  const localVariableCollections = localVariablesResponse.meta.variableCollections;
  const localVariables = localVariablesResponse.meta.variables;

  Object.values(localVariableCollections).forEach(async (collection, index) => {
    if (!collection.variableIds) return;

    collection?.variableIds.forEach((variableId) => {
      const variable = localVariables[`${variableId}`];
      if (variable.remote === true) return;

      const collection = localVariableCollections[variable.variableCollectionId];
      const getCollectionName = collection?.name;

      const standardizedCollectionName = standardizeCollectionName(getCollectionName);

      // Test for invalid characters in standardizedCollectionName
      if (!/^[a-z0-9-]+$/.test(standardizedCollectionName)) {
        throw new Error(`Collection name "${standardizedCollectionName}" contains invalid characters. Only lowercase letters, numbers and hyphens are allowed.`);
      }

      // Initialize collection in tokensFiles if it doesn't exist
      if (!tokensFiles[standardizedCollectionName]) {
        tokensFiles[standardizedCollectionName] = {};
      }

      const getId = variable.id;
      const getNameConverted = variable.name
        .replace(/[^a-zA-Z0-9\s-]/g, '-')
        .replace(/ /g, '-')
        .replace(/\//g, '-')
        .toLowerCase();

      const token: any = {
        name: getNameConverted,
        originalName: getNameConverted,
        id: getId,
        type: tokenTypeFromVariable(variable),
        value: tokenValueFromVariable(variable, 'light', localVariables, localVariableCollections),
        description: variable.description,
        collectionParentName: standardizedCollectionName,
        collectionParentId: collection.id,
        collectionParentDefaultModeId: collection.defaultModeId,
        collectionParentModeName: collection.modes.filter((mode) => mode.modeId === collection.defaultModeId)[0].name,
      };

      if (standardizedCollectionName === 'primitives') token.isPrimitive = 'true';

      // construct data needed for inheritance for Tier 2 and 3 //////////////////////
      const isTierTwoStructure = (standardizedCollectionName.startsWith('2-') && standardizedCollectionName.endsWith('brands')) || standardizedCollectionName === '3-global-styles';
      const isTierThreeStructure = standardizedCollectionName === '1-select-brand-initial';

      // we use same for both tiers but slightly change
      if (isTierTwoStructure || isTierThreeStructure) {
        const aliasArray = [
          ...new Set(
            Object.values(variable.valuesByMode)
              .filter((mode): mode is VariableAlias => typeof mode === 'object' && 'type' in mode && mode.type === 'VARIABLE_ALIAS')
              .map((mode) => mode.id)
          ),
        ];

        if (!aliasArray.length) {
          token.nativeValue = token?.value;
          token.staticModeValues =
            collection?.modes?.map((mode) => ({
              name: mode.name,
            })) || [];

          // throw new Error('no aliasArray', token);
        } else {
          token.collectionParentModes =
            collection?.modes?.map((mode) => ({
              modeId: mode.modeId,
              name: mode.name,
              primitiveReference: Object.entries(variable.valuesByMode)
                .filter(([modeId, value]) => modeId === mode.modeId && typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS')
                .map(([_, value]) => {
                  const primitiveVar = localVariables[(value as VariableAlias).id];

                  const primitiveCollection = localVariableCollections[primitiveVar.variableCollectionId];
                  const correctPrimitiveName = standardizeCollectionName(primitiveCollection?.modes[0]?.name);

                  return {
                    id: primitiveVar.id,
                    name: primitiveVar.name,
                    value: tokenValueFromVariable(primitiveVar, 'light', localVariables, localVariableCollections),
                    valuesByMode: primitiveVar.valuesByMode,
                    correctPrimitiveName,
                  };
                })[0],
            })) || [];
        }

        // declare is statements
        if (isTierTwoStructure) token.isTierTwo = 'true';
        if (isTierThreeStructure) token.isTierThree = 'true';
      }

      ////////////////////////////////////////////////////////////////////////////////

      if (tokensFiles[standardizedCollectionName][getId]) {
        throw new Error(`Token with ID ${getId} already exists in collection ${standardizedCollectionName}`);
      }

      if (!('value' in token)) {
        console.error(token);
        throw new Error(`Token with ID ${getId} has no value`, token);
      }

      tokensFiles[standardizedCollectionName][token.name] = token;
    });
  });
  return tokensFiles;
}
