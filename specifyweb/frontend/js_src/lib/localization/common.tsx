import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./utils.tsx before editing this file

const commonText = createDictionary({
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
  okay: 'Okay',
});

export default commonText;
