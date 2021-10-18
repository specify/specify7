import React from 'react';

import { createDictionary, createHeader, createJsxHeader } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const commonText = createDictionary({
  specifySeven: {
    'en-us': 'Specify&nbsp7',
  },
  pageNotFound: {
    'en-us': 'Page Not Found',
  },
  collectionAccessDeniedDialogTitle: {
    'en-us': 'Access denied',
  },
  collectionAccessDeniedDialogHeader: {
    'en-us': createHeader('You do not have access to this collection'),
  },
  collectionAccessDeniedDialogMessage: {
    'en-us': (collectionName: string) =>
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
  },
  cancel: {
    'en-us': 'Cancel',
  },
  create: {
    'en-us': 'Create',
  },
  close: {
    'en-us': 'Close',
  },
  apply: {
    'en-us': 'Apply',
  },
  applyAll: {
    'en-us': 'Apply All',
  },
  clearAll: {
    'en-us': 'Clear all',
  },
  save: {
    'en-us': 'Save',
  },
  add: {
    'en-us': 'Add',
  },
  open: {
    'en-us': 'Open',
  },
  delete: {
    'en-us': 'Delete',
  },
  next: {
    'en-us': 'Next',
  },
  previous: {
    'en-us': 'Previous',
  },
  tools: {
    'en-us': 'Tools',
  },
  loading: {
    'en-us': 'Loading...',
  },
  tableName: {
    'en-us': 'Table Name',
  },
  name: {
    'en-us': 'Name',
  },
  created: {
    'en-us': 'Created',
  },
  uploaded: {
    'en-us': 'Uploaded',
  },
  createdBy: {
    'en-us': 'Created by:',
  },
  modifiedBy: {
    'en-us': 'Modified by:',
  },
  stop: {
    'en-us': 'Stop',
  },
  remove: {
    'en-us': 'Remove',
  },
  search: {
    'en-us': 'Search',
  },
  noResults: {
    'en-us': 'No Results',
  },
  notFound: {
    'en-us': 'Not found',
  },
  new: {
    'en-us': 'New',
  },
  reports: {
    'en-us': 'Reports',
  },
  labels: {
    'en-us': 'Labels',
  },
  edit: {
    'en-us': 'Edit',
  },
  ignore: {
    'en-us': 'Ignore',
  },
  logIn: {
    'en-us': 'Log In',
  },
  start: {
    'en-us': 'Start',
  },
  end: {
    'en-us': 'End',
  },
  update: {
    'en-us': 'Update',
  },
  generate: {
    'en-us': 'Generate',
  },
  loadingInline: {
    'en-us': '(loading...)',
  },
  listTruncated: {
    'en-us': '(list truncated)',
  },
  metadataInline: {
    'en-us': 'Metadata:',
  },
  metadata: {
    'en-us': 'Metadata',
  },
  query: {
    'en-us': 'Query',
  },
  unmapped: {
    'en-us': 'Unmapped',
  },
  expand: {
    'en-us': 'Expand',
  },
  geoMap: {
    'en-us': 'GeoMap',
  },
  fullDate: {
    'en-us': 'Full Date',
  },
  year: {
    'en-us': 'Year',
  },
  month: {
    'en-us': 'Month',
  },
  day: {
    'en-us': 'Day',
  },
  view: {
    'en-us': 'View',
  },
  addChild: {
    'en-us': 'Add child',
  },
  move: {
    'en-us': 'Move',
  },
  // Toolbar
  notifications: {
    'en-us': (count: number) => `Notifications: ${count}`,
  },
  attachments: {
    'en-us': 'Attachments',
  },
  dataEntry: {
    'en-us': 'Data Entry',
  },
  makeDwca: {
    'en-us': 'Make DwCA',
  },
  definitionResourceNotFound: {
    'en-us': (resourceName: string) =>
      `Definition resource "${resourceName}" was not found.`,
  },
  metadataResourceNotFound: {
    'en-us': (resourceName: string) =>
      `Metadata resource "${resourceName}" was not found.`,
  },
  updateExportFeed: {
    'en-us': 'Update Feed Now',
  },
  updateExportFeedDialogTitle: {
    'en-us': 'Export Feed',
  },
  updateExportFeedDialogHeader: {
    'en-us': createHeader('Update all export feed items now?'),
  },
  updateExportFeedDialogMessage: {
    'en-us': 'Update all export feed items now?',
  },
  feedExportStartedDialogTitle: {
    'en-us': 'Export Feed',
  },
  feedExportStartedDialogHeader: {
    'en-us': createHeader('Export feed update started'),
  },
  feedExportStartedDialogMessage: {
    'en-us': `
      Update started. You will receive a notification for each feed item
      updated.`,
  },
  dwcaExportStartedDialogTitle: {
    'en-us': 'DwCA',
  },
  dwcaExportStartedDialogHeader: {
    'en-us': createHeader('DwCA export started'),
  },
  dwcaExportStartedDialogMessage: {
    'en-us': `
      Export started. You will receive a notification
      when the export is complete.`,
  },
  interactions: {
    'en-us': 'Interactions',
  },
  generateMasterKey: {
    'en-us': 'Generate Master Key',
  },
  generateMasterKeyDialogTitle: {
    'en-us': 'Master Key',
  },
  generateMasterKeyDialogHeader: {
    'en-us': createHeader('Generate Master Key'),
  },
  userPassword: {
    'en-us': 'User Password:',
  },
  masterKeyDialogTitle: {
    'en-us': 'Master Key',
  },
  masterKeyDialogHeader: {
    'en-us': createHeader('Master key generated'),
  },
  masterKeyFieldLabel: {
    'en-us': 'Master Key:',
  },
  incorrectPassword: {
    'en-us': 'Password was incorrect.',
  },
  queries: {
    'en-us': 'Queries',
  },
  queriesDialogTitle: {
    'en-us': (count: number) => `Queries (${count})`,
  },
  newQueryDialogTitle: {
    'en-us': 'New Query Type',
  },
  exportQueryForDwca: {
    'en-us': 'Export query for DwCA definition.',
  },
  exportQueryForDwcaDialogTitle: {
    'en-us': 'Query XML for DwCA definition',
  },
  exportQueryForDwcaDialogHeader: {
    'en-us': createHeader('Query XML for DwCA definition'),
  },
  exportQueryAsReport: {
    'en-us': 'Define report based on query.',
  },
  exportQueryAsLabel: {
    'en-us': 'Define label based on query.',
  },
  newResourceTitle: {
    'en-us': (resourceName: string) => `New ${resourceName}`,
  },
  labelName: {
    'en-us': 'Label Name',
  },
  reportName: {
    'en-us': 'Report Name',
  },
  createLabelDialogTitle: {
    'en-us': 'Labels',
  },
  createLabelDialogHeader: {
    'en-us': createHeader('Create new label'),
  },
  createReportDialogTitle: {
    'en-us': 'Reports',
  },
  createReportDialogHeader: {
    'en-us': createHeader('Create new report'),
  },
  recordSets: {
    'en-us': 'Record Sets',
  },
  resources: {
    'en-us': 'Resources',
  },
  appResources: {
    'en-us': 'App Resources',
  },
  viewSets: {
    'en-us': 'View Sets',
  },
  resourcesDialogTitle: {
    'en-us': 'Resources',
  },
  resourcesDialogHeader: {
    'en-us': createHeader('Choose the resource type you wish to edit:'),
  },
  repairTree: {
    'en-us': 'Repair Tree',
  },
  trees: {
    'en-us': 'Trees',
  },
  treesDialogTitle: {
    'en-us': 'Trees',
  },
  manageUsers: {
    'en-us': 'Manage Users',
  },
  manageUsersDialogTitle: {
    'en-us': 'Manage Users',
  },
  workbench: {
    'en-us': 'WorkBench',
  },
  chooseDwcaDialogTitle: {
    'en-us': 'Choose DwCA',
  },
  dwcaDefinition: {
    'en-us': 'DwCA definition:',
  },
  metadataResource: {
    'en-us': 'Metadata resource:',
  },
  // Error Boundary
  errorBoundaryDialogTitle: {
    'en-us': 'Unexpected Error',
  },
  errorBoundaryDialogHeader: {
    'en-us': createJsxHeader('An unexpected error has occurred'),
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
  },
  backEndErrorDialogTitle: {
    'en-us': 'Server Error',
  },
  backEndErrorDialogHeader: {
    'en-us': createHeader(
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
  },
  // Search
  expressSearch: {
    'en-us': 'Express Search',
  },
  primarySearch: {
    'en-us': 'Primary Search',
  },
  secondarySearch: {
    'en-us': 'Secondary Search',
  },
  running: {
    'en-us': 'Running...',
  },
  noMatches: {
    'en-us': 'No Matches',
  },
  searchQuery: {
    'en-us': 'Search Query',
  },
  unknown: {
    'en-us': 'Unknown',
  },
  // Unload Protection
  leavePageDialogTitle: {
    'en-us': 'Unsaved changes detected',
  },
  leavePageDialogHeader: {
    'en-us': createHeader('Are you sure you want to leave this page?'),
  },
  leave: {
    'en-us': 'Leave',
  },
  // Notifications
  notificationsDialogTitle: {
    'en-us': 'Notifications',
  },
  feedItemUpdated: {
    'en-us': 'Export feed item updated.',
  },
  updateFeedFailed: {
    'en-us': 'Export feed update failed.',
  },
  dwcaExportCompleted: {
    'en-us': 'DwCA export completed.',
  },
  dwcaExportFailed: {
    'en-us': 'DwCA export failed.',
  },
  queryExportToCsvCompleted: {
    'en-us': 'Query export to CSV completed.',
  },
  queryExportToKmlCompleted: {
    'en-us': 'Query export to KML completed.',
  },
  dataSetOwnershipTransferred: {
    'en-us': (userName: string, dataSetName: string) => `
      ${userName} transferred the ownership of the ${dataSetName} dataset
      to you.`,
  },
  // OtherCollectionView
  noAccessToResource: {
    'en-us': `
      You do not have access to any collection containing this resource
      through the currently logged in account`,
  },
  resourceInaccessible: {
    'en-us': `
      The requested resource cannot be accessed while logged into the
      current collection.`,
  },
  selectCollection: {
    'en-us': 'Select one of the following collections:',
  },
  loginToProceed: {
    'en-us': (collectionName: string) => `
       You can login to the collection, ${collectionName}, to proceed:`,
  },
  // SpecifyApp
  versionMismatchDialogTitle: {
    'en-us': 'Version Mismatch',
  },
  versionMismatchDialogHeader: {
    'en-us': createHeader('Specify version does not match database version'),
  },
  versionMismatchDialogMessage: {
    'en-us': (specifySixVersion: string, databaseVersion: string) => `
      The Specify version ${specifySixVersion} does not match the database
      version ${databaseVersion}.`,
  },
  versionMismatchSecondDialogMessage: {
    'en-us':
      'Some features of Specify 7 may therefore fail to operate correctly.',
  },
  resourceDeletedDialogTitle: {
    'en-us': 'Deleted',
  },
  resourceDeletedDialogHeader: {
    'en-us': createHeader('Item deleted'),
  },
  resourceDeletedDialogMessage: {
    'en-us': 'Item was deleted successfully.',
  },
  appTitle: {
    'en-us': (baseTitle: string) => `${baseTitle} | Specify 7`,
  },
  // StartApp
  sessionTimeOutDialogTitle: {
    'en-us': 'Access denied',
  },
  sessionTimeOutDialogHeader: {
    'en-us': createHeader('Insufficient Privileges'),
  },
  sessionTimeOutDialogMessage: {
    'en-us': `
      You lack sufficient privileges for that action, or your current
      session has been logged out.`,
  },
  // UserTools
  logOut: {
    'en-us': 'Log out',
  },
  changePassword: {
    'en-us': 'Change password',
  },
  userToolsDialogTitle: {
    'en-us': 'User Tools',
  },
});

export default commonText;
