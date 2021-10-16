import { createDictionary, createHeader } from './utils';

// Refer to "Guidelines for Programmers" in ./utils.tsx before editing this file

const adminText = createDictionary({
  removeAdmin: 'Remove Admin',
  makeAdmin: 'Make Admin',
  saveUserFirst: 'Save user first',
  mustBeManager: 'User must be saved as Manager first',

  mimetype: 'Mimetype:',
  loadFile: 'Load File',
  download: 'Download',
  corruptResourceOrConflict: `
    This app resource appears to be corrupt but may be in the process of
    being saved by another session. It can be deleted if that is not the case.`,
  resourceLoadDialogTitle: 'Load file',
  resourceLoadDialogHeader: createHeader('Load resource file'),
  resourceLoadDialogMessage: 'Select the file to be loaded into the editor.',
  globalResourcesTitle: (resourceCount: string) =>
    `Global <small>(${resourceCount})</small>`,
  disciplineResourcesTitle: (resourceCount: string) =>
    `Discipline <small>(${resourceCount})</small>`,
  userTypes: 'User Types',
  users: 'Users',
  createResourceDialogTitle: 'Create Resource',
  createResourceDialogHeader: createHeader('Create New Resource File'),
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
  userCollectionsPluginDialogTitle: 'Select user collection access',
});

export default adminText;
