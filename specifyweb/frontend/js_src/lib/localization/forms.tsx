import type { RA } from '../components/wbplanview';
import { createDictionary, createHeader } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const formsText = createDictionary({
  // Attachments
  attachments: 'Attachments',
  filterAttachments: 'Filter Attachments',
  attachmentServerUnavailable: 'Attachment server unavailable.',
  attachmentUploadDialogTitle: 'Uploading...',
  tables: 'Tables',
  openDataDialogTitle: 'Opening...',
  linkInline: 'link',

  // BusinessRules
  valueMustBeUniqueToField: (fieldName: string) =>
    `Value must be unique to ${fieldName}`,
  valuesOfMustBeUniqueToField: (fieldName: string, values: RA<string>) =>
    `Values of ${
      values.length === 1
        ? values[0]
        : `${values.slice(0, -1).join(', ')} and ${values.slice(-1)[0]}`
    }} must be unique to ${fieldName}}`,
  database: 'database',

  // CollectionReLoneToManyPlugin
  collectionObject: 'Collection Object',
  collection: 'Collection',
  // "set" as in "Set Value"
  set: 'Set',

  // Data Model
  specifySchema: 'Specify Schema',

  // Data View
  emptyRecordSetMessage: (recordSetName: string) => `
    <h2>The Record Set "${recordSetName}" contains no records.</h2>
    <p>You can <a class="recordset-delete">delete</a> the record set or
    <a class="recordset-add intercept-navigation">add</a> records to it.</p>
    <p>Be aware that another user maybe getting ready to add records,
    so only delete this record set if you are sure it is not to be used.</p>`,
  checkingIfResourceCanBeDeleted: 'Checking if resource can be deleted.',
  deleteBlockedDialogTitle: 'Delete resource',
  deleteBlockedDialogHeader: createHeader('Delete blocked'),
  deleteBlockedDialogMessage: `
    The resource cannot be deleted because it is referenced through the
    following fields:`,
  contract: 'Contract',
  expand: 'Expand',

  // Forms Dialog
  formsDialogTitle: 'Forms',

  // Interactions
  addItems: 'Add Items',
  recordReturn: (modelName: string) => `${modelName} Return`,
  createRecord: (modelName: string) => `Create ${modelName}`,
  invalid: 'Invalid:',
  missing: 'Missing:',
  preparationsNotFound: 'No preparations were found.',
  problemsFound: 'There are problems with the entry:',
  ignoreAndContinue: 'Ignore and continue',
  recordSetCaption: (count: number) =>
    `By choosing a recordset (${count === 0 ? 'none' : count} available)`,
  entryCaption: (fieldName: string) => `By entering ${fieldName}s`,
  noPreparationsCaption: 'Without preparations',
  noCollectionObjectCaption: 'Add unassociated item',
  actionNotSupported: (actionName: string) => `${actionName} is not supported.`,

  // Loan Return
  preparationsDialogTitle: 'Preparations',
  preparationsCanNotBeReturned: `
    Preparations cannot be returned in this context.`,
  noUnresolvedPreparations: 'There no unresolved preparations for this loan.',
  remarks: 'Remarks',
  unresolved: 'Unresolved',
  return: 'Return',
  resolve: 'Resolve',
  returnAllPreparations: 'Return all preparations',
  returnSelectedPreparations: 'Return selected preparations',
  selectAllAvailablePreparations: 'Select all available preparations',
  selectAll: 'Select All',
  selectedAmount: 'Selected Amount',
  returnedAmount: 'Returned Amount',
  resolvedAmount: 'Resolved Amount',
  receivedBy: 'Received by',
  dateResolved: 'Date resolved',

  // PaleoLocationPlugin
  paleoMap: 'Paleo Map',
  paleoRequiresGeographyDialogTitle: 'Paleo Map',
  paleoRequiresGeographyDialogHeader: createHeader('Geography Required'),
  paleoRequiresGeographyDialogMessage: `
    The Paleo Map plugin requires that the locality have geographic
    coordinates and that the paleo context have a geographic age with at
    least a start time or and end time populated.`,
  noCoordinatesDialogTitle: 'No coordinates',
  noCoordinatesDialogHeader: (modelName: string) =>
    createHeader(`Not enough information to map ${modelName}`),
  noCoordinatesDialogMessage: (modelName: string) => `
    ${modelName} must have coordinates and paleo context to be mapped.`,
  unsupportedFormDialogTitle: 'Unsupported Plugin',
  unsupportedFormDialogHeader: createHeader('Incorrect Form'),
  unsupportedFormDialogMessage: `
    This plugin cannot be used on this form. Try moving it to the locality,
    collecting event or collection object forms.`,

  // DateParser
  invalidDate: 'Invalid Date',

  // DeleteButton
  deleteConfirmationDialogTitle: 'Delete?',
  deleteConfirmationDialogHeader: createHeader(
    'Are you sure you want to permanently delete this item(s)?'
  ),
  deleteConfirmationDialogMessage: 'This action can not be undone.',

  // PartialDateUi
  fullDate: 'Full Date',
  monthYear: 'Mon / Year',
  year: 'Year',
  monthPlaceholder: 'MM',
  yearPlaceholder: 'YYYY',
  today: 'Today',
  todayButtonDescription: 'Set to current date',

  // PickListBox
  showAllItems: 'Show All Items',
  addToPickListConfirmationDialogTitle: 'Pick List',
  addToPickListConfirmationDialogHeader: createHeader('Add to pick list?'),
  addToPickListConfirmationDialogMessage: (
    value: string,
    pickListName: string
  ) => `Add value "${value}" to the pick list named ${pickListName}?`,

  // ReadOnlyPickListComboBox
  noData: 'No Data.',

  // RecordSelector
  removeRecordDialogHeader: createHeader('Remove dependent record'),
  removeRecordDialogMessage: 'Are you sure you want to remove this record?',

  // RecordSetsDialog
  recordSetsDialogTitle: (count: number) => `Record Sets (${count})`,
  createRecordSetButtonDescription: 'Create a new record set',
  recordSetDeletionWarning: (recordSetName: string) => `
    The record set "${recordSetName}" will be deleted. The referenced
    records will NOT be deleted.`,

  // Reports
  reportsCanNotBePrinted: 'Reports/Labels cannot be printed in this context.',
  noReportsAvailable: 'No reports are available for this table.',
  reportProblemsDialogTitle: 'Problems with report',
  reportsProblemsDialogMessage:
    'The selected report has the following problems:',
  badImageExpressions: 'Bad Image Expressions',
  missingAttachments: 'Missing attachments',
  // A verb
  fix: 'Fix',
  missingAttachmentsFixDialogTitle: 'Choose file',
  reportParameters: 'Report Parameters',
  labelFromRecordSetDialogTitle: 'From Record Set',
  runReport: 'Run Report',

  // ResourceView
  missingFormDefinitionPageHeader: 'Missing form definition',
  missingFormDefinitionPageContent: `
    Specify was unable to find the form definition to display this resource`,
  addingToRecordSet: 'Adding to Record Set and Database',

  // SaveButton
  unsavedFormUnloadProtect: 'This form has not been saved.',
  saveAndAddAnother: 'Save and Add Another',
  saveConflictDialogTitle: 'Save record',
  saveConflictDialogHeader: createHeader('Save conflict'),
  saveConflictDialogMessage: `
    The data shown on this page has been changed by another user or in
    another browser tab and is out of date. The page must be reloaded to
    prevent inconsistent data from being saved.`,
  saveBlockedDialogTitle: 'Save record',
  saveBlockedDialogHeader: createHeader('Save blocked'),
  saveBlockedDialogMessage:
    'Form cannot be saved while the following errors exist:',

  // ShowTransCommand
  resolvedLoans: 'Resolved Loans',
  // Open is a noun
  openLoans: 'Open Loans',
  gifts: 'Gifts',
  exchanges: 'Exchanges',

  // SpecifyCommands
  unavailableCommandButton: 'Command N/A',
  unavailableCommandDialogTitle: 'Command Not Available',
  unavailableCommandDialogHeader: createHeader('Command Not Available'),
  unavailableCommandDialogMessage: `
    This command is currently unavailable for <i>Specify&nbsp7</i>
    It was probably included on this form from <i>Specify&nbsp6</i> and
    may be supported in the future.`,
  commandName: 'Command name:',

  // SpecifyPlugins
  unavailablePluginButton: 'Plugin N/A',
  unavailablePluginDialogTitle: 'Plugin Not Available',
  unavailablePluginDialogHeader: createHeader('Plugin Not Available'),
  unavailablePluginDialogMessage: `
    This plugin is currently unavailable for <i>Specify&nbsp7</i>
    It was probably included on this form from <i>Specify&nbsp6</i> and
    may be supported in the future.`,
  pluginName: 'Plugin name:',

  // SubViewHeader
  link: 'Link',
  visit: 'Visit',

  // UiInputField
  formatPopUp: (format: string) => `Format: ${format}`,

  // UiParse
  illegalBool: (value: string) => `Illegal value for Boolean: "${value}.`,
  outOfRange: (minSafeInteger: number, maxSafeInteger: number) =>
    `Value must be between ${minSafeInteger} and ${maxSafeInteger}.`,
  notNumber: 'Not a valid number.',
  notInteger: 'Not a valid integer.',
  lengthOverflow: (maxLength: string) =>
    `Value cannot be longer than ${maxLength}.`,
  requiredField: 'Field is required.',
  requiredFormat: (format: string) => `Required Format: ${format}.`,
  noParser: (type: string) => `No parser for type ${type}`,

  // UserAgentsPlugin
  setAgents: 'Set Agents',
  setAgentsDisabledButtonDescription: 'Save user before adding agents.',
  userAgentsPluginDialogTitle: 'Set User Agents',
});

export default formsText;
