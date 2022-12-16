/**
 * Localization strings used in security panel, permissions and login screen
 *
 * @module
 */

import React from 'react';

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

/* eslint-disable react/jsx-no-literals */
/* eslint-disable @typescript-eslint/naming-convention */
export const userText = createDictionary({
  collectionAccessDenied: {
    'en-us': 'You do not have access to this collection',
    'ru-ru': 'У вас нет доступа к этой коллекции',
  },
  collectionAccessDeniedDescription: {
    'en-us': (collectionName: string) =>
      `The currently logged in account does not have access to the
       ${collectionName} collection.`,
    'ru-ru': (collectionName: string) =>
      `Учетная запись, вошедшая в систему в данный момент, не имеет доступа к
       коллекции ${collectionName}.`,
  },
  changePassword: {
    'en-us': 'Change Password',
    'ru-ru': 'Изменить пароль',
  },
  oldPassword: {
    'en-us': 'Old password',
    'ru-ru': 'Предыдущий пароль',
  },
  newPassword: {
    'en-us': 'New password',
    'ru-ru': 'iНовый пароль',
  },
  repeatPassword: {
    'en-us': 'Repeat new password',
    'ru-ru': 'Повторите новый пароль',
  },
  logOut: {
    'en-us': 'Log Out',
    'ru-ru': 'Выйти',
  },
  noAgent: {
    'en-us': 'Current user does not have an agent assigned',
    'ru-ru': 'Текущему пользователю не назначен агент',
  },
  noAgentDescription: {
    'en-us': 'Please log in as admin and assign an agent to this user',
    'ru-ru':
      'Пожалуйста, войдите как администратор и назначьте агента этому пользователю',
  },
  helloMessage: {
    'en-us': (userName: string) => `Hello, ${userName}!`,
    'ru-ru': (userName: string) => `Привет, ${userName}!`,
  },
  oicWelcomeMessage: {
    'en-us': `
      You've been invited to associate an external login to
      your Specify user account. This will enable you to log in to Specify with
      your chosen provider going forward.
    `,
    'ru-ru': `
      Вам было предложено связать внешний логин с вашей учетной записью
      пользователя Specify. Это позволит вам войти в Specify с выбранным вами
      провайдером в будущем.
    `,
  },
  legacyLogin: {
    'en-us': 'Sign in with Specify Account',
    'ru-ru': 'Войти с помощью Профиля Specify',
  },
  unknownOicUser: {
    'en-us': (providerName: string) => `There is currently no Specify user
      associated with your ${providerName} account. If you have a Specify user
      name and password, you can enter them below to associate that user with
      your ${providerName} account for future logins.
    `,
    'ru-ru': (providerName: string) => `В настоящее время нет пользователя
      Specify, связанного с вашей учетной записью ${providerName}. Если у вас
      есть Specify имя пользователя и пароль, вы можете ввести их ниже, чтобы
      связать этого пользователя с вашей учетной записью ${providerName} для
      будущих входов в систему.
    `,
  },
  generateMasterKey: {
    'en-us': 'Generate Master Key',
    'ru-ru': 'Сгенерировать мастер-ключ',
  },
  userPassword: {
    'en-us': 'User Password:',
    'ru-ru': 'Пользовательский пароль:',
  },
  masterKeyDialogHeader: {
    'en-us': 'Master key generated',
    'ru-ru': 'Мастер-ключ создан',
  },
  masterKeyFieldLabel: {
    'en-us': 'Master Key:',
    'ru-ru': 'Мастер ключ:',
  },
  incorrectPassword: {
    'en-us': 'Password was incorrect.',
    'ru-ru': 'Пароль неверный.',
  },
  noAccessToResource: {
    'en-us': `
      You do not have access to any collection containing this resource
      through the currently logged in account`,
    'ru-ru': `
      У вас нет доступа ни к одной коллекции, содержащей этот ресурс
      через текущую учетную запись`,
  },
  resourceInaccessible: {
    'en-us': `
      The requested resource cannot be accessed while logged into the
      current collection.`,
    'ru-ru': `
      Запрошенный ресурс недоступен в текущей коллекция.`,
  },
  selectCollection: {
    'en-us': 'Select one of the following collections:',
    'ru-ru': 'Выберите одну из следующих коллекций:',
  },
  loginToProceed: {
    'en-us': 'You can login to the collection, to proceed:',
    'ru-ru': 'Вы можете войти в коллекцию, чтобы продолжить:',
  },
  sessionTimeOutDialogHeader: {
    'en-us': 'Insufficient Privileges',
    'ru-ru': 'Insufficient Privileges',
  },
  sessionTimeOutDialogText: {
    'en-us': `
      You lack sufficient privileges for that action, or your current
      session has been logged out.`,
    'ru-ru': `
      У вас недостаточно прав для этого действия, или текещий сеанс был
      отключен.`,
  },
  /*
   * Used in field formatter if user doesn't have read access to the related
   * table
   */
  noPermission: {
    'en-us': 'NO PERMISSION',
    'ru-ru': 'ОТСУТСТВУЕТ РАЗРЕШЕНИЕ',
  },
  permissionDeniedError: {
    'en-us': 'Permission denied error',
    'ru-ru': 'В доступе отказано',
  },
  permissionDeniedDialogText: {
    'en-us': `You don't have any policy or role that gives you permission to do
      the following action:`,
    'ru-ru': `У вас нет политики или роли, которая дает вам разрешение на
      выполнение следующих действий:`,
  },
  permissionDeniedDialogSecondText: {
    'en-us': (url: JSX.Element) => <>Permission denied when accessing {url}</>,
    'ru-ru': (url: JSX.Element) => (
      <>Разрешение не было дано при доступе к {url}</>
    ),
  },
  noAccessToCollections: {
    'en-us': `
      The logged in user has not been given access to any collections in this
      database. You must login as another user.
    `,
    'ru-ru': `
      Пользователь, вошедший в систему, не получил доступа ни к каким
      коллекциям в этой базе данных. Вы должны войти в систему как другой
      пользователь.
    `,
  },
  userAccount: {
    'en-us': 'User Account',
    'ru-ru': 'Учетная запись',
  },
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
  configureCollectionAccess: {
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
  collectionAccess: {
    'en-us': 'Enable Collection Access',
    'ru-ru': 'Доступ к коллекции',
  },
  createRole: {
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
  userInviteLink: {
    'en-us': 'User Invite Link',
    'ru-ru': 'Ссылка для приглашения пользователя',
  },
  userInviteLinkDescription: {
    'en-us': (username: string) => `
      Send the following link to ${username} to allow
      them to log in for the first time.
    `,
    'ru-ru': (username: string) => `
      Отправьте эту ссылку ${username}, чтобы разрешить
      им войти в систему в первый раз.
    `,
  },
  noProvidersForUserInviteLink: {
    'en-us': `No external identity provider is configured.
      You can configure some in Specify 7 server settings`,
    'ru-ru': `Внешний поставщик удостоверений не настроен.
     Вы можете настроить некоторые в настройках сервера Specify 7.`,
  },
  legacyPermissions: {
    'en-us': 'Specify 6 Permissions',
    'ru-ru': 'Specify 6 Разрешения',
  },
  setPasswordBeforeSavePrompt: {
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
  deleteRoleWithUsers: {
    'en-us': 'Delete role that has users?',
    'ru-ru': 'Удалить роль, в которой есть пользователи?',
  },
  deleteRoleWithUsersDescription: {
    'en-us': 'Users will not be deleted, but they would lose this role.',
    'ru-ru': 'Пользователи не будут удалены, но потеряют эту роль.',
  },
  institutionPolicies: {
    'en-us':
      'Custom Institution-level Policies (applies to all assigned collections)',
    'ru-ru': `
      Пользовательские политики на уровне учреждения (применяются ко всем назначенным коллекциям)`,
  },
  cantRemoveLastAdmin: {
    'en-us': "Can't remove Institution Admin status",
    'ru-ru': 'Не могу удалить статус суперадминистратора',
  },
  cantRemoveLastAdminDescription: {
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
} as const);
/* eslint-enable react/jsx-no-literals */
/* eslint-enable @typescript-eslint/naming-convention */
