import React from 'react';

import { createDictionary, createHeader, createJsxHeader } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const wbText = createDictionary({
  // Buttons
  rollback: 'Roll Back',
  validate: 'Validate',
  validation: 'Validation',
  upload: 'Upload',
  rollingBack: 'Rolling Back',
  uploading: 'Uploading',
  validating: 'Validating',
  results: 'Results',
  disambiguate: 'Disambiguate',
  fillDown: 'Fill Down',
  fillUp: 'Fill Up',
  revert: 'Revert',
  geoLocate: 'GeoLocate',
  dataMapper: 'Data Mapper',
  dataCheck: 'Data Check',
  dataCheckOn: (queueLength: number) =>
    `Data Check: On ${queueLength > 0 ? ` (${queueLength})` : ''}`,
  changeOwner: 'Change Owner',
  export: 'Export',
  convertCoordinates: 'Convert Coordinates',
  navigation: 'Navigation',
  replace: 'Replace',
  replacementValue: 'Replacement value',
  searchResults: 'Search Results',
  configureSearchReplace: 'Configure Search & Replace',
  modifiedCells: 'Modified Cells',
  newCells: 'New Cells',
  errorCells: 'Error Cells',
  dataEditor: 'Data Editor',

  // Dialogs
  dataSetLoadingDialogTitle: 'Loading',
  noUploadPlanDialogTitle: 'Upload Plan Status',
  noUploadPlanDialogHeader: createHeader('No Upload Plan is Defined'),
  noUploadPlanDialogMessage:
    'No Upload Plan has been defined for this Data Set. Create one now?',
  noDisambiguationResultsDialogTitle: 'Disambiguate',
  noDisambiguationResultsDialogHeader: createHeader('Unable to disambiguate'),
  noDisambiguationResultsDialogMessage: `
    None of the matched records currently exist in the database.
    This can happen if all of the matching records were deleted since the
    validation process occurred, or if all of the matches were ambiguous
    with respect other records in this data set. In the latter case, you
    will need to add fields and values to the data set to resolve the
    ambiguity.`,
  disambiguationDialogTitle: 'Disambiguate Multiple Record Matches',
  applyAllUnavailable: `
    "Apply All" is not available while Data Check is in progress.`,
  rollbackDialogTitle: 'Data Set Roll Back',
  rollbackDialogHeader: createHeader('Begin Data Set Roll Back?'),
  rollbackDialogMessage: `
    Rolling back will remove the new data records this Data Set added to the
    Specify database. The entire rollback will be cancelled if any of the
    uploaded data have been referenced (re-used) by other data records since
    they were uploaded.`,
  startUploadDialogTitle: 'Data Set Upload',
  startUploadDialogHeader: createHeader('Begin Data Set Upload?'),
  startUploadDialogMessage: `
    Uploading the Data Set will add the data to the Specify database.`,
  deleteDataSetDialogTitle: 'Delete Data Set',
  deleteDataSetDialogHeader: createHeader('Delete this Data Set?'),
  deleteDataSetDialogMessage: `
    Deleting a Data Set permanently removes it and its Upload Plan.
    Data mappings will not be available for re-use; Rollback will not be
    an option for an uploaded Data Set.`,
  dataSetDeletedTitle: 'Delete Data Set',
  dataSetDeletedHeader: createHeader('Data Set successfully deleted'),
  dataSetDeletedMessage: 'Data Set successfully deleted.',
  revertChangesDialogTitle: 'Revert Changes',
  revertChangesDialogHeader: createHeader('Revert Unsaved Changes?'),
  revertChangesDialogMessage: `
    This action will discard all changes made to the Data Set since
    the last Save.`,
  savingDialogTitle: 'Saving',
  onExitDialogMessage: 'Changes to this Data Set have not been Saved.',

  // Validation
  /* This value must match the one on the back-end exactly */
  picklistValidationFailed: (value: string) =>
    [
      `${value ? `"${value}"` : ''} is not a legal value in this picklist `,
      'field.\nClick on the arrow to choose among available options.',
    ].join(''),
  noMatchErrorMessage: 'No matching record for must-match table.',
  matchedMultipleErrorMessage: [
    'This value matches two or more existing database records and the match ',
    'must be disambiguated before uploading.',
  ].join(''),
  validationNoErrorsDialogTitle: 'Data Set Validation',
  validationNoErrorsDialogHeader: createHeader(
    'Validate Completed with No Errors'
  ),
  validationNoErrorsDialogMessage: `
    Validation found no errors, it is
    ready to be uploaded into the database.<br><br>

    Note: If this Data Set is edited and re-saved, Validate should
    be re-run prior to Uploading to verify that no errors have been
    introduced.`,
  validationErrorsDialogTitle: 'Data Set Validation',
  validationErrorsDialogHeader: createHeader('Validate Completed with Errors'),
  validationErrorsDialogMessage: `
    Validation found errors in the Data Set.<br><br>

   Note: If this Data Set is edited and re-saved, Validate should
   be re-run prior to Uploading to verify that no errors have been introduced.`,
  uploadNoErrorsDialogTitle: 'Data Set Upload',
  uploadNoErrorsDialogHeader: createHeader('Upload Completed with No Errors'),
  uploadNoErrorsDialogMessage: `
    Click on the "Results" button to see the number of new records
    added to each database table.`,
  uploadErrorsDialogTitle: 'Data Set Upload',
  uploadErrorsDialogHeader: createHeader('Upload Failed due to Error Cells'),
  uploadErrorsDialogMessage: `
    The upload failed due to one or more cell value errors.<br><br>

    Validate the Data Set and review the
    mouseover hints for each error cell, then make the
    appropriate corrections. Save and retry the
    Upload.`,
  dataSetRollbackDialogTitle: 'Data Set Rollback',
  dataSetRollbackDialogHeader: createHeader(
    'Data Set was rolled back successfully'
  ),
  dataSetRollbackDialogMessage:
    'This Rolledback Data Set is saved, and can be edited or re-uploaded.',
  validationCanceledDialogTitle: 'Data Set Validation',
  validationCanceledDialogHeader: createHeader('Validation Canceled'),
  validationCanceledDialogMessage: 'Data Set Validation cancelled.',
  rollbackCanceledDialogTitle: 'Data Set Rollback',
  rollbackCanceledDialogHeader: createHeader('Rollback Canceled'),
  rollbackCanceledDialogMessage: 'Data Set Rollback cancelled.',
  uploadCanceledDialogTitle: 'Data Set Upload',
  uploadCanceledDialogHeader: createHeader('Upload Canceled'),
  uploadCanceledDialogMessage: 'Data Set Upload cancelled.',
  geoLocateDialogTitle: 'GeoLocate',
  coordinateConverterDialogTitle: 'Geocoordinate Format',
  coordinateConverterDialogHeader: createHeader(
    'Choose a preferred Geocoordinate format'
  ),

  // Misc
  wbUploadedUnavailable: 'The data set must be validated or uploaded',
  wbValidateUnavailable:
    'An Upload Plan needs to defined before this Data Set can be Validated',
  unavailableWhileEditing: 'This action requires all changes to be saved',
  uploadUnavailableWhileHasErrors:
    'Upload is unavailable while some cells have validation errors',
  unavailableWhileViewingResults:
    'This action is unavailable while viewing the upload results',
  unavailableWhileValidating:
    'This action is unavailable while Data Check is in progress',
  unavailableWithoutLocality:
    'This tool requires locality columns to be mapped',
  unavailableWhenUploaded: 'This tool does not work with uploaded Data Sets',
  dataSetDeletedOrNotFound: 'Data Set was deleted by another session.',
  includeDmsSymbols: 'Include DMS Symbols',

  // WbUploaded
  uploadResults: 'Upload Results',
  potentialUploadResults: 'Potential Upload Results',
  noUploadResultsAvailable: 'No upload results are available for this cell',
  wbUploadedDescription: 'Number of new records created in each table:',
  wbUploadedPotentialDescription:
    'Number of new records that would be created in each table:',

  // WbAdvancedSearch
  wbAdvancedSearchDialogTitle: 'Configure Search & Replace',
  navigationOptions: 'Navigation Options',
  cursorPriority: 'Cursor Priority',
  columnFirst: 'Column first',
  rowFirst: 'Row first',
  searchOptions: 'Search Options',
  findEntireCellsOnly: 'Find entire cells only',
  matchCase: 'Match case',
  useRegularExpression: 'Use regular expression',
  liveUpdate: 'Live search',
  replaceOptions: 'Replace Options',
  replaceMode: 'Replace Mode',
  replaceAll: 'Replace all matches',
  replaceNext: 'Replace next occurrence',

  // WbImport
  importDataSet: 'Import Data Set',
  wbImportHeader: 'Import a File to Create a New Data Set',
  previewDataSet: 'Preview Dataset',
  corruptFile: (fileName: string) =>
    `The file ${fileName} is corrupt or contains no data!`,
  characterEncoding: 'Character encoding:',
  filePickerMessage: 'Choose a file or drag it here',
  selectedFileName: (fileName: string) => `Selected file: ${fileName}`,
  chooseDataSetName: 'Name for New Data Set:',
  firstRowIsHeader: 'First Row is Header:',
  importFile: 'Import file',
  columnName: (columnIndex: number) => `Column ${columnIndex}`,

  // WbPlanView
  matchBehavior: 'Match Behavior:',
  suggestedMappings: 'Suggested Mappings:',
  requiredFields: 'Required Fields',
  optionalFields: 'Optional Fields',
  hiddenFields: 'Hidden Fields',
  mappingOptions: 'Mapping Options',
  ignoreWhenBlank: 'Ignore when Blank',
  ignoreWhenBlankDescription: [
    'When set to "Ignore when Blank" blank values in this column will not be ',
    'considered for matching purposes. Blank values are ignored when matching ',
    'even if a default value is provided',
  ].join(''),
  ignoreAlways: 'Always Ignore',
  ignoreAlwaysDescription: [
    'When set to "Ignore Always" the value in this column will never be ',
    'considered for matching purposes, only for uploading.',
  ].join(''),
  ignoreNever: 'Never Ignore',
  ignoreNeverDescription: [
    'This column would always be considered for matching purposes, regardless ',
    "of it's value",
  ].join(''),
  allowNullValues: 'Allow Null Values',
  useDefaultValue: 'Use Default Value',
  defaultValue: 'Default Value',
  useDefaultValueDescription:
    'This value would be used in place of empty cells',
  addNewColumn: 'Add New Column',
  revealHiddenFormFields: 'Reveal Hidden Form Fields',
  validationFailedDialogTitle: 'Upload Plan Validation',
  validationFailedDialogHeader: createJsxHeader(
    'Validation found missing mappings:'
  ),
  validationFailedDialogMessage: `
    This data mapping is missing one or more data fields required for
    uploading by your Specify configuration. Add the missing mappings
    shown or save this Upload Plan as unfinished.`,
  continueEditing: 'Continue Editing',
  saveUnfinished: 'Save Unfinished',
  map: 'Map',
  mapButtonDescription: 'Map selected field to selected header',
  relationship: (tableName: string): string =>
    `Relationship with the ${tableName} table`,
  selectBaseTableDialogTitle: 'Select a Base Table',
  chooseExistingPlan: 'Choose Existing Plan',
  showAdvancedTables: 'Show Advanced Tables',
  dataSetUploaded: 'Data Set uploaded. This Upload Plan cannot be changed',
  dataSetUploadedDescription: [
    'You are viewing the mappings for an uploaded dataset.\n',
    'To edit the mappings, rollback the uploaded data or create a new ',
    'dataset',
  ].join(''),
  baseTable: 'Base Table',
  goToBaseTableDialogTitle: 'Change Base Table',
  goToBaseTableDialogHeader: createJsxHeader(
    'Change the Base Table for Mapping Data Set Columns?'
  ),
  goToBaseTableDialogMessage: `
    Choosing a different Base Table for a Data Set Upload will make that
    table the new starting point for column-to-data field mappings and
    will erase existing mappings. The Automapper will attempt to map
    columns to the new Base Table fields.`,
  clearMapping: 'Clear Mapping',
  changeBaseTable: 'Change Base Table',
  reRunAutoMapper: 'Rerun Automapper',
  autoMapper: 'Automapper',
  mappingEditor: 'Map Explorer',
  hideMappingEditor: 'Hide Map Explorer',
  showMappingEditor: 'Show Map Explorer',
  resizeMappingEditorButtonDescription:
    'Click and drag up or down to resize the Map Explorer',
  mappings: 'Mappings',
  clearMappings: 'Clear Mappings',
  emptyDataSetDialogTitle: 'Empty Data Set',
  emptyDataSetDialogHeader: createJsxHeader('Empty Data Set'),
  emptyDataSetDialogMessage: (
    <>
      This Data Set doesn&apos;t have any columns.
      <br />
      Press the &quot;Add New Column&quot; button at the bottom of the screen to
      add new columns,
    </>
  ),
  reRunAutoMapperDialogTitle: 'Automapper',
  reRunAutoMapperDialogHeader: createJsxHeader(
    'Automap to start a new Upload Plan?'
  ),
  reRunAutoMapperDialogMessage: 'This will erase existing data field mappings.',
  nothingToValidateDialogTitle: 'Nothing to validate',
  nothingToValidateDialogHeader: createJsxHeader(
    'There are no mappings to validate'
  ),
  nothingToValidateDialogMessage:
    'Please map some headers before running the validation.',
  matchingLogicDialogTitle: 'Change Matching Logic',
  matchingLogicDialogMessage: 'Require Data to Match Existing Records',
  matchingLogicUnavailableDialogMessage:
    'Matching logic is unavailable for current mappings',
  mustMatch: 'Must Match',
  unloadProtectMessage: 'This mapping has not been saved.',
  newDataSetName: (date: string): string => `New Data Set ${date}`,
  newHeaderName: (index: number): string => `New Column ${index}`,
  noHeader: '(no header)',

  // WbsDialog
  wbsDialogDefaultDialogTitle: (dataSetCount: number) =>
    `Data Sets (${dataSetCount})`,
  wbsDialogEmptyDefaultDialogMessage: 'Currently no Data Sets exist.',
  wbsDialogTemplatesDialogTitle: 'Copy plan from existing Data Set',
  wbsDialogEmptyTemplateDialogMessage:
    'There are no plans available, please continue to create an upload plan.',
  createDataSetInstructions: `
    Use "Import a file" or "Create New" to make a new one.`,
  createNew: 'Create New',

  // DataSetMeta
  dataSetMetaDialogTitle: 'Data Set Properties',
  dataSetName: 'Data Set Name:',
  remarks: 'Remarks:',
  numberOfRows: 'Number of rows:',
  numberOfColumns: 'Number of columns:',
  created: 'Created:',
  modified: 'Modified:',
  uploaded: 'Uploaded:',
  importedFileName: 'Import file name:',
  noFileName: '(no file name)',
  changeDataSetOwnerDialogTitle: 'Data Set Properties',
  changeDataSetOwnerDialogHeader: createHeader('Change Data Set Owner'),
  changeDataSetOwnerDialogMessage: 'Select New Owner:',
  dataSetOwnerChangedDialogTitle: 'Data Set Properties',
  dataSetOwnerChangedDialogHeader: createHeader('Data Set owner changed'),
  dataSetOwnerChangedDialogMessage: 'Data Set owner changed.',
  dataSet: 'Data Set:',
  dataSetUploadedLabel: '(Uploaded, Read-Only)',

  // WbStatus
  wbStatusUnuploadDialogTitle: 'Data Set Rollback Status',
  wbStatusUploadDialogTitle: 'Data Set Upload Status',
  wbStatusValidationDialogTitle: 'Data Set Validation Status',
  aborting: 'Aborting...',
  wbStatusAbortFailed: (operationName: string) =>
    `Failed aborting ${operationName}. Please try again later`,
  wbStatusOperationNoProgress: (operationName: string) => `${operationName}...`,
  wbStatusOperationProgress: (
    operationName: string,
    current: number,
    total: number
  ) => `${operationName} row ${current}/${total}`,
  wbStatusPendingDialogMessage: function wbStatusPendingDialogMessage(
    operationName: string
  ) {
    return (
      <>
        {operationName} of this Data Set should begin shortly.
        <br />
        <br />
        If this message persists for longer than 30 seconds, the {
          operationName
        }{' '}
        process is busy with another Data Set. Please try again later.
      </>
    );
  },
  wbStatusErrorDialogMessage: function wbStatusPendingDialogMessage(
    operationName: string,
    errorMessage: string
  ) {
    return (
      <>
        Error occurred during {operationName}:
        <br />
        <br />
        {errorMessage}
      </>
    );
  },
  updatingTrees: 'Updating trees...',
});

export default wbText;
