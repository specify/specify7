import { createDictionary, createHeader } from './utils';

// Refer to "Guidelines for Programmers" in ./utils.tsx before editing this file

const adminText = createDictionary({
  removeAdmin: 'Remove Admin',
  makeAdmin: 'Make Admin',
  adminStatusUnsavedDescription: 'Save user first',
  mustBeManager: 'User must be saved as Manager first',

  metadata: 'Metadata:',
  mimetype: 'Mimetype:',
  loadFile: 'Load File:',
  download: 'Download',
  corruptResourceOrConflict: `
    This app resource appears to be corrupt but may be in the process of
    being saved by another session. It can be deleted if that is not the case.`,
  resourceLoadDialogTitle: 'Load file',
  resourceLoadDialogHeader: createHeader(''),
  resourceLoadDialogMessage: 'Select the file to be loaded into the editor.',
  globalResourcesTitle: (resourceCount: string) =>
    `Global <small>(${resourceCount})</small>`,
  disciplineResourcesTitle: (resourceCount: string) =>
    `Discipliine <small>(${resourceCount})</small>`,
  userTypes: 'User Types',
  users: 'Users',
  createResourceDialogTitle: 'New Resource Name',
  createResourceDialogHeader: createHeader(''),
  newResourceName: 'New Resource Name:',

  setPassword: 'Set Password',
  passwordLengthError: 'Password must have at least six characters.',
  passwordsDoNotMatchError: 'Passwords do not match.',
  saveUserBeforeSettingPasswordError: 'Save user before setting password.',

  // PasswordChange
  password: 'Password',
  confirmPassword: 'Confirm',

  // UserCollectionsPlugin
  collections: 'Collections',
  userCollectionsPluginButtonDisabledDescription: 'Save user first',
  userCollectionsPluginDialogTitle: 'Select user collection access',
});

export default adminText;
