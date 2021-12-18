/**
 * Localization strings for app resources and user management
 *
 * @module
 */

import { createDictionary, createHeader } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const adminText = createDictionary({
  removeAdmin: {
    'en-us': 'Remove Admin',
    'ru-ru': 'Забрать администратора',
    ca: 'Remove Admin',
  },
  canNotRemoveYourself: {
    'en-us': 'You can not revoke your own admin status',
    'ru-ru': 'Вы не можете отозвать свой собственный статус администратора',
    ca: 'No podeu revocar el vostre estat d\'administrador',
  },
  makeAdmin: {
    'en-us': 'Make Admin',
    'ru-ru': 'Сделать администратором',
    ca: 'Make Admin',
  },
  saveUserFirst: {
    'en-us': 'Save user first',
    'ru-ru': 'Сначала нужко сохранить пользователя',
    ca: 'Save user first',
  },
  mustBeManager: {
    'en-us': 'User must be saved as Manager first',
    'ru-ru': 'Сначала пользователь должен быть сохранен как менеджер',
    ca: 'User must be saved as Manager first',
  },
  mimetype: {
    'en-us': 'Mimetype:',
    'ru-ru': 'Mimetype:',
    ca: 'Mimetype:',
  },
  loadFile: {
    'en-us': 'Load File',
    'ru-ru': 'Загрузить файл',
    ca: 'Load File',
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
  },
  resourceLoadDialogTitle: {
    'en-us': 'Load file',
    'ru-ru': 'Загрузить файл',
    ca: 'Load file',
  },
  resourceLoadDialogHeader: {
    'en-us': createHeader('Load resource file'),
    'ru-ru': createHeader('Загрузить файл ресурсов'),
    ca: createHeader('Load resource file'),
  },
  resourceLoadDialogMessage: {
    'en-us': 'Select the file to be loaded into the editor.',
    'ru-ru': 'Выберите файл для загрузки в редактор.',
    ca: 'Select the file to be loaded into the editor.',
  },
  globalResourcesTitle: {
    'en-us': (resourceCount: string) =>
      `Global <small>(${resourceCount})</small>`,
    'ru-ru': (resourceCount: string) =>
      `Глобальный <small>(${resourceCount})</small>`,
    ca: (resourceCount: string) => `Global <small>(${resourceCount})</small>`,
  },
  disciplineResourcesTitle: {
    'en-us': (resourceCount: string) =>
      `Discipline <small>(${resourceCount})</small>`,
    'ru-ru': (resourceCount: string) =>
      `Дисциплина <small>(${resourceCount})</small>`,
    ca: (resourceCount: string) =>
      `Discipline <small>(${resourceCount})</small>`,
  },
  userTypes: {
    'en-us': 'User Types',
    'ru-ru': 'Типы пользователей',
    ca: 'User Types',
  },
  users: {
    'en-us': 'Users',
    'ru-ru': 'Пользователи',
    ca: 'Users',
  },
  createResourceDialogTitle: {
    'en-us': 'Create Resource',
    'ru-ru': 'Создать ресурс',
    ca: 'Create Resource',
  },
  createResourceDialogHeader: {
    'en-us': createHeader('Create New Resource File'),
    'ru-ru': createHeader('Создать новый файл ресурсов'),
    ca: createHeader('Create New Resource File'),
  },
  newResourceName: {
    'en-us': 'New Resource Name:',
    'ru-ru': 'Имя нового ресурса:',
    ca: 'New Resource Name:',
  },
  setPassword: {
    'en-us': 'Set Password',
    'ru-ru': 'Поставить пароля',
    ca: 'Set Password',
  },
  passwordLengthError: {
    'en-us': 'Password must have at least six characters.',
    'ru-ru': 'Пароль должен состоять не менее чем из шести символов.',
    ca: 'Password must have at least six characters.',
  },
  passwordsDoNotMatchError: {
    'en-us': 'Passwords do not match.',
    'ru-ru': 'Пароли не соответствуют.',
    ca: 'Passwords do not match.',
  },
  saveUserBeforeSettingPasswordError: {
    'en-us': 'Save user before setting password.',
    'ru-ru': 'Сохраните пользователя перед установкой пароля.',
    ca: 'Save user before setting password.',
  },
  // PasswordChange
  password: {
    'en-us': 'Password',
    'ru-ru': 'Пароль',
    ca: 'Password',
  },
  confirmPassword: {
    'en-us': 'Confirm',
    'ru-ru': 'Подтвердить',
    ca: 'Confirm',
  },
  // UserCollectionsPlugin
  collections: {
    'en-us': 'Collections',
    'ru-ru': 'Коллекции',
    ca: 'Collections',
  },
  notAvailableOnAdmins: {
    'en-us': 'This option is unavailable for admin users',
    'ru-ru': 'Эта опция недоступна для администраторов.',
    ca: 'Aquesta opció no està disponible per als usuaris administradors',
  },
  userCollectionsPluginDialogTitle: {
    'en-us': 'Select user collection access',
    'ru-ru': 'Выберите доступ к коллекциям',
    ca: 'Select user collection access',
  },
});

export default adminText;
