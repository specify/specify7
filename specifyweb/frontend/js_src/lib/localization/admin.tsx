import { createDictionary, createHeader } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const adminText = createDictionary({
  removeAdmin: {
    'en-us': 'Remove Admin',
    'ru-ru': 'Remove Admin',
  },
  canNotRemoveYourself: {
    'en-us': 'You can not revoke your own admin status',
  },
  makeAdmin: {
    'en-us': 'Make Admin',
    'ru-ru': 'Make Admin',
  },
  saveUserFirst: {
    'en-us': 'Save user first',
    'ru-ru': 'Save user first',
  },
  mustBeManager: {
    'en-us': 'User must be saved as Manager first',
    'ru-ru': 'User must be saved as Manager first',
  },
  mimetype: {
    'en-us': 'Mimetype:',
    'ru-ru': 'Mimetype:',
  },
  loadFile: {
    'en-us': 'Load File',
    'ru-ru': 'Load File',
  },
  corruptResourceOrConflict: {
    'en-us': `
      This app resource appears to be corrupt but may be in the process of
      being saved by another session. It can be deleted if that is not the
      case.`,
    'ru-ru': `
      This app resource appears to be corrupt but may be in the process of
      being saved by another session. It can be deleted if that is not the
      case.`,
  },
  resourceLoadDialogTitle: {
    'en-us': 'Load file',
    'ru-ru': 'Load file',
  },
  resourceLoadDialogHeader: {
    'en-us': createHeader('Load resource file'),
    'ru-ru': createHeader('Load resource file'),
  },
  resourceLoadDialogMessage: {
    'en-us': 'Select the file to be loaded into the editor.',
    'ru-ru': 'Select the file to be loaded into the editor.',
  },
  globalResourcesTitle: {
    'en-us': (resourceCount: string) =>
      `Global <small>(${resourceCount})</small>`,
    'ru-ru': (resourceCount: string) =>
      `Global <small>(${resourceCount})</small>`,
  },
  disciplineResourcesTitle: {
    'en-us': (resourceCount: string) =>
      `Discipline <small>(${resourceCount})</small>`,
    'ru-ru': (resourceCount: string) =>
      `Discipline <small>(${resourceCount})</small>`,
  },
  userTypes: {
    'en-us': 'User Types',
    'ru-ru': 'User Types',
  },
  users: {
    'en-us': 'Users',
    'ru-ru': 'Users',
  },
  createResourceDialogTitle: {
    'en-us': 'Create Resource',
    'ru-ru': 'Create Resource',
  },
  createResourceDialogHeader: {
    'en-us': createHeader('Create New Resource File'),
    'ru-ru': createHeader('Create New Resource File'),
  },
  newResourceName: {
    'en-us': 'New Resource Name:',
    'ru-ru': 'New Resource Name:',
  },
  setPassword: {
    'en-us': 'Set Password',
    'ru-ru': 'Set Password',
  },
  passwordLengthError: {
    'en-us': 'Password must have at least six characters.',
    'ru-ru': 'Password must have at least six characters.',
  },
  passwordsDoNotMatchError: {
    'en-us': 'Passwords do not match.',
    'ru-ru': 'Passwords do not match.',
  },
  saveUserBeforeSettingPasswordError: {
    'en-us': 'Save user before setting password.',
    'ru-ru': 'Save user before setting password.',
  },
  // PasswordChange
  password: {
    'en-us': 'Password',
    'ru-ru': 'Password',
  },
  confirmPassword: {
    'en-us': 'Confirm',
    'ru-ru': 'Confirm',
  },
  // UserCollectionsPlugin
  collections: {
    'en-us': 'Collections',
    'ru-ru': 'Collections',
  },
  notAvailableOnAdmins: {
    'en-us': 'This option is unavailable for admin users',
  },
  userCollectionsPluginDialogTitle: {
    'en-us': 'Select user collection access',
    'ru-ru': 'Select user collection access',
  },
});

export default adminText;
