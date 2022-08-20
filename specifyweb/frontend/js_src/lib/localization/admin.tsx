/**
 * Localization strings for app resources and user management
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

/* eslint-disable react/jsx-no-literals */
/* eslint-disable @typescript-eslint/naming-convention */
export const adminText = createDictionary({
  removeAdmin: {
    'en-us': 'Remove Admin',
    'ru-ru': 'Забрать администратора',
  },
  canNotRemoveYourself: {
    'en-us': 'You cannot revoke your own admin status',
    'ru-ru': 'Вы не можете отозвать свой собственный статус администратора',
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
  loadFile: {
    'en-us': 'Load File',
    'ru-ru': 'Загрузить файл',
  },
  globalResources: {
    'en-us': 'Global Resources',
    'ru-ru': 'Глобальные ресурсы',
  },
  disciplineResources: {
    'en-us': 'Discipline Resources',
    'ru-ru': 'Ресурсы дисциплины',
  },
  userTypes: {
    'en-us': 'User Types',
    'ru-ru': 'Типы пользователей',
  },
  users: {
    'en-us': 'User Accounts',
    'ru-ru': 'Пользователи',
  },
  institutionUsers: {
    'en-us': 'User Accounts Defined in this Institution',
    'ru-ru': 'Пользователи',
  },
  collectionUsers: {
    'en-us': 'User Accounts Assigned to this Collection',
    'ru-ru': 'Пользователи',
  },
  selectResourceTypeDialogHeader: {
    'en-us': 'Select Resource Type',
    'ru-ru': 'Выберите тип ресурса',
  },
  setPassword: {
    'en-us': 'Set Password',
    'ru-ru': 'Поставить пароля',
  },
  passwordsDoNotMatchError: {
    'en-us': 'Passwords do not match.',
    'ru-ru': 'Пароли не соответствуют.',
  },
  // PasswordChange
  confirmPassword: {
    'en-us': 'Confirm',
    'ru-ru': 'Подтвердить',
  },
  collections: {
    'en-us': 'Collection(s)',
    'ru-ru': 'Коллекции',
  },
  notAvailableOnAdmins: {
    'en-us': 'This option is unavailable for admin users',
    'ru-ru': 'Эта опция недоступна для администраторов.',
  },
  userCollectionsPluginDialogTitle: {
    'en-us': 'Select user collection access',
    'ru-ru': 'Выберите доступ к коллекциям',
  },
  securityPanel: {
    'en-us': 'Security and Accounts',
    'ru-ru': 'Безопасность и аккаунты',
  },
  userRoleLibrary: {
    'en-us': 'Institution Library of Role Templates',
    'ru-ru': 'Библиотека ролей пользователей',
  },
  userRoles: {
    'en-us': 'User Roles',
    'ru-ru': 'Роли пользователей',
  },
  collectionUserRoles: {
    'en-us': 'Collection User Roles',
    'ru-ru': 'Роли пользователей',
  },
  assignedUserRoles: {
    'en-us': 'Assigned User Roles',
    'ru-ru': 'Назначенные роли пользователя',
  },
  table: {
    'en-us': 'Table',
    'ru-ru': 'Таблица',
  },
  rolePolicies: {
    'en-us': 'Role Permission Policies',
    'ru-ru': 'Политики',
  },
  userPolicies: {
    'en-us': 'User Permission Policies',
    'ru-ru': 'Политики',
  },
  customUserPolices: {
    'en-us':
      'Custom Collection-level Policies (applies to this collection only)',
    'ru-ru': `
      Пользовательские политики на уровне коллекции (применяется только к этой коллекции)`,
  },
  role: {
    'en-us': 'Role:',
    'ru-ru': 'Роль:',
  },
  read: {
    'en-us': 'Read',
    'ru-ru': 'Читать',
  },
  userPermissionPreview: {
    'en-us': "User's Permission Profile (read-only)",
    'ru-ru': 'Профиль разрешений пользователя (только чтение)',
  },
  outOfDateWarning: {
    'en-us':
      'Note: preview may be out of date. Save changes to update the preview',
    'ru-ru': `Примечание. Предварительный просмотр может быть устаревшим.
      Сохраните изменения, чтобы обновить предварительный просмотр`,
  },
  allUsers: {
    'en-us': 'All Users',
    'ru-ru': 'Все пользователи',
  },
  thisUser: {
    'en-us': 'This user',
    'ru-ru': 'Этот пользователь',
  },
  action: {
    'en-us': 'Action',
    'ru-ru': 'Действие',
  },
  resource: {
    'en-us': 'Resource',
    'ru-ru': 'Ресурс',
  },
  allCollections: {
    'en-us': 'All Collections',
    'ru-ru': 'Все коллекции',
  },
  thisCollection: {
    'en-us': 'This collection',
    'ru-ru': 'Эта коллекция',
  },
  allActions: {
    'en-us': 'All Actions',
    'ru-ru': 'Все действия',
  },
  none: {
    'en-us': 'none',
    'ru-ru': 'ничто',
  },
  collectionAccess: {
    'en-us': 'Enable Collection Access',
    'ru-ru': 'Доступ к коллекции',
  },
  createRoleDialogHeader: {
    'en-us': 'Create Role',
    'ru-ru': 'Создать роль',
  },
  newRole: {
    'en-us': 'New Role',
    'ru-ru': 'Новая роль',
  },
  fromLibrary: {
    'en-us': 'From library:',
    'ru-ru': 'Из библиотеки:',
  },
  fromExistingRole: {
    'en-us': 'From an existing role:',
    'ru-ru': 'Из существующей роли:',
  },
  createNewRoles: {
    'en-us': 'Create new roles:',
    'ru-ru': 'Будут созданы новые роли:',
  },
  updateExistingRoles: {
    'en-us': 'Update existing roles:',
    'ru-ru': 'Update existing roles:',
  },
  unchangedRoles: {
    'en-us': 'Unchanged roles:',
    'ru-ru': 'Эти роли будут обновлены:',
  },
  institutionAdmin: {
    'en-us': 'Institution Admin',
    'ru-ru': 'Супер администратор',
  },

  // UserInviteLinkPlugin
  createInviteLink: {
    'en-us': 'Create Invite Link',
    'ru-ru': 'Создать пригласительную ссылку',
  },
  userInviteLinkDialogHeader: {
    'en-us': 'User Invite Link',
    'ru-ru': 'Ссылка для приглашения пользователя',
  },
  userInviteLinkDialogText: {
    'en-us': (username: string) => `
      Send the following link to ${username} to allow
      them to log in for the first time.
    `,
    'ru-ru': (username: string) => `
      Отправьте эту ссылку ${username}, чтобы разрешить
      им войти в систему в первый раз.
    `,
  },
  userInviteLinkInvalidDialogText: {
    'en-us': `No external identity provider is configured.
      You can configure some in Specify 7 server settings`,
    'ru-ru': `Внешний поставщик удостоверений не настроен.
     Вы можете настроить некоторые в настройках сервера Specify 7.`,
  },
  legacyPermissions: {
    'en-us': 'Specify 6 Permissions',
    'ru-ru': 'Specify 6 Разрешения',
  },
  setPasswordDialogText: {
    'en-us': `Consider setting a password for this user. Users without a password
      won't be able to sign in`,
    'ru-ru': `Не забудьте установить пароль для этого пользователя. Пользователи
      без пароля не смогут войти`,
  },
  setCollections: {
    'en-us': 'Set Collections',
    'ru-ru': 'Коллекции',
  },
  agentInUse: {
    'en-us': 'This agent is already associated with a different user.',
    'ru-ru': 'Этот агент уже связан с другим пользователем.',
  },
  setAgentsDialogText: {
    'en-us': 'Please set the following agents before proceeding:',
    'ru-ru': 'Прежде чем продолжить, установите следующие агенты:',
  },
  externalIdentityProviders: {
    'en-us': 'External identity providers:',
    'ru-ru': 'Внешние аутентификаторы:',
  },
  allTables: {
    'en-us': 'All tables',
    'ru-ru': 'Все таблицы',
  },
  loadingAdmins: {
    'en-us': 'Loading admins...',
    'ru-ru': 'Загрузка администраторов...',
  },
  specifyAdmin: {
    'en-us': '(Specify 7 Admin)',
    'ru-ru': '(Specify 7 Администратор)',
  },
  legacyAdmin: {
    'en-us': '(Specify 6 Admin)',
    'ru-ru': '(Specify 6 Администратор)',
  },
  deleteRoleDialogHeader: {
    'en-us': 'Delete role that has users?',
    'ru-ru': 'Удалить роль, в которой есть пользователи?',
  },
  deleteRoleDialogText: {
    'en-us': 'Users will not be deleted, but they would lose this role.',
    'ru-ru': 'Пользователи не будут удалены, но потеряют эту роль.',
  },
  institutionPolicies: {
    'en-us':
      'Custom Institution-level Policies (applies to all assigned collections)',
    'ru-ru': `
      Пользовательские политики на уровне учреждения (применяются ко всем назначенным коллекциям)`,
  },
  noAdminsErrorDialogHeader: {
    'en-us': "Can't remove Institution Admin status",
    'ru-ru': 'Не могу удалить статус суперадминистратора',
  },
  noAdminsErrorDialogText: {
    'en-us': 'There must be at least one Institution Admin in institution',
    'ru-ru': 'Должен быть хотя бы один суперадмин',
  },
  switchToHorizontalLayout: {
    'en-us': 'Switch to horizontal layout',
    'ru-ru': 'Переключиться на горизонтальную раскладку',
  },
  switchToVerticalLayout: {
    'en-us': 'Switch to vertical layout',
    'ru-ru': 'Переключиться на вертикальную компоновку',
  },
  advancedTables: {
    'en-us': 'Advanced tables',
    'ru-ru': 'Дополнительные таблицы',
  },
  excludedInstitutionalPolicies: {
    'en-us': 'Excluded institutional policies:',
    'ru-ru': 'Исключенные институциональные политики:',
  },
  excludedInstitutionalPoliciesDescription: {
    'en-us': `(Some policies that apply only at the institution-level are not
      present here at the collection-level.)`,
    'ru-ru': `Некоторые политики применяются только на институциональном уровне,
      поэтому они удалены из этих списков.`,
  },
  accountSetupOptions: {
    'en-us': 'Account Setup Options',
    'ru-ru': 'Параметры учетной записи',
  },
  resources: {
    'en-us': 'Resources',
    'ru-ru': 'Ресурсы',
  },
  subCategories: {
    'en-us': 'Sub-categories',
    'ru-ru': 'Подкатегории',
  },
  addResource: {
    'en-us': 'Add Resource',
    'ru-ru': 'Добавить ресурс',
  },
  appResource: {
    'en-us': 'App Resource',
    'ru-ru': 'Ресурс приложения',
  },
  formDefinitions: {
    'en-us': 'Form Definitions',
    'ru-ru': 'Макеты форм',
  },
  selectResourceType: {
    'en-us': 'Select Resource Type',
    'ru-ru': 'Выберите тип ресурса',
  },
  label: {
    'en-us': 'Label',
    'ru-ru': 'Этикетка',
  },
  report: {
    'en-us': 'Report',
    'ru-ru': 'Отчет',
  },
  userPreferences: {
    'en-us': 'User Preferences',
    'ru-ru': 'Пользовательские настройки',
  },
  defaultUserPreferences: {
    'en-us': 'Default User Preferences',
    'ru-ru': 'Пользовательские настройки по умолчанию',
  },
  rssExportFeed: {
    'en-us': 'RSS Export Feed',
    'ru-ru': 'RSS-канал экспорта',
  },
  expressSearchConfig: {
    'en-us': 'Express Search Config',
    'ru-ru': 'Конфигурация быстрого поиска',
  },
  webLinks: {
    'en-us': 'Web Links',
    'ru-ru': 'Веб-ссылки',
  },
  uiFormatters: {
    'en-us': 'Field formatters',
    'ru-ru': 'Форматировщики полей',
  },
  dataObjectFormatters: {
    'en-us': 'Record Formatters',
    'ru-ru': 'Форматировщики записей',
  },
  searchDialogDefinitions: {
    'en-us': 'Search Dialog Definitions',
    'ru-ru': 'Макеты диалогового окна поиска',
  },
  dataEntryTables: {
    'en-us': 'Data Entry Tables',
    'ru-ru': 'Таблицы ввода данных',
  },
  interactionsTables: {
    'en-us': 'Interactions Tables',
    'ru-ru': 'Таблицы взаимодействий',
  },
  otherXmlResource: {
    'en-us': 'Other XML Resource',
    'ru-ru': 'Другой XML-ресурс',
  },
  otherJsonResource: {
    'en-us': 'Other JSON Resource',
    'ru-ru': 'Другой JSON-ресурс',
  },
  otherPropertiesResource: {
    'en-us': 'Other Properties Resource',
    'ru-ru': 'Другой Properties-ресурс',
  },
  otherAppResource: {
    'en-us': 'Other app resource',
    'ru-ru': 'Другой ресурс',
  },
  filters: {
    'en-us': 'Filters',
    'ru-ru': 'Фильтры',
  },
  leafletLayers: {
    'en-us': 'Leaflet Layers',
    'ru-ru': 'Слои Leaflet',
  },
  textEditor: {
    'en-us': 'Text Editor',
    'ru-ru': 'Текстовый редактор',
  },
  visualEditor: {
    'en-us': 'Visual Editor',
    'ru-ru': 'Визуальный редактор',
  },
});
/* eslint-enable react/jsx-no-literals */
/* eslint-enable @typescript-eslint/naming-convention */
