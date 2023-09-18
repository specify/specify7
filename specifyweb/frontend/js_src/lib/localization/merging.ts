/**
 * Localization strings used by Record Merging tool
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const mergingText = createDictionary({
  recordMerging: {
    'en-us': 'Record Merging',
    'ru-ru': 'Объединение записей',
  },
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
  agentContainsGroupDescription: {
    'en-us': `Agents contain group members`,
  },
  recordNotBeMergedReason: {
    'en-us': `The following records cannot be merged. Reason:`,
  },
  someCannotBeMerged: {
    'en-us': `Some records cannot be merged`,
  },
  mergeOthers: {
    'en-us': 'Merge others',
  },
  warningMergeText: {
    'en-us': `
      Before proceeding, please note that the following action 
      may interrupt other users. This action may cause delays 
      or temporary unavailability of certain features for Specify 
      users. Please consider the impact on their experience.
      This merge cannot be undone`,
  },
  mergeFailed: {
    'en-us': 'Merge Failed',
  },
  mergeSucceeded: {
    'en-us': 'Merge Succeeded',
  },
  merging: {
    'en-us': 'Merging',
  },

  mergingHasStarted: {
    'en-us': 'The merge process has started.',
  },
  mergingHasSucceeded: {
    'en-us': 'The merge process has succeeded.',
  },
  mergingHasFailed: {
    'en-us': 'The merge process has failed.',
  },
  mergingHasBeenCanceled: {
    'en-us': 'The merge process has been canceled.',
  },
  retryMerge: {
    'en-us': 'Retry merge.',
  },
  mergingWentWrong: {
    'en-us': 'Something went wrong during the merging process.',
  },
  loadReferences: {
    'en-us': 'Load References',
  },
} as const);
