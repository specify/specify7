/**
 * Localization strings used in the Schema Config and data model viewer
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const schemaText = createDictionary({
  table: {
    'en-us': 'Table',
    'ru-ru': 'Таблица',
  },
  tableFormatted: {
    'en-us': 'Table: {name:string}',
    'ru-ru': 'Таблица: {name:string}',
  },
  tableName: {
    'en-us': 'Table Name',
    'ru-ru': 'Имя таблицы',
  },
  schemaConfig: {
    'en-us': 'Schema Config',
    'ru-ru': 'Конфигурация схемы',
  },
  unsavedSchemaUnloadProtect: {
    'en-us': 'Schema changes have not been saved',
    'ru-ru': 'Изменения схемы не сохранены',
  },
  changeBaseTable: {
    'en-us': 'Change Base Table',
    'ru-ru': 'Изменить базовую таблицу',
  },
  fields: {
    'en-us': 'Fields',
    'ru-ru': 'Поля',
  },
  field: {
    'en-us': 'Field: {name:string}',
    'ru-ru': 'Поле: {name:string}',
  },
  relationships: {
    'en-us': 'Relationships',
    'ru-ru': 'Отношения',
  },
  caption: {
    'en-us': 'Caption',
    'ru-ru': 'Подпись',
  },
  description: {
    'en-us': 'Description',
    'ru-ru': 'Описание',
  },
  hideTable: {
    'en-us': 'Hide Table',
    'ru-ru': 'Скрыть таблицу',
  },
  hideField: {
    'en-us': 'Hide Field',
    'ru-ru': 'Скрыть поле',
  },
  tableFormat: {
    'en-us': 'Table Format',
    'ru-ru': 'Формат таблицы',
  },
  tableAggregation: {
    'en-us': 'Table Aggregation',
    'ru-ru': 'Агрегация таблиц',
  },
  type: {
    'en-us': 'Type',
    'ru-ru': 'Тип',
  },
  oneToOne: {
    'en-us': 'One-to-one',
    'ru-ru': 'Один к одному',
  },
  oneToMany: {
    'en-us': 'One-to-many',
    'ru-ru': 'Один ко многим',
  },
  manyToOne: {
    'en-us': 'Many-to-one',
    'ru-ru': 'Многие к одному',
  },
  manyToMany: {
    'en-us': 'many-to-many',
    'ru-ru': 'Многие-ко-многим',
  },
  fieldLength: {
    'en-us': 'Length',
    'ru-ru': 'Длина',
  },
  readOnly: {
    'en-us': 'Read-only',
    'ru-ru': 'Только чтение',
  },
  required: {
    'en-us': 'Required',
    'ru-ru': 'Необходимый',
  },
  fieldFormat: {
    'en-us': 'Field Format',
    'ru-ru': 'Формат поля',
  },
  formatted: {
    'en-us': 'Formatted',
    'ru-ru': 'Форматирован',
  },
  webLink: {
    'en-us': 'Web Link',
    'ru-ru': 'Интернет-ссылка',
  },
  pickList: {
    'en-us': 'Pick List',
    'ru-ru': 'Список выбора',
  },
  system: {
    'en-us': 'System',
    'ru-ru': 'Системное',
  },
  userDefined: {
    'en-us': 'User Defined',
    'ru-ru': 'Создано пользователем',
  },
  addLanguage: {
    'en-us': 'Add Language',
    'ru-ru': 'Добавить язык',
  },
  addLanguageDialogHeader: {
    'en-us': 'Add new language',
    'ru-ru': 'Добавить новый язык',
  },
  tables: {
    'en-us': 'Tables',
    'ru-ru': 'Таблицы',
  },
  fieldLabel: {
    'en-us': 'Label',
    'ru-ru': 'Локализованный',
  },
  hidden: {
    'en-us': 'Hidden',
    'ru-ru': 'Скрытый',
  },
  databaseColumn: {
    'en-us': 'Database Column',
    'ru-ru': 'Столбец базы данных',
  },
  relatedModel: {
    'en-us': 'Related Model',
    'ru-ru': 'Родственная Таблица',
  },
  otherSideName: {
    'en-us': 'Other side name',
    'ru-ru': 'Имя другой стороны',
  },
  dependent: {
    'en-us': 'Dependent',
    'ru-ru': 'Зависимый',
  },
  downloadAsJson: {
    'en-us': 'Download as JSON',
    'ru-ru': 'Скачать как JSON',
  },
  downloadAsTsv: {
    'en-us': 'Download as TSV',
    'ru-ru': 'Скачать как TSV',
  },
  tableId: {
    'en-us': 'Table ID',
    'ru-ru': 'Идентификатор',
  },
  fieldCount: {
    'en-us': 'Field count',
    'ru-ru': 'Количество полей',
  },
  relationshipCount: {
    'en-us': 'Relationship count',
    'ru-ru': 'Количество отношений',
  },
  databaseSchema: {
    'en-us': 'Database Schema',
    'ru-ru': 'Database Schema',
  },
  selectedTables: {
    'en-us': 'Selected Tables',
    'ru-ru': 'Выбранные таблицы',
  },
  possibleTables: {
    'en-us': 'Possible Tables',
    'ru-ru': 'Возможные таблицы',
  },
} as const);
