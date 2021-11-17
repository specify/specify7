import React from 'react';

import { createDictionary, createHeader, createJsxHeader } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const commonText = createDictionary({
  specifySeven: {
    'en-us': 'Specify&nbsp7',
    'ru-ru': 'Specify&nbsp7',
  },
  pageNotFound: {
    'en-us': 'Page Not Found',
    'ru-ru': 'Page Not Found',
  },
  collectionAccessDeniedDialogTitle: {
    'en-us': 'Access denied',
    'ru-ru': 'Access denied',
  },
  collectionAccessDeniedDialogHeader: {
    'en-us': createHeader('You do not have access to this collection'),
    'ru-ru': createHeader('You do not have access to this collection'),
  },
  collectionAccessDeniedDialogMessage: {
    'en-us': (collectionName: string) =>
      `The currently logged in account does not have access to the
       ${collectionName} collection.`,
    'ru-ru': (collectionName: string) =>
      `The currently logged in account does not have access to the
       ${collectionName} collection.`,
  },
  noAgentDialogTitle: {
    'en-us': 'No Agent assigned',
  },
  noAgentDialogHeader: {
    'en-us': createHeader(
      'Current user does not have an agent assigned'
    ),
  },
  noAgentDialogMessage: {
    'en-us': 'Please log in as admin and assign an agent to this user',
  },
  no: {
    'en-us': 'No',
    'ru-ru': 'No',
  },
  cancel: {
    'en-us': 'Cancel',
    'ru-ru': 'Cancel',
  },
  create: {
    'en-us': 'Create',
    'ru-ru': 'Create',
  },
  close: {
    'en-us': 'Close',
    'ru-ru': 'Close',
  },
  apply: {
    'en-us': 'Apply',
    'ru-ru': 'Apply',
  },
  applyAll: {
    'en-us': 'Apply All',
    'ru-ru': 'Apply All',
  },
  clearAll: {
    'en-us': 'Clear all',
    'ru-ru': 'Clear all',
  },
  save: {
    'en-us': 'Save',
    'ru-ru': 'Save',
  },
  add: {
    'en-us': 'Add',
    'ru-ru': 'Add',
  },
  open: {
    'en-us': 'Open',
    'ru-ru': 'Open',
  },
  delete: {
    'en-us': 'Delete',
    'ru-ru': 'Delete',
  },
  next: {
    'en-us': 'Next',
    'ru-ru': 'Next',
  },
  previous: {
    'en-us': 'Previous',
    'ru-ru': 'Previous',
  },
  tools: {
    'en-us': 'Tools',
    'ru-ru': 'Tools',
  },
  loading: {
    'en-us': 'Loading...',
    'ru-ru': 'Loading...',
  },
  tableName: {
    'en-us': 'Table Name',
    'ru-ru': 'Table Name',
  },
  name: {
    'en-us': 'Name',
    'ru-ru': 'Name',
  },
  created: {
    'en-us': 'Created',
    'ru-ru': 'Created',
  },
  uploaded: {
    'en-us': 'Uploaded',
    'ru-ru': 'Uploaded',
  },
  createdBy: {
    'en-us': 'Created by:',
    'ru-ru': 'Created by:',
  },
  modifiedBy: {
    'en-us': 'Modified by:',
    'ru-ru': 'Modified by:',
  },
  stop: {
    'en-us': 'Stop',
    'ru-ru': 'Stop',
  },
  remove: {
    'en-us': 'Remove',
    'ru-ru': 'Remove',
  },
  search: {
    'en-us': 'Search',
    'ru-ru': 'Search',
  },
  noResults: {
    'en-us': 'No Results',
    'ru-ru': 'No Results',
  },
  notApplicable: {
    'en-us': 'N/A',
    'ru-ru': 'N/A',
  },
  notFound: {
    'en-us': 'Not found',
    'ru-ru': 'Not found',
  },
  new: {
    'en-us': 'New',
    'ru-ru': 'New',
  },
  reports: {
    'en-us': 'Reports',
    'ru-ru': 'Reports',
  },
  labels: {
    'en-us': 'Labels',
    'ru-ru': 'Labels',
  },
  edit: {
    'en-us': 'Edit',
    'ru-ru': 'Edit',
  },
  ignore: {
    'en-us': 'Ignore',
    'ru-ru': 'Ignore',
  },
  logIn: {
    'en-us': 'Log In',
    'ru-ru': 'Log In',
  },
  start: {
    'en-us': 'Start',
    'ru-ru': 'Start',
  },
  end: {
    'en-us': 'End',
    'ru-ru': 'End',
  },
  update: {
    'en-us': 'Update',
    'ru-ru': 'Update',
  },
  generate: {
    'en-us': 'Generate',
    'ru-ru': 'Generate',
  },
  loadingInline: {
    'en-us': '(loading...)',
    'ru-ru': '(loading...)',
  },
  listTruncated: {
    'en-us': '(list truncated)',
    'ru-ru': '(list truncated)',
  },
  metadataInline: {
    'en-us': 'Metadata:',
    'ru-ru': 'Metadata:',
  },
  metadata: {
    'en-us': 'Metadata',
    'ru-ru': 'Metadata',
  },
  query: {
    'en-us': 'Query',
  },
  unmapped: {
    'en-us': 'Unmapped',
    'ru-ru': 'Unmapped',
  },
  mapped: {
    'en-us': 'Mapped',
    'ru-ru': 'Mapped',
  },
  expand: {
    'en-us': 'Expand',
    'ru-ru': 'Expand',
  },
  geoMap: {
    'en-us': 'GeoMap',
    'ru-ru': 'GeoMap',
  },
  fullDate: {
    'en-us': 'Full Date',
    'ru-ru': 'Full Date',
  },
  year: {
    'en-us': 'Year',
    'ru-ru': 'Year',
  },
  month: {
    'en-us': 'Month',
    'ru-ru': 'Month',
  },
  day: {
    'en-us': 'Day',
    'ru-ru': 'Day',
  },
  view: {
    'en-us': 'View',
    'ru-ru': 'View',
  },
  addChild: {
    'en-us': 'Add child',
    'ru-ru': 'Add child',
  },
  move: {
    'en-us': 'Move',
    'ru-ru': 'Move',
  },
  opensInNewTab: {
    'en-us': '(opens in a new tab)',
    'ru-ru': '(opens in a new tab)',
  },

  // Toolbar
  notifications: {
    'en-us': (count: number) => `Notifications: ${count}`,
    'ru-ru': (count: number) => `Notifications: ${count}`,
  },
  attachments: {
    'en-us': 'Attachments',
    'ru-ru': 'Attachments',
  },
  dataEntry: {
    'en-us': 'Data Entry',
    'ru-ru': 'Data Entry',
  },
  makeDwca: {
    'en-us': 'Make DwCA',
    'ru-ru': 'Make DwCA',
  },
  definitionResourceNotFound: {
    'en-us': (resourceName: string) =>
      `Definition resource "${resourceName}" was not found.`,
    'ru-ru': (resourceName: string) =>
      `Definition resource "${resourceName}" was not found.`,
  },
  metadataResourceNotFound: {
    'en-us': (resourceName: string) =>
      `Metadata resource "${resourceName}" was not found.`,
    'ru-ru': (resourceName: string) =>
      `Metadata resource "${resourceName}" was not found.`,
  },
  updateExportFeed: {
    'en-us': 'Update Feed Now',
    'ru-ru': 'Update Feed Now',
  },
  updateExportFeedDialogTitle: {
    'en-us': 'Export Feed',
    'ru-ru': 'Export Feed',
  },
  updateExportFeedDialogHeader: {
    'en-us': createHeader('Update all export feed items now?'),
    'ru-ru': createHeader('Update all export feed items now?'),
  },
  updateExportFeedDialogMessage: {
    'en-us': 'Update all export feed items now?',
    'ru-ru': 'Update all export feed items now?',
  },
  feedExportStartedDialogTitle: {
    'en-us': 'Export Feed',
    'ru-ru': 'Export Feed',
  },
  feedExportStartedDialogHeader: {
    'en-us': createHeader('Export feed update started'),
    'ru-ru': createHeader('Export feed update started'),
  },
  feedExportStartedDialogMessage: {
    'en-us': `
      Update started. You will receive a notification for each feed item
      updated.`,
    'ru-ru': `
      Update started. You will receive a notification for each feed item
      updated.`,
  },
  dwcaExportStartedDialogTitle: {
    'en-us': 'DwCA',
    'ru-ru': 'DwCA',
  },
  dwcaExportStartedDialogHeader: {
    'en-us': createHeader('DwCA export started'),
    'ru-ru': createHeader('DwCA export started'),
  },
  dwcaExportStartedDialogMessage: {
    'en-us': `
      Export started. You will receive a notification
      when the export is complete.`,
    'ru-ru': `
      Export started. You will receive a notification
      when the export is complete.`,
  },
  interactions: {
    'en-us': 'Interactions',
    'ru-ru': 'Interactions',
  },
  generateMasterKey: {
    'en-us': 'Generate Master Key',
    'ru-ru': 'Generate Master Key',
  },
  generateMasterKeyDialogTitle: {
    'en-us': 'Master Key',
    'ru-ru': 'Master Key',
  },
  generateMasterKeyDialogHeader: {
    'en-us': createHeader('Generate Master Key'),
    'ru-ru': createHeader('Generate Master Key'),
  },
  userPassword: {
    'en-us': 'User Password:',
    'ru-ru': 'User Password:',
  },
  masterKeyDialogTitle: {
    'en-us': 'Master Key',
    'ru-ru': 'Master Key',
  },
  masterKeyDialogHeader: {
    'en-us': createHeader('Master key generated'),
    'ru-ru': createHeader('Master key generated'),
  },
  masterKeyFieldLabel: {
    'en-us': 'Master Key:',
    'ru-ru': 'Master Key:',
  },
  incorrectPassword: {
    'en-us': 'Password was incorrect.',
    'ru-ru': 'Password was incorrect.',
  },
  ascending: {
    'en-us': 'Ascending',
    'ru-ru': 'Ascending',
  },
  descending: {
    'en-us': 'Descending',
    'ru-ru': 'Descending',
  },
  queries: {
    'en-us': 'Queries',
    'ru-ru': 'Queries',
  },
  queriesDialogTitle: {
    'en-us': (count: number) => `Queries (${count})`,
    'ru-ru': (count: number) => `Queries (${count})`,
  },
  newQueryDialogTitle: {
    'en-us': 'New Query Type',
    'ru-ru': 'New Query Type',
  },
  exportQueryForDwca: {
    'en-us': 'Export query for DwCA definition.',
    'ru-ru': 'Export query for DwCA definition.',
  },
  exportQueryForDwcaDialogTitle: {
    'en-us': 'Query XML for DwCA definition',
    'ru-ru': 'Query XML for DwCA definition',
  },
  exportQueryForDwcaDialogHeader: {
    'en-us': createHeader('Query XML for DwCA definition'),
    'ru-ru': createHeader('Query XML for DwCA definition'),
  },
  exportQueryAsReport: {
    'en-us': 'Define report based on query.',
    'ru-ru': 'Define report based on query.',
  },
  exportQueryAsLabel: {
    'en-us': 'Define label based on query.',
    'ru-ru': 'Define label based on query.',
  },
  newResourceTitle: {
    'en-us': (resourceName: string) => `New ${resourceName}`,
    'ru-ru': (resourceName: string) => `New ${resourceName}`,
  },
  labelName: {
    'en-us': 'Label Name',
    'ru-ru': 'Label Name',
  },
  reportName: {
    'en-us': 'Report Name',
    'ru-ru': 'Report Name',
  },
  createLabelDialogTitle: {
    'en-us': 'Labels',
    'ru-ru': 'Labels',
  },
  createLabelDialogHeader: {
    'en-us': createHeader('Create new label'),
    'ru-ru': createHeader('Create new label'),
  },
  createReportDialogTitle: {
    'en-us': 'Reports',
    'ru-ru': 'Reports',
  },
  createReportDialogHeader: {
    'en-us': createHeader('Create new report'),
    'ru-ru': createHeader('Create new report'),
  },
  recordSets: {
    'en-us': 'Record Sets',
    'ru-ru': 'Record Sets',
  },
  resources: {
    'en-us': 'Resources',
    'ru-ru': 'Resources',
  },
  appResources: {
    'en-us': 'App Resources',
    'ru-ru': 'App Resources',
  },
  viewSets: {
    'en-us': 'View Sets',
    'ru-ru': 'View Sets',
  },
  resourcesDialogTitle: {
    'en-us': 'Resources',
    'ru-ru': 'Resources',
  },
  resourcesDialogHeader: {
    'en-us': createHeader('Choose the resource type you wish to edit:'),
    'ru-ru': createHeader('Choose the resource type you wish to edit:'),
  },
  repairTree: {
    'en-us': 'Repair Tree',
    'ru-ru': 'Repair Tree',
  },
  trees: {
    'en-us': 'Trees',
    'ru-ru': 'Trees',
  },
  treesDialogTitle: {
    'en-us': 'Trees',
    'ru-ru': 'Trees',
  },
  recordSet: {
    'en-us': 'Record Set',
    'ru-ru': 'Record Set',
  },
  recordCount: {
    'en-us': 'Record Count',
    'ru-ru': 'Record Count',
  },
  size: {
    'en-us': 'Size',
    'ru-ru': 'Size',
  },
  manageUsers: {
    'en-us': 'Manage Users',
    'ru-ru': 'Manage Users',
  },
  manageUsersDialogTitle: {
    'en-us': 'Manage Users',
    'ru-ru': 'Manage Users',
  },
  query: {
    'en-us': 'Query',
    'ru-ru': 'Query',
  },
  workbench: {
    'en-us': 'WorkBench',
    'ru-ru': 'WorkBench',
  },
  chooseDwcaDialogTitle: {
    'en-us': 'Choose DwCA',
    'ru-ru': 'Choose DwCA',
  },
  dwcaDefinition: {
    'en-us': 'DwCA definition:',
    'ru-ru': 'DwCA definition:',
  },
  metadataResource: {
    'en-us': 'Metadata resource:',
    'ru-ru': 'Metadata resource:',
  },
  // Error Boundary
  errorBoundaryDialogTitle: {
    'en-us': 'Unexpected Error',
    'ru-ru': 'Unexpected Error',
  },
  errorBoundaryDialogHeader: {
    'en-us': createJsxHeader('An unexpected error has occurred'),
    'ru-ru': createJsxHeader('An unexpected error has occurred'),
  },
  errorBoundaryDialogMessage: {
    'en-us': (
      <>
        Please reload the page and try again.
        <br />
        If this issue persists, please contact your IT support or if this is a
        Specify Cloud database, contact
        <a href="mailto:support@specifysoftware.org">
          support@specifysoftware.org
        </a>
      </>
    ),
    'ru-ru': (
      <>
        Please reload the page and try again.
        <br />
        If this issue persists, please contact your IT support or if this is a
        Specify Cloud database, contact
        <a href="mailto:support@specifysoftware.org">
          support@specifysoftware.org
        </a>
      </>
    ),
  },
  backEndErrorDialogTitle: {
    'en-us': 'Server Error',
    'ru-ru': 'Server Error',
  },
  backEndErrorDialogHeader: {
    'en-us': createHeader(
      'An error occurred communicating with the Specify 7 server.'
    ),
    'ru-ru': createHeader(
      'An error occurred communicating with the Specify 7 server.'
    ),
  },
  backEndErrorDialogMessage: {
    'en-us': `
      Please reload the page and try again.<br>
      If the issue persists, please contact your IT support, or if this is
      a Specify Cloud database, contact
      <a href="mailto:support@specifysoftware.org">
        support@specifysoftware.org
      </a>.`,
    'ru-ru': `
      Please reload the page and try again.<br>
      If the issue persists, please contact your IT support, or if this is
      a Specify Cloud database, contact
      <a href="mailto:support@specifysoftware.org">
        support@specifysoftware.org
      </a>.`,
  },
  // Search
  expressSearch: {
    'en-us': 'Express Search',
    'ru-ru': 'Express Search',
  },
  primarySearch: {
    'en-us': 'Primary Search',
    'ru-ru': 'Primary Search',
  },
  secondarySearch: {
    'en-us': 'Secondary Search',
    'ru-ru': 'Secondary Search',
  },
  running: {
    'en-us': 'Running...',
    'ru-ru': 'Running...',
  },
  noMatches: {
    'en-us': 'No Matches',
    'ru-ru': 'No Matches',
  },
  searchQuery: {
    'en-us': 'Search Query',
    'ru-ru': 'Search Query',
  },
  unknown: {
    'en-us': 'Unknown',
    'ru-ru': 'Unknown',
  },
  // Unload Protection
  leavePageDialogTitle: {
    'en-us': 'Unsaved changes detected',
    'ru-ru': 'Unsaved changes detected',
  },
  leavePageDialogHeader: {
    'en-us': createHeader('Are you sure you want to leave this page?'),
    'ru-ru': createHeader('Are you sure you want to leave this page?'),
  },
  leave: {
    'en-us': 'Leave',
    'ru-ru': 'Leave',
  },
  // Notifications
  notificationsDialogTitle: {
    'en-us': 'Notifications',
    'ru-ru': 'Notifications',
  },
  feedItemUpdated: {
    'en-us': 'Export feed item updated.',
    'ru-ru': 'Export feed item updated.',
  },
  updateFeedFailed: {
    'en-us': 'Export feed update failed.',
    'ru-ru': 'Export feed update failed.',
  },
  exception: {
    'en-us': 'Exception',
    'ru-ru': 'Exception',
  },
  download: {
    'en-us': 'Download',
    'ru-ru': 'Download',
  },
  dwcaExportCompleted: {
    'en-us': 'DwCA export completed.',
    'ru-ru': 'DwCA export completed.',
  },
  dwcaExportFailed: {
    'en-us': 'DwCA export failed.',
    'ru-ru': 'DwCA export failed.',
  },
  queryExportToCsvCompleted: {
    'en-us': 'Query export to CSV completed.',
    'ru-ru': 'Query export to CSV completed.',
  },
  queryExportToKmlCompleted: {
    'en-us': 'Query export to KML completed.',
    'ru-ru': 'Query export to KML completed.',
  },
  dataSetOwnershipTransferred: {
    'en-us': (userName: string, dataSetName: string) => `
      ${userName} transferred the ownership of the ${dataSetName} dataset
      to you.`,
    'ru-ru': (userName: string, dataSetName: string) => `
      ${userName} transferred the ownership of the ${dataSetName} dataset
      to you.`,
  },
  // OtherCollectionView
  noAccessToResource: {
    'en-us': `
      You do not have access to any collection containing this resource
      through the currently logged in account`,
    'ru-ru': `
      You do not have access to any collection containing this resource
      through the currently logged in account`,
  },
  resourceInaccessible: {
    'en-us': `
      The requested resource cannot be accessed while logged into the
      current collection.`,
    'ru-ru': `
      The requested resource cannot be accessed while logged into the
      current collection.`,
  },
  selectCollection: {
    'en-us': 'Select one of the following collections:',
    'ru-ru': 'Select one of the following collections:',
  },
  collection: {
    'en-us': 'Collection',
    'ru-ru': 'Collection',
  },
  loginToProceed: {
    'en-us': (collectionName: string) => `
       You can login to the collection, ${collectionName}, to proceed:`,
    'ru-ru': (collectionName: string) => `
       You can login to the collection, ${collectionName}, to proceed:`,
  },
  // SpecifyApp
  versionMismatchDialogTitle: {
    'en-us': 'Version Mismatch',
    'ru-ru': 'Version Mismatch',
  },
  versionMismatchDialogHeader: {
    'en-us': createHeader('Specify version does not match database version'),
    'ru-ru': createHeader('Specify version does not match database version'),
  },
  versionMismatchDialogMessage: {
    'en-us': (specifySixVersion: string, databaseVersion: string) => `
      The Specify version ${specifySixVersion} does not match the database
      version ${databaseVersion}.`,
    'ru-ru': (specifySixVersion: string, databaseVersion: string) => `
      The Specify version ${specifySixVersion} does not match the database
      version ${databaseVersion}.`,
  },
  versionMismatchSecondDialogMessage: {
    'en-us':
      'Some features of Specify 7 may therefore fail to operate correctly.',
    'ru-ru':
      'Some features of Specify 7 may therefore fail to operate correctly.',
  },
  resourceDeletedDialogTitle: {
    'en-us': 'Deleted',
    'ru-ru': 'Deleted',
  },
  resourceDeletedDialogHeader: {
    'en-us': createHeader('Item deleted'),
    'ru-ru': createHeader('Item deleted'),
  },
  resourceDeletedDialogMessage: {
    'en-us': 'Item was deleted successfully.',
    'ru-ru': 'Item was deleted successfully.',
  },
  appTitle: {
    'en-us': (baseTitle: string) => `${baseTitle} | Specify 7`,
    'ru-ru': (baseTitle: string) => `${baseTitle} | Specify 7`,
  },
  // StartApp
  sessionTimeOutDialogTitle: {
    'en-us': 'Access denied',
    'ru-ru': 'Access denied',
  },
  sessionTimeOutDialogHeader: {
    'en-us': createHeader('Insufficient Privileges'),
    'ru-ru': createHeader('Insufficient Privileges'),
  },
  sessionTimeOutDialogMessage: {
    'en-us': `
      You lack sufficient privileges for that action, or your current
      session has been logged out.`,
    'ru-ru': `
      You lack sufficient privileges for that action, or your current
      session has been logged out.`,
  },
  // UserTools
  logOut: {
    'en-us': 'Log out',
    'ru-ru': 'Log out',
  },
  changePassword: {
    'en-us': 'Change password',
    'ru-ru': 'Change password',
  },
  userToolsDialogTitle: {
    'en-us': 'User Tools',
    'ru-ru': 'User Tools',
  },
});

export default commonText;
