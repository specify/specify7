import type { RA } from '../components/wbplanview';
import { createDictionary, createHeader } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const formsText = createDictionary({
  // Attachments
  filterAttachments: {
    'en-us': 'Filter Attachments',
    'ru-ru': 'Filter Attachments',
  },
  attachmentServerUnavailable: {
    'en-us': 'Attachment server unavailable.',
    'ru-ru': 'Attachment server unavailable.',
  },
  attachmentUploadDialogTitle: {
    'en-us': 'Uploading...',
    'ru-ru': 'Uploading...',
  },
  tables: {
    'en-us': 'Tables',
    'ru-ru': 'Tables',
  },
  openDataDialogTitle: {
    'en-us': 'Opening...',
    'ru-ru': 'Opening...',
  },
  clone: {
    'en-us': 'Clone',
    'ru-ru': 'Clone',
  },
  linkInline: {
    'en-us': 'link',
    'ru-ru': 'link',
  },
  // BusinessRules
  valueMustBeUniqueToField: {
    'en-us': (fieldName: string) => `Value must be unique to ${fieldName}`,
    'ru-ru': (fieldName: string) => `Value must be unique to ${fieldName}`,
  },
  valuesOfMustBeUniqueToField: {
    'en-us': (fieldName: string, values: RA<string>, lastValue) =>
      `Values of ${values.join(', ')} and ${lastValue}
       must be unique to ${fieldName}}`,
    'ru-ru': (fieldName: string, values: RA<string>, lastValue) =>
      `Values of ${values.join(', ')} and ${lastValue}
       must be unique to ${fieldName}}`,
  },
  database: {
    'en-us': 'database',
    'ru-ru': 'database',
  },
  // CollectionReLoneToManyPlugin
  collectionObject: {
    'en-us': 'Collection Object',
    'ru-ru': 'Collection Object',
  },
  collection: {
    'en-us': 'Collection',
    'ru-ru': 'Collection',
  },
  // "set" as in "Set Value"
  set: {
    'en-us': 'Set',
    'ru-ru': 'Set',
  },
  // Data Model
  specifySchema: {
    'en-us': 'Specify Schema',
    'ru-ru': 'Specify Schema',
  },
  // Data View
  emptyRecordSetMessage: {
    'en-us': (recordSetName: string) => `
      <h2>The Record Set "${recordSetName}" contains no records.</h2>
      <p>You can <button class="recordset-delete magic-button" type="button">delete</button> the record set or
      <a class="recordset-add intercept-navigation magic-button">add</a> records to it.</p>
      <p>Be aware that another user maybe getting ready to add records,
      so only delete this record set if you are sure it is not to be used.</p>`,
    'ru-ru': (recordSetName: string) => `
      <h2>The Record Set "${recordSetName}" contains no records.</h2>
      <p>You can <button class="recordset-delete magic-button" type="button">delete</button> the record set or
      <a class="recordset-add intercept-navigation magic-button">add</a> records to it.</p>
      <p>Be aware that another user maybe getting ready to add records,
      so only delete this record set if you are sure it is not to be used.</p>`,
  },
  checkingIfResourceCanBeDeleted: {
    'en-us': 'Checking if resource can be deleted.',
    'ru-ru': 'Checking if resource can be deleted.',
  },
  deleteBlockedDialogTitle: {
    'en-us': 'Delete resource',
    'ru-ru': 'Delete resource',
  },
  deleteBlockedDialogHeader: {
    'en-us': createHeader('Delete blocked'),
    'ru-ru': createHeader('Delete blocked'),
  },
  deleteBlockedDialogMessage: {
    'en-us': `
      The resource cannot be deleted because it is referenced through the
      following fields:`,
    'ru-ru': `
      The resource cannot be deleted because it is referenced through the
      following fields:`,
  },
  contract: {
    'en-us': 'Contract',
    'ru-ru': 'Contract',
  },
  // Forms Dialog
  formsDialogTitle: {
    'en-us': 'Forms',
    'ru-ru': 'Forms',
  },
  // Interactions
  addItems: {
    'en-us': 'Add Items',
    'ru-ru': 'Add Items',
  },
  recordReturn: {
    'en-us': (modelName: string) => `${modelName} Return`,
    'ru-ru': (modelName: string) => `${modelName} Return`,
  },
  createRecord: {
    'en-us': (modelName: string) => `Create ${modelName}`,
    'ru-ru': (modelName: string) => `Create ${modelName}`,
  },
  invalid: {
    'en-us': 'Invalid:',
    'ru-ru': 'Invalid:',
  },
  missing: {
    'en-us': 'Missing:',
    'ru-ru': 'Missing:',
  },
  preparationsNotFound: {
    'en-us': 'No preparations were found.',
    'ru-ru': 'No preparations were found.',
  },
  problemsFound: {
    'en-us': 'There are problems with the entry:',
    'ru-ru': 'There are problems with the entry:',
  },
  ignoreAndContinue: {
    'en-us': 'Ignore and continue',
    'ru-ru': 'Ignore and continue',
  },
  recordSetCaption: {
    'en-us': (count: number) =>
      `By choosing a recordset (${count === 0 ? 'none' : count} available)`,
    'ru-ru': (count: number) =>
      `By choosing a recordset (${count === 0 ? 'none' : count} available)`,
  },
  entryCaption: {
    'en-us': (fieldName: string) => `By entering ${fieldName}s`,
    'ru-ru': (fieldName: string) => `By entering ${fieldName}s`,
  },
  noPreparationsCaption: {
    'en-us': 'Without preparations',
    'ru-ru': 'Without preparations',
  },
  noCollectionObjectCaption: {
    'en-us': 'Add unassociated item',
    'ru-ru': 'Add unassociated item',
  },
  actionNotSupported: {
    'en-us': (actionName: string) => `${actionName} is not supported.`,
    'ru-ru': (actionName: string) => `${actionName} is not supported.`,
  },
  // Loan Return
  preparationsDialogTitle: {
    'en-us': 'Preparations',
    'ru-ru': 'Preparations',
  },
  preparationsCanNotBeReturned: {
    'en-us': `
      Preparations cannot be returned in this context.`,
    'ru-ru': `
      Preparations cannot be returned in this context.`,
  },
  noUnresolvedPreparations: {
    'en-us': 'There no unresolved preparations for this loan.',
    'ru-ru': 'There no unresolved preparations for this loan.',
  },
  remarks: {
    'en-us': 'Remarks',
    'ru-ru': 'Remarks',
  },
  unresolved: {
    'en-us': 'Unresolved',
    'ru-ru': 'Unresolved',
  },
  return: {
    'en-us': 'Return',
    'ru-ru': 'Return',
  },
  resolve: {
    'en-us': 'Resolve',
    'ru-ru': 'Resolve',
  },
  returnAllPreparations: {
    'en-us': 'Return all preparations',
    'ru-ru': 'Return all preparations',
  },
  returnSelectedPreparations: {
    'en-us': 'Return selected preparations',
    'ru-ru': 'Return selected preparations',
  },
  selectAllAvailablePreparations: {
    'en-us': 'Select all available preparations',
    'ru-ru': 'Select all available preparations',
  },
  selectAll: {
    'en-us': 'Select All',
    'ru-ru': 'Select All',
  },
  selectedAmount: {
    'en-us': 'Selected Amount',
    'ru-ru': 'Selected Amount',
  },
  returnedAmount: {
    'en-us': 'Returned Amount',
    'ru-ru': 'Returned Amount',
  },
  resolvedAmount: {
    'en-us': 'Resolved Amount',
    'ru-ru': 'Resolved Amount',
  },
  receivedBy: {
    'en-us': 'Received by',
    'ru-ru': 'Received by',
  },
  dateResolved: {
    'en-us': 'Date resolved',
    'ru-ru': 'Date resolved',
  },
  // PaleoLocationPlugin
  paleoMap: {
    'en-us': 'Paleo Map',
    'ru-ru': 'Paleo Map',
  },
  paleoRequiresGeographyDialogTitle: {
    'en-us': 'Paleo Map',
    'ru-ru': 'Paleo Map',
  },
  paleoRequiresGeographyDialogHeader: {
    'en-us': createHeader('Geography Required'),
    'ru-ru': createHeader('Geography Required'),
  },
  paleoRequiresGeographyDialogMessage: {
    'en-us': `
      The Paleo Map plugin requires that the locality have geographic
      coordinates and that the paleo context have a geographic age with at
      least a start time or and end time populated.`,
    'ru-ru': `
      The Paleo Map plugin requires that the locality have geographic
      coordinates and that the paleo context have a geographic age with at
      least a start time or and end time populated.`,
  },
  noCoordinatesDialogTitle: {
    'en-us': 'No coordinates',
    'ru-ru': 'No coordinates',
  },
  noCoordinatesDialogHeader: {
    'en-us': (modelName: string) =>
      createHeader(`Not enough information to map ${modelName}`),
    'ru-ru': (modelName: string) =>
      createHeader(`Not enough information to map ${modelName}`),
  },
  noCoordinatesDialogMessage: {
    'en-us': (modelName: string) => `
    ${modelName} must have coordinates and paleo context to be mapped.`,
    'ru-ru': (modelName: string) => `
    ${modelName} must have coordinates and paleo context to be mapped.`,
  },
  unsupportedFormDialogTitle: {
    'en-us': 'Unsupported Plugin',
    'ru-ru': 'Unsupported Plugin',
  },
  unsupportedFormDialogHeader: {
    'en-us': createHeader('Incorrect Form'),
    'ru-ru': createHeader('Incorrect Form'),
  },
  unsupportedFormDialogMessage: {
    'en-us': `
      This plugin cannot be used on this form. Try moving it to the locality,
      collecting event or collection object forms.`,
    'ru-ru': `
      This plugin cannot be used on this form. Try moving it to the locality,
      collecting event or collection object forms.`,
  },
  // DateParser
  invalidDate: {
    'en-us': 'Invalid Date',
    'ru-ru': 'Invalid Date',
  },
  // DeleteButton
  deleteConfirmationDialogTitle: {
    'en-us': 'Delete?',
    'ru-ru': 'Delete?',
  },
  deleteConfirmationDialogHeader: {
    'en-us': createHeader(
      'Are you sure you want to permanently delete this item(s)?'
    ),
    'ru-ru': createHeader(
      'Are you sure you want to permanently delete this item(s)?'
    ),
  },
  deleteConfirmationDialogMessage: {
    'en-us': 'This action can not be undone.',
    'ru-ru': 'This action can not be undone.',
  },
  // PartialDateUi
  datePrecision: {
    'en-us': 'Date Precision',
    'ru-ru': 'Date Precision',
  },
  monthYear: {
    'en-us': 'Mon / Year',
    'ru-ru': 'Mon / Year',
  },
  dayPlaceholder: {
    'en-us': 'DD',
    'ru-ru': 'DD',
  },
  monthPlaceholder: {
    'en-us': 'MM',
    'ru-ru': 'MM',
  },
  yearPlaceholder: {
    'en-us': 'YYYY',
    'ru-ru': 'YYYY',
  },
  today: {
    'en-us': 'Today',
    'ru-ru': 'Today',
  },
  todayButtonDescription: {
    'en-us': 'Set to current date',
    'ru-ru': 'Set to current date',
  },
  // PickListBox
  addToPickListConfirmationDialogTitle: {
    'en-us': 'Pick List',
    'ru-ru': 'Pick List',
  },
  addToPickListConfirmationDialogHeader: {
    'en-us': createHeader('Add to pick list?'),
    'ru-ru': createHeader('Add to pick list?'),
  },
  addToPickListConfirmationDialogMessage: {
    'en-us': (value: string, pickListName: string) =>
      `Add value "${value}" to the pick list named ${pickListName}?`,
    'ru-ru': (value: string, pickListName: string) =>
      `Add value "${value}" to the pick list named ${pickListName}?`,
  },
  // ReadOnlyPickListComboBox
  noData: {
    'en-us': 'No Data.',
    'ru-ru': 'No Data.',
  },
  // RecordSelector
  removeRecordDialogHeader: {
    'en-us': createHeader('Remove dependent record'),
    'ru-ru': createHeader('Remove dependent record'),
  },
  removeRecordDialogMessage: {
    'en-us': 'Are you sure you want to remove this record?',
    'ru-ru': 'Are you sure you want to remove this record?',
  },
  // RecordSetsDialog
  recordSetsDialogTitle: {
    'en-us': (count: number) => `Record Sets (${count})`,
    'ru-ru': (count: number) => `Record Sets (${count})`,
  },
  createRecordSetButtonDescription: {
    'en-us': 'Create a new record set',
    'ru-ru': 'Create a new record set',
  },
  recordSetDeletionWarning: {
    'en-us': (recordSetName: string) => `
      The record set "${recordSetName}" will be deleted. The referenced
      records will NOT be deleted.`,
    'ru-ru': (recordSetName: string) => `
      The record set "${recordSetName}" will be deleted. The referenced
      records will NOT be deleted.`,
  },
  // Reports
  reportsCanNotBePrintedDialogMessage: {
    'en-us': 'Reports/Labels cannot be printed in this context.',
    'ru-ru': 'Reports/Labels cannot be printed in this context.',
  },
  noReportsAvailable: {
    'en-us': 'No reports are available for this table.',
    'ru-ru': 'No reports are available for this table.',
  },
  reportProblemsDialogTitle: {
    'en-us': 'Problems with report',
    'ru-ru': 'Problems with report',
  },
  reportsProblemsDialogMessage: {
    'en-us': 'The selected report has the following problems:',
    'ru-ru': 'The selected report has the following problems:',
  },
  badImageExpressions: {
    'en-us': 'Bad Image Expressions',
    'ru-ru': 'Bad Image Expressions',
  },
  missingAttachments: {
    'en-us': 'Missing attachments',
    'ru-ru': 'Missing attachments',
  },
  // A verb
  fix: {
    'en-us': 'Fix',
    'ru-ru': 'Fix',
  },
  missingAttachmentsFixDialogTitle: {
    'en-us': 'Choose file',
    'ru-ru': 'Choose file',
  },
  reportParameters: {
    'en-us': 'Report Parameters',
    'ru-ru': 'Report Parameters',
  },
  labelFromRecordSetDialogTitle: {
    'en-us': 'From Record Set',
    'ru-ru': 'From Record Set',
  },
  runReport: {
    'en-us': 'Run Report',
    'ru-ru': 'Run Report',
  },
  // ResourceView
  missingFormDefinitionPageHeader: {
    'en-us': 'Missing form definition',
    'ru-ru': 'Missing form definition',
  },
  missingFormDefinitionPageContent: {
    'en-us': `
      Specify was unable to find the form definition to display this resource`,
    'ru-ru': `
      Specify was unable to find the form definition to display this resource`,
  },
  addingToRecordSet: {
    'en-us': 'Adding to Record Set and Database',
    'ru-ru': 'Adding to Record Set and Database',
  },
  createRecordButtonDescription: {
    'en-us': 'Create record and add to Record Set',
    'ru-ru': 'Create record and add to Record Set',
  },
  recordSetAreaDescription: {
    'en-us': (recordSetName: string): string => `Record Set: ${recordSetName}`,
    'ru-ru': (recordSetName: string): string => `Record Set: ${recordSetName}`,
  },
  previousRecord: {
    'en-us': 'Previous Record',
    'ru-ru': 'Previous Record',
  },
  nextRecord: {
    'en-us': 'Next Record',
    'ru-ru': 'Next Record',
  },
  currentPositionInTheRecordSet: {
    'en-us': 'Current Position in the Record Set',
    'ru-ru': 'Current Position in the Record Set',
  },
  // Current index in the record set
  aOutOfB: {
    'en-us': (current: number, total: number): string =>
      `${current} out of ${total}`,
    'ru-ru': (current: number, total: number): string =>
      `${current} out of ${total}`,
  },
  // SaveButton
  unsavedFormUnloadProtect: {
    'en-us': 'This form has not been saved.',
    'ru-ru': 'This form has not been saved.',
  },
  saveAndAddAnother: {
    'en-us': 'Save and Add Another',
    'ru-ru': 'Save and Add Another',
  },
  saveConflictDialogTitle: {
    'en-us': 'Save record',
    'ru-ru': 'Save record',
  },
  saveConflictDialogHeader: {
    'en-us': createHeader('Save conflict'),
    'ru-ru': createHeader('Save conflict'),
  },
  saveConflictDialogMessage: {
    'en-us': `
      The data shown on this page has been changed by another user or in
      another browser tab and is out of date. The page must be reloaded to
      prevent inconsistent data from being saved.`,
    'ru-ru': `
      The data shown on this page has been changed by another user or in
      another browser tab and is out of date. The page must be reloaded to
      prevent inconsistent data from being saved.`,
  },
  saveBlockedDialogTitle: {
    'en-us': 'Save record',
    'ru-ru': 'Save record',
  },
  saveBlockedDialogHeader: {
    'en-us': createHeader('Save blocked'),
    'ru-ru': createHeader('Save blocked'),
  },
  saveBlockedDialogMessage: {
    'en-us': 'Form cannot be saved while the following errors exist:',
    'ru-ru': 'Form cannot be saved while the following errors exist:',
  },
  // ShowTransCommand
  resolvedLoans: {
    'en-us': 'Resolved Loans',
    'ru-ru': 'Resolved Loans',
  },
  // Open is a noun
  openLoans: {
    'en-us': 'Open Loans',
    'ru-ru': 'Open Loans',
  },
  gifts: {
    'en-us': 'Gifts',
    'ru-ru': 'Gifts',
  },
  exchanges: {
    'en-us': 'Exchanges',
    'ru-ru': 'Exchanges',
  },
  // SpecifyCommands
  unavailableCommandButton: {
    'en-us': 'Command N/A',
    'ru-ru': 'Command N/A',
  },
  unavailableCommandDialogTitle: {
    'en-us': 'Command Not Available',
    'ru-ru': 'Command Not Available',
  },
  unavailableCommandDialogHeader: {
    'en-us': createHeader('Command Not Available'),
    'ru-ru': createHeader('Command Not Available'),
  },
  unavailableCommandDialogMessage: {
    'en-us': `
      This command is currently unavailable for <i>Specify&nbsp7</i>
      It was probably included on this form from <i>Specify&nbsp6</i> and
      may be supported in the future.`,
    'ru-ru': `
      This command is currently unavailable for <i>Specify&nbsp7</i>
      It was probably included on this form from <i>Specify&nbsp6</i> and
      may be supported in the future.`,
  },
  commandName: {
    'en-us': 'Command name:',
    'ru-ru': 'Command name:',
  },
  // SpecifyPlugins
  unavailablePluginButton: {
    'en-us': 'Plugin N/A',
    'ru-ru': 'Plugin N/A',
  },
  unavailablePluginDialogTitle: {
    'en-us': 'Plugin Not Available',
    'ru-ru': 'Plugin Not Available',
  },
  unavailablePluginDialogHeader: {
    'en-us': createHeader('Plugin Not Available'),
    'ru-ru': createHeader('Plugin Not Available'),
  },
  unavailablePluginDialogMessage: {
    'en-us': `
      This plugin is currently unavailable for <i>Specify&nbsp7</i>
      It was probably included on this form from <i>Specify&nbsp6</i> and
      may be supported in the future.`,
    'ru-ru': `
      This plugin is currently unavailable for <i>Specify&nbsp7</i>
      It was probably included on this form from <i>Specify&nbsp6</i> and
      may be supported in the future.`,
  },
  pluginName: {
    'en-us': 'Plugin name:',
    'ru-ru': 'Plugin name:',
  },
  // SubViewHeader
  link: {
    'en-us': 'Link',
    'ru-ru': 'Link',
  },
  visit: {
    'en-us': 'Visit',
    'ru-ru': 'Visit',
  },
  // UiParse
  illegalBool: {
    'en-us': 'Illegal value for a Yes/No field',
    'ru-ru': 'Illegal value for a Yes/No field',
  },
  requiredField: {
    'en-us': 'Field is required.',
    'ru-ru': 'Field is required.',
  },
  requiredFormat: {
    'en-us': (format: string) => `Required Format: ${format}.`,
    'ru-ru': (format: string) => `Required Format: ${format}.`,
  },
  noParser: {
    'en-us': (type: string) => `No parser for type ${type}`,
    'ru-ru': (type: string) => `No parser for type ${type}`,
  },
  inputTypeNumber: {
    'en-us': `Value must be a number`,
    'ru-ru': `Value must be a number`,
  },
  minimumLength: {
    'en-us': (number: number) =>
      `Minimum length for this field is ${number} characters`,
    'ru-ru': (number: number) =>
      `Minimum length for this field is ${number} characters`,
  },
  maximumLength: {
    'en-us': (number: number) =>
      `Value can not be longer than ${number} characters`,
    'ru-ru': (number: number) =>
      `Value can not be longer than ${number} characters`,
  },
  minimumNumber: {
    'en-us': (number: number) => `Number must be smaller than ${number}`,
    'ru-ru': (number: number) => `Number must be smaller than ${number}`,
  },
  maximumNumber: {
    'en-us': (number: number) => `Value must be greater than ${number}`,
    'ru-ru': (number: number) => `Value must be greater than ${number}`,
  },
  wrongStep: {
    'en-us': (step: number) => `Value must be a multiple of ${step}`,
    'ru-ru': (step: number) => `Value must be a multiple of ${step}`,
  },
  // UserAgentsPlugin
  setAgents: {
    'en-us': 'Set Agents',
    'ru-ru': 'Set Agents',
  },
  setAgentsDisabledButtonDescription: {
    'en-us': 'Save user before adding agents.',
    'ru-ru': 'Save user before adding agents.',
  },
  userAgentsPluginDialogTitle: {
    'en-us': 'Set User Agents',
    'ru-ru': 'Set User Agents',
  },
});

export default formsText;
