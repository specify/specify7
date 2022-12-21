/**
 * Localization for strings that are returned from the back-end. (back-end
 * returns a key, and front-end resolves the key into a string)
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const backEndText = createDictionary({
  failedParsingBoolean: {
    'en-us': 'value "{value:string}" not resolvable to True or False',
    'ru-ru': 'значение "{value:string}" не разрешается to True or False',
  },
  failedParsingDecimal: {
    'en-us': 'value "{value:string}" is not a valid decimal value',
    'ru-ru': 'значение "{value:string}" не является допустимым чеслом',
  },
  failedParsingPickList: {
    'en-us': `
      {value:string} is not a legal value in this picklist field.

      "Click on the arrow to choose among available options.
    `,
    'ru-ru': `
      {value:string} не является допустимым значением в этом списке.
      
      Нажмите на стрелку, чтобы выбрать один из доступных вариантов.
    `,
  },
  failedParsingAgentType: {
    'en-us':
      'bad agent type: "{badType:string}". Expected one of {validTypes:string}',
    'ru-ru':
      'неверный тип агента: "{badType:string}". Ожидается один из {validTypes:string}',
  },
  invalidTreeStructure: {
    'en-us': 'There are multiple "Uploaded" placeholder values in the tree!',
    'ru-ru': 'В дереве есть несколько веток с именем "Uploaded"!',
  },
  missingRequiredTreeParent: {
    'en-us':
      'Missing or unmapped required tree parent rank value for "{names:string}".',
    'ru-ru':
      'Отсутствует или не сопоставлено необходимое значение родительского ранга для дерева "{names:string}".',
  },
} as const);
