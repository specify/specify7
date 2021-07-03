import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./utils.tsx before editing this file

const commonText = createDictionary({
  specifySeven: 'Specify 7',
  pageNotFound: 'Page Not Found',

  collectionAccessDeniedDialogTitle: 'Access denied',
  collectionAccessDeniedDialogMessage: (collectionName: string) =>
    `You do not have access to the collection ${collectionName}
    through the currently logged in account.`,

  yes: 'Yes',
  no: 'No',
  back: 'Back',
  cancel: 'Cancel',
  create: 'Create',
  close: 'Close',
  apply: 'Apply',
  applyAll: 'Apply All',
  clearAll: 'Clear all',
  save: 'Save',
  add: 'Add',
  open: 'Open',
  delete: 'Delete',
  next: 'Next',
  previous: 'Previous',
  tools: 'Tools',
  loading: 'Loading...',
  tableName: 'Table Name',
  name: 'Name',
  created: 'Created',
  uploaded: 'Uploaded',
  createdBy: 'Created by',
  modifiedBy: 'Modified by',
  editName: 'Edit Name',
  details: 'Details',
  stop: 'Stop',
  remove: 'Remove',
  search: 'Search',
  noResults: 'No Results',
  new: 'New',
  reports: 'Reports',
  labels: 'Labels',
  edit: 'Edit',
  ignore: 'Ignore',
  query: 'Query',
  // A verb
  login: 'Login',
  start: 'Start',
  update: 'Update',
  generate: 'Generate',
  loadingInline: '(loading...)',

  // Toolbar
  attachments: 'Attachments',
  dataEntry: 'Data Entry',
  makeDwca: 'Make DwCA',
  definitionResourceNotFound: (resourceName: string) =>
    `Definition resource "${resourceName}" was not found.`,
  metadataResourceNotFound: (resourceName: string) =>
    `Metadata resource "${resourceName}" was not found.`,
  updateExportFeedDialogTitle: 'Update Feed Now',
  updateExportFeedDialogMessage: 'Update all export feed items now?',
  feedExportStartedDialogTitle: 'Update Started',
  feedExportStartedDialogMessage: `
    Update started. You will receive a notification for each feed item
    updated.`,
  interactions: 'Interactions',
  generateMasterKey: 'Generate Master Key',
  generateMasterKeyDialogTitle: 'Generate Master Key',
  userPassword: 'User Password:',
  masterKeyDialogTitle: 'Master Key',
  masterKeyFieldLabel: 'Master Key:',
  incorrectPassword: 'Password was incorrect.',
  queries: 'Queries',
  queriesDialogTitle: (count: number) => `"Queries (${count})`,
  newQueryDialogTitle: 'New Query Type',
  exportQueryForDwca: 'Export query for DwCA definition.',
  exportQueryForDwcaDialogTitle: 'Query XML for DwCA definition.',
  exportQueryAsReport: 'Define report based on query.',
  exportQueryAsLabel: 'Define label based on query.',
  newResourceTitle: (resourceName: string) => `New ${resourceName}`,
  labelName: 'Label Name',
  reportName: 'Report Name',
  createLabelDialogTitle: 'Create new label',
  createReportDialogTitle: 'Create new label',
  recordSets: 'Record Sets',
  resources: 'Resources',
  appResources: 'App Resources',
  viewSets: 'View Sets',
  resourcesDialogTitle: 'Resources',
  repairTree: 'Repair Tree',
  trees: 'Trees',
  treesDialogTitle: 'Trees',
  manageUsers: 'Manage Users',
  manageUsersDialogTitle: 'Manage Users',
  workbench: 'WorkBench',

  // Error Boundary
  errorBoundaryDialogTitle: 'Unexpected Error',
  errorBoundaryDialogMessage: 'An unexpected error has occurred.',
  backEndErrorDialogTitle: 'Server Error',
  backendErrorDialogMessage: `
    An error has occurred during communication with the server.`,
  okay: 'Okay',

  // Search
  expressSearch: 'Express Search',
  primarySearch: 'Primary Search',
  secondarySearch: 'Secondary Search',
  running: 'Running...',
  noMatches: 'No Matches',

  // Unload Protection
  leavePageDialogTitle: 'Leave Page?',
  leave: 'Leave',

  // Notifications
  feedItemUpdated: 'Export feed item updated.',
  updateFeedFailed: 'Export feed update failed.',
  dwcaExportCompleted: 'DwCA export completed.',
  dwcaExportFailed: 'DwCA export failed.',
  queryExportToCsvCompleted: 'Query export to CSV completed.',
  queryExportToKmlCompleted: 'Query export to KML completed.',
  dataSetOwnershipTransferred: (userName: string, dataSetName: string) => `
    ${userName} transferred the ownership of the ${dataSetName} dataset 
    to you.`,

  // SpecifyApp
  versionMismatchDialogTitle: 'Version Mismatch',
  versionMismatchDialogMessage: (
    specifySixVersion: string,
    databaseVersion: string
  ) => `
    The Specify version ${specifySixVersion} does not match the database
    version ${databaseVersion}`,
  versionMismatchSecondDialogMessage:
    'Some features of Specify 7 may therefore fail to operate correctly.',
  resourceDeletedDialogTitle: 'Item Deleted',
  resourceDeletedDialogMessage: 'Item Deleted.',
  appTitle: (baseTitle: string) => `${baseTitle} | Specify 7`,

  // StartApp
  sessionTimeOutDialogTitle: 'Insufficient Privileges',
  sessionTimeOutDialogMessage: `
    You lack sufficient privileges for that action, or your current
    session has been logged out.`,

  // UserTools
  logOut: 'Log out',
  changePassword: 'Change password',
  userToolsDialogTitle: '',


});

export default commonText;
