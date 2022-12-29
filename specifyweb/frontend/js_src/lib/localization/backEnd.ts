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
  failedParsingFloat: {
    'en-us': 'value "{value:string}" is not a valid floating point value',
    'ru-ru':
      'значение "{value:string}" не является допустимым числом с плавающей точкой',
  },
  failedParsingPickList: {
    'en-us': `
      {value:string} is not a legal value in this picklist field.

      Click on the arrow to choose among available options.
    `,
    'ru-ru': `
      {value:string} не является допустимым значением в этом списке.

      Нажмите на стрелку, чтобы выбрать один из доступных вариантов.
    `,
  },
  failedParsingAgentType: {
    'en-us': `
      bad agent type: "{badType:string}". Expected one of {validTypes:string}
    `,
    'ru-ru': `
      неверный тип агента: "{badType:string}". Ожидается один из
      {validTypes:string}
    `,
  },
  pickListValueTooLong: {
    'en-us': `
      value from picklist {pickList:string} longer than the max of
      {maxLength:number|formatted} for field
    `,
    'ru-ru': `
      значение из списка {pickList:string} длиннее максимального значения
      {maxLength:number|formatted} для поля
    `,
  },
  valueTooLong: {
    'en-us':
      'value must not have length greater than {maxLength:number|formatted}',
    'ru-ru': 'значение не должно быть длиннее {maxLength:number|formatted}',
  },
  invalidYear: {
    'en-us': 'date value must contain four digit year: {value:string}',
    'ru-ru':
      'значение даты должно содержать четырехзначный год: {value:string}',
  },
  badDateFormat: {
    'en-us': 'bad date value: {value:string}. expected: {format:string}',
    'ru-ru':
      'неверное значение даты: {value:string}. ожидается: {format:string}',
  },
  coordinateBadFormat: {
    'en-us': 'bad latitude or longitude value: {value:string}',
    'ru-ru': 'неверное значение широты или долготы: {value:string}',
  },
  latitudeOutOfRange: {
    'en-us': 'latitude must be between -90 and 90. Actual: {value:string}',
    'ru-ru': 'широта должна быть между -90 и 90. Фактически: {value:string}',
  },
  longitudeOutOfRange: {
    'en-us': 'longitude must be between -180 and 180. Actual: {value:string}',
    'ru-ru': 'долгота должна быть между -180 и 180. Фактически: {value:string}',
  },
  invalidPartialRecord: {
    'en-us': 'this field must be empty if {column:string} is empty',
    'ru-ru': 'это поле должно быть пустым, если {column:string} пусто',
  },
  fieldRequiredByUploadPlan: {
    'en-us': 'field is required by upload plan mapping',
    'ru-ru': 'поле обязательно для загрузки плана',
  },
  invalidTreeStructure: {
    'en-us': 'There are multiple "Uploaded" placeholder values in the tree!',
    'ru-ru': 'В дереве есть несколько веток с именем "Uploaded"!',
  },
  missingRequiredTreeParent: {
    'en-us': `
      Missing or unmapped required tree parent rank value for "{names:string}".
    `,
    'ru-ru': `
      Отсутствует или не сопоставлено необходимое значение родительского ранга
      для дерева "{names:string}".
    `,
  },
} as const);
