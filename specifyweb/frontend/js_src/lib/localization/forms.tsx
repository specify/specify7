import type { RA } from '../components/wbplanview';
import { createDictionary, createHeader } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const formsText = createDictionary({
  // Attachments
  filterAttachments: {
    'en-us': 'Filter Attachments',
  },
  attachmentServerUnavailable: {
    'en-us': 'Attachment server unavailable.',
  },
  attachmentUploadDialogTitle: {
    'en-us': 'Uploading...',
  },
  tables: {
    'en-us': 'Tables',
  },
  openDataDialogTitle: {
    'en-us': 'Opening...',
  },
  clone: {
    'en-us': 'Clone',
  },
  linkInline: {
    'en-us': 'link',
  },
  // BusinessRules
  valueMustBeUniqueToField: {
    'en-us': (fieldName: string) => `Value must be unique to ${fieldName}`,
  },
  valuesOfMustBeUniqueToField: {
    'en-us': (fieldName: string, values: RA<string>, lastValue) =>
      `Values of ${values.join(', ')} and ${lastValue}
       must be unique to ${fieldName}}`,
  },
  database: {
    'en-us': 'database',
  },
  // CollectionReLoneToManyPlugin
  collectionObject: {
    'en-us': 'Collection Object',
  },
  collection: {
    'en-us': 'Collection',
  },
  // "set" as in "Set Value"
  set: {
    'en-us': 'Set',
  },
  // Data Model
  specifySchema: {
    'en-us': 'Specify Schema',
  },
  // Data View
  emptyRecordSetMessage: {
    'en-us': (recordSetName: string) => `
      <h2>The Record Set "${recordSetName}" contains no records.</h2>
      <p>You can <button class="recordset-delete magic-button" type="button">delete</button> the record set or
      <a class="recordset-add intercept-navigation magic-button">add</a> records to it.</p>
      <p>Be aware that another user maybe getting ready to add records,
      so only delete this record set if you are sure it is not to be used.</p>`,
  },
  checkingIfResourceCanBeDeleted: {
    'en-us': 'Checking if resource can be deleted.',
  },
  deleteBlockedDialogTitle: {
    'en-us': 'Delete resource',
  },
  deleteBlockedDialogHeader: {
    'en-us': createHeader('Delete blocked'),
  },
  deleteBlockedDialogMessage: {
    'en-us': `
      The resource cannot be deleted because it is referenced through the
      following fields:`,
  },
  contract: {
    'en-us': 'Contract',
  },
  // Forms Dialog
  formsDialogTitle: {
    'en-us': 'Forms',
  },
  // Interactions
  addItems: {
    'en-us': 'Add Items',
  },
  recordReturn: {
    'en-us': (modelName: string) => `${modelName} Return`,
  },
  createRecord: {
    'en-us': (modelName: string) => `Create ${modelName}`,
  },
  invalid: {
    'en-us': 'Invalid:',
  },
  missing: {
    'en-us': 'Missing:',
  },
  preparationsNotFound: {
    'en-us': 'No preparations were found.',
  },
  problemsFound: {
    'en-us': 'There are problems with the entry:',
  },
  ignoreAndContinue: {
    'en-us': 'Ignore and continue',
  },
  recordSetCaption: {
    'en-us': (count: number) =>
      `By choosing a recordset (${count === 0 ? 'none' : count} available)`,
  },
  entryCaption: {
    'en-us': (fieldName: string) => `By entering ${fieldName}s`,
  },
  noPreparationsCaption: {
    'en-us': 'Without preparations',
  },
  noCollectionObjectCaption: {
    'en-us': 'Add unassociated item',
  },
  actionNotSupported: {
    'en-us': (actionName: string) => `${actionName} is not supported.`,
  },
  // Loan Return
  preparationsDialogTitle: {
    'en-us': 'Preparations',
  },
  preparationsCanNotBeReturned: {
    'en-us': `
      Preparations cannot be returned in this context.`,
  },
  noUnresolvedPreparations: {
    'en-us': 'There no unresolved preparations for this loan.',
  },
  remarks: {
    'en-us': 'Remarks',
  },
  unresolved: {
    'en-us': 'Unresolved',
  },
  return: {
    'en-us': 'Return',
  },
  resolve: {
    'en-us': 'Resolve',
  },
  returnAllPreparations: {
    'en-us': 'Return all preparations',
  },
  returnSelectedPreparations: {
    'en-us': 'Return selected preparations',
  },
  selectAllAvailablePreparations: {
    'en-us': 'Select all available preparations',
  },
  selectAll: {
    'en-us': 'Select All',
  },
  selectedAmount: {
    'en-us': 'Selected Amount',
  },
  returnedAmount: {
    'en-us': 'Returned Amount',
  },
  resolvedAmount: {
    'en-us': 'Resolved Amount',
  },
  receivedBy: {
    'en-us': 'Received by',
  },
  dateResolved: {
    'en-us': 'Date resolved',
  },
  // PaleoLocationPlugin
  paleoMap: {
    'en-us': 'Paleo Map',
  },
  paleoRequiresGeographyDialogTitle: {
    'en-us': 'Paleo Map',
  },
  paleoRequiresGeographyDialogHeader: {
    'en-us': createHeader('Geography Required'),
  },
  paleoRequiresGeographyDialogMessage: {
    'en-us': `
      The Paleo Map plugin requires that the locality have geographic
      coordinates and that the paleo context have a geographic age with at
      least a start time or and end time populated.`,
  },
  noCoordinatesDialogTitle: {
    'en-us': 'No coordinates',
  },
  noCoordinatesDialogHeader: {
    'en-us': (modelName: string) =>
      createHeader(`Not enough information to map ${modelName}`),
  },
  noCoordinatesDialogMessage: {
    'en-us': (modelName: string) => `
    ${modelName} must have coordinates and paleo context to be mapped.`,
  },
  unsupportedFormDialogTitle: {
    'en-us': 'Unsupported Plugin',
  },
  unsupportedFormDialogHeader: {
    'en-us': createHeader('Incorrect Form'),
  },
  unsupportedFormDialogMessage: {
    'en-us': `
      This plugin cannot be used on this form. Try moving it to the locality,
      collecting event or collection object forms.`,
  },
  // DateParser
  invalidDate: {
    'en-us': 'Invalid Date',
  },
  // DeleteButton
  deleteConfirmationDialogTitle: {
    'en-us': 'Delete?',
  },
  deleteConfirmationDialogHeader: {
    'en-us': createHeader(
      'Are you sure you want to permanently delete this item(s)?'
    ),
  },
  deleteConfirmationDialogMessage: {
    'en-us': 'This action can not be undone.',
  },
  // PartialDateUi
  datePrecision: {
    'en-us': 'Date Precision',
  },
  monthYear: {
    'en-us': 'Mon / Year',
  },
  dayPlaceholder: {
    'en-us': 'DD',
  },
  monthPlaceholder: {
    'en-us': 'MM',
  },
  yearPlaceholder: {
    'en-us': 'YYYY',
  },
  today: {
    'en-us': 'Today',
  },
  todayButtonDescription: {
    'en-us': 'Set to current date',
  },
  // PickListBox
  addToPickListConfirmationDialogTitle: {
    'en-us': 'Pick List',
  },
  addToPickListConfirmationDialogHeader: {
    'en-us': createHeader('Add to pick list?'),
  },
  addToPickListConfirmationDialogMessage: {
    'en-us': (value: string, pickListName: string) =>
      `Add value "${value}" to the pick list named ${pickListName}?`,
  },
  // ReadOnlyPickListComboBox
  noData: {
    'en-us': 'No Data.',
  },
  // RecordSelector
  removeRecordDialogHeader: {
    'en-us': createHeader('Remove dependent record'),
  },
  removeRecordDialogMessage: {
    'en-us': 'Are you sure you want to remove this record?',
  },
  // RecordSetsDialog
  recordSetsDialogTitle: {
    'en-us': (count: number) => `Record Sets (${count})`,
  },
  createRecordSetButtonDescription: {
    'en-us': 'Create a new record set',
  },
  recordSetDeletionWarning: {
    'en-us': (recordSetName: string) => `
      The record set "${recordSetName}" will be deleted. The referenced
      records will NOT be deleted.`,
  },
  // Reports
  reportsCanNotBePrintedDialogMessage: {
    'en-us': 'Reports/Labels cannot be printed in this context.',
  },
  noReportsAvailable: {
    'en-us': 'No reports are available for this table.',
  },
  reportProblemsDialogTitle: {
    'en-us': 'Problems with report',
  },
  reportsProblemsDialogMessage: {
    'en-us': 'The selected report has the following problems:',
  },
  badImageExpressions: {
    'en-us': 'Bad Image Expressions',
  },
  missingAttachments: {
    'en-us': 'Missing attachments',
  },
  // A verb
  fix: {
    'en-us': 'Fix',
  },
  missingAttachmentsFixDialogTitle: {
    'en-us': 'Choose file',
  },
  reportParameters: {
    'en-us': 'Report Parameters',
  },
  labelFromRecordSetDialogTitle: {
    'en-us': 'From Record Set',
  },
  runReport: {
    'en-us': 'Run Report',
  },
  // ResourceView
  missingFormDefinitionPageHeader: {
    'en-us': 'Missing form definition',
  },
  missingFormDefinitionPageContent: {
    'en-us': `
      Specify was unable to find the form definition to display this resource`,
  },
  addingToRecordSet: {
    'en-us': 'Adding to Record Set and Database',
  },
  createRecordButtonDescription: {
    'en-us': 'Create record and add to Record Set',
  },
  recordSetAreaDescription: {
    'en-us': (recordSetName: string): string => `Record Set: ${recordSetName}`,
  },
  previousRecord: {
    'en-us': 'Previous Record',
  },
  nextRecord: {
    'en-us': 'Next Record',
  },
  currentPositionInTheRecordSet: {
    'en-us': 'Current Position in the Record Set',
  },
  // Current index in the record set
  aOutOfB: {
    'en-us': (current: number, total: number): string =>
      `${current} out of ${total}`,
  },
  // SaveButton
  unsavedFormUnloadProtect: {
    'en-us': 'This form has not been saved.',
  },
  saveAndAddAnother: {
    'en-us': 'Save and Add Another',
  },
  saveConflictDialogTitle: {
    'en-us': 'Save record',
  },
  saveConflictDialogHeader: {
    'en-us': createHeader('Save conflict'),
  },
  saveConflictDialogMessage: {
    'en-us': `
      The data shown on this page has been changed by another user or in
      another browser tab and is out of date. The page must be reloaded to
      prevent inconsistent data from being saved.`,
  },
  saveBlockedDialogTitle: {
    'en-us': 'Save record',
  },
  saveBlockedDialogHeader: {
    'en-us': createHeader('Save blocked'),
  },
  saveBlockedDialogMessage: {
    'en-us': 'Form cannot be saved while the following errors exist:',
  },
  // ShowTransCommand
  resolvedLoans: {
    'en-us': 'Resolved Loans',
  },
  // Open is a noun
  openLoans: {
    'en-us': 'Open Loans',
  },
  gifts: {
    'en-us': 'Gifts',
  },
  exchanges: {
    'en-us': 'Exchanges',
  },
  // SpecifyCommands
  unavailableCommandButton: {
    'en-us': 'Command N/A',
  },
  unavailableCommandDialogTitle: {
    'en-us': 'Command Not Available',
  },
  unavailableCommandDialogHeader: {
    'en-us': createHeader('Command Not Available'),
  },
  unavailableCommandDialogMessage: {
    'en-us': `
      This command is currently unavailable for <i>Specify&nbsp7</i>
      It was probably included on this form from <i>Specify&nbsp6</i> and
      may be supported in the future.`,
  },
  commandName: {
    'en-us': 'Command name:',
  },
  // SpecifyPlugins
  unavailablePluginButton: {
    'en-us': 'Plugin N/A',
  },
  unavailablePluginDialogTitle: {
    'en-us': 'Plugin Not Available',
  },
  unavailablePluginDialogHeader: {
    'en-us': createHeader('Plugin Not Available'),
  },
  unavailablePluginDialogMessage: {
    'en-us': `
      This plugin is currently unavailable for <i>Specify&nbsp7</i>
      It was probably included on this form from <i>Specify&nbsp6</i> and
      may be supported in the future.`,
  },
  pluginName: {
    'en-us': 'Plugin name:',
  },
  // SubViewHeader
  link: {
    'en-us': 'Link',
  },
  visit: {
    'en-us': 'Visit',
  },
  // UiParse
  illegalBool: {
    'en-us': 'Illegal value for a Yes/No field',
  },
  requiredField: {
    'en-us': 'Field is required.',
  },
  requiredFormat: {
    'en-us': (format: string) => `Required Format: ${format}.`,
  },
  noParser: {
    'en-us': (type: string) => `No parser for type ${type}`,
  },
  inputTypeNumber: {
    'en-us': `Value must be a number`,
  },
  minimumLength: {
    'en-us': (number: number) =>
      `Minimum length for this field is ${number} characters`,
  },
  maximumLength: {
    'en-us': (number: number) =>
      `Value can not be longer than ${number} characters`,
  },
  minimumNumber: {
    'en-us': (number: number) => `Number must be smaller than ${number}`,
  },
  maximumNumber: {
    'en-us': (number: number) => `Value must be greater than ${number}`,
  },
  wrongStep: {
    'en-us': (step: number) => `Value must be a multiple of ${step}`,
  },
  // UserAgentsPlugin
  setAgents: {
    'en-us': 'Set Agents',
  },
  setAgentsDisabledButtonDescription: {
    'en-us': 'Save user before adding agents.',
  },
  userAgentsPluginDialogTitle: {
    'en-us': 'Set User Agents',
  },
});

export default formsText;
