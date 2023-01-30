/**
 * Localization strings used by Record Merging tool
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const mergingText = createDictionary({
  mergeRecords: {
    'en-us': 'Merge Records',
    'ru-ru': 'Объединить записи',
  },
  mergedRecord: {
    'en-us': 'Merged Record',
    'ru-ru': 'Объединенная запись',
  },
  showConflictingFieldsOnly: {
    'en-us': 'Show conflicting fields only',
    'ru-ru': 'Показать только конфликтующие поля',
  },
  referencesToRecord: {
    'en-us': 'References to this record',
    'ru-ru': 'Ссылки на эту запись',
  },
  preview: {
    'en-us': 'Preview',
    'ru-ru': 'Открыть',
  },
  newMergedRecord: {
    'en-us': 'New merged record',
    'ru-ru': 'Новая объединенная запись',
  },
  duplicateRecord: {
    'en-us': 'Preview {index:number|formatted}',
    'ru-ru': 'Предпросмотр {index:number|formatted}',
  },
  nRecords: {
    'en-us': '{count:number|formatted} records',
    'ru-ru': '{count:number|formatted} записей',
  },
  subViewControls: {
    'en-us': 'Sub-view Controls',
    'ru-ru': 'Под-вид Контролы',
  },
  mergeFields: {
    comment: 'Example: "Merge Addresses"',
    'en-us': 'Merge {field:string}',
    'ru-ru': 'Объединить {field:string}',
  },
  autoPopulate: {
    'en-us': 'Auto-populate',
  },
  dismissFromMerging: {
    'en-us': 'Dismiss from merging',
  },
} as const);
