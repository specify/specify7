/**
 * Localization strings for app resources and user management
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const adminText = createDictionary({
  removeAdmin: {
    'en-us': 'Remove Admin',
    'ru-ru': 'Забрать администратора',
    ca: 'Remove Admin',
    'es-es': 'Remove Admin',
  },
  canNotRemoveYourself: {
    'en-us': 'You can not revoke your own admin status',
    'ru-ru': 'Вы не можете отозвать свой собственный статус администратора',
    ca: "No podeu revocar el vostre estat d'administrador",
    'es-es': 'You can not revoke your own admin status',
  },
  makeAdmin: {
    'en-us': 'Make Admin',
    'ru-ru': 'Сделать администратором',
    ca: 'Make Admin',
    'es-es': 'Make Admin',
  },
  saveUserFirst: {
    'en-us': 'Save user first',
    'ru-ru': 'Сначала нужко сохранить пользователя',
    ca: 'Save user first',
    'es-es': 'Save user first',
  },
  mustBeManager: {
    'en-us': 'User must be saved as Manager first',
    'ru-ru': 'Сначала пользователь должен быть сохранен как менеджер',
    ca: 'User must be saved as Manager first',
    'es-es': 'User must be saved as Manager first',
  },
  mimetype: {
    'en-us': 'Mimetype:',
    'ru-ru': 'Mimetype:',
    ca: 'Mimetype:',
    'es-es': 'Mimetype:',
  },
  loadFile: {
    'en-us': 'Load File',
    'ru-ru': 'Загрузить файл',
    ca: 'Load File',
    'es-es': 'Load File',
  },
  corruptResourceOrConflict: {
    'en-us': `
      This app resource appears to be corrupt but may be in the process of
      being saved by another session. It can be deleted if that is not the
      case.`,
    'ru-ru': `
      Ресурс поврежден о может быть в процессес охраняется другим сеансом.
      Его можно удалить, если это не кейс.`,
    ca: `
      This app resource appears to be corrupt but may be in the process of
      being saved by another session. It can be deleted if that is not the
      case.`,
    'es-es': `
      This app resource appears to be corrupt but may be in the process of
      being saved by another session. It can be deleted if that is not the
      case.`,
  },
  resourceLoadDialogTitle: {
    'en-us': 'Load file',
    'ru-ru': 'Загрузить файл',
    ca: 'Load file',
    'es-es': 'Load file',
  },
  resourceLoadDialogHeader: {
    'en-us': 'Load resource file',
    'ru-ru': 'Загрузить файл ресурсов',
    ca: 'Load resource file',
    'es-es': 'Load resource file',
  },
  resourceLoadDialogMessage: {
    'en-us': 'Select the file to be loaded into the editor.',
    'ru-ru': 'Выберите файл для загрузки в редактор.',
    ca: 'Select the file to be loaded into the editor.',
    'es-es': 'Select the file to be loaded into the editor.',
  },
  globalResourcesTitle: {
    'en-us': (resourceCount: string) =>
      `Global <small>(${resourceCount})</small>`,
    'ru-ru': (resourceCount: string) =>
      `Глобальный <small>(${resourceCount})</small>`,
    ca: (resourceCount: string) => `Global <small>(${resourceCount})</small>`,
    'es-es': (resourceCount: string) =>
      `Global <small>(${resourceCount})</small>`,
  },
  disciplineResourcesTitle: {
    'en-us': (resourceCount: string) =>
      `Discipline <small>(${resourceCount})</small>`,
    'ru-ru': (resourceCount: string) =>
      `Дисциплина <small>(${resourceCount})</small>`,
    ca: (resourceCount: string) =>
      `Discipline <small>(${resourceCount})</small>`,
    'es-es': (resourceCount: string) =>
      `Discipline <small>(${resourceCount})</small>`,
  },
  userTypes: {
    'en-us': 'User Types',
    'ru-ru': 'Типы пользователей',
    ca: 'User Types',
    'es-es': 'User Types',
  },
  users: {
    'en-us': 'Users',
    'ru-ru': 'Пользователи',
    ca: 'Users',
    'es-es': 'Users',
  },
  createResourceDialogTitle: {
    'en-us': 'Create Resource',
    'ru-ru': 'Создать ресурс',
    ca: 'Create Resource',
    'es-es': 'Create Resource',
  },
  createResourceDialogHeader: {
    'en-us': 'Create New Resource File',
    'ru-ru': 'Создать новый файл ресурсов',
    ca: 'Create New Resource File',
    'es-es': 'Create New Resource File',
  },
  newResourceName: {
    'en-us': 'New Resource Name:',
    'ru-ru': 'Имя нового ресурса:',
    ca: 'New Resource Name:',
    'es-es': 'New Resource Name:',
  },
  setPassword: {
    'en-us': 'Set Password',
    'ru-ru': 'Поставить пароля',
    ca: 'Set Password',
    'es-es': 'Set Password',
  },
  passwordsDoNotMatchError: {
    'en-us': 'Passwords do not match.',
    'ru-ru': 'Пароли не соответствуют.',
    ca: 'Passwords do not match.',
    'es-es': 'Passwords do not match.',
  },
  // PasswordChange
  password: {
    'en-us': 'Password',
    'ru-ru': 'Пароль',
    ca: 'Password',
    'es-es': 'Password',
  },
  confirmPassword: {
    'en-us': 'Confirm',
    'ru-ru': 'Подтвердить',
    ca: 'Confirm',
    'es-es': 'Confirm',
  },
  // UserCollectionsPlugin
  collections: {
    'en-us': 'Collections',
    'ru-ru': 'Коллекции',
    ca: 'Collections',
    'es-es': 'Collections',
  },
  notAvailableOnAdmins: {
    'en-us': 'This option is unavailable for admin users',
    'ru-ru': 'Эта опция недоступна для администраторов.',
    ca: 'Aquesta opció no està disponible per als usuaris administradors',
    'es-es': 'This option is unavailable for admin users',
  },
  userCollectionsPluginDialogTitle: {
    'en-us': 'Select user collection access',
    'ru-ru': 'Выберите доступ к коллекциям',
    ca: 'Select user collection access',
    'es-es': 'Select user collection access',
  },
  securityPanel: {
    'en-us': 'Security Panel',
    'ru-ru': 'Защита',
    ca: 'Security Panel',
    'es-es': 'Security Panel',
  },
  institution: {
    'en-us': 'Institution:',
    'ru-ru': 'Institution:',
    ca: 'Institution:',
    'es-es': 'Institution:',
  },
  userRoleLibrary: {
    'en-us': 'User role library:',
    'ru-ru': 'Библиотека ролей пользователей:',
    ca: 'User role library:',
    'es-es': 'User role library:',
  },
  userRoles: {
    'en-us': 'User roles',
    'ru-ru': 'Роли пользователей',
    ca: 'User roles',
    'es-es': 'User roles',
  },
  table: {
    'en-us': 'Table',
    'ru-ru': 'Таблица',
    ca: 'Table',
    'es-es': 'Table',
  },
  policies: {
    'en-us': 'Policies',
    'ru-ru': 'Политики',
    ca: 'Policies',
    'es-es': 'Policies',
  },
  role: {
    'en-us': 'Role:',
    'ru-ru': 'Роль:',
    ca: 'Role:',
    'es-es': 'Role:',
  },
  user: {
    'en-us': 'User:',
    'ru-ru': 'Пользователь:',
    ca: 'User:',
    'es-es': 'User:',
  },
  read: {
    'en-us': 'Read',
    'ru-ru': 'Читать',
    ca: 'Read',
    'es-es': 'Read',
  },
  preview: {
    'en-us': 'Preview',
    'ru-ru': 'Предварительный просмотр',
    ca: 'Preview',
    'es-es': 'Preview',
  },
  outOfDateWarning: {
    'en-us': 'Note: preview may be out of date.',
    'ru-ru': 'Примечание. Предварительный просмотр может быть устаревшим.',
    ca: 'Note: preview may be out of date.',
    'es-es': 'Note: preview may be out of date.',
  },
  // FIXME: localize
  userPolicies: {
    'en-us': 'User policies',
    'ru-ru': 'User policies',
    ca: 'User policies',
    'es-es': 'User policies',
  },
  institutionUserPolicies: {
    'en-us': 'Institution-wide User policies:',
    'ru-ru': 'Institution-wide User policies:',
    ca: 'Institution-wide User policies:',
    'es-es': 'Institution-wide User policies:',
  },
  allUsers: {
    'en-us': 'All Users',
    'ru-ru': 'All Users',
    ca: 'All Users',
    'es-es': 'All Users',
  },
  thisUser: {
    'en-us': 'This user',
    'ru-ru': 'This user',
    ca: 'This user',
    'es-es': 'This user',
  },
  action: {
    'en-us': 'Action',
    'ru-ru': 'Action',
    ca: 'Action',
    'es-es': 'Action',
  },
  resource: {
    'en-us': 'Resource',
    'ru-ru': 'Resource',
    ca: 'Resource',
    'es-es': 'Resource',
  },
  allCollections: {
    'en-us': 'All Collectins',
    'ru-ru': 'All Collectins',
    ca: 'All Collectins',
    'es-es': 'All Collectins',
  },
  thisCollection: {
    'en-us': 'This collection',
    'ru-ru': 'This collection',
    ca: 'This collection',
    'es-es': 'This collection',
  },
  allResources: {
    'en-us': 'All Resources',
    'ru-ru': 'All Resources',
    ca: 'All Resources',
    'es-es': 'All Resources',
  },
  allActions: {
    'en-us': 'All Actions',
    'ru-ru': 'All Actions',
    ca: 'All Actions',
    'es-es': 'All Actions',
  },
  none: {
    'en-us': 'none',
    'ru-ru': 'none',
    ca: 'none',
    'es-es': 'none',
  },
  collectionAccess: {
    'en-us': 'Collection Access',
    'ru-ru': 'Collection Access',
    ca: 'Collection Access',
    'es-es': 'Collection Access',
  },
  createRoleDialogHeader: {
    'en-us': 'Create Role',
    'ru-ru': 'Create Role',
    ca: 'Create Role',
    'es-es': 'Create Role',
  },
  newRole: {
    'en-us': 'New Role',
    'ru-ru': 'New Role',
    ca: 'New Role',
    'es-es': 'New Role',
  },
  fromLibrary: {
    'en-us': 'From library:',
    'ru-ru': 'From library:',
    ca: 'From library:',
    'es-es': 'From library:',
  },
  fromExistingRole: {
    'en-us': 'From an existing role:',
    'ru-ru': 'From an existing role:',
    ca: 'From an existing role:',
    'es-es': 'From an existing role:',
  },
  fromScratch: {
    'en-us': 'From scratch',
    'ru-ru': 'From scratch',
    ca: 'From scratch',
    'es-es': 'From scratch',
  },
  createNewRoles: {
    'en-us': 'Create new roles:',
    'ru-ru': 'Create new roles:',
    ca: 'Create new roles:',
    'es-es': 'Create new roles:',
  },
  updateExistingRoles: {
    'en-us': 'Update existing roles:',
    'ru-ru': 'Update existing roles:',
    ca: 'Update existing roles:',
    'es-es': 'Update existing roles:',
  },
  unchangedRoles: {
    'en-us': 'Unchanged roles:',
    'ru-ru': 'Unchanged roles:',
    ca: 'Unchanged roles:',
    'es-es': 'Unchanged roles:',
  },
  superAdmin: {
    'en-us': 'Super Admin',
    'ru-ru': 'Super Admin',
    ca: 'Super Admin',
    'es-es': 'Super Admin',
  },

  // FIXME: localize
  // UserInviteLinkPlugin
  createInviteLink: {
    'en-us': 'Create Invite Link',
    'ru-ru': 'Create Invite Link',
    ca: 'Create Invite Link',
    'es-es': 'Create Invite Link',
  },
  userInviteLinkDialogHeader: {
    'en-us': 'User Invite Link',
    'ru-ru': 'User Invite Link',
    ca: 'User Invite Link',
    'es-es': 'User Invite Link',
  },
  userInviteLinkDialogMessage: {
    'en-us': (username: string) => `
      Send the following link to ${username} to allow
      them to log in for the first time.
    `,
    'ru-ru': (username: string) => `
      Send the following link to ${username} to allow
      them to log in for the first time.
    `,
    ca: (username: string) => `
      Send the following link to ${username} to allow
      them to log in for the first time.
    `,
    'es-es': (username: string) => `
      Send the following link to ${username} to allow
      them to log in for the first time.
    `,
  },
  copyToClipboard: {
    'en-us': 'Copy to clipboard',
    'ru-ru': 'Copy to clipboard',
    ca: 'Copy to clipboard',
    'es-es': 'Copy to clipboard',
  },
  legacyPermissions: {
    'en-us': 'Specify 6 Permissions',
    'ru-ru': 'Specify 6 Permissions',
    ca: 'Specify 6 Permissions',
    'es-es': 'Specify 6 Permissions',
  },
  setPasswordDialogMessage: {
    'en-us': `Consider setting a password for this user. Users without a password
      won't be able to sign in`,
    'ru-ru': `Consider setting a password for this user. Users without a password
      won't be able to sign in`,
    ca: `Consider setting a password for this user. Users without a password
      won't be able to sign in`,
    'es-es': `Consider setting a password for this user. Users without a password
      won't be able to sign in`,
  },
});

export default adminText;
