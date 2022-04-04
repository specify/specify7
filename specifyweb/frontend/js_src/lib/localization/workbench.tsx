/**
 * Localization strings used by the WorkBench (and WbPlanView)
 *
 * @module
 */

import React from 'react';

import { createDictionary, whitespaceSensitive } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const wbText = createDictionary({
  // Buttons
  rollback: {
    'en-us': 'Roll Back',
    'ru-ru': 'Откат',
    ca: 'Roll Back',
    'es-es': 'Roll Back',
  },
  validate: {
    'en-us': 'Validate',
    'ru-ru': 'Проверить',
    ca: 'Validate',
    'es-es': 'Validate',
  },
  validation: {
    'en-us': 'Validation',
    'ru-ru': 'Проверка',
    ca: 'Validation',
    'es-es': 'Validation',
  },
  upload: {
    'en-us': 'Upload',
    'ru-ru': 'Загрузка',
    ca: 'Upload',
    'es-es': 'Upload',
  },
  rollingBack: {
    'en-us': 'Rolling Back',
    'ru-ru': 'Откат',
    ca: 'Rolling Back',
    'es-es': 'Rolling Back',
  },
  uploading: {
    'en-us': 'Uploading',
    'ru-ru': 'Загрузка',
    ca: 'Uploading',
    'es-es': 'Uploading',
  },
  validating: {
    'en-us': 'Validating',
    'ru-ru': 'Проверка',
    ca: 'Validating',
    'es-es': 'Validating',
  },
  results: {
    'en-us': 'Results',
    'ru-ru': 'Результаты',
    ca: 'Results',
    'es-es': 'Results',
  },
  disambiguate: {
    'en-us': 'Disambiguate',
    'ru-ru': 'Устранить Неоднозначность',
    ca: 'Disambiguate',
    'es-es': 'Disambiguate',
  },
  fillDown: {
    'en-us': 'Fill Down',
    'ru-ru': 'Заполнить Вниз',
    ca: 'Fill Down',
    'es-es': 'Fill Down',
  },
  fillUp: {
    'en-us': 'Fill Up',
    'ru-ru': 'Заполнить Вверх',
    ca: 'Fill Up',
    'es-es': 'Fill Up',
  },
  revert: {
    'en-us': 'Revert',
    'ru-ru': 'Вернуть',
    ca: 'Revert',
    'es-es': 'Revert',
  },
  dataMapper: {
    'en-us': 'Data Mapper',
    'ru-ru': 'Сопоставления',
    ca: 'Data Mapper',
    'es-es': 'Data Mapper',
  },
  dataCheck: {
    'en-us': 'Data Check',
    'ru-ru': 'Проверка данных',
    ca: 'Data Check',
    'es-es': 'Data Check',
  },
  dataCheckOn: {
    'en-us': `Data Check: On`,
    'ru-ru': `Проверка данных: вкл.`,
    ca: `Data Check: On`,
    'es-es': `Data Check: On`,
  },
  changeOwner: {
    'en-us': 'Change Owner',
    'ru-ru': 'Сменить владельца',
    ca: 'Change Owner',
    'es-es': 'Change Owner',
  },
  export: {
    'en-us': 'Export',
    'ru-ru': 'Экспорт',
    ca: 'Export',
    'es-es': 'Export',
  },
  convertCoordinates: {
    'en-us': 'Convert Coordinates',
    'ru-ru': 'Преобразовать координаты',
    ca: 'Convert Coordinates',
    'es-es': 'Convert Coordinates',
  },
  navigation: {
    'en-us': 'Navigation',
    'ru-ru': 'Навигация',
    ca: 'Navigation',
    'es-es': 'Navigation',
  },
  replace: {
    'en-us': 'Replace',
    'ru-ru': 'Заменять',
    ca: 'Replace',
    'es-es': 'Replace',
  },
  replacementValue: {
    'en-us': 'Replacement value',
    'ru-ru': 'Замена',
    ca: 'Replacement value',
    'es-es': 'Replacement value',
  },
  searchResults: {
    'en-us': 'Search Results',
    'ru-ru': 'Результаты Поиска',
    ca: 'Search Results',
    'es-es': 'Search Results',
  },
  clickToToggle: {
    'en-us': 'Click to toggle visibility',
    'ru-ru': 'Нажмите, чтобы переключить видимость',
    ca: 'Click to toggle visibility',
    'es-es': 'Click to toggle visibility',
  },
  configureSearchReplace: {
    'en-us': 'Configure Search & Replace',
    'ru-ru': 'Настроить поиск и замену',
    ca: 'Configure Search & Replace',
    'es-es': 'Configure Search & Replace',
  },
  modifiedCells: {
    'en-us': 'Modified Cells',
    'ru-ru': 'Модифицированные клетки',
    ca: 'Modified Cells',
    'es-es': 'Modified Cells',
  },
  newCells: {
    'en-us': 'New Cells',
    'ru-ru': 'Новые клетки',
    ca: 'New Cells',
    'es-es': 'New Cells',
  },
  errorCells: {
    'en-us': 'Error Cells',
    'ru-ru': 'Ячейки с ошибками',
    ca: 'Error Cells',
    'es-es': 'Error Cells',
  },
  dataEditor: {
    'en-us': 'Data Editor',
    'ru-ru': 'Редактор данных',
    ca: 'Data Editor',
    'es-es': 'Data Editor',
  },
  // Dialogs
  noUploadPlanDialogTitle: {
    'en-us': 'Upload Plan Status',
    'ru-ru': 'Статус плана загрузки',
    ca: 'Upload Plan Status',
    'es-es': 'Upload Plan Status',
  },
  noUploadPlanDialogHeader: {
    'en-us': 'No Upload Plan is Defined',
    'ru-ru': 'План загрузки не определен',
    ca: 'No Upload Plan is Defined',
    'es-es': 'No Upload Plan is Defined',
  },
  noUploadPlanDialogMessage: {
    'en-us':
      'No Upload Plan has been defined for this Data Set. Create one now?',
    'ru-ru':
      'Для этого набора данных не определен план загрузки. Создать эго сейчас?',
    ca: 'No Upload Plan has been defined for this Data Set. Create one now?',
    'es-es':
      'No Upload Plan has been defined for this Data Set. Create one now?',
  },
  noDisambiguationResultsDialogTitle: {
    'en-us': 'Disambiguate',
    'ru-ru': 'Устранить неоднозначность',
    ca: 'Disambiguate',
    'es-es': 'Disambiguate',
  },
  noDisambiguationResultsDialogHeader: {
    'en-us': 'Unable to disambiguate',
    'ru-ru': 'Невозможно устранить неуверенность',
    ca: 'Unable to disambiguate',
    'es-es': 'Unable to disambiguate',
  },
  noDisambiguationResultsDialogMessage: {
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
    ca: `
      None of the matched records currently exist in the database.
      This can happen if all of the matching records were deleted since the
      validation process occurred, or if all of the matches were ambiguous
      with respect other records in this data set. In the latter case, you
      will need to add fields and values to the data set to resolve the
      ambiguity.`,
    'es-es': `
      None of the matched records currently exist in the database.
      This can happen if all of the matching records were deleted since the
      validation process occurred, or if all of the matches were ambiguous
      with respect other records in this data set. In the latter case, you
      will need to add fields and values to the data set to resolve the
      ambiguity.`,
  },
  disambiguationDialogTitle: {
    'en-us': 'Disambiguate Multiple Record Matches',
    'ru-ru': 'Устранение неоднозначности',
    ca: 'Disambiguate Multiple Record Matches',
    'es-es': 'Disambiguate Multiple Record Matches',
  },
  applyAllUnavailable: {
    'en-us': '"Apply All" is not available while Data Check is in progress.',
    'ru-ru': '«Применить все» недоступно, пока выполняется проверка данных.',
    ca: '"Apply All" is not available while Data Check is in progress.',
    'es-es': '"Apply All" is not available while Data Check is in progress.',
  },
  rollbackDialogTitle: {
    'en-us': 'Data Set Roll Back',
    'ru-ru': 'Откат набора данных',
    ca: 'Data Set Roll Back',
    'es-es': 'Data Set Roll Back',
  },
  rollbackDialogHeader: {
    'en-us': 'Begin Data Set Roll Back?',
    'ru-ru': 'Начать откат набора данных?',
    ca: 'Begin Data Set Roll Back?',
    'es-es': 'Begin Data Set Roll Back?',
  },
  rollbackDialogMessage: {
    'en-us': `
      Rolling back will remove the new data records this Data Set added to the
      Specify database. The entire rollback will be cancelled if any of the
      uploaded data have been referenced (re-used) by other data records since
      they were uploaded.`,
    'ru-ru': `
      Откат удалит новые записи данных, которые этот набор данных добавил в
      базу данных Specify. Весь откат будет отменен, если на загруженные данные
      ссылаются другие записи данных с момента они были загружены.`,
    ca: `
      Rolling back will remove the new data records this Data Set added to the
      Specify database. The entire rollback will be cancelled if any of the
      uploaded data have been referenced (re-used) by other data records since
      they were uploaded.`,
    'es-es': `
      Rolling back will remove the new data records this Data Set added to the
      Specify database. The entire rollback will be cancelled if any of the
      uploaded data have been referenced (re-used) by other data records since
      they were uploaded.`,
  },
  startUploadDialogTitle: {
    'en-us': 'Data Set Upload',
    'ru-ru': 'Загрузка набора данных',
    ca: 'Data Set Upload',
    'es-es': 'Data Set Upload',
  },
  startUploadDialogHeader: {
    'en-us': 'Begin Data Set Upload?',
    'ru-ru': 'Начать загрузку набора данных?',
    ca: 'Begin Data Set Upload?',
    'es-es': 'Begin Data Set Upload?',
  },
  startUploadDialogMessage: {
    'en-us': `
      Uploading the Data Set will add the data to the Specify database.`,
    'ru-ru': `
      Загрузка набора данных добавит данные в базу данных Specify.`,
    ca: `
      Uploading the Data Set will add the data to the Specify database.`,
    'es-es': `
      Uploading the Data Set will add the data to the Specify database.`,
  },
  deleteDataSetDialogTitle: {
    'en-us': 'Delete Data Set',
    'ru-ru': 'Удалить набор данных',
    ca: 'Delete Data Set',
    'es-es': 'Delete Data Set',
  },
  deleteDataSetDialogHeader: {
    'en-us': 'Delete this Data Set?',
    'ru-ru': 'Удалить этот набор данных?',
    ca: 'Delete this Data Set?',
    'es-es': 'Delete this Data Set?',
  },
  deleteDataSetDialogMessage: {
    'en-us': `
      Deleting a Data Set permanently removes it and its Upload Plan.
      Data mappings will no longer be available for re-use with other
      Data Sets. Also after deleting, Rollback will no longer be an option for
      an uploaded Data Set.`,
    'ru-ru': `
      Удаление набора данных приводит к безвозвратному удалению его и его плана
      загрузки. План загрузки не будут доступным для повторного использования;
      Отката не будет возможным для загруженного набора данных.`,
    ca: `
      Deleting a Data Set permanently removes it and its Upload Plan.
      Data mappings will not be available for re-use; Rollback will not be
      an option for an uploaded Data Set.`,
    'es-es': `
      Deleting a Data Set permanently removes it and its Upload Plan.
      Data mappings will no longer be available for re-use with other
      Data Sets. Also after deleting, Rollback will no longer be an option for
      an uploaded Data Set.`,
  },
  dataSetDeletedDialogTitle: {
    'en-us': 'Delete Data Set',
    'ru-ru': 'Удалить набор данных',
    ca: 'Delete Data Set',
    'es-es': 'Delete Data Set',
  },
  dataSetDeletedDialogHeader: {
    'en-us': 'Data Set successfully deleted',
    'ru-ru': 'Набор данных успешно удален',
    ca: 'Data Set successfully deleted',
    'es-es': 'Data Set successfully deleted',
  },
  dataSetDeletedDialogMessage: {
    'en-us': 'Data Set successfully deleted.',
    'ru-ru': 'Набор данных успешно удален.',
    ca: 'Data Set successfully deleted.',
    'es-es': 'Data Set successfully deleted.',
  },
  revertChangesDialogTitle: {
    'en-us': 'Revert Changes',
    'ru-ru': 'Отменить изменения',
    ca: 'Revert Changes',
    'es-es': 'Revert Changes',
  },
  revertChangesDialogHeader: {
    'en-us': 'Revert Unsaved Changes?',
    'ru-ru': 'Отменить несохраненные изменения?',
    ca: 'Revert Unsaved Changes?',
    'es-es': 'Revert Unsaved Changes?',
  },
  revertChangesDialogMessage: {
    'en-us': `
      This action will discard all changes made to the Data Set since
      the last Save.`,
    'ru-ru': `
      Это действие приведет к отмене всех изменений, внесенных в набор данных с
      момента последнего сохранение.`,
    ca: `
      This action will discard all changes made to the Data Set since
      the last Save.`,
    'es-es': `
      This action will discard all changes made to the Data Set since
      the last Save.`,
  },
  savingDialogTitle: {
    'en-us': 'Saving',
    'ru-ru': 'Сохранение',
    ca: 'Saving',
    'es-es': 'Saving',
  },
  onExitDialogMessage: {
    'en-us': 'Changes to this Data Set have not been Saved.',
    'ru-ru': 'Изменения в этом наборе данных не были сохранены.',
    ca: 'Changes to this Data Set have not been Saved.',
    'es-es': 'Changes to this Data Set have not been Saved.',
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
    ca: (value: string) =>
      whitespaceSensitive(
        `${value ? `"${value}"` : ''} is not a legal value in this picklist
      field.<br>

      Click on the arrow to choose among available options.`
      ),
    'es-es': (value: string) =>
      whitespaceSensitive(
        `${value ? `"${value}"` : ''} is not a legal value in this picklist
      field.<br>

      Click on the arrow to choose among available options.`
      ),
  },
  noMatchErrorMessage: {
    'en-us': 'No matching record for must-match table.',
    'ru-ru':
      'Нет соответствующей записи для таблицы обязательного соответствия.',
    ca: 'No matching record for must-match table.',
    'es-es': 'No matching record for must-match table.',
  },
  matchedMultipleErrorMessage: {
    'en-us': `
      This value matches two or more existing database records and the match
      must be disambiguated before uploading.`,
    'ru-ru': `
      Это значение соответствует двум или более существующим записям базы
      данных и совпадению`,
    ca: `
      This value matches two or more existing database records and the match
      must be disambiguated before uploading.`,
    'es-es': `
      This value matches two or more existing database records and the match
      must be disambiguated before uploading.`,
  },
  validationNoErrorsDialogTitle: {
    'en-us': 'Data Set Validation',
    'ru-ru': 'Проверка набора данных',
    ca: 'Data Set Validation',
    'es-es': 'Data Set Validation',
  },
  validationNoErrorsDialogHeader: {
    'en-us': 'Validate Completed with No Errors',
    'ru-ru': 'Проверка завершена без ошибок',
    ca: 'Validate Completed with No Errors',
    'es-es': 'Validate Completed with No Errors',
  },
  validationNoErrorsDialogMessage: {
    'en-us': `
      Validation found no errors, it is
      ready to be uploaded into the database.<br><br>

      Note: If this Data Set is edited and re-saved, Validate should
      be re-run prior to Uploading to verify that no errors have been
      introduced.`,
    'ru-ru': `
      Проверка завершена без ошибок. Этот набора данных
      готов к загрузке в базу данных.<br><br>

      Примечание: Если этот набор данных отредактирован и повторно сохранен,
      начать проверку снова, чтобы убедиться, что ошибок не было введено.`,
    ca: `
      Validation found no errors, it is
      ready to be uploaded into the database.<br><br>

      Note: If this Data Set is edited and re-saved, Validate should
      be re-run prior to Uploading to verify that no errors have been
      introduced.`,
    'es-es': `
      Validation found no errors, it is
      ready to be uploaded into the database.<br><br>

      Note: If this Data Set is edited and re-saved, Validate should
      be re-run prior to Uploading to verify that no errors have been
      introduced.`,
  },
  validationErrorsDialogTitle: {
    'en-us': 'Data Set Validation',
    'ru-ru': 'Проверка набора данных',
    ca: 'Data Set Validation',
    'es-es': 'Data Set Validation',
  },
  validationErrorsDialogHeader: {
    'en-us': 'Validate Completed with Errors',
    'ru-ru': 'Проверка завершена с ошибками',
    ca: 'Validate Completed with Errors',
    'es-es': 'Validate Completed with Errors',
  },
  validationErrorsDialogMessage: {
    'en-us': `
       Validation found errors in the Data Set.<br><br>

       Note: If this Data Set is edited and re-saved, Validate should
       be re-run prior to Uploading to verify that no errors have been
       introduced.`,
    'ru-ru': `
       Проверка обнаружила ошибки в наборе данных.<br><br>

       Примечание: Если этот набор данных отредактирован и повторно сохранен,
      начать проверку снова, чтобы убедиться, что ошибок не было введено.`,
    ca: `
       Validation found errors in the Data Set.<br><br>

       Note: If this Data Set is edited and re-saved, Validate should
       be re-run prior to Uploading to verify that no errors have been
       introduced.`,
    'es-es': `
       Validation found errors in the Data Set.<br><br>

       Note: If this Data Set is edited and re-saved, Validate should
       be re-run prior to Uploading to verify that no errors have been
       introduced.`,
  },
  uploadNoErrorsDialogTitle: {
    'en-us': 'Data Set Upload',
    'ru-ru': 'Загрузка набора данных',
    ca: 'Data Set Upload',
    'es-es': 'Data Set Upload',
  },
  uploadNoErrorsDialogHeader: {
    'en-us': 'Upload Completed with No Errors',
    'ru-ru': 'Загрузка завершена без ошибок',
    ca: 'Upload Completed with No Errors',
    'es-es': 'Upload Completed with No Errors',
  },
  uploadNoErrorsDialogMessage: {
    'en-us': `
      Click on the "Results" button to see the number of new records
      added to each database table.`,
    'ru-ru': `
      Нажмите кнопку «Результаты», чтобы увидеть количество новых записей
      добавлен в каждую таблицу базы данных`,
    ca: `
      Click on the "Results" button to see the number of new records
      added to each database table.`,
    'es-es': `
      Click on the "Results" button to see the number of new records
      added to each database table.`,
  },
  uploadErrorsDialogTitle: {
    'en-us': 'Data Set Upload',
    'ru-ru': 'Загрузка набора данных',
    ca: 'Data Set Upload',
    'es-es': 'Data Set Upload',
  },
  uploadErrorsDialogHeader: {
    'en-us': 'Upload Failed due to Error Cells',
    'ru-ru': 'Ошибка загрузки из-за ошибок',
    ca: 'Upload Failed due to Error Cells',
    'es-es': 'Upload Failed due to Error Cells',
  },
  uploadErrorsDialogMessage: {
    'en-us': `
      The upload failed due to one or more cell value errors.<br><br>

      Validate the Data Set and review the
      mouseover hints for each error cell, then make the
      appropriate corrections. Save and retry the
      Upload.`,
    'ru-ru': `
      Загрузка не удалась из-за одной или нескольких ошибок значений ячеек.
      <br><br>

      Проверте набор данных и наведите указатель мыши на каждую ячейку с
      ошибкой, затем сделайте соответствующие исправления, сохраните и повторите
      попытку.`,
    ca: `
      The upload failed due to one or more cell value errors.<br><br>

      Validate the Data Set and review the
      mouseover hints for each error cell, then make the
      appropriate corrections. Save and retry the
      Upload.`,
    'es-es': `
      The upload failed due to one or more cell value errors.<br><br>

      Validate the Data Set and review the
      mouseover hints for each error cell, then make the
      appropriate corrections. Save and retry the
      Upload.`,
  },
  dataSetRollbackDialogTitle: {
    'en-us': 'Data Set Rollback',
    'ru-ru': 'Откат набора данных',
    ca: 'Data Set Rollback',
    'es-es': 'Data Set Rollback',
  },
  dataSetRollbackDialogHeader: {
    'en-us': 'Data Set was rolled back successfully',
    'ru-ru': 'Набор данных был успешно откат',
    ca: 'Data Set was rolled back successfully',
    'es-es': 'Data Set was rolled back successfully',
  },
  dataSetRollbackDialogMessage: {
    'en-us':
      'This Rolledback Data Set is saved, and can be edited or re-uploaded.',
    'ru-ru': `Этот набор данных отката сохранянен, и его можно редактировать или
      повторно загружать.`,
    ca: 'This Rolledback Data Set is saved, and can be edited or re-uploaded.',
    'es-es':
      'This Rolledback Data Set is saved, and can be edited or re-uploaded.',
  },
  validationCanceledDialogTitle: {
    'en-us': 'Data Set Validation',
    'ru-ru': 'Проверка набора данных',
    ca: 'Data Set Validation',
    'es-es': 'Data Set Validation',
  },
  validationCanceledDialogHeader: {
    'en-us': 'Validation Canceled',
    'ru-ru': 'Проверка отменена',
    ca: 'Validation Canceled',
    'es-es': 'Validation Canceled',
  },
  validationCanceledDialogMessage: {
    'en-us': 'Data Set Validation cancelled.',
    'ru-ru': 'Проверка набора данных отменена.',
    ca: 'Data Set Validation cancelled.',
    'es-es': 'Data Set Validation cancelled.',
  },
  rollbackCanceledDialogTitle: {
    'en-us': 'Data Set Rollback',
    'ru-ru': 'Откат набора данных',
    ca: 'Data Set Rollback',
    'es-es': 'Data Set Rollback',
  },
  rollbackCanceledDialogHeader: {
    'en-us': 'Rollback Canceled',
    'ru-ru': 'Откат отменен',
    ca: 'Rollback Canceled',
    'es-es': 'Rollback Canceled',
  },
  rollbackCanceledDialogMessage: {
    'en-us': 'Data Set Rollback cancelled.',
    'ru-ru': 'Откат набора данных отменен.',
    ca: 'Data Set Rollback cancelled.',
    'es-es': 'Data Set Rollback cancelled.',
  },
  uploadCanceledDialogTitle: {
    'en-us': 'Data Set Upload',
    'ru-ru': 'Загрузка набора данных',
    ca: 'Data Set Upload',
    'es-es': 'Data Set Upload',
  },
  uploadCanceledDialogHeader: {
    'en-us': 'Upload Canceled',
    'ru-ru': 'Загрузка отменена',
    ca: 'Upload Canceled',
    'es-es': 'Upload Canceled',
  },
  uploadCanceledDialogMessage: {
    'en-us': 'Data Set Upload cancelled.',
    'ru-ru': 'Загрузка набора данных отменена.',
    ca: 'Data Set Upload cancelled.',
    'es-es': 'Data Set Upload cancelled.',
  },
  geoLocateDialogTitle: {
    'en-us': 'GeoLocate',
    'ru-ru': 'GeoLocate',
    ca: 'GeoLocate',
    'es-es': 'GeoLocate',
  },
  coordinateConverterDialogTitle: {
    'en-us': 'Geocoordinate Format',
    'ru-ru': 'Геокоординатный формат',
    ca: 'Geocoordinate Format',
    'es-es': 'Geocoordinate Format',
  },
  coordinateConverterDialogHeader: {
    'en-us': 'Choose a preferred Geocoordinate format',
    'ru-ru': 'Выберите предпочтительный формат геокоординат',
    ca: 'Choose a preferred Geocoordinate format',
    'es-es': 'Choose a preferred Geocoordinate format',
  },
  // Misc
  unmappedColumn: {
    'en-us': 'Unmapped Column',
    'ru-ru': 'Несопоставленный столбец',
    ca: 'Columna sense mapes',
    'es-es': 'Unmapped Column',
  },
  notMapped: {
    'en-us': 'NOT MAPPED',
    'ru-ru': 'НЕСОПОСТАВЛЕННЫЙ',
    ca: 'NOT MAPPED',
    'es-es': 'NOT MAPPED',
  },
  emptyStringInline: {
    'en-us': '(empty string)',
    'ru-ru': '(пуста строка)',
    ca: '(cadena buida)',
    'es-es': '(empty string)',
  },
  wbUploadedUnavailable: {
    'en-us': 'The data set must be validated or uploaded',
    'ru-ru': 'The data set must be validated or uploaded',
    ca: 'The data set must be validated or uploaded',
    'es-es': 'The data set must be validated or uploaded',
  },
  wbValidateUnavailable: {
    'en-us':
      'An Upload Plan needs to defined before this Data Set can be Validated',
    'ru-ru': whitespaceSensitive(`
      План загрузки должен быть определен до того, как этот набор данных
      может быть проверен
    `),
    ca: 'An Upload Plan needs to defined before this Data Set can be Validated',
    'es-es':
      'An Upload Plan needs to defined before this Data Set can be Validated',
  },
  unavailableWhileEditing: {
    'en-us': 'This action requires all changes to be saved',
    'ru-ru': 'Это действие требует сохранения всех изменений',
    ca: 'This action requires all changes to be saved',
    'es-es': 'This action requires all changes to be saved',
  },
  uploadUnavailableWhileHasErrors: {
    'en-us': 'Upload is unavailable while some cells have validation errors',
    'ru-ru': whitespaceSensitive(`
      Загрузка недоступна, в то время как в некоторых ячейках есть ошибки
      проверки
    `),
    ca: 'Upload is unavailable while some cells have validation errors',
    'es-es': 'Upload is unavailable while some cells have validation errors',
  },
  unavailableWhileViewingResults: {
    'en-us': 'This action is unavailable while viewing the upload results',
    'ru-ru': 'Это действие недоступно при просмотре результатов загрузки',
    ca: 'This action is unavailable while viewing the upload results',
    'es-es': 'This action is unavailable while viewing the upload results',
  },
  unavailableWhileValidating: {
    'en-us': 'This action is unavailable while Data Check is in progress',
    'ru-ru': 'Это действие недоступно, пока выполняется проверка данных',
    ca: 'This action is unavailable while Data Check is in progress',
    'es-es': 'This action is unavailable while Data Check is in progress',
  },
  unavailableWithoutLocality: {
    'en-us': 'This tool requires locality columns to be mapped',
    'ru-ru':
      'Этот инструмент требует, чтобы столбцы координат были сопоставлены',
    ca: 'This tool requires locality columns to be mapped',
    'es-es': 'This tool requires locality columns to be mapped',
  },
  unavailableWhenUploaded: {
    'en-us': 'This tool does not work with uploaded Data Sets',
    'ru-ru': 'Этот инструмент не работает с загруженными наборами данных',
    ca: 'This tool does not work with uploaded Data Sets',
    'es-es': 'This tool does not work with uploaded Data Sets',
  },
  dataSetDeletedOrNotFound: {
    'en-us': 'Data Set was deleted by another session.',
    'ru-ru': 'Набор данных был удален другим сеансом.',
    ca: 'Data Set was deleted by another session.',
    'es-es': 'Data Set was deleted by another session.',
  },
  includeDmsSymbols: {
    'en-us': 'Include DMS Symbols',
    'ru-ru': 'Включить символы DMS',
    ca: 'Include DMS Symbols',
    'es-es': 'Include DMS Symbols',
  },
  // WbUploaded
  uploadResults: {
    'en-us': 'Upload Results',
    'ru-ru': 'Результаты загрузки',
    ca: 'Upload Results',
    'es-es': 'Upload Results',
  },
  potentialUploadResults: {
    'en-us': 'Potential Upload Results',
    'ru-ru': 'Возможные результаты загрузки',
    ca: 'Potential Upload Results',
    'es-es': 'Potential Upload Results',
  },
  noUploadResultsAvailable: {
    'en-us': 'No upload results are available for this cell',
    'ru-ru': 'Для этой ячейки нет результатов загрузки',
    ca: 'No upload results are available for this cell',
    'es-es': 'No upload results are available for this cell',
  },
  wbUploadedDescription: {
    'en-us': 'Number of new records created in each table:',
    'ru-ru': 'Количество новых записей, созданных в каждой таблице:',
    ca: 'Number of new records created in each table:',
    'es-es': 'Number of new records created in each table:',
  },
  wbUploadedPotentialDescription: {
    'en-us': 'Number of new records that would be created in each table:',
    'ru-ru':
      'Количество новых записей, которые будут созданы в каждой таблице:',
    ca: 'Number of new records that would be created in each table:',
    'es-es': 'Number of new records that would be created in each table:',
  },
  // WbAdvancedSearch
  wbAdvancedSearchDialogTitle: {
    'en-us': 'Configure Search & Replace',
    'ru-ru': 'Настроить поиск и замену',
    ca: 'Configure Search & Replace',
    'es-es': 'Configure Search & Replace',
  },
  navigationOptions: {
    'en-us': 'Navigation Options',
    'ru-ru': 'Опции навигации',
    ca: 'Navigation Options',
    'es-es': 'Navigation Options',
  },
  cursorPriority: {
    'en-us': 'Cursor Priority',
    'ru-ru': 'Приоритет курсора',
    ca: 'Cursor Priority',
    'es-es': 'Cursor Priority',
  },
  columnFirst: {
    'en-us': 'Column first',
    'ru-ru': 'Столбец за столбцом',
    ca: 'Column first',
    'es-es': 'Column first',
  },
  rowFirst: {
    'en-us': 'Row first',
    'ru-ru': 'Ряд за рядом',
    ca: 'Row first',
    'es-es': 'Row first',
  },
  searchOptions: {
    'en-us': 'Search Options',
    'ru-ru': 'Параметры поиска',
    ca: 'Search Options',
    'es-es': 'Search Options',
  },
  findEntireCellsOnly: {
    'en-us': 'Find entire cells only',
    'ru-ru': 'Найти только целые ячейки',
    ca: 'Find entire cells only',
    'es-es': 'Find entire cells only',
  },
  matchCase: {
    'en-us': 'Match case',
    'ru-ru': 'Учитывать регистр',
    ca: 'Match case',
    'es-es': 'Match case',
  },
  useRegularExpression: {
    'en-us': 'Use regular expression',
    'ru-ru': 'Использовать регулярное выражение',
    ca: 'Use regular expression',
    'es-es': 'Use regular expression',
  },
  liveUpdate: {
    'en-us': 'Live search',
    'ru-ru': 'Живой поиск',
    ca: 'Live search',
    'es-es': 'Live search',
  },
  replaceOptions: {
    'en-us': 'Replace Options',
    'ru-ru': 'Параметры замены',
    ca: 'Replace Options',
    'es-es': 'Replace Options',
  },
  replaceMode: {
    'en-us': 'Replace Mode',
    'ru-ru': 'Режим замены',
    ca: 'Replace Mode',
    'es-es': 'Replace Mode',
  },
  replaceAll: {
    'en-us': 'Replace all matches',
    'ru-ru': 'Заменить все совпадения',
    ca: 'Replace all matches',
    'es-es': 'Replace all matches',
  },
  replaceNext: {
    'en-us': 'Replace next occurrence',
    'ru-ru': 'Заменить следующее происшествие',
    ca: 'Replace next occurrence',
    'es-es': 'Replace next occurrence',
  },
  // WbImport
  importDataSet: {
    'en-us': 'Import Data Set',
    'ru-ru': 'Импортировать набор данных',
    ca: 'Import Data Set',
    'es-es': 'Import Data Set',
  },
  wbImportHeader: {
    'en-us': 'Import a File to Create a New Data Set',
    'ru-ru': 'Импортируйте файл для создания нового набора данных',
    ca: 'Import a File to Create a New Data Set',
    'es-es': 'Import a File to Create a New Data Set',
  },
  previewDataSet: {
    'en-us': 'Preview Dataset',
    'ru-ru': 'Предварительный просмотр набора данных',
    ca: 'Preview Dataset',
    'es-es': 'Preview Dataset',
  },
  corruptFile: {
    'en-us': (fileName: string) =>
      `The file ${fileName} is corrupt or contains no data!`,
    'ru-ru': (fileName: string) =>
      `Файл ${fileName} поврежден или не содержит данных!`,
    ca: (fileName: string) =>
      `The file ${fileName} is corrupt or contains no data!`,
    'es-es': (fileName: string) =>
      `The file ${fileName} is corrupt or contains no data!`,
  },
  characterEncoding: {
    'en-us': 'Character encoding:',
    'ru-ru': 'Кодировка символов:',
    ca: 'Character encoding:',
    'es-es': 'Character encoding:',
  },
  chooseDataSetName: {
    'en-us': 'Name for New Data Set:',
    'ru-ru': 'Имя для нового набора данных:',
    ca: 'Name for New Data Set:',
    'es-es': 'Name for New Data Set:',
  },
  firstRowIsHeader: {
    'en-us': 'First Row is Header:',
    'ru-ru': 'Первая строка является заголовок:',
    ca: 'First Row is Header:',
    'es-es': 'First Row is Header:',
  },
  importFile: {
    'en-us': 'Import file',
    'ru-ru': 'Импортировать файл',
    ca: 'Import file',
    'es-es': 'Import file',
  },
  columnName: {
    'en-us': (columnIndex: number) => `Column ${columnIndex}`,
    'ru-ru': (columnIndex: number) => `Столбец ${columnIndex}`,
    ca: (columnIndex: number) => `Column ${columnIndex}`,
    'es-es': (columnIndex: number) => `Column ${columnIndex}`,
  },
  // WbPlanView
  matchBehavior: {
    'en-us': 'Match Behavior:',
    'ru-ru': 'Поведение при совпадении:',
    ca: 'Match Behavior:',
    'es-es': 'Match Behavior:',
  },
  columnMapping: {
    'en-us': 'Column Mapping',
    'ru-ru': 'Сопоставление столбцов',
    ca: 'Column Mapping',
    'es-es': 'Column Mapping',
  },
  suggestedMappings: {
    'en-us': 'Suggested Mappings:',
    'ru-ru': 'Предлагаемые сопоставления:',
    ca: 'Suggested Mappings:',
    'es-es': 'Suggested Mappings:',
  },
  requiredFields: {
    'en-us': 'Required Fields',
    'ru-ru': 'Обязательные поля',
    ca: 'Required Fields',
    'es-es': 'Required Fields',
  },
  optionalFields: {
    'en-us': 'Optional Fields',
    'ru-ru': 'Необязательные поля',
    ca: 'Optional Fields',
    'es-es': 'Optional Fields',
  },
  hiddenFields: {
    'en-us': 'Hidden Fields',
    'ru-ru': 'Скрытые поля',
    ca: 'Hidden Fields',
    'es-es': 'Hidden Fields',
  },
  mappingOptions: {
    'en-us': 'Mapping Options',
    'ru-ru': 'Параметры сопоставления',
    ca: 'Mapping Options',
    'es-es': 'Mapping Options',
  },
  ignoreWhenBlank: {
    'en-us': 'Ignore when Blank',
    'ru-ru': 'Игнорировать, когда пусто',
    ca: 'Ignore when Blank',
    'es-es': 'Ignore when Blank',
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
    ca: whitespaceSensitive(`
      When set to "Ignore when Blank" blank values in this column will not be
      considered for matching purposes. Blank values are ignored when matching
      even if a default value is provided
    `),
    'es-es': whitespaceSensitive(`
      When set to "Ignore when Blank" blank values in this column will not be
      considered for matching purposes. Blank values are ignored when matching
      even if a default value is provided
    `),
  },
  ignoreAlways: {
    'en-us': 'Always Ignore',
    'ru-ru': 'Всегда игнорировать',
    ca: 'Always Ignore',
    'es-es': 'Always Ignore',
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
    ca: whitespaceSensitive(`
      When set to "Ignore Always" the value in this column will never be
      considered for matching purposes, only for uploading.
    `),
    'es-es': whitespaceSensitive(`
      When set to "Ignore Always" the value in this column will never be
      considered for matching purposes, only for uploading.
    `),
  },
  ignoreNever: {
    'en-us': 'Never Ignore',
    'ru-ru': 'Никогда не игнорировать',
    ca: 'Never Ignore',
    'es-es': 'Never Ignore',
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
    ca: whitespaceSensitive(`
      This column would always be considered for matching purposes, regardless
      of it's value
    `),
    'es-es': whitespaceSensitive(`
      This column would always be considered for matching purposes, regardless
      of it's value
    `),
  },
  allowNullValues: {
    'en-us': 'Allow Null Values',
    'ru-ru': 'Разрешить нулевые значения',
    ca: 'Allow Null Values',
    'es-es': 'Allow Null Values',
  },
  useDefaultValue: {
    'en-us': 'Use Default Value',
    'ru-ru': 'Использовать значение по умолчанию',
    ca: 'Use Default Value',
    'es-es': 'Use Default Value',
  },
  defaultValue: {
    'en-us': 'Default Value',
    'ru-ru': 'Значение по умолчанию',
    ca: 'Default Value',
    'es-es': 'Default Value',
  },
  useDefaultValueDescription: {
    'en-us': 'This value would be used in place of empty cells',
    'ru-ru': 'Это значение будет использоваться вместо пустых ячеек',
    ca: 'This value would be used in place of empty cells',
    'es-es': 'This value would be used in place of empty cells',
  },
  addNewColumn: {
    'en-us': 'Add New Column',
    'ru-ru': 'Добавить новую колонку',
    ca: 'Add New Column',
    'es-es': 'Add New Column',
  },
  revealHiddenFormFields: {
    'en-us': 'Reveal Hidden Form Fields',
    'ru-ru': 'Показать скрытые поля формы',
    ca: 'Reveal Hidden Form Fields',
    'es-es': 'Reveal Hidden Form Fields',
  },
  validationFailedDialogTitle: {
    'en-us': 'Upload Plan Validation',
    'ru-ru': 'Проверка плана загрузки',
    ca: 'Upload Plan Validation',
    'es-es': 'Upload Plan Validation',
  },
  validationFailedDialogHeader: {
    'en-us': 'Validation found missing mappings:',
    'ru-ru': 'Проверка обнаружила недостающие сопоставления:',
    ca: 'Validation found missing mappings:',
    'es-es': 'Validation found missing mappings:',
  },
  validationFailedDialogMessage: {
    'en-us': `
      This data mapping is missing one or more data fields required for
      uploading by your Specify configuration. Add the missing mappings
      shown or save this Upload Plan as unfinished.`,
    'ru-ru': `
      В этом сопоставлении данные отсутствует в одном или нескольких полей
      данных, необходимых для загрузки по вашей Specify конфигурацию. Добавьте
      недостающие сопоставления или сохраните этот план загрузки как
      незавершенный.`,
    ca: `
      This data mapping is missing one or more data fields required for
      uploading by your Specify configuration. Add the missing mappings
      shown or save this Upload Plan as unfinished.`,
    'es-es': `
      This data mapping is missing one or more data fields required for
      uploading by your Specify configuration. Add the missing mappings
      shown or save this Upload Plan as unfinished.`,
  },
  continueEditing: {
    'en-us': 'Continue Editing',
    'ru-ru': 'Продолжить редактирование',
    ca: 'Continue Editing',
    'es-es': 'Continue Editing',
  },
  saveUnfinished: {
    'en-us': 'Save Unfinished',
    'ru-ru': 'Сохранить незаконченное',
    ca: 'Save Unfinished',
    'es-es': 'Save Unfinished',
  },
  map: {
    'en-us': 'Map',
    'ru-ru': 'Сопоставить',
    ca: 'Map',
    'es-es': 'Map',
  },
  unmap: {
    'en-us': 'Unmap',
    'ru-ru': 'Отменить сопоставления',
    ca: 'Anulla el mapa',
    'es-es': 'Unmap',
  },
  mapButtonDescription: {
    'en-us': 'Map selected field to selected header',
    'ru-ru': 'Сопоставить выбранное поле с выбранным столбцом',
    ca: 'Map selected field to selected header',
    'es-es': 'Map selected field to selected header',
  },
  relationship: {
    'en-us': (tableName: string): string =>
      `Relationship with the ${tableName} table`,
    'ru-ru': (tableName: string): string => `Связь с таблицей ${tableName}`,
    ca: (tableName: string): string =>
      `Relationship with the ${tableName} table`,
    'es-es': (tableName: string): string =>
      `Relationship with the ${tableName} table`,
  },
  relationshipInline: {
    'en-us': 'Relationship',
    'ru-ru': 'Связь',
    ca: 'Relació',
    'es-es': 'Relationship',
  },
  selected: {
    'en-us': 'Selected',
    'ru-ru': 'Выбрано',
    ca: 'Seleccionat',
    'es-es': 'Selected',
  },
  selectBaseTableDialogTitle: {
    'en-us': 'Select a Base Table',
    'ru-ru': 'Выберите базовую таблицу',
    ca: 'Select a Base Table',
    'es-es': 'Select a Base Table',
  },
  chooseExistingPlan: {
    'en-us': 'Choose Existing Plan',
    'ru-ru': 'Выберите существующий план',
    ca: 'Choose Existing Plan',
    'es-es': 'Choose Existing Plan',
  },
  showAdvancedTables: {
    'en-us': 'Show Advanced Tables',
    'ru-ru': 'Показать дополнительные таблицы',
    ca: 'Show Advanced Tables',
    'es-es': 'Show Advanced Tables',
  },
  dataSetUploaded: {
    'en-us': 'Data Set uploaded. This Upload Plan cannot be changed',
    'ru-ru': 'Набор данных загружен. Этот план загрузки нельзя изменить',
    ca: 'Data Set uploaded. This Upload Plan cannot be changed',
    'es-es': 'Data Set uploaded. This Upload Plan cannot be changed',
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
    ca: whitespaceSensitive(`
      You are viewing the mappings for an uploaded dataset.<br>

      To edit the mappings, rollback the uploaded data or create a new
      dataset
    `),
    'es-es': whitespaceSensitive(`
      You are viewing the mappings for an uploaded dataset.<br>

      To edit the mappings, rollback the uploaded data or create a new
      dataset
    `),
  },
  baseTable: {
    'en-us': 'Base Table',
    'ru-ru': 'Базовая таблица',
    ca: 'Base Table',
    'es-es': 'Base Table',
  },
  goToBaseTableDialogTitle: {
    'en-us': 'Change Base Table',
    'ru-ru': 'Изменить базовую таблицу',
    ca: 'Change Base Table',
    'es-es': 'Change Base Table',
  },
  goToBaseTableDialogHeader: {
    'en-us': 'Change the Base Table for Mapping Data Set Columns?',
    'ru-ru':
      'Изменить базовую таблицу для сопоставления столбцов набора данных?',
    ca: 'Change the Base Table for Mapping Data Set Columns?',
    'es-es': 'Change the Base Table for Mapping Data Set Columns?',
  },
  goToBaseTableDialogMessage: {
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
    ca: `
      Choosing a different Base Table for a Data Set Upload will make that
      table the new starting point for column-to-data field mappings and
      will erase existing mappings. The AutoMapper will attempt to map
      columns to the new Base Table fields.`,
    'es-es': `
      Choosing a different Base Table for a Data Set Upload will make that
      table the new starting point for column-to-data field mappings and
      will erase existing mappings. The AutoMapper will attempt to map
      columns to the new Base Table fields.`,
  },
  clearMapping: {
    'en-us': 'Clear Mapping',
    'ru-ru': 'Очистить сопоставление',
    ca: 'Clear Mapping',
    'es-es': 'Clear Mapping',
  },
  reRunAutoMapper: {
    'en-us': 'Rerun AutoMapper',
    'ru-ru': 'Перезапустить AutoMapper',
    ca: 'Rerun AutoMapper',
    'es-es': 'Rerun AutoMapper',
  },
  autoMapper: {
    'en-us': 'AutoMapper',
    'ru-ru': 'AutoMapper',
    ca: 'AutoMapper',
    'es-es': 'AutoMapper',
  },
  mappingEditor: {
    'en-us': 'Map Explorer',
    'ru-ru': 'Обзор сопоставлений',
    ca: 'Map Explorer',
    'es-es': 'Map Explorer',
  },
  hideMappingEditor: {
    'en-us': 'Hide Map Explorer',
    'ru-ru': 'Спрятать обзор сопоставлений',
    ca: 'Hide Map Explorer',
    'es-es': 'Hide Map Explorer',
  },
  showMappingEditor: {
    'en-us': 'Show Map Explorer',
    'ru-ru': 'Показать обзор сопоставлений',
    ca: 'Show Map Explorer',
    'es-es': 'Show Map Explorer',
  },
  mappings: {
    'en-us': 'Mappings',
    'ru-ru': 'Сопоставления',
    ca: 'Mappings',
    'es-es': 'Mappings',
  },
  clearMappings: {
    'en-us': 'Clear Mappings',
    'ru-ru': 'Очистить сопоставления',
    ca: 'Clear Mappings',
    'es-es': 'Clear Mappings',
  },
  emptyDataSetDialogTitle: {
    'en-us': 'Empty Data Set',
    'ru-ru': 'Пустой набор данных',
    ca: 'Empty Data Set',
    'es-es': 'Empty Data Set',
  },
  emptyDataSetDialogHeader: {
    'en-us': 'Empty Data Set',
    'ru-ru': 'Пустой набор данных',
    ca: 'Empty Data Set',
    'es-es': 'Empty Data Set',
  },
  emptyDataSetDialogMessage: {
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
    ca: (
      <>
        This Data Set doesn&apos;t have any columns.
        <br />
        Press the &quot;Add New Column&quot; button at the bottom of the screen
        to add new columns.
      </>
    ),
    'es-es': (
      <>
        This Data Set doesn&apos;t have any columns.
        <br />
        Press the &quot;Add New Column&quot; button at the bottom of the screen
        to add new columns.
      </>
    ),
  },
  reRunAutoMapperDialogTitle: {
    'en-us': 'AutoMapper',
    'ru-ru': 'AutoMapper',
    ca: 'AutoMapper',
    'es-es': 'AutoMapper',
  },
  reRunAutoMapperDialogHeader: {
    'en-us': 'Automap to start a new Upload Plan?',
    'ru-ru': 'Автоматически сопоставить?',
    ca: 'Automap to start a new Upload Plan?',
    'es-es': 'Automap to start a new Upload Plan?',
  },
  reRunAutoMapperDialogMessage: {
    'en-us': 'This will erase existing data field mappings.',
    'ru-ru': 'Это сотрет существующие сопоставления.',
    ca: 'This will erase existing data field mappings.',
    'es-es': 'This will erase existing data field mappings.',
  },
  nothingToValidateDialogTitle: {
    'en-us': 'Nothing to validate',
    'ru-ru': 'Нет сопоставлений для проверки',
    ca: 'Nothing to validate',
    'es-es': 'Nothing to validate',
  },
  nothingToValidateDialogHeader: {
    'en-us': 'There are no mappings to validate',
    'ru-ru': 'Нет сопоставлений для проверки',
    ca: 'There are no mappings to validate',
    'es-es': 'There are no mappings to validate',
  },
  nothingToValidateDialogMessage: {
    'en-us': 'Please map some headers before running the validation.',
    'ru-ru':
      'Пожалуйста, сопоставьте некоторые заголовки перед запуском проверки.',
    ca: 'Please map some headers before running the validation.',
    'es-es': 'Please map some headers before running the validation.',
  },
  matchingLogicDialogTitle: {
    'en-us': 'Change Matching Logic',
    'ru-ru': 'Изменить логику соответствия',
    ca: 'Change Matching Logic',
    'es-es': 'Change Matching Logic',
  },
  matchingLogicDialogMessage: {
    'en-us': 'Require Data to Match Existing Records',
    'ru-ru': 'Требовать сопоставления данных с существующими записями',
    ca: 'Require Data to Match Existing Records',
    'es-es': 'Require Data to Match Existing Records',
  },
  matchingLogicUnavailableDialogMessage: {
    'en-us': 'Matching logic is unavailable for current mappings',
    'ru-ru': 'Логика соответствия недоступна для текущих сопоставлений',
    ca: 'Matching logic is unavailable for current mappings',
    'es-es': 'Matching logic is unavailable for current mappings',
  },
  mustMatch: {
    'en-us': 'Must Match',
    'ru-ru': 'Логика соответствия',
    ca: 'Must Match',
    'es-es': 'Must Match',
  },
  unloadProtectMessage: {
    'en-us': 'This mapping has not been saved.',
    'ru-ru': 'Это сопоставление не было сохранено.',
    ca: 'This mapping has not been saved.',
    'es-es': 'This mapping has not been saved.',
  },
  newDataSetName: {
    'en-us': (date: string): string => `New Data Set ${date}`,
    'ru-ru': (date: string): string => `Новый набор данных ${date}`,
    ca: (date: string): string => `New Data Set ${date}`,
    'es-es': (date: string): string => `New Data Set ${date}`,
  },
  newHeaderName: {
    'en-us': (index: number): string => `New Column ${index}`,
    'ru-ru': (index: number): string => `Новый столбец ${index}`,
    ca: (index: number): string => `New Column ${index}`,
    'es-es': (index: number): string => `New Column ${index}`,
  },
  noHeader: {
    'en-us': '(no header)',
    'ru-ru': '(нет заголовка)',
    ca: '(no header)',
    'es-es': '(no header)',
  },
  // WbsDialog
  wbsDialogDefaultDialogTitle: {
    'en-us': (dataSetCount: number) => `Data Sets (${dataSetCount})`,
    'ru-ru': (dataSetCount: number) => `Наборы данных (${dataSetCount})`,
    ca: (dataSetCount: number) => `Data Sets (${dataSetCount})`,
    'es-es': (dataSetCount: number) => `Data Sets (${dataSetCount})`,
  },
  wbsDialogEmptyDefaultDialogMessage: {
    'en-us': 'Currently no Data Sets exist.',
    'ru-ru': 'В настоящее время наборов данных не существует.',
    ca: 'Currently no Data Sets exist.',
    'es-es': 'Currently no Data Sets exist.',
  },
  wbsDialogTemplatesDialogTitle: {
    'en-us': 'Copy plan from existing Data Set',
    'ru-ru': 'Копировать план из существующего набора данных',
    ca: 'Copy plan from existing Data Set',
    'es-es': 'Copy plan from existing Data Set',
  },
  wbsDialogEmptyTemplateDialogMessage: {
    'en-us':
      'There are no plans available, please continue to create an upload plan.',
    'ru-ru': 'Нет доступных планов, продолжайте создавать план загрузки.',
    ca: 'There are no plans available, please continue to create an upload plan.',
    'es-es':
      'There are no plans available, please continue to create an upload plan.',
  },
  createDataSetInstructions: {
    'en-us': `
    Use "Import a file" or "Create New" to make a new one.`,
    'ru-ru': `
    Используйте «Импортировать файл» или «Создать новый», чтобы создать новый.`,
    ca: `
    Use "Import a file" or "Create New" to make a new one.`,
    'es-es': `
    Use "Import a file" or "Create New" to make a new one.`,
  },
  createNew: {
    'en-us': 'Create New',
    'ru-ru': 'Создайте новый',
    ca: 'Create New',
    'es-es': 'Create New',
  },
  // Datasetmeta
  dataSetMetaDialogTitle: {
    'en-us': 'Data Set Properties',
    'ru-ru': 'Свойства набора данных',
    ca: 'Data Set Properties',
    'es-es': 'Data Set Properties',
  },
  dataSetName: {
    'en-us': 'Data Set Name:',
    'ru-ru': 'Название набора данных:',
    ca: 'Data Set Name:',
    'es-es': 'Data Set Name:',
  },
  remarks: {
    'en-us': 'Remarks:',
    'ru-ru': 'Примечания:',
    ca: 'Remarks:',
    'es-es': 'Remarks:',
  },
  numberOfRows: {
    'en-us': 'Number of rows:',
    'ru-ru': 'Количество рядов:',
    ca: 'Number of rows:',
    'es-es': 'Number of rows:',
  },
  numberOfColumns: {
    'en-us': 'Number of columns:',
    'ru-ru': 'Количество столбцов:',
    ca: 'Number of columns:',
    'es-es': 'Number of columns:',
  },
  created: {
    'en-us': 'Created:',
    'ru-ru': 'Созданный:',
    ca: 'Created:',
    'es-es': 'Created:',
  },
  modified: {
    'en-us': 'Modified:',
    'ru-ru': 'Измененый:',
    ca: 'Modified:',
    'es-es': 'Modified:',
  },
  uploaded: {
    'en-us': 'Uploaded:',
    'ru-ru': 'Загруженый:',
    ca: 'Uploaded:',
    'es-es': 'Uploaded:',
  },
  importedFileName: {
    'en-us': 'Import file name:',
    'ru-ru': 'Имя файла импорта:',
    ca: 'Import file name:',
    'es-es': 'Import file name:',
  },
  noFileName: {
    'en-us': '(no file name)',
    'ru-ru': '(файл без имени)',
    ca: '(no file name)',
    'es-es': '(no file name)',
  },
  changeDataSetOwnerDialogTitle: {
    'en-us': 'Data Set Properties',
    'ru-ru': 'Свойства набора данных',
    ca: 'Data Set Properties',
    'es-es': 'Data Set Properties',
  },
  changeDataSetOwnerDialogHeader: {
    'en-us': 'Change Data Set Owner',
    'ru-ru': 'Изменить владельца набора данных',
    ca: 'Change Data Set Owner',
    'es-es': 'Change Data Set Owner',
  },
  changeDataSetOwnerDialogMessage: {
    'en-us': 'Select New Owner:',
    'ru-ru': 'Выберите нового владельца:',
    ca: 'Select New Owner:',
    'es-es': 'Select New Owner:',
  },
  dataSetOwnerChangedDialogTitle: {
    'en-us': 'Data Set Properties',
    'ru-ru': 'Свойства набора данных',
    ca: 'Data Set Properties',
    'es-es': 'Data Set Properties',
  },
  dataSetOwnerChangedDialogHeader: {
    'en-us': 'Data Set owner changed',
    'ru-ru': 'Владелец набора данных изменен',
    ca: 'Data Set owner changed',
    'es-es': 'Data Set owner changed',
  },
  dataSetOwnerChangedDialogMessage: {
    'en-us': 'Data Set owner changed.',
    'ru-ru': 'Владелец набора данных изменен',
    ca: 'Data Set owner changed.',
    'es-es': 'Data Set owner changed.',
  },
  dataSet: {
    'en-us': 'Data Set:',
    'ru-ru': 'Набор данных:',
    ca: 'Data Set:',
    'es-es': 'Data Set:',
  },
  dataSetUploadedLabel: {
    'en-us': '(Uploaded, Read-Only)',
    'ru-ru': '(Загружено, только для чтения)',
    ca: '(Uploaded, Read-Only)',
    'es-es': '(Uploaded, Read-Only)',
  },
  // WbStatus
  wbStatusUnuploadDialogTitle: {
    'en-us': 'Data Set Rollback Status',
    'ru-ru': 'Состояние отката набора данных',
    ca: 'Data Set Rollback Status',
    'es-es': 'Data Set Rollback Status',
  },
  wbStatusUploadDialogTitle: {
    'en-us': 'Data Set Upload Status',
    'ru-ru': 'Состояние загрузки набора данных',
    ca: 'Data Set Upload Status',
    'es-es': 'Data Set Upload Status',
  },
  wbStatusValidationDialogTitle: {
    'en-us': 'Data Set Validation Status',
    'ru-ru': 'Статус проверки набора данных',
    ca: 'Data Set Validation Status',
    'es-es': 'Data Set Validation Status',
  },
  aborting: {
    'en-us': 'Aborting...',
    'ru-ru': 'Прерывание...',
    ca: 'Aborting...',
    'es-es': 'Aborting...',
  },
  wbStatusAbortFailed: {
    'en-us': (operationName: string) =>
      `Failed aborting ${operationName}. Please try again later`,
    'ru-ru': (operationName: string) =>
      `Не удалось прервать операцию ${operationName}. Пожалуйста, попробуйте
      позже`,
    ca: (operationName: string) =>
      `Failed aborting ${operationName}. Please try again later`,
    'es-es': (operationName: string) =>
      `Failed aborting ${operationName}. Please try again later`,
  },
  wbStatusOperationNoProgress: {
    'en-us': (operationName: string) => `${operationName}...`,
    'ru-ru': (operationName: string) => `${operationName}...`,
    ca: (operationName: string) => `${operationName}...`,
    'es-es': (operationName: string) => `${operationName}...`,
  },
  wbStatusOperationProgress: {
    'en-us': (operationName: string, current: number, total: number) =>
      `${operationName} row ${current}/${total}`,
    'ru-ru': (operationName: string, current: number, total: number) =>
      `${operationName} строка ${current}/${total}`,
    ca: (operationName: string, current: number, total: number) =>
      `${operationName} row ${current}/${total}`,
    'es-es': (operationName: string, current: number, total: number) =>
      `${operationName} row ${current}/${total}`,
  },
  wbStatusPendingDialogMessage: {
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
    ca: (operationName: string) => (
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
    'es-es': (operationName: string) => (
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
  },
  wbStatusErrorDialogMessage: {
    'en-us': (operationName: string) =>
      `Error occurred during ${operationName}`,
    'ru-ru': (operationName: string) =>
      `Произошла ошибка во время ${operationName}`,
    ca: (operationName: string) => `Error occurred during ${operationName}`,
    'es-es': (operationName: string) =>
      `Error occurred during ${operationName}`,
  },
  updatingTrees: {
    'en-us': 'Updating trees...',
    'ru-ru': 'Обновление деревьев...',
    ca: 'Updating trees...',
    'es-es': 'Updating trees...',
  },
});

export default wbText;
