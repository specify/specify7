import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./utils.tsx before editing this file

const commonText = createDictionary({
  specifySeven: 'Specify 7',
  pageNotFound: 'Page Not Found',

  yes: 'Yes',
  no: 'No',
  back: 'Back',
  cancel: 'Cancel',
  create: 'Create',
  close: 'Close',
  apply: 'Apply',
  applyAll: 'Apply All',
  save: 'Save',
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

});

export default commonText;
