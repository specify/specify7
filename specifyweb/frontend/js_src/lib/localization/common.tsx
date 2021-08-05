import React from 'react';

import { createDictionary, createHeader, createJsxHeader } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const commonText = createDictionary({
  specifySeven: 'Specify&nbsp7',
  pageNotFound: 'Page Not Found',

  collectionAccessDeniedDialogTitle: 'Access denied',
  collectionAccessDeniedDialogHeader: createHeader(
    'You do not have access to this collection'
  ),
  collectionAccessDeniedDialogMessage: (collectionName: string) =>
    `The currently logged in account does not have access to the
    ${collectionName} collection.`,
  noAgentDialogTitle: 'No Agent assigned',
  noAgentDialogHeader: createHeader(
    'Current user does not have an agent assigned'
  ),
  noAgentDialogMessage:
    'Please log in as admin and assign an agent to this user',

  no: 'No',
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
  createdBy: 'Created by:',
  modifiedBy: 'Modified by:',
  stop: 'Stop',
  remove: 'Remove',
  search: 'Search',
  noResults: 'No Results',
  notFound: 'Not found',
  new: 'New',
  reports: 'Reports',
  labels: 'Labels',
  edit: 'Edit',
  ignore: 'Ignore',
  logIn: 'Log In',
  start: 'Start',
  update: 'Update',
  generate: 'Generate',
  loadingInline: '(loading...)',
  listTruncated: '(list truncated)',
  metadataInline: 'Metadata:',
  metadata: 'Metadata',
  query: 'Query',
  unmapped: 'Unmapped',
  expand: 'Expand',
  geoMap: 'GeoMap',

  // Toolbar
  notifications: (count: number) => `Notifications: ${count}`,
  attachments: 'Attachments',
  dataEntry: 'Data Entry',
  makeDwca: 'Make DwCA',
  definitionResourceNotFound: (resourceName: string) =>
    `Definition resource "${resourceName}" was not found.`,
  metadataResourceNotFound: (resourceName: string) =>
    `Metadata resource "${resourceName}" was not found.`,
  updateExportFeed: 'Update Feed Now',
  updateExportFeedDialogTitle: 'Export Feed',
  updateExportFeedDialogHeader: createHeader(
    'Update all export feed items now?'
  ),
  updateExportFeedDialogMessage: 'Update all export feed items now?',
  feedExportStartedDialogTitle: 'Export Feed',
  feedExportStartedDialogHeader: createHeader('Export feed update started'),
  feedExportStartedDialogMessage: `
    Update started. You will receive a notification for each feed item
    updated.`,
  dwcaExportStartedDialogTitle: 'DwCA',
  dwcaExportStartedDialogHeader: createHeader('DwCA export started'),
  dwcaExportStartedDialogMessage: `
    Export started. You will receive a notification
    when the export is complete.`,
  interactions: 'Interactions',
  generateMasterKey: 'Generate Master Key',
  generateMasterKeyDialogTitle: 'Master Key',
  generateMasterKeyDialogHeader: createHeader('Generate Master Key'),
  userPassword: 'User Password:',
  masterKeyDialogTitle: 'Master Key',
  masterKeyDialogHeader: createHeader('Master key generated'),
  masterKeyFieldLabel: 'Master Key:',
  incorrectPassword: 'Password was incorrect.',
  queries: 'Queries',
  queriesDialogTitle: (count: number) => `Queries (${count})`,
  newQueryDialogTitle: 'New Query Type',
  exportQueryForDwca: 'Export query for DwCA definition.',
  exportQueryForDwcaDialogTitle: 'Query XML for DwCA definition',
  exportQueryForDwcaDialogHeader: createHeader('Query XML for DwCA definition'),
  exportQueryAsReport: 'Define report based on query.',
  exportQueryAsLabel: 'Define label based on query.',
  newResourceTitle: (resourceName: string) => `New ${resourceName}`,
  labelName: 'Label Name',
  reportName: 'Report Name',
  createLabelDialogTitle: 'Labels',
  createLabelDialogHeader: createHeader('Create new label'),
  createReportDialogTitle: 'Reports',
  createReportDialogHeader: createHeader('Create new report'),
  recordSets: 'Record Sets',
  resources: 'Resources',
  appResources: 'App Resources',
  viewSets: 'View Sets',
  resourcesDialogTitle: 'Resources',
  resourcesDialogHeader: createHeader(
    'Choose the resource type you wish to edit:'
  ),
  repairTree: 'Repair Tree',
  trees: 'Trees',
  treesDialogTitle: 'Trees',
  manageUsers: 'Manage Users',
  manageUsersDialogTitle: 'Manage Users',
  workbench: 'WorkBench',
  chooseDwcaDialogTitle: 'Choose DwCA',
  dwcaDefinition: 'DwCA definition:',
  metadataResource: 'Metadata resource:',

  // Error Boundary
  errorBoundaryDialogTitle: 'Unexpected Error',
  errorBoundaryDialogHeader: createJsxHeader(
    'An unexpected error has occurred'
  ),
  errorBoundaryDialogMessage: (
    <>
      Please reload the page and try again. If this issue persists, please
      contact your IT support or if this is a Specify Cloud database, contact
      <a href="mailto:support@specifysoftware.org">
        support@specifysoftware.org
      </a>
      .
    </>
  ),
  backEndErrorDialogTitle: 'Server Error',
  backEndErrorDialogHeader: createHeader(
    'An error occurred communicating with the Specify 7 server.'
  ),
  backEndErrorDialogMessage: `
    Please reload the page and try again. If the issue persists, please
    contact your IT support, or if this is a Specify Cloud database, contact
    <a href="mailto:support@specifysoftware.org">
      support@specifysoftware.org
    </a>.`,

  // Search
  expressSearch: 'Express Search',
  primarySearch: 'Primary Search',
  secondarySearch: 'Secondary Search',
  running: 'Running...',
  noMatches: 'No Matches',
  searchQuery: 'Search Query',
  unknown: 'Unknown',

  // Unload Protection
  leavePageDialogTitle: 'Unsaved changes detected',
  leavePageDialogHeader: createHeader(
    'Are you sure you want to leave this page?'
  ),
  leave: 'Leave',

  // Notifications
  notificationsDialogTitle: 'Notifications',
  feedItemUpdated: 'Export feed item updated.',
  updateFeedFailed: 'Export feed update failed.',
  dwcaExportCompleted: 'DwCA export completed.',
  dwcaExportFailed: 'DwCA export failed.',
  queryExportToCsvCompleted: 'Query export to CSV completed.',
  queryExportToKmlCompleted: 'Query export to KML completed.',
  dataSetOwnershipTransferred: (userName: string, dataSetName: string) => `
    ${userName} transferred the ownership of the ${dataSetName} dataset
    to you.`,

  // OtherCollectionView
  noAccessToResource: `
    You do not have access to any collection containing this resource
    through the currently logged in account`,
  resourceInaccessible: `
    The requested resource cannot be accessed while logged into the
    current collection.`,
  selectCollection: 'Select one of the following collections:',
  loginToProceed: (collectionName: string) => `
    You can login to the collection, ${collectionName}, to proceed:`,

  // SpecifyApp
  versionMismatchDialogTitle: 'Version Mismatch',
  versionMismatchDialogHeader: createHeader(
    'Specify version does not match database version'
  ),
  versionMismatchDialogMessage: (
    specifySixVersion: string,
    databaseVersion: string
  ) => `
    The Specify version ${specifySixVersion} does not match the database
    version ${databaseVersion}.`,
  versionMismatchSecondDialogMessage:
    'Some features of Specify 7 may therefore fail to operate correctly.',
  resourceDeletedDialogTitle: 'Deleted',
  resourceDeletedDialogHeader: createHeader('Item deleted'),
  resourceDeletedDialogMessage: 'Item was deleted successfully.',
  appTitle: (baseTitle: string) => `${baseTitle} | Specify 7`,

  // StartApp
  sessionTimeOutDialogTitle: 'Access denied',
  sessionTimeOutDialogHeader: createHeader('Insufficient Privileges'),
  sessionTimeOutDialogMessage: `
    You lack sufficient privileges for that action, or your current
    session has been logged out.`,

  // UserTools
  logOut: 'Log out',
  changePassword: 'Change password',
  userToolsDialogTitle: 'User Tools',
});

export default commonText;
