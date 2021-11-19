import { createDictionary, createHeader } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const adminText = createDictionary({
  removeAdmin: {
    'en-us': 'Remove Admin',
    'ru-ru': 'Забрать администратора',
  },
  canNotRemoveYourself: {
    'en-us': 'You can not revoke your own admin status',
  },
  makeAdmin: {
    'en-us': 'Make Admin',
    'ru-ru': 'Сделать администратором',
  },
  saveUserFirst: {
    'en-us': 'Save user first',
    'ru-ru': 'Сначала нужко сохранить пользователя',
  },
  mustBeManager: {
    'en-us': 'User must be saved as Manager first',
    'ru-ru': 'Сначала пользователь должен быть сохранен как менеджер',
  },
  mimetype: {
    'en-us': 'Mimetype:',
    'ru-ru': 'Mimetype:',
  },
  loadFile: {
    'en-us': 'Load File',
    'ru-ru': 'Загрузить файл',
  },
  corruptResourceOrConflict: {
    'en-us': `
      This app resource appears to be corrupt but may be in the process of
      being saved by another session. It can be deleted if that is not the
      case.`,
    'ru-ru': `
      Ресурс поврежден о может быть в процессес охраняется другим сеансом.
      Его можно удалить, если это не кейс.`,
  },
  resourceLoadDialogTitle: {
    'en-us': 'Load file',
    'ru-ru': 'Загрузить файл',
  },
  resourceLoadDialogHeader: {
    'en-us': createHeader('Load resource file'),
    'ru-ru': createHeader('Загрузить файл ресурсов'),
  },
  resourceLoadDialogMessage: {
    'en-us': 'Select the file to be loaded into the editor.',
    'ru-ru': 'Выберите файл для загрузки в редактор.',
  },
  globalResourcesTitle: {
    'en-us': (resourceCount: string) =>
      `Global <small>(${resourceCount})</small>`,
    'ru-ru': (resourceCount: string) =>
      `Глобальный <small>(${resourceCount})</small>`,
  },
  disciplineResourcesTitle: {
    'en-us': (resourceCount: string) =>
      `Discipline <small>(${resourceCount})</small>`,
    'ru-ru': (resourceCount: string) =>
      `Дисциплина <small>(${resourceCount})</small>`,
  },
  userTypes: {
    'en-us': 'User Types',
    'ru-ru': 'Типы пользователей',
  },
  users: {
    'en-us': 'Users',
    'ru-ru': 'Пользователи',
  },
  createResourceDialogTitle: {
    'en-us': 'Create Resource',
    'ru-ru': 'Создать ресурс',
  },
  createResourceDialogHeader: {
    'en-us': createHeader('Create New Resource File'),
    'ru-ru': createHeader('Создать новый файл ресурсов'),
  },
  newResourceName: {
    'en-us': 'New Resource Name:',
    'ru-ru': 'Имя нового ресурса:',
  },
  setPassword: {
    'en-us': 'Set Password',
    'ru-ru': 'Поставить пароля',
  },
  passwordLengthError: {
    'en-us': 'Password must have at least six characters.',
    'ru-ru': 'Пароль должен состоять не менее чем из шести символов.',
  },
  passwordsDoNotMatchError: {
    'en-us': 'Passwords do not match.',
    'ru-ru': 'Пароли не соответствуют.',
  },
  saveUserBeforeSettingPasswordError: {
    'en-us': 'Save user before setting password.',
    'ru-ru': 'Сохраните пользователя перед установкой пароля.',
  },
  // PasswordChange
  password: {
    'en-us': 'Password',
    'ru-ru': 'Пароль',
  },
  confirmPassword: {
    'en-us': 'Confirm',
    'ru-ru': 'Подтвердить',
  },
  // UserCollectionsPlugin
  collections: {
    'en-us': 'Collections',
    'ru-ru': 'Коллекции',
  },
  notAvailableOnAdmins: {
    'en-us': 'This option is unavailable for admin users',
  },
  userCollectionsPluginDialogTitle: {
    'en-us': 'Select user collection access',
    'ru-ru': 'Выберите доступ к коллекциям',
  },
});

export default adminText;
