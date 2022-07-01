/**
 * Localization strings used by the WorkBench (and WbPlanView)
 *
 * @module
 */

import React from 'react';

import { createDictionary, whitespaceSensitive } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const wbText = createDictionary({
  // Buttons
  rollback: {
    'en-us': 'Roll Back',
    'ru-ru': 'Откат',
  },
  validate: {
    'en-us': 'Validate',
    'ru-ru': 'Проверить',
  },
  validation: {
    'en-us': 'Validation',
    'ru-ru': 'Проверка',
  },
  upload: {
    'en-us': 'Upload',
    'ru-ru': 'Загрузка',
  },
  rollingBack: {
    'en-us': 'Rolling Back',
    'ru-ru': 'Откат',
  },
  uploading: {
    'en-us': 'Uploading',
    'ru-ru': 'Загрузка',
  },
  validating: {
    'en-us': 'Validating',
    'ru-ru': 'Проверка',
  },
  disambiguate: {
    'en-us': 'Disambiguate',
    'ru-ru': 'Устранить Неоднозначность',
  },
  fillDown: {
    'en-us': 'Fill Down',
    'ru-ru': 'Заполнить Вниз',
  },
  fillUp: {
    'en-us': 'Fill Up',
    'ru-ru': 'Заполнить Вверх',
  },
  revert: {
    'en-us': 'Revert',
    'ru-ru': 'Вернуть',
  },
  dataMapper: {
    'en-us': 'Data Mapper',
    'ru-ru': 'Сопоставления',
  },
  dataCheck: {
    'en-us': 'Data Check',
    'ru-ru': 'Проверка данных',
  },
  dataCheckOn: {
    'en-us': `Data Check: On`,
    'ru-ru': `Проверка данных: вкл.`,
  },
  changeOwner: {
    'en-us': 'Change Owner',
    'ru-ru': 'Сменить владельца',
  },
  convertCoordinates: {
    'en-us': 'Convert Coordinates',
    'ru-ru': 'Преобразовать координаты',
  },
  navigation: {
    'en-us': 'Navigation',
    'ru-ru': 'Навигация',
  },
  replace: {
    'en-us': 'Replace',
    'ru-ru': 'Заменять',
  },
  replacementValue: {
    'en-us': 'Replacement value',
    'ru-ru': 'Замена',
  },
  searchResults: {
    'en-us': 'Search Results',
    'ru-ru': 'Результаты Поиска',
  },
  clickToToggle: {
    'en-us': 'Click to toggle visibility',
    'ru-ru': 'Нажмите, чтобы переключить видимость',
  },
  configureSearchReplace: {
    'en-us': 'Configure Search & Replace',
    'ru-ru': 'Настроить поиск и замену',
  },
  modifiedCells: {
    'en-us': 'Modified Cells',
    'ru-ru': 'Модифицированные клетки',
  },
  newCells: {
    'en-us': 'New Cells',
    'ru-ru': 'Новые клетки',
  },
  errorCells: {
    'en-us': 'Error Cells',
    'ru-ru': 'Ячейки с ошибками',
  },
  dataEditor: {
    'en-us': 'Data Editor',
    'ru-ru': 'Редактор данных',
  },
  // Dialogs
  noUploadPlanDialogHeader: {
    'en-us': 'No Upload Plan is Defined',
    'ru-ru': 'План загрузки не определен',
  },
  noUploadPlanDialogText: {
    'en-us':
      'No Upload Plan has been defined for this Data Set. Create one now?',
    'ru-ru':
      'Для этого набора данных не определен план загрузки. Создать эго сейчас?',
  },
  noDisambiguationResultsDialogHeader: {
    'en-us': 'Unable to disambiguate',
    'ru-ru': 'Невозможно устранить неуверенность',
  },
  noDisambiguationResultsDialogText: {
    'en-us': `
      None of the matched records currently exist in the database.
      This can happen if all of the matching records were deleted since the
      validation process occurred, or if all of the matches were ambiguous
      with respect other records in this data set. In the latter case, you
      will need to add fields and values to the data set to resolve the
      ambiguity.`,
    'ru-ru': `
      Ни одна из совпадающих записей в настоящее время не существует в базе
      данных. Это может произойти, если все совпадающие записи были удалены с
      моментапроверки, или если все совпадения были неоднозначными по отношению
      к другим записям в этом наборе данных. В последнем случае вы
      потребуется добавить новые поля и значения в набор данных, чтобы разрешить
      двусмысленность.`,
  },
  disambiguationDialogTitle: {
    'en-us': 'Disambiguate Multiple Record Matches',
    'ru-ru': 'Устранение неоднозначности',
  },
  applyAllUnavailable: {
    'en-us': '"Apply All" is not available while Data Check is in progress.',
    'ru-ru': '«Применить все» недоступно, пока выполняется проверка данных.',
  },
  rollbackDialogHeader: {
    'en-us': 'Begin Data Set Roll Back?',
    'ru-ru': 'Начать откат набора данных?',
  },
  rollbackDialogText: {
    'en-us': `
      Rolling back will remove the new data records this Data Set added to the
      Specify database. The entire rollback will be cancelled if any of the
      uploaded data have been referenced (re-used) by other data records since
      they were uploaded.`,
    'ru-ru': `
      Откат удалит новые записи данных, которые этот набор данных добавил в
      базу данных Specify. Весь откат будет отменен, если на загруженные данные
      ссылаются другие записи данных с момента они были загружены.`,
  },
  startUploadDialogHeader: {
    'en-us': 'Begin Data Set Upload?',
    'ru-ru': 'Начать загрузку набора данных?',
  },
  startUploadDialogText: {
    'en-us': `
      Uploading the Data Set will add the data to the Specify database.`,
    'ru-ru': `
      Загрузка набора данных добавит данные в базу данных Specify.`,
  },
  deleteDataSetDialogHeader: {
    'en-us': 'Delete this Data Set?',
    'ru-ru': 'Удалить этот набор данных?',
  },
  deleteDataSetDialogText: {
    'en-us': `
      Deleting a Data Set permanently removes it and its Upload Plan.
      Data mappings will no longer be available for re-use with other
      Data Sets. Also after deleting, Rollback will no longer be an option for
      an uploaded Data Set.`,
    'ru-ru': `
      Удаление набора данных приводит к безвозвратному удалению его и его плана
      загрузки. План загрузки не будут доступным для повторного использования;
      Отката не будет возможным для загруженного набора данных.`,
  },
  dataSetDeletedDialogHeader: {
    'en-us': 'Data Set successfully deleted',
    'ru-ru': 'Набор данных успешно удален',
  },
  dataSetDeletedDialogText: {
    'en-us': 'Data Set successfully deleted.',
    'ru-ru': 'Набор данных успешно удален.',
  },
  revertChangesDialogHeader: {
    'en-us': 'Revert Unsaved Changes?',
    'ru-ru': 'Отменить несохраненные изменения?',
  },
  revertChangesDialogText: {
    'en-us': `
      This action will discard all changes made to the Data Set since
      the last Save.`,
    'ru-ru': `
      Это действие приведет к отмене всех изменений, внесенных в набор данных с
      момента последнего сохранение.`,
  },
  savingDialogTitle: {
    'en-us': 'Saving',
    'ru-ru': 'Сохранение',
  },
  onExitDialogText: {
    'en-us': 'Changes to this Data Set have not been Saved.',
    'ru-ru': 'Изменения в этом наборе данных не были сохранены.',
  },
  // Validation
  /* This value must match the one on the back-end exactly */
  picklistValidationFailed: {
    'en-us': (value: string) =>
      whitespaceSensitive(
        `${value ? `"${value}"` : ''} is not a legal value in this picklist
      field.<br>

      Click on the arrow to choose among available options.`
      ),
    'ru-ru': (value: string) =>
      whitespaceSensitive(
        `${value ? `"${value}"` : ''} не является допустимым значением в этом
      списке.<br>

      Нажмите на стрелку, чтобы выбрать один из доступных вариантов.`
      ),
  },
  noMatchErrorMessage: {
    'en-us': 'No matching record for must-match table.',
    'ru-ru':
      'Нет соответствующей записи для таблицы обязательного соответствия.',
  },
  matchedMultipleErrorMessage: {
    'en-us': whitespaceSensitive(`
      This value matches two or more existing database records and the match
      must be disambiguated before uploading.`),
    'ru-ru': whitespaceSensitive(`
      Это значение соответствует двум или более существующим записям базы
      данных и совпадению`),
  },
  validationNoErrorsDialogHeader: {
    'en-us': 'Validate Completed with No Errors',
    'ru-ru': 'Проверка завершена без ошибок',
  },
  validationNoErrorsDialogText: {
    'en-us': (
      <>
        Validation found no errors, it is ready to be uploaded into the
        database.
        <br />
        <br />
        Note: If this Data Set is edited and re-saved, Validate should be re-run
        prior to Uploading to verify that no errors have been introduced.
      </>
    ),
    'ru-ru': (
      <>
        Проверка завершена без ошибок. Этот набора данных готов к загрузке в
        базу данных.
        <br />
        <br />
        Примечание: Если этот набор данных отредактирован и повторно сохранен,
        начать проверку снова, чтобы убедиться, что ошибок не было введено.
      </>
    ),
  },
  validationErrorsDialogHeader: {
    'en-us': 'Validate Completed with Errors',
    'ru-ru': 'Проверка завершена с ошибками',
  },
  validationErrorsDialogText: {
    'en-us': (
      <>
        Validation found errors in the Data Set.
        <br />
        <br />
        Note: If this Data Set is edited and re-saved, Validate should be re-run
        prior to Uploading to verify that no errors have been introduced.
      </>
    ),
    'ru-ru': (
      <>
        Проверка обнаружила ошибки в наборе данных.
        <br />
        <br />
        Примечание: Если этот набор данных отредактирован и повторно сохранен,
        начать проверку снова, чтобы убедиться, что ошибок не было введено.
      </>
    ),
  },
  uploadNoErrorsDialogHeader: {
    'en-us': 'Upload Completed with No Errors',
    'ru-ru': 'Загрузка завершена без ошибок',
  },
  uploadNoErrorsDialogText: {
    'en-us': `
      Click on the "Results" button to see the number of new records
      added to each database table.`,
    'ru-ru': `
      Нажмите кнопку «Результаты», чтобы увидеть количество новых записей
      добавлен в каждую таблицу базы данных`,
  },
  uploadErrorsDialogHeader: {
    'en-us': 'Upload Failed due to Error Cells',
    'ru-ru': 'Ошибка загрузки из-за ошибок',
  },
  uploadErrorsDialogText: {
    'en-us': (
      <>
        The upload failed due to one or more cell value errors.
        <br />
        <br />
        Validate the Data Set and review the mouseover hints for each error
        cell, then make the appropriate corrections. Save and retry the Upload.
      </>
    ),
    'ru-ru': (
      <>
        Загрузка не удалась из-за одной или нескольких ошибок значений ячеек.
        <br />
        <br />
        Проверте набор данных и наведите указатель мыши на каждую ячейку с
        ошибкой, затем сделайте соответствующие исправления, сохраните и
        повторите попытку.
      </>
    ),
  },
  dataSetRollbackDialogHeader: {
    'en-us': 'Data Set was rolled back successfully',
    'ru-ru': 'Набор данных был успешно откат',
  },
  dataSetRollbackDialogText: {
    'en-us':
      'This Rolledback Data Set is saved, and can be edited or re-uploaded.',
    'ru-ru': `Этот набор данных отката сохранянен, и его можно редактировать или
      повторно загружать.`,
  },
  validationCanceledDialogHeader: {
    'en-us': 'Validation Canceled',
    'ru-ru': 'Проверка отменена',
  },
  validationCanceledDialogText: {
    'en-us': 'Data Set Validation cancelled.',
    'ru-ru': 'Проверка набора данных отменена.',
  },
  rollbackCanceledDialogHeader: {
    'en-us': 'Rollback Canceled',
    'ru-ru': 'Откат отменен',
  },
  rollbackCanceledDialogText: {
    'en-us': 'Data Set Rollback cancelled.',
    'ru-ru': 'Откат набора данных отменен.',
  },
  uploadCanceledDialogHeader: {
    'en-us': 'Upload Canceled',
    'ru-ru': 'Загрузка отменена',
  },
  uploadCanceledDialogText: {
    'en-us': 'Data Set Upload cancelled.',
    'ru-ru': 'Загрузка набора данных отменена.',
  },
  geoLocateDialogTitle: {
    'en-us': 'GeoLocate',
    'ru-ru': 'GeoLocate',
  },
  coordinateConverterDialogTitle: {
    'en-us': 'Geocoordinate Format',
    'ru-ru': 'Геокоординатный формат',
  },
  coordinateConverterDialogHeader: {
    'en-us': 'Choose a preferred Geocoordinate format',
    'ru-ru': 'Выберите предпочтительный формат геокоординат',
  },
  // Misc
  unmappedColumn: {
    'en-us': 'Unmapped Column',
    'ru-ru': 'Несопоставленный столбец',
  },
  notMapped: {
    'en-us': 'NOT MAPPED',
    'ru-ru': 'НЕСОПОСТАВЛЕННЫЙ',
  },
  emptyStringInline: {
    'en-us': '(empty string)',
    'ru-ru': '(пуста строка)',
  },
  wbUploadedUnavailable: {
    'en-us': 'The data set must be validated or uploaded',
    'ru-ru': 'The data set must be validated or uploaded',
  },
  wbValidateUnavailable: {
    'en-us':
      'An Upload Plan needs to defined before this Data Set can be Validated',
    'ru-ru': whitespaceSensitive(`
      План загрузки должен быть определен до того, как этот набор данных
      может быть проверен
    `),
  },
  unavailableWhileEditing: {
    'en-us': 'This action requires all changes to be saved',
    'ru-ru': 'Это действие требует сохранения всех изменений',
  },
  uploadUnavailableWhileHasErrors: {
    'en-us': 'Upload is unavailable while some cells have validation errors',
    'ru-ru': whitespaceSensitive(`
      Загрузка недоступна, в то время как в некоторых ячейках есть ошибки
      проверки
    `),
  },
  unavailableWhileViewingResults: {
    'en-us': 'This action is unavailable while viewing the upload results',
    'ru-ru': 'Это действие недоступно при просмотре результатов загрузки',
  },
  unavailableWhileValidating: {
    'en-us': 'This action is unavailable while Data Check is in progress',
    'ru-ru': 'Это действие недоступно, пока выполняется проверка данных',
  },
  unavailableWithoutLocality: {
    'en-us': 'This tool requires locality columns to be mapped',
    'ru-ru':
      'Этот инструмент требует, чтобы столбцы координат были сопоставлены',
  },
  unavailableWhenUploaded: {
    'en-us': 'This tool does not work with uploaded Data Sets',
    'ru-ru': 'Этот инструмент не работает с загруженными наборами данных',
  },
  dataSetDeletedOrNotFound: {
    'en-us': 'Data Set was deleted by another session.',
    'ru-ru': 'Набор данных был удален другим сеансом.',
  },
  includeDmsSymbols: {
    'en-us': 'Include DMS Symbols',
    'ru-ru': 'Включить символы DMS',
  },
  // WbUploaded
  uploadResults: {
    'en-us': 'Upload Results',
    'ru-ru': 'Результаты загрузки',
  },
  potentialUploadResults: {
    'en-us': 'Potential Upload Results',
    'ru-ru': 'Возможные результаты загрузки',
  },
  noUploadResultsAvailable: {
    'en-us': 'No upload results are available for this cell',
    'ru-ru': 'Для этой ячейки нет результатов загрузки',
  },
  wbUploadedDescription: {
    'en-us': 'Number of new records created in each table:',
    'ru-ru': 'Количество новых записей, созданных в каждой таблице:',
  },
  wbUploadedPotentialDescription: {
    'en-us': 'Number of new records that would be created in each table:',
    'ru-ru':
      'Количество новых записей, которые будут созданы в каждой таблице:',
  },
  // WbAdvancedSearch
  wbAdvancedSearchDialogTitle: {
    'en-us': 'Configure Search & Replace',
    'ru-ru': 'Настроить поиск и замену',
  },
  navigationOptions: {
    'en-us': 'Navigation Options',
    'ru-ru': 'Опции навигации',
  },
  cursorPriority: {
    'en-us': 'Cursor Priority',
    'ru-ru': 'Приоритет курсора',
  },
  columnFirst: {
    'en-us': 'Column first',
    'ru-ru': 'Столбец за столбцом',
  },
  rowFirst: {
    'en-us': 'Row first',
    'ru-ru': 'Ряд за рядом',
  },
  searchOptions: {
    'en-us': 'Search Options',
    'ru-ru': 'Параметры поиска',
  },
  findEntireCellsOnly: {
    'en-us': 'Find entire cells only',
    'ru-ru': 'Найти только целые ячейки',
  },
  matchCase: {
    'en-us': 'Match case',
    'ru-ru': 'Учитывать регистр',
  },
  useRegularExpression: {
    'en-us': 'Use regular expression',
    'ru-ru': 'Использовать регулярное выражение',
  },
  liveUpdate: {
    'en-us': 'Live search',
    'ru-ru': 'Живой поиск',
  },
  replaceOptions: {
    'en-us': 'Replace Options',
    'ru-ru': 'Параметры замены',
  },
  replaceMode: {
    'en-us': 'Replace Mode',
    'ru-ru': 'Режим замены',
  },
  replaceAll: {
    'en-us': 'Replace all matches',
    'ru-ru': 'Заменить все совпадения',
  },
  replaceNext: {
    'en-us': 'Replace next occurrence',
    'ru-ru': 'Заменить следующее происшествие',
  },
  // WbImport
  importDataSet: {
    'en-us': 'Import Data Set',
    'ru-ru': 'Импортировать набор данных',
  },
  wbImportHeader: {
    'en-us': 'Import a File to Create a New Data Set',
    'ru-ru': 'Импортируйте файл для создания нового набора данных',
  },
  previewDataSet: {
    'en-us': 'Preview Dataset',
    'ru-ru': 'Предварительный просмотр набора данных',
  },
  corruptFile: {
    'en-us': (fileName: string) =>
      `The file ${fileName} is corrupt or contains no data!`,
    'ru-ru': (fileName: string) =>
      `Файл ${fileName} поврежден или не содержит данных!`,
  },
  characterEncoding: {
    'en-us': 'Character encoding:',
    'ru-ru': 'Кодировка символов:',
  },
  chooseDataSetName: {
    'en-us': 'Name for New Data Set:',
    'ru-ru': 'Имя для нового набора данных:',
  },
  firstRowIsHeader: {
    'en-us': 'First Row is Header:',
    'ru-ru': 'Первая строка является заголовок:',
  },
  importFile: {
    'en-us': 'Import file',
    'ru-ru': 'Импортировать файл',
  },
  columnName: {
    'en-us': (columnIndex: number) => `Column ${columnIndex}`,
    'ru-ru': (columnIndex: number) => `Столбец ${columnIndex}`,
  },
  // WbPlanView
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
  mappingOptions: {
    'en-us': 'Mapping Options',
    'ru-ru': 'Параметры сопоставления',
  },
  ignoreWhenBlank: {
    'en-us': 'Ignore when Blank',
    'ru-ru': 'Игнорировать, когда пусто',
  },
  ignoreWhenBlankDescription: {
    'en-us': whitespaceSensitive(`
      When set to "Ignore when Blank" blank values in this column will not be
      considered for matching purposes. Blank values are ignored when matching
      even if a default value is provided
    `),
    'ru-ru': whitespaceSensitive(`
      Если задано значение «Игнорировать, когда пусто», пустые значения в
      этом столбце не будет рассматривается для целей сопоставления.
      Пустые значения игнорируются при сопоставлении даже если указано
      значение по умолчанию
    `),
  },
  ignoreAlways: {
    'en-us': 'Always Ignore',
    'ru-ru': 'Всегда игнорировать',
  },
  ignoreAlwaysDescription: {
    'en-us': whitespaceSensitive(`
      When set to "Ignore Always" the value in this column will never be
      considered for matching purposes, only for uploading.
    `),
    'ru-ru': whitespaceSensitive(`
      Если задано значение «Всегда игнорировать», значение в этом столбце
      никогда не будет рассматривается для целей сопоставления, только для
      загрузки
    `),
  },
  ignoreNever: {
    'en-us': 'Never Ignore',
    'ru-ru': 'Никогда не игнорировать',
  },
  ignoreNeverDescription: {
    'en-us': whitespaceSensitive(`
      This column would always be considered for matching purposes, regardless
      of it's value
    `),
    'ru-ru': whitespaceSensitive(`
      Этот столбец всегда будет учитываться для целей сопоставления,
      независимо от содержимое столбца
    `),
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
  revealHiddenFormFields: {
    'en-us': 'Reveal Hidden Form Fields',
    'ru-ru': 'Показать скрытые поля формы',
  },
  validationFailedDialogHeader: {
    'en-us': 'Validation found missing mappings:',
    'ru-ru': 'Проверка обнаружила недостающие сопоставления:',
  },
  validationFailedDialogText: {
    'en-us': `
      This data mapping is missing one or more data fields required for
      uploading by your Specify configuration. Add the missing mappings
      shown or save this Upload Plan as unfinished.`,
    'ru-ru': `
      В этом сопоставлении данные отсутствует в одном или нескольких полей
      данных, необходимых для загрузки по вашей Specify конфигурацию. Добавьте
      недостающие сопоставления или сохраните этот план загрузки как
      незавершенный.`,
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
  relationship: {
    'en-us': (tableName: string): string =>
      `Relationship with the ${tableName} table`,
    'ru-ru': (tableName: string): string => `Связь с таблицей ${tableName}`,
  },
  relationshipInline: {
    'en-us': 'Relationship',
    'ru-ru': 'Связь',
  },
  selectBaseTableDialogTitle: {
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
    'en-us': whitespaceSensitive(`
      You are viewing the mappings for an uploaded dataset.<br>

      To edit the mappings, rollback the uploaded data or create a new
      dataset
    `),
    'ru-ru': whitespaceSensitive(`
      Вы просматриваете сопоставления для загруженного набора данных.<br>

      Чтобы изменить сопоставления, откатите загруженные данные или создайте
      новый набор данных
    `),
  },
  baseTable: {
    'en-us': 'Base Table',
    'ru-ru': 'Базовая таблица',
  },
  goToBaseTableDialogHeader: {
    'en-us': 'Change the Base Table for Mapping Data Set Columns?',
    'ru-ru':
      'Изменить базовую таблицу для сопоставления столбцов набора данных?',
  },
  goToBaseTableDialogText: {
    'en-us': `
      Choosing a different Base Table for a Data Set Upload will make that
      table the new starting point for column-to-data field mappings and
      will erase existing mappings. The AutoMapper will attempt to map
      columns to the new Base Table fields.`,
    'ru-ru': `
      Выбор другой базовой таблице для загрузки набора данных сделает ту
      таблицу новой отправной точкой для сопоставлений полей столбцов и данных и
      сотрет существующие сопоставления. AutoMapper попытается сопоставить
      столбцы в новые поля базовой таблицы.`,
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
  hideMappingEditor: {
    'en-us': 'Hide Map Explorer',
    'ru-ru': 'Спрятать обзор сопоставлений',
  },
  showMappingEditor: {
    'en-us': 'Show Map Explorer',
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
  emptyDataSetDialogHeader: {
    'en-us': 'Empty Data Set',
    'ru-ru': 'Пустой набор данных',
  },
  emptyDataSetDialogText: {
    'en-us': (
      <>
        This Data Set doesn&apos;t have any columns.
        <br />
        Press the &quot;Add New Column&quot; button at the bottom of the screen
        to add new columns.
      </>
    ),
    'ru-ru': (
      <>
        В этом наборе данных нет столбцов.
        <br />
        Нажмите кнопку &quot;Добавить новый столбец&quot; кнопка внизу экрана
        чтобы добавить новые столбцы.
      </>
    ),
  },
  reRunAutoMapperDialogHeader: {
    'en-us': 'Automap to start a new Upload Plan?',
    'ru-ru': 'Автоматически сопоставить?',
  },
  reRunAutoMapperDialogText: {
    'en-us': 'This will erase existing data field mappings.',
    'ru-ru': 'Это сотрет существующие сопоставления.',
  },
  matchingLogicDialogTitle: {
    'en-us': 'Change Matching Logic',
    'ru-ru': 'Изменить логику соответствия',
  },
  matchingLogicDialogText: {
    'en-us': 'Require Data to Match Existing Records',
    'ru-ru': 'Требовать сопоставления данных с существующими записями',
  },
  matchingLogicUnavailableDialogText: {
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
  newDataSetName: {
    'en-us': (date: string): string => `New Data Set ${date}`,
    'ru-ru': (date: string): string => `Новый набор данных ${date}`,
  },
  newHeaderName: {
    'en-us': (index: number): string => `New Column ${index}`,
    'ru-ru': (index: number): string => `Новый столбец ${index}`,
  },
  noHeader: {
    'en-us': '(no header)',
    'ru-ru': '(нет заголовка)',
  },
  // WbsDialog
  wbsDialogDefaultDialogTitle: {
    'en-us': (dataSetCount: number) => `WorkBench Data Sets (${dataSetCount})`,
    'ru-ru': (dataSetCount: number) => `Наборы данных (${dataSetCount})`,
  },
  wbsDialogEmptyDefaultDialogText: {
    'en-us': 'Currently no Data Sets exist.',
    'ru-ru': 'В настоящее время наборов данных не существует.',
  },
  wbsDialogTemplatesDialogTitle: {
    'en-us': 'Copy plan from existing Data Set',
    'ru-ru': 'Копировать план из существующего набора данных',
  },
  wbsDialogEmptyTemplateDialogText: {
    'en-us':
      'There are no plans available, please continue to create an upload plan.',
    'ru-ru': 'Нет доступных планов, продолжайте создавать план загрузки.',
  },
  createDataSetInstructions: {
    'en-us': `
      Use "Import a file" or "Create New" to make a new one.`,
    'ru-ru': `
      Используйте «Импортировать файл» или «Создать новый», чтобы создать новый.`,
  },
  createNew: {
    'en-us': 'Create New',
    'ru-ru': 'Создайте новый',
  },
  // Datasetmeta
  dataSetMetaDialogTitle: {
    'en-us': 'Data Set Properties',
    'ru-ru': 'Свойства набора данных',
  },
  dataSetName: {
    'en-us': 'Data Set Name:',
    'ru-ru': 'Название набора данных:',
  },
  remarks: {
    'en-us': 'Remarks:',
    'ru-ru': 'Примечания:',
  },
  numberOfRows: {
    'en-us': 'Number of rows:',
    'ru-ru': 'Количество рядов:',
  },
  numberOfColumns: {
    'en-us': 'Number of columns:',
    'ru-ru': 'Количество столбцов:',
  },
  created: {
    'en-us': 'Created:',
    'ru-ru': 'Созданный:',
  },
  modified: {
    'en-us': 'Modified:',
    'ru-ru': 'Измененый:',
  },
  uploaded: {
    'en-us': 'Uploaded:',
    'ru-ru': 'Загруженый:',
  },
  importedFileName: {
    'en-us': 'Import file name:',
    'ru-ru': 'Имя файла импорта:',
  },
  noFileName: {
    'en-us': '(no file name)',
    'ru-ru': '(файл без имени)',
  },
  changeDataSetOwnerDialogHeader: {
    'en-us': 'Change Data Set Owner',
    'ru-ru': 'Изменить владельца набора данных',
  },
  changeDataSetOwnerDialogText: {
    'en-us': 'Select New Owner:',
    'ru-ru': 'Выберите нового владельца:',
  },
  dataSetOwnerChangedDialogHeader: {
    'en-us': 'Data Set owner changed',
    'ru-ru': 'Владелец набора данных изменен',
  },
  dataSetOwnerChangedDialogText: {
    'en-us': 'Data Set owner changed.',
    'ru-ru': 'Владелец набора данных изменен',
  },
  dataSet: {
    'en-us': 'Data Set:',
    'ru-ru': 'Набор данных:',
  },
  dataSetUploadedLabel: {
    'en-us': '(Uploaded, Read-Only)',
    'ru-ru': '(Загружено, только для чтения)',
  },
  // WbStatus
  wbStatusUnuploadDialogTitle: {
    'en-us': 'Data Set Rollback Status',
    'ru-ru': 'Состояние отката набора данных',
  },
  wbStatusUploadDialogTitle: {
    'en-us': 'Data Set Upload Status',
    'ru-ru': 'Состояние загрузки набора данных',
  },
  wbStatusValidationDialogTitle: {
    'en-us': 'Data Set Validation Status',
    'ru-ru': 'Статус проверки набора данных',
  },
  aborting: {
    'en-us': 'Aborting...',
    'ru-ru': 'Прерывание...',
  },
  wbStatusAbortFailed: {
    'en-us': (operationName: string) =>
      `Failed aborting ${operationName}. Please try again later`,
    'ru-ru': (operationName: string) =>
      `Не удалось прервать операцию ${operationName}. Пожалуйста, попробуйте
      позже`,
  },
  wbStatusOperationNoProgress: {
    'en-us': (operationName: string) => `${operationName}...`,
    'ru-ru': (operationName: string) => `${operationName}...`,
  },
  wbStatusOperationProgress: {
    'en-us': (operationName: string, current: number, total: number) =>
      `${operationName} row ${current}/${total}`,
    'ru-ru': (operationName: string, current: number, total: number) =>
      `${operationName} строка ${current}/${total}`,
  },
  wbStatusPendingDialogText: {
    'en-us': (operationName: string) => (
      <>
        {operationName} of this Data Set should begin shortly.
        <br />
        <br />
        If this message persists for longer than 30 seconds, the {
          operationName
        }{' '}
        process is busy with another Data Set. Please try again later.
      </>
    ),
    'ru-ru': (operationName: string) => (
      <>
        {operationName} этого набора данных должно начаться в ближайшее время.
        <br />
        <br />
        Если это сообщение отображается дольше 30 секунд Процесс {
          operationName
        }{' '}
        занят другим набором данных. Пожалуйста, попробуй снова позже.
      </>
    ),
  },
  wbStatusErrorDialogText: {
    'en-us': (operationName: string) =>
      `Error occurred during ${operationName}`,
    'ru-ru': (operationName: string) =>
      `Произошла ошибка во время ${operationName}`,
  },
  updatingTrees: {
    'en-us': 'Updating trees...',
    'ru-ru': 'Обновление деревьев...',
  },
  invalidTemplateDialogText: {
    'en-us':
      'Selected Data Set has no upload plan. Please select a different one.',
    'ru-ru': `Выбранный набор данных не имеет плана загрузки. Выберите другой
      набор данных.`,
  },
});
