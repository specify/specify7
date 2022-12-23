/**
 * Localization strings used for Interactions
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const interactionsText = createDictionary({
  interactions: {
    'en-us': 'Interactions',
    'ru-ru': 'Взаимодействия',
  },
  addItems: {
    'en-us': 'Add Items',
    'ru-ru': 'Добавить элементы',
  },
  recordReturn: {
    'en-us': '{modelName:string} Return',
    'ru-ru': 'Возврат {modelName:string}',
  },
  createRecord: {
    'en-us': 'Create {modelName:string}',
    'ru-ru': 'Создать {modelName:string}',
  },
  missing: {
    'en-us': 'Missing:',
    'ru-ru': 'Отсутствует:',
  },
  preparationsNotFound: {
    'en-us': 'No preparations were found.',
    'ru-ru': 'Никаких препаратов не обнаружено.',
  },
  problemsFound: {
    'en-us': 'There are problems with the entry:',
    'ru-ru': 'Обнаружены ошибки:',
  },
  byChoosingRecordSet: {
    comment: 'See documentation for syntax for plural rules',
    'en-us': 'By choosing a recordset ({{count:none | one | ??}} available)',
    'ru-ru': 'Выбрав набор записей (доступно {count:number|formatted})',
  },
  byEnteringNumbers: {
    comment:
      'Field name is localized. Coming from Schema Configuration. I.e, By entering Catalog Numbers',
    'en-us': 'By entering {fieldName:string}s',
    'ru-ru': 'Ввести {fieldName:string}',
  },
  withoutPreparations: {
    'en-us': 'Without preparations',
    'ru-ru': 'Без подготовки',
  },
  addUnassociated: {
    'en-us': 'Add unassociated item',
    'ru-ru': 'Добавить несвязанный элемент',
  },
  preparations: {
    'en-us': 'Preparations',
    'ru-ru': 'Препараты',
  },
  // FIXME: look over all keys and rename where makes sense
  preparationsCanNotBeReturned: {
    'en-us': 'Preparations cannot be returned in this context.',
    'ru-ru': 'Препараты не могут быть возвращены в этом контексте.',
  },
  noUnresolvedPreparations: {
    'en-us': 'There are no unresolved preparations for this loan.',
    'ru-ru': 'Незавершенных приготовлений по этому кредиту нет.',
  },
  unresolved: {
    'en-us': 'Unresolved',
    'ru-ru': 'Нерешенные',
  },
  return: {
    'en-us': 'Return',
    'ru-ru': 'Возвращение',
  },
  resolve: {
    'en-us': 'Resolve',
    'ru-ru': 'Разрешить',
  },
  returnAllPreparations: {
    'en-us': 'Return all preparations',
    'ru-ru': 'Вернуть все препараты',
  },
  returnSelectedPreparations: {
    'en-us': 'Return selected preparations',
    'ru-ru': 'Вернуть выбранные препараты',
  },
  selectAllAvailablePreparations: {
    'en-us': 'Select all available preparations',
    'ru-ru': 'Выбрать все доступные препараты',
  },
  selectAll: {
    'en-us': 'Select All',
    'ru-ru': 'Выбрать все',
  },
  selectedAmount: {
    'en-us': 'Selected Amount',
    'ru-ru': 'Выбранная сумма',
  },
  returnedAmount: {
    'en-us': 'Returned Amount',
    'ru-ru': 'Возвращенно',
  },
  resolvedAmount: {
    'en-us': 'Resolved Amount',
    'ru-ru': 'Решенный',
  },
  prepReturnFormatter: {
    comment: 'Used to format preparations in the prep return dialog',
    'en-us': '{tableName:string}: {resource: string}',
    'ru-ru': '{tableName:string}: {resource: string}',
  },
  resolvedLoans: {
    'en-us': 'Resolved Loans',
    'ru-ru': 'Решение Заемы',
  },
  openLoans: {
    'en-us': 'Open Loans',
    'ru-ru': 'Открытые займы',
  },
  gifts: {
    'en-us': 'Gifts',
    'ru-ru': 'Подарки',
  },
  exchanges: {
    'en-us': 'Exchanges',
    'ru-ru': 'Обмены',
  },
  unCataloged: {
    'en-us': 'uncataloged',
    'ru-ru': 'некаталогизированный',
  },
  returnedPreparations: {
    'en-us': 'Returned Preparations',
    'ru-ru': 'Возвращенные препараты',
  },
  returnedAndSaved: {
    'en-us':
      '{count:number|formatted} preparations have been returned and saved.',
    'ru-ru': '{count:number|formatted} препарата возвращены и сохранены.',
  },
  deselectAll: {
    'en-us': 'Deselect all',
    'ru-ru': 'Отменить выбор',
  },
  available: {
    'en-us': 'Available',
    'ru-ru': 'В наличии',
  },
  unavailable: {
    'en-us': 'Unavailable',
    'ru-ru': 'Недоступен',
  },
  returnLoan: {
    'en-us': 'Return Loan',
    'ru-ru': 'Возврат Заема',
  },
  printInvoice: {
    'en-us': 'Print Invoice',
    'ru-ru': 'Распечатать Накладную',
  },
  loanWithoutPreparation: {
    'en-us': 'Loan w/o Preps',
    'ru-ru': 'Заем без Препаратов',
  },
  loanWithoutPreparationDescription: {
    'en-us': 'Create a loan with no preparations',
    'ru-ru': 'Создать Заем без препаратов',
  },
  createLoan: {
    'en-us': 'Create a Loan',
    'ru-ru': 'Создать Заем',
  },
  editLoan: {
    'en-us': 'Edit Loan',
    'ru-ru': 'Редактировать Заем',
  },
  createdGift: {
    'en-us': 'Create a Gift',
    'ru-ru': 'Создать Дар',
  },
  editGift: {
    'en-us': 'Edit Gift',
    'ru-ru': 'Редактировать Дар',
  },
  createInformationRequest: {
    'en-us': 'Create Information Request',
    'ru-ru': 'Создать Экспресс Запрос',
  },
} as const);
