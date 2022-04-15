/**
 * Localization strings for app resources and user management
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const adminText = createDictionary({
  removeAdmin: {
    'en-us': 'Remove Admin',
    'ru-ru': 'Забрать администратора',
    ca: 'Remove Admin',
    'es-es': 'Remove Admin',
  },
  canNotRemoveYourself: {
    'en-us': 'You cannot revoke your own admin status',
    'ru-ru': 'Вы не можете отозвать свой собственный статус администратора',
    ca: "No podeu revocar el vostre estat d'administrador",
    'es-es': 'You cannot revoke your own admin status',
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
  userPolicies: {
    'en-us': 'User policies',
    'ru-ru': 'Пользовательские политики',
    ca: 'User policies',
    'es-es': 'User policies',
  },
  allUsers: {
    'en-us': 'All Users',
    'ru-ru': 'Все пользователи',
    ca: 'All Users',
    'es-es': 'All Users',
  },
  thisUser: {
    'en-us': 'This user',
    'ru-ru': 'Этот пользователь',
    ca: 'This user',
    'es-es': 'This user',
  },
  action: {
    'en-us': 'Action',
    'ru-ru': 'Действие',
    ca: 'Action',
    'es-es': 'Action',
  },
  resource: {
    'en-us': 'Resource',
    'ru-ru': 'Ресурс',
    ca: 'Resource',
    'es-es': 'Resource',
  },
  allCollections: {
    'en-us': 'All Collections',
    'ru-ru': 'Все коллекции',
    ca: 'All Collections',
    'es-es': 'All Collections',
  },
  thisCollection: {
    'en-us': 'This collection',
    'ru-ru': 'Эта коллекция',
    ca: 'This collection',
    'es-es': 'This collection',
  },
  allActions: {
    'en-us': 'All Actions',
    'ru-ru': 'Все действия',
    ca: 'All Actions',
    'es-es': 'All Actions',
  },
  none: {
    'en-us': 'none',
    'ru-ru': 'ничто',
    ca: 'none',
    'es-es': 'none',
  },
  collectionAccess: {
    'en-us': 'Collection Access',
    'ru-ru': 'Доступ к коллекции',
    ca: 'Collection Access',
    'es-es': 'Collection Access',
  },
  createRoleDialogHeader: {
    'en-us': 'Create Role',
    'ru-ru': 'Создать роль',
    ca: 'Create Role',
    'es-es': 'Create Role',
  },
  newRole: {
    'en-us': 'New Role',
    'ru-ru': 'Новая роль',
    ca: 'New Role',
    'es-es': 'New Role',
  },
  fromLibrary: {
    'en-us': 'From library:',
    'ru-ru': 'Из библиотеки:',
    ca: 'From library:',
    'es-es': 'From library:',
  },
  fromExistingRole: {
    'en-us': 'From an existing role:',
    'ru-ru': 'Из существующей роли:',
    ca: 'From an existing role:',
    'es-es': 'From an existing role:',
  },
  fromScratch: {
    'en-us': 'From scratch',
    'ru-ru': 'С нуля',
    ca: 'From scratch',
    'es-es': 'From scratch',
  },
  createNewRoles: {
    'en-us': 'Create new roles:',
    'ru-ru': 'Будут созданы новые роли:',
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
    'ru-ru': 'Эти роли будут обновлены:',
    ca: 'Unchanged roles:',
    'es-es': 'Unchanged roles:',
  },
  superAdmin: {
    'en-us': 'Super Admin',
    'ru-ru': 'Супер администратор',
    ca: 'Super Admin',
    'es-es': 'Super Admin',
  },

  // UserInviteLinkPlugin
  createInviteLink: {
    'en-us': 'Create Invite Link',
    'ru-ru': 'Создать пригласительную ссылку',
    ca: 'Create Invite Link',
    'es-es': 'Create Invite Link',
  },
  userInviteLinkDialogHeader: {
    'en-us': 'User Invite Link',
    'ru-ru': 'Ссылка для приглашения пользователя',
    ca: 'User Invite Link',
    'es-es': 'User Invite Link',
  },
  userInviteLinkDialogMessage: {
    'en-us': (username: string) => `
      Send the following link to ${username} to allow
      them to log in for the first time.
    `,
    'ru-ru': (username: string) => `
      Отправьте эту ссылку ${username}, чтобы разрешить
      им войти в систему в первый раз.
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
    'ru-ru': 'Скопировать в буфер обмена',
    ca: 'Copy to clipboard',
    'es-es': 'Copy to clipboard',
  },
  legacyPermissions: {
    'en-us': 'Specify 6 Permissions',
    'ru-ru': 'Specify 6 Разрешения',
    ca: 'Specify 6 Permissions',
    'es-es': 'Specify 6 Permissions',
  },
  setPasswordDialogMessage: {
    'en-us': `Consider setting a password for this user. Users without a password
      won't be able to sign in`,
    'ru-ru': `Не забудьте установить пароль для этого пользователя. Пользователи
      без пароля не смогут войти`,
    ca: `Consider setting a password for this user. Users without a password
      won't be able to sign in`,
    'es-es': `Consider setting a password for this user. Users without a password
      won't be able to sign in`,
  },
  setCollections: {
    'en-us': 'Set Collections',
    'ru-ru': 'Коллекции',
    ca: 'Set Collections',
    'es-es': 'Set Collections',
  },
  // FIXME: localize
  agentInUse: {
    'en-us': 'This agent is already associated with a different user.',
    'ru-ru': 'This agent is already associated with a different user',
    ca: 'This agent is already associated with a different user',
    'es-es': 'This agent is already associated with a different user',
  },
  setAgentsDialogMessage: {
    'en-us': 'Please set the following agents before proceeding:',
    'ru-ru': 'Please set the following agents before proceeding:',
    ca: 'Please set the following agents before proceeding:',
    'es-es': 'Please set the following agents before proceeding:',
  },
  externalIdentityProviders: {
    'en-us': 'External identity providers:',
    'ru-ru': 'External identity providers:',
    ca: 'External identity providers:',
    'es-es': 'External identity providers:',
  },
});
