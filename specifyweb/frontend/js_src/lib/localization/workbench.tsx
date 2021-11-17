import React from 'react';

import { createDictionary, createHeader, createJsxHeader } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const wbText = createDictionary({
  // Buttons
  rollback: {
    'en-us': 'Roll Back',
  },
  validate: {
    'en-us': 'Validate',
  },
  validation: {
    'en-us': 'Validation',
  },
  upload: {
    'en-us': 'Upload',
  },
  rollingBack: {
    'en-us': 'Rolling Back',
  },
  uploading: {
    'en-us': 'Uploading',
  },
  validating: {
    'en-us': 'Validating',
  },
  results: {
    'en-us': 'Results',
  },
  disambiguate: {
    'en-us': 'Disambiguate',
  },
  fillDown: {
    'en-us': 'Fill Down',
  },
  fillUp: {
    'en-us': 'Fill Up',
  },
  revert: {
    'en-us': 'Revert',
  },
  geoLocate: {
    'en-us': 'GeoLocate',
  },
  dataMapper: {
    'en-us': 'Data Mapper',
  },
  dataCheck: {
    'en-us': 'Data Check',
  },
  dataCheckOn: {
    'en-us': `Data Check: On`,
  },
  changeOwner: {
    'en-us': 'Change Owner',
  },
  export: {
    'en-us': 'Export',
  },
  convertCoordinates: {
    'en-us': 'Convert Coordinates',
  },
  navigation: {
    'en-us': 'Navigation',
  },
  replace: {
    'en-us': 'Replace',
  },
  replacementValue: {
    'en-us': 'Replacement value',
  },
  searchResults: {
    'en-us': 'Search Results',
  },
  clickToToggle: {
    'en-us': 'Click to toggle visibility',
  },
  configureSearchReplace: {
    'en-us': 'Configure Search & Replace',
  },
  modifiedCells: {
    'en-us': 'Modified Cells',
  },
  newCells: {
    'en-us': 'New Cells',
  },
  errorCells: {
    'en-us': 'Error Cells',
  },
  dataEditor: {
    'en-us': 'Data Editor',
  },
  // Dialogs
  noUploadPlanDialogTitle: {
    'en-us': 'Upload Plan Status',
  },
  noUploadPlanDialogHeader: {
    'en-us': createHeader('No Upload Plan is Defined'),
  },
  noUploadPlanDialogMessage: {
    'en-us':
      'No Upload Plan has been defined for this Data Set. Create one now?',
  },
  noDisambiguationResultsDialogTitle: {
    'en-us': 'Disambiguate',
  },
  noDisambiguationResultsDialogHeader: {
    'en-us': createHeader('Unable to disambiguate'),
  },
  noDisambiguationResultsDialogMessage: {
    'en-us': `
      None of the matched records currently exist in the database.
      This can happen if all of the matching records were deleted since the
      validation process occurred, or if all of the matches were ambiguous
      with respect other records in this data set. In the latter case, you
      will need to add fields and values to the data set to resolve the
      ambiguity.`,
  },
  disambiguationDialogTitle: {
    'en-us': 'Disambiguate Multiple Record Matches',
  },
  applyAllUnavailable: {
    'en-us': '"Apply All" is not available while Data Check is in progress.',
  },
  rollbackDialogTitle: {
    'en-us': 'Data Set Roll Back',
  },
  rollbackDialogHeader: {
    'en-us': createHeader('Begin Data Set Roll Back?'),
  },
  rollbackDialogMessage: {
    'en-us': `
      Rolling back will remove the new data records this Data Set added to the
      Specify database. The entire rollback will be cancelled if any of the
      uploaded data have been referenced (re-used) by other data records since
      they were uploaded.`,
  },
  startUploadDialogTitle: {
    'en-us': 'Data Set Upload',
  },
  startUploadDialogHeader: {
    'en-us': createHeader('Begin Data Set Upload?'),
  },
  startUploadDialogMessage: {
    'en-us': `
      Uploading the Data Set will add the data to the Specify database.`,
  },
  deleteDataSetDialogTitle: {
    'en-us': 'Delete Data Set',
  },
  deleteDataSetDialogHeader: {
    'en-us': createHeader('Delete this Data Set?'),
  },
  deleteDataSetDialogMessage: {
    'en-us': `
      Deleting a Data Set permanently removes it and its Upload Plan.
      Data mappings will not be available for re-use; Rollback will not be
      an option for an uploaded Data Set.`,
  },
  dataSetDeletedTitle: {
    'en-us': 'Delete Data Set',
  },
  dataSetDeletedHeader: {
    'en-us': createHeader('Data Set successfully deleted'),
  },
  dataSetDeletedMessage: {
    'en-us': 'Data Set successfully deleted.',
  },
  revertChangesDialogTitle: {
    'en-us': 'Revert Changes',
  },
  revertChangesDialogHeader: {
    'en-us': createHeader('Revert Unsaved Changes?'),
  },
  revertChangesDialogMessage: {
    'en-us': `
      This action will discard all changes made to the Data Set since
      the last Save.`,
  },
  savingDialogTitle: {
    'en-us': 'Saving',
  },
  onExitDialogMessage: {
    'en-us': 'Changes to this Data Set have not been Saved.',
  },
  // Validation
  /* This value must match the one on the back-end exactly */
  picklistValidationFailed: {
    'en-us': (value: string) =>
      [
        `${value ? `"${value}"` : ''} is not a legal value in this picklist `,
        'field.\nClick on the arrow to choose among available options.',
      ].join(''),
  },
  noMatchErrorMessage: {
    'en-us': 'No matching record for must-match table.',
  },
  matchedMultipleErrorMessage: {
    'en-us': [
      'This value matches two or more existing database records and the match ',
      'must be disambiguated before uploading.',
    ].join(''),
  },
  validationNoErrorsDialogTitle: {
    'en-us': 'Data Set Validation',
  },
  validationNoErrorsDialogHeader: {
    'en-us': createHeader('Validate Completed with No Errors'),
  },
  validationNoErrorsDialogMessage: {
    'en-us': `
      Validation found no errors, it is
      ready to be uploaded into the database.<br><br>

      Note: If this Data Set is edited and re-saved, Validate should
      be re-run prior to Uploading to verify that no errors have been
      introduced.`,
  },
  validationErrorsDialogTitle: {
    'en-us': 'Data Set Validation',
  },
  validationErrorsDialogHeader: {
    'en-us': createHeader('Validate Completed with Errors'),
  },
  validationErrorsDialogMessage: {
    'en-us': `
       Validation found errors in the Data Set.<br><br>

       Note: If this Data Set is edited and re-saved, Validate should
       be re-run prior to Uploading to verify that no errors have been introduced.`,
  },
  uploadNoErrorsDialogTitle: {
    'en-us': 'Data Set Upload',
  },
  uploadNoErrorsDialogHeader: {
    'en-us': createHeader('Upload Completed with No Errors'),
  },
  uploadNoErrorsDialogMessage: {
    'en-us': `
      Click on the "Results" button to see the number of new records
      added to each database table.`,
  },
  uploadErrorsDialogTitle: {
    'en-us': 'Data Set Upload',
  },
  uploadErrorsDialogHeader: {
    'en-us': createHeader('Upload Failed due to Error Cells'),
  },
  uploadErrorsDialogMessage: {
    'en-us': `
      The upload failed due to one or more cell value errors.<br><br>

      Validate the Data Set and review the
      mouseover hints for each error cell, then make the
      appropriate corrections. Save and retry the
      Upload.`,
  },
  dataSetRollbackDialogTitle: {
    'en-us': 'Data Set Rollback',
  },
  dataSetRollbackDialogHeader: {
    'en-us': createHeader('Data Set was rolled back successfully'),
  },
  dataSetRollbackDialogMessage: {
    'en-us':
      'This Rolledback Data Set is saved, and can be edited or re-uploaded.',
  },
  validationCanceledDialogTitle: {
    'en-us': 'Data Set Validation',
  },
  validationCanceledDialogHeader: {
    'en-us': createHeader('Validation Canceled'),
  },
  validationCanceledDialogMessage: {
    'en-us': 'Data Set Validation cancelled.',
  },
  rollbackCanceledDialogTitle: {
    'en-us': 'Data Set Rollback',
  },
  rollbackCanceledDialogHeader: {
    'en-us': createHeader('Rollback Canceled'),
  },
  rollbackCanceledDialogMessage: {
    'en-us': 'Data Set Rollback cancelled.',
  },
  uploadCanceledDialogTitle: {
    'en-us': 'Data Set Upload',
  },
  uploadCanceledDialogHeader: {
    'en-us': createHeader('Upload Canceled'),
  },
  uploadCanceledDialogMessage: {
    'en-us': 'Data Set Upload cancelled.',
  },
  geoLocateDialogTitle: {
    'en-us': 'GeoLocate',
  },
  coordinateConverterDialogTitle: {
    'en-us': 'Geocoordinate Format',
  },
  coordinateConverterDialogHeader: {
    'en-us': createHeader('Choose a preferred Geocoordinate format'),
  },
  // Misc
  wbUploadedUnavailable: {
    'en-us': 'The data set must be validated or uploaded',
  },
  wbValidateUnavailable: {
    'en-us':
      'An Upload Plan needs to defined before this Data Set can be Validated',
  },
  unavailableWhileEditing: {
    'en-us': 'This action requires all changes to be saved',
  },
  uploadUnavailableWhileHasErrors: {
    'en-us': 'Upload is unavailable while some cells have validation errors',
  },
  unavailableWhileViewingResults: {
    'en-us': 'This action is unavailable while viewing the upload results',
  },
  unavailableWhileValidating: {
    'en-us': 'This action is unavailable while Data Check is in progress',
  },
  unavailableWithoutLocality: {
    'en-us': 'This tool requires locality columns to be mapped',
  },
  unavailableWhenUploaded: {
    'en-us': 'This tool does not work with uploaded Data Sets',
  },
  dataSetDeletedOrNotFound: {
    'en-us': 'Data Set was deleted by another session.',
  },
  includeDmsSymbols: {
    'en-us': 'Include DMS Symbols',
  },
  // WbUploaded
  uploadResults: {
    'en-us': 'Upload Results',
  },
  potentialUploadResults: {
    'en-us': 'Potential Upload Results',
  },
  noUploadResultsAvailable: {
    'en-us': 'No upload results are available for this cell',
  },
  wbUploadedDescription: {
    'en-us': 'Number of new records created in each table:',
  },
  wbUploadedPotentialDescription: {
    'en-us': 'Number of new records that would be created in each table:',
  },
  // WbAdvancedSearch
  wbAdvancedSearchDialogTitle: {
    'en-us': 'Configure Search & Replace',
  },
  navigationOptions: {
    'en-us': 'Navigation Options',
  },
  cursorPriority: {
    'en-us': 'Cursor Priority',
  },
  columnFirst: {
    'en-us': 'Column first',
  },
  rowFirst: {
    'en-us': 'Row first',
  },
  searchOptions: {
    'en-us': 'Search Options',
  },
  findEntireCellsOnly: {
    'en-us': 'Find entire cells only',
  },
  matchCase: {
    'en-us': 'Match case',
  },
  useRegularExpression: {
    'en-us': 'Use regular expression',
  },
  liveUpdate: {
    'en-us': 'Live search',
  },
  replaceOptions: {
    'en-us': 'Replace Options',
  },
  replaceMode: {
    'en-us': 'Replace Mode',
  },
  replaceAll: {
    'en-us': 'Replace all matches',
  },
  replaceNext: {
    'en-us': 'Replace next occurrence',
  },
  // WbImport
  importDataSet: {
    'en-us': 'Import Data Set',
  },
  wbImportHeader: {
    'en-us': 'Import a File to Create a New Data Set',
  },
  previewDataSet: {
    'en-us': 'Preview Dataset',
  },
  corruptFile: {
    'en-us': (fileName: string) =>
      `The file ${fileName} is corrupt or contains no data!`,
  },
  characterEncoding: {
    'en-us': 'Character encoding:',
  },
  filePickerMessage: {
    'en-us': 'Choose a file or drag it here',
  },
  selectedFileName: {
    'en-us': (fileName: string) => `Selected file: ${fileName}`,
  },
  chooseDataSetName: {
    'en-us': 'Name for New Data Set:',
  },
  firstRowIsHeader: {
    'en-us': 'First Row is Header:',
  },
  importFile: {
    'en-us': 'Import file',
  },
  columnName: {
    'en-us': (columnIndex: number) => `Column ${columnIndex}`,
  },
  // WbPlanView
  matchBehavior: {
    'en-us': 'Match Behavior:',
  },
  columnMapping: {
    'en-us': 'Column Mapping',
  },
  suggestedMappings: {
    'en-us': 'Suggested Mappings:',
  },
  requiredFields: {
    'en-us': 'Required Fields',
  },
  optionalFields: {
    'en-us': 'Optional Fields',
  },
  hiddenFields: {
    'en-us': 'Hidden Fields',
  },
  mappingOptions: {
    'en-us': 'Mapping Options',
  },
  ignoreWhenBlank: {
    'en-us': 'Ignore when Blank',
  },
  ignoreWhenBlankDescription: {
    'en-us': [
      'When set to "Ignore when Blank" blank values in this column will not be ',
      'considered for matching purposes. Blank values are ignored when matching ',
      'even if a default value is provided',
    ].join(''),
  },
  ignoreAlways: {
    'en-us': 'Always Ignore',
  },
  ignoreAlwaysDescription: {
    'en-us': [
      'When set to "Ignore Always" the value in this column will never be ',
      'considered for matching purposes, only for uploading.',
    ].join(''),
  },
  ignoreNever: {
    'en-us': 'Never Ignore',
  },
  ignoreNeverDescription: {
    'en-us': [
      'This column would always be considered for matching purposes, regardless ',
      "of it's value",
    ].join(''),
  },
  allowNullValues: {
    'en-us': 'Allow Null Values',
  },
  useDefaultValue: {
    'en-us': 'Use Default Value',
  },
  defaultValue: {
    'en-us': 'Default Value',
  },
  useDefaultValueDescription: {
    'en-us': 'This value would be used in place of empty cells',
  },
  addNewColumn: {
    'en-us': 'Add New Column',
  },
  revealHiddenFormFields: {
    'en-us': 'Reveal Hidden Form Fields',
  },
  validationFailedDialogTitle: {
    'en-us': 'Upload Plan Validation',
  },
  validationFailedDialogHeader: {
    'en-us': createJsxHeader('Validation found missing mappings:'),
  },
  validationFailedDialogMessage: {
    'en-us': `
      This data mapping is missing one or more data fields required for
      uploading by your Specify configuration. Add the missing mappings
      shown or save this Upload Plan as unfinished.`,
  },
  continueEditing: {
    'en-us': 'Continue Editing',
  },
  saveUnfinished: {
    'en-us': 'Save Unfinished',
  },
  map: {
    'en-us': 'Map',
  },
  mapButtonDescription: {
    'en-us': 'Map selected field to selected header',
  },
  relationship: {
    'en-us': (tableName: string): string =>
      `Relationship with the ${tableName} table`,
  },
  selectBaseTableDialogTitle: {
    'en-us': 'Select a Base Table',
  },
  chooseExistingPlan: {
    'en-us': 'Choose Existing Plan',
  },
  showAdvancedTables: {
    'en-us': 'Show Advanced Tables',
  },
  dataSetUploaded: {
    'en-us': 'Data Set uploaded. This Upload Plan cannot be changed',
  },
  dataSetUploadedDescription: {
    'en-us': [
      'You are viewing the mappings for an uploaded dataset.\n',
      'To edit the mappings, rollback the uploaded data or create a new ',
      'dataset',
    ].join(''),
  },
  baseTable: {
    'en-us': 'Base Table',
  },
  goToBaseTableDialogTitle: {
    'en-us': 'Change Base Table',
  },
  goToBaseTableDialogHeader: {
    'en-us': createJsxHeader(
      'Change the Base Table for Mapping Data Set Columns?'
    ),
  },
  goToBaseTableDialogMessage: {
    'en-us': `
      Choosing a different Base Table for a Data Set Upload will make that
      table the new starting point for column-to-data field mappings and
      will erase existing mappings. The Automapper will attempt to map
      columns to the new Base Table fields.`,
  },
  clearMapping: {
    'en-us': 'Clear Mapping',
  },
  changeBaseTable: {
    'en-us': 'Change Base Table',
  },
  reRunAutoMapper: {
    'en-us': 'Rerun Automapper',
  },
  autoMapper: {
    'en-us': 'Automapper',
  },
  mappingEditor: {
    'en-us': 'Map Explorer',
  },
  hideMappingEditor: {
    'en-us': 'Hide Map Explorer',
  },
  showMappingEditor: {
    'en-us': 'Show Map Explorer',
  },
  resizeMappingEditorButtonDescription: {
    'en-us': 'Click and drag up or down to resize the Map Explorer',
  },
  mappings: {
    'en-us': 'Mappings',
  },
  clearMappings: {
    'en-us': 'Clear Mappings',
  },
  emptyDataSetDialogTitle: {
    'en-us': 'Empty Data Set',
  },
  emptyDataSetDialogHeader: {
    'en-us': createJsxHeader('Empty Data Set'),
  },
  emptyDataSetDialogMessage: {
    'en-us': (
      <>
        This Data Set doesn&apos;t have any columns.
        <br />
        Press the &quot;Add New Column&quot; button at the bottom of the screen
        to add new columns,
      </>
    ),
  },
  reRunAutoMapperDialogTitle: {
    'en-us': 'Automapper',
  },
  reRunAutoMapperDialogHeader: {
    'en-us': createJsxHeader('Automap to start a new Upload Plan?'),
  },
  reRunAutoMapperDialogMessage: {
    'en-us': 'This will erase existing data field mappings.',
  },
  nothingToValidateDialogTitle: {
    'en-us': 'Nothing to validate',
  },
  nothingToValidateDialogHeader: {
    'en-us': createJsxHeader('There are no mappings to validate'),
  },
  nothingToValidateDialogMessage: {
    'en-us': 'Please map some headers before running the validation.',
  },
  matchingLogicDialogTitle: {
    'en-us': 'Change Matching Logic',
  },
  matchingLogicDialogMessage: {
    'en-us': 'Require Data to Match Existing Records',
  },
  matchingLogicUnavailableDialogMessage: {
    'en-us': 'Matching logic is unavailable for current mappings',
  },
  mustMatch: {
    'en-us': 'Must Match',
  },
  unloadProtectMessage: {
    'en-us': 'This mapping has not been saved.',
  },
  newDataSetName: {
    'en-us': (date: string): string => `New Data Set ${date}`,
  },
  newHeaderName: {
    'en-us': (index: number): string => `New Column ${index}`,
  },
  noHeader: {
    'en-us': '(no header)',
  },
  // WbsDialog
  wbsDialogDefaultDialogTitle: {
    'en-us': (dataSetCount: number) => `Data Sets (${dataSetCount})`,
  },
  wbsDialogEmptyDefaultDialogMessage: {
    'en-us': 'Currently no Data Sets exist.',
  },
  wbsDialogTemplatesDialogTitle: {
    'en-us': 'Copy plan from existing Data Set',
  },
  wbsDialogEmptyTemplateDialogMessage: {
    'en-us':
      'There are no plans available, please continue to create an upload plan.',
  },
  createDataSetInstructions: {
    'en-us': `
    Use "Import a file" or "Create New" to make a new one.`,
  },
  createNew: {
    'en-us': 'Create New',
  },
  // DataSetMeta
  dataSetMetaDialogTitle: {
    'en-us': 'Data Set Properties',
  },
  dataSetName: {
    'en-us': 'Data Set Name:',
  },
  remarks: {
    'en-us': 'Remarks:',
  },
  numberOfRows: {
    'en-us': 'Number of rows:',
  },
  numberOfColumns: {
    'en-us': 'Number of columns:',
  },
  created: {
    'en-us': 'Created:',
  },
  modified: {
    'en-us': 'Modified:',
  },
  uploaded: {
    'en-us': 'Uploaded:',
  },
  importedFileName: {
    'en-us': 'Import file name:',
  },
  noFileName: {
    'en-us': '(no file name)',
  },
  changeDataSetOwnerDialogTitle: {
    'en-us': 'Data Set Properties',
  },
  changeDataSetOwnerDialogHeader: {
    'en-us': createHeader('Change Data Set Owner'),
  },
  changeDataSetOwnerDialogMessage: {
    'en-us': 'Select New Owner:',
  },
  dataSetOwnerChangedDialogTitle: {
    'en-us': 'Data Set Properties',
  },
  dataSetOwnerChangedDialogHeader: {
    'en-us': createHeader('Data Set owner changed'),
  },
  dataSetOwnerChangedDialogMessage: {
    'en-us': 'Data Set owner changed.',
  },
  dataSet: {
    'en-us': 'Data Set:',
  },
  dataSetUploadedLabel: {
    'en-us': '(Uploaded, Read-Only)',
  },
  // WbStatus
  wbStatusUnuploadDialogTitle: {
    'en-us': 'Data Set Rollback Status',
  },
  wbStatusUploadDialogTitle: {
    'en-us': 'Data Set Upload Status',
  },
  wbStatusValidationDialogTitle: {
    'en-us': 'Data Set Validation Status',
  },
  aborting: {
    'en-us': 'Aborting...',
  },
  wbStatusAbortFailed: {
    'en-us': (operationName: string) =>
      `Failed aborting ${operationName}. Please try again later`,
  },
  wbStatusOperationNoProgress: {
    'en-us': (operationName: string) => `${operationName}...`,
  },
  wbStatusOperationProgress: {
    'en-us': (operationName: string, current: number, total: number) =>
      `${operationName} row ${current}/${total}`,
  },
  wbStatusPendingDialogMessage: {
    'en-us': function wbStatusPendingDialogMessage(operationName: string) {
      return (
        <>
          {operationName} of this Data Set should begin shortly.
          <br />
          <br />
          If this message persists for longer than 30 seconds, the{' '}
          {operationName} process is busy with another Data Set. Please try
          again later.
        </>
      );
    },
  },
  wbStatusErrorDialogMessage: {
    'en-us': function wbStatusPendingDialogMessage(
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
  },
  updatingTrees: {
    'en-us': 'Updating trees...',
  },
});

export default wbText;
