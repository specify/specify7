/**
 * Localization strings used by the WorkBench (and WbPlanView)
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const wbPlanText = createDictionary({
  dataMapper: {
    'en-us': 'Data Mapper',
    'ru-ru': 'Сопоставления',
  },
  noUploadPlan: {
    'en-us': 'No Upload Plan is Defined',
    'ru-ru': 'План загрузки не определен',
  },
  noUploadPlanDescription: {
    'en-us':
      'No Upload Plan has been defined for this Data Set. Create one now?',
    'ru-ru': `
      Для этого набора данных не определен план загрузки. Создать эго сейчас?
    `,
  },
  unmappedColumn: {
    'en-us': 'Unmapped Column',
    'ru-ru': 'Несопоставленный столбец',
  },
  notMapped: {
    comment: 'Show in pick list in Data Mapper when column is not mapped',
    'en-us': 'NOT MAPPED',
    'ru-ru': 'НЕСОПОСТАВЛЕННЫЙ',
  },
  matchBehavior: {
    'en-us': 'Match Behavior:',
    'ru-ru': 'Поведение при совпадении:',
  },
  columnMapping: {
    'en-us': 'Column Mapping',
    'ru-ru': 'Сопоставление столбцов',
  },
  suggestedMappings: {
    'en-us': 'Suggested Mappings:',
    'ru-ru': 'Предлагаемые сопоставления:',
  },
  requiredFields: {
    'en-us': 'Required Fields',
    'ru-ru': 'Обязательные поля',
  },
  optionalFields: {
    'en-us': 'Optional Fields',
    'ru-ru': 'Необязательные поля',
  },
  hiddenFields: {
    'en-us': 'Hidden Fields',
    'ru-ru': 'Скрытые поля',
  },
  revealHiddenFormFields: {
    'en-us': 'Reveal Hidden Form Fields',
    'ru-ru': 'Показать скрытые поля формы',
  },
  mappingOptions: {
    'en-us': 'Mapping Options',
    'ru-ru': 'Параметры сопоставления',
  },
  ignoreWhenBlank: {
    'en-us': 'Ignore when Blank',
    'ru-ru': 'Игнорировать, когда пусто',
  },
  ignoreWhenBlankDescription: {
    'en-us': `
      When set to "Ignore when Blank" blank values in this column will not be
      considered for matching purposes. Blank values are ignored when matching
      even if a default value is provided
    `,
    'ru-ru': `
      Если задано значение «Игнорировать, когда пусто», пустые значения в этом
      столбце не будет рассматривается для целей сопоставления. Пустые значения
      игнорируются при сопоставлении даже если указано значение по умолчанию
    `,
  },
  ignoreAlways: {
    'en-us': 'Always Ignore',
    'ru-ru': 'Всегда игнорировать',
  },
  ignoreAlwaysDescription: {
    'en-us': `
      When set to "Ignore Always" the value in this column will never be
      considered for matching purposes, only for uploading.
    `,
    'ru-ru': `
      Если задано значение «Всегда игнорировать», значение в этом столбце
      никогда не будет рассматривается для целей сопоставления, только для
      загрузки
    `,
  },
  ignoreNever: {
    'en-us': 'Never Ignore',
    'ru-ru': 'Никогда не игнорировать',
  },
  ignoreNeverDescription: {
    'en-us': `
      This column would always be considered for matching purposes, regardless
      of it's value
    `,
    'ru-ru': `
      Этот столбец всегда будет учитываться для целей сопоставления, независимо
      от содержимое столбца
    `,
  },
  allowNullValues: {
    'en-us': 'Allow Null Values',
    'ru-ru': 'Разрешить нулевые значения',
  },
  useDefaultValue: {
    'en-us': 'Use Default Value',
    'ru-ru': 'Использовать значение по умолчанию',
  },
  defaultValue: {
    'en-us': 'Default Value',
    'ru-ru': 'Значение по умолчанию',
  },
  useDefaultValueDescription: {
    'en-us': 'This value would be used in place of empty cells',
    'ru-ru': 'Это значение будет использоваться вместо пустых ячеек',
  },
  addNewColumn: {
    'en-us': 'Add New Column',
    'ru-ru': 'Добавить новую колонку',
  },
  validationFailed: {
    'en-us': 'Validation found missing mappings:',
    'ru-ru': 'Проверка обнаружила недостающие сопоставления:',
  },
  validationFailedDescription: {
    'en-us': `
      This data mapping is missing one or more data fields required for
      uploading by your Specify configuration. Add the missing mappings shown or
      save this Upload Plan as unfinished.
    `,
    'ru-ru': `
      В этом сопоставлении данные отсутствует в одном или нескольких полей
      данных, необходимых для загрузки по вашей Specify конфигурацию. Добавьте
      недостающие сопоставления или сохраните этот план загрузки как
      незавершенный.
    `,
  },
  continueEditing: {
    'en-us': 'Continue Editing',
    'ru-ru': 'Продолжить редактирование',
  },
  saveUnfinished: {
    'en-us': 'Save Unfinished',
    'ru-ru': 'Сохранить незаконченное',
  },
  map: {
    'en-us': 'Map',
    'ru-ru': 'Сопоставить',
  },
  unmap: {
    'en-us': 'Unmap',
    'ru-ru': 'Отменить сопоставления',
  },
  mapButtonDescription: {
    'en-us': 'Map selected field to selected header',
    'ru-ru': 'Сопоставить выбранное поле с выбранным столбцом',
  },
  relationshipWithTable: {
    'en-us': 'Relationship to the {tableName:string} table',
    'ru-ru': 'Связь с таблицей {tableName:string}',
  },
  selectBaseTable: {
    'en-us': 'Select a Base Table',
    'ru-ru': 'Выберите базовую таблицу',
  },
  chooseExistingPlan: {
    'en-us': 'Choose Existing Plan',
    'ru-ru': 'Выберите существующий план',
  },
  showAdvancedTables: {
    'en-us': 'Show Advanced Tables',
    'ru-ru': 'Показать дополнительные таблицы',
  },
  dataSetUploaded: {
    'en-us': 'Data Set uploaded. This Upload Plan cannot be changed',
    'ru-ru': 'Набор данных загружен. Этот план загрузки нельзя изменить',
  },
  dataSetUploadedDescription: {
    'en-us': `
      You are viewing the mappings for an uploaded dataset.
      
      To edit the mappings, rollback the uploaded data or create a new dataset
    `,
    'ru-ru': `
      Вы просматриваете сопоставления для загруженного набора данных.
      
      Чтобы изменить сопоставления, откатите загруженные данные или создайте
      новый набор данных
    `,
  },
  baseTable: {
    'en-us': 'Base Table',
    'ru-ru': 'Базовая таблица',
  },
  goToBaseTable: {
    'en-us': 'Change the Base Table for Mapping Data Set Columns?',
    'ru-ru':
      'Изменить базовую таблицу для сопоставления столбцов набора данных?',
  },
  goToBaseTableDescription: {
    'en-us': `
      Choosing a different Base Table for a Data Set Upload will make that table
      the new starting point for column-to-data field mappings and will erase
      existing mappings. The AutoMapper will attempt to map columns to the new
      Base Table fields.
    `,
    'ru-ru': `
      Выбор другой базовой таблице для загрузки набора данных сделает ту таблицу
      новой отправной точкой для сопоставлений полей столбцов и данных и сотрет
      существующие сопоставления. AutoMapper попытается сопоставить столбцы в
      новые поля базовой таблицы.
    `,
  },
  clearMapping: {
    'en-us': 'Clear Mapping',
    'ru-ru': 'Очистить сопоставление',
  },
  reRunAutoMapper: {
    'en-us': 'Rerun AutoMapper',
    'ru-ru': 'Перезапустить AutoMapper',
  },
  autoMapper: {
    'en-us': 'AutoMapper',
    'ru-ru': 'AutoMapper',
  },
  mappingEditor: {
    'en-us': 'Map Explorer',
    'ru-ru': 'Обзор сопоставлений',
  },
  hideFieldMapper: {
    'en-us': 'Hide Field Mapper',
    'ru-ru': 'Спрятать обзор сопоставлений',
  },
  showFieldMapper: {
    'en-us': 'Show Field Mapper',
    'ru-ru': 'Показать обзор сопоставлений',
  },
  mappings: {
    'en-us': 'Mappings',
    'ru-ru': 'Сопоставления',
  },
  clearMappings: {
    'en-us': 'Clear Mappings',
    'ru-ru': 'Очистить сопоставления',
  },
  emptyDataSet: {
    'en-us': 'Empty Data Set',
    'ru-ru': 'Пустой набор данных',
  },
  emptyDataSetDescription: {
    'en-us': "This Data Set doesn't have any columns.",
    'ru-ru': 'В этом наборе данных нет столбцов.',
  },
  emptyDataSetSecondDescription: {
    'en-us': `
      Press the "Add New Column" button below the mapping lines to add new
      columns.
    `,
    'ru-ru': `
      Нажмите кнопку "Добавить новый столбец" под строками сопоставления, чтобы
      добавить новые столбцы.
    `,
  },
  reRunAutoMapperConfirmation: {
    'en-us': 'Automap to start a new Upload Plan?',
    'ru-ru': 'Автоматически сопоставить?',
  },
  reRunAutoMapperConfirmationDescription: {
    'en-us': 'This will erase existing data field mappings.',
    'ru-ru': 'Это сотрет существующие сопоставления.',
  },
  changeMatchingLogic: {
    'en-us': 'Change Matching Logic',
    'ru-ru': 'Изменить логику соответствия',
  },
  matchingLogicDescription: {
    'en-us': 'Require Data to Match Existing Records',
    'ru-ru': 'Требовать сопоставления данных с существующими записями',
  },
  matchingLogicUnavailable: {
    'en-us': 'Matching logic is unavailable for current mappings',
    'ru-ru': 'Логика соответствия недоступна для текущих сопоставлений',
  },
  mustMatch: {
    'en-us': 'Must Match',
    'ru-ru': 'Логика соответствия',
  },
  unloadProtectMessage: {
    'en-us': 'This mapping has not been saved.',
    'ru-ru': 'Это сопоставление не было сохранено.',
  },
  newHeaderName: {
    'en-us': 'New Column {index:number}',
    'ru-ru': 'Новый столбец {index:number}',
  },
  noHeader: {
    'en-us': '(no header)',
    'ru-ru': '(нет заголовка)',
  },
  copyPlan: {
    'en-us': 'Copy plan from existing Data Set',
    'ru-ru': 'Копировать план из существующего набора данных',
  },
  noPlansToCopyFrom: {
    'en-us': `
      There are no plans available, please continue to create an upload plan.
    `,
    'ru-ru': 'Нет доступных планов, продолжайте создавать план загрузки.',
  },
  invalidTemplatePlan: {
    'en-us':
      'Selected Data Set has no upload plan. Please select a different one.',
    'ru-ru': `
      Выбранный набор данных не имеет плана загрузки. Выберите другой набор
      данных.
    `,
  },
} as const);
