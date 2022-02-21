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
  passwordLengthError: {
    'en-us': 'Password must have at least six characters.',
    'ru-ru': 'Пароль должен состоять не менее чем из шести символов.',
    ca: 'Password must have at least six characters.',
    'es-es': 'Password must have at least six characters.',
  },
  passwordsDoNotMatchError: {
    'en-us': 'Passwords do not match.',
    'ru-ru': 'Пароли не соответствуют.',
    ca: 'Passwords do not match.',
    'es-es': 'Passwords do not match.',
  },
  saveUserBeforeSettingPasswordError: {
    'en-us': 'Save user before setting password.',
    'ru-ru': 'Сохраните пользователя перед установкой пароля.',
    ca: 'Save user before setting password.',
    'es-es': 'Save user before setting password.',
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
});

export default adminText;
