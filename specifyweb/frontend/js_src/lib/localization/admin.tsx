import { createDictionary, createHeader } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const adminText = createDictionary({
  removeAdmin: 'Remove Admin',
  canNotRemoveYourself: 'You can not revoke your own admin status',
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
  resourceLoadDialogHeader: createHeader(''),
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
  notAvailableOnAdmins: 'This option is unavailable for admin users',
  userCollectionsPluginDialogTitle: 'Select user collection access',

    // UserInviteLinkPlugin
    userInviteLinkDialogTitle: 'User Invite Link',
    createInviteLink: 'Create Invite Link',
    userInviteLinkDialogText: (username: string) => `
      Send the following link to ${username} to allow
      them to log in for the first time.
      `
});

export default adminText;
