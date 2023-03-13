/**
 * Localization strings used in security panel, permissions and login screen
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const userText = createDictionary({
  logIn: {
    'en-us': 'Log In',
    'ru-ru': 'Авторизоваться',
    'es-es': 'Iniciar sesión',
    'fr-fr': 'Connexion',
    'uk-ua': 'Увійти',
  },
  username: {
    'en-us': 'Username',
    'ru-ru': 'Имя пользователя',
    'es-es': 'Nombre de usuario',
    'fr-fr': "Nom d'utilisateur",
    'uk-ua': "Ім'я користувача",
  },
  password: {
    'en-us': 'Password',
    'ru-ru': 'Пароль',
    'es-es': 'Contraseña',
    'fr-fr': 'Mot de passe',
    'uk-ua': 'Пароль',
  },
  collectionAccessDenied: {
    'en-us': 'You do not have access to this collection',
    'ru-ru': 'У вас нет доступа к этой коллекции',
    'es-es': 'No tienes acceso a esta colección.',
    'fr-fr': "Vous n'avez pas accès à cette collection",
    'uk-ua': 'Ви не маєте доступу до цієї колекції',
  },
  collectionAccessDeniedDescription: {
    'en-us': `
      The currently logged in account does not have access to the
      {collectionName:string} collection.
    `,
    'ru-ru': `
      Текущая учетная запись, вошедшая в систему, не имеет доступа к коллекции
      {collectionName:string}.
    `,
    'es-es': `
      La cuenta actualmente iniciada no tiene acceso a la colección
      {collectionName:string}.
    `,
    'fr-fr': `
      Le compte actuellement connecté n'a pas accès à la collection
      {collectionName:string}.
    `,
    'uk-ua': `
      Обліковий запис, який зараз увійшов, не має доступу до колекції
      {collectionName:string}.
    `,
  },
  changePassword: {
    'en-us': 'Change Password',
    'ru-ru': 'Изменить пароль',
    'es-es': 'Cambia la contraseña',
    'fr-fr': 'Modifier le mot de passe',
    'uk-ua': 'Змінити пароль',
  },
  oldPassword: {
    'en-us': 'Old password',
    'ru-ru': 'Старый пароль',
    'es-es': 'Contraseña anterior',
    'fr-fr': 'Mot de passe actuel',
    'uk-ua': 'Старий пароль',
  },
  newPassword: {
    'en-us': 'New password',
    'ru-ru': 'Новый пароль',
    'es-es': 'Nueva contraseña',
    'fr-fr': 'Nouveau mot de passe',
    'uk-ua': 'Новий пароль',
  },
  repeatPassword: {
    'en-us': 'Repeat new password',
    'ru-ru': 'повторите новый пароль',
    'es-es': 'repita la nueva contraseña',
    'fr-fr': 'Répéter le nouveau mot de passe',
    'uk-ua': 'Повторіть новий пароль',
  },
  logOut: {
    'en-us': 'Log Out',
    'ru-ru': 'Выйти',
    'es-es': 'Cerrar sesión',
    'fr-fr': 'Se déconnecter',
    'uk-ua': 'Вийти',
  },
  setUserAgents: {
    'en-us': 'Set User Agents',
    'ru-ru': 'Установить пользовательских агентов',
    'es-es': 'Establecer agentes de usuario',
    'fr-fr': 'Définir les agents utilisateurs',
    'uk-ua': 'Встановити агентів користувача',
  },
  noAgent: {
    'en-us': 'Current user does not have an agent assigned',
    'ru-ru': 'Текущему пользователю не назначен агент',
    'es-es': 'El usuario actual no tiene un agente asignado',
    'fr-fr': "L'utilisateur actuel n'a pas d'agent assigné",
    'uk-ua': 'Поточний користувач не має призначеного агента',
  },
  noAgentDescription: {
    'en-us': 'Please log in as admin and assign an agent to this user',
    'ru-ru': `
      Пожалуйста, войдите в систему как администратор и назначьте агента этому
      пользователю
    `,
    'es-es':
      'Inicie sesión como administrador y asigne un agente a este usuario',
    'fr-fr': `
      Veuillez vous connecter en tant qu'administrateur et attribuer un agent à
      cet utilisateur
    `,
    'uk-ua': `
      Будь ласка, увійдіть як адміністратор і призначте агента цьому
      користувачеві
    `,
  },
  helloMessage: {
    'en-us': 'Hello, {userName:string}!',
    'ru-ru': 'Привет, {userName:string}!',
    'es-es': '¡Hola, {userName:string}!',
    'fr-fr': 'Bonjour, {userName:string} !',
    'uk-ua': 'Привіт, {userName:string}!',
  },
  oicWelcomeMessage: {
    'en-us': `
      You've been invited to associate an external login to your Specify user
      account. This will enable you to log in to Specify with your chosen
      provider going forward.
    `,
    'ru-ru': `
      Вам было предложено связать внешний логин с вашей учетной записью
      пользователя Specify. Это позволит вам войти в Specify с выбранным вами
      провайдером в будущем.
    `,
    'es-es': `
      Ha sido invitado a asociar un inicio de sesión externo a su cuenta de
      usuario Especificar. Esto le permitirá iniciar sesión en Specific con su
      proveedor elegido en el futuro.
    `,
    'fr-fr': `
      Vous avez été invité à associer une connexion externe à votre compte
      d'utilisateur Spécifier. Cela vous permettra de vous connecter à Spécifier
      avec votre fournisseur choisi à l'avenir.
    `,
    'uk-ua': `
      Вас запросили пов’язати зовнішній логін із вашим обліковим записом
      користувача Specify. Це дозволить вам увійти в систему Specify з вибраним
      постачальником надалі.
    `,
  },
  legacyLogin: {
    'en-us': 'Sign in with Specify Account',
    'ru-ru': 'Войти с помощью Указать учетную запись',
    'es-es': 'Iniciar sesión con Especificar cuenta',
    'fr-fr': 'Connectez-vous avec Spécifiez le compte',
    'uk-ua': 'Увійдіть за допомогою Вказати обліковий запис',
  },
  unknownOicUser: {
    'en-us': `
      There is currently no Specify user associated with your
      {providerName:string} account. If you have a Specify user name and
      password, you can enter them below to associate that user with your
      {providerName:string} account for future logins.
    `,
    'ru-ru': `
      В настоящее время нет пользователя Specify, связанного с вашей учетной
      записью {providerName:string}. Если у вас есть Укажите имя пользователя и
      пароль, вы можете ввести их ниже, чтобы связать этого пользователя с вашей
      учетной записью {providerName:string} для будущих входов в систему.
    `,
    'es-es': `
      Actualmente no hay un usuario específico asociado con su cuenta
      {providerName:string}. Si tiene un nombre de usuario y contraseña
      especificados, puede ingresarlos a continuación para asociar ese usuario
      con su cuenta {providerName:string} para futuros inicios de sesión.
    `,
    'fr-fr': `
      Il n'y a actuellement aucun utilisateur spécifié associé à votre compte
      {providerName:string}. Si vous disposez d'un nom d'utilisateur et d'un
      mot de passe, vous pouvez les saisir ci-dessous pour associer cet
      utilisateur à votre compte {providerName:string} lors de futures
      connexions.
    `,
    'uk-ua': `
      Наразі немає жодного користувача, пов’язаного з вашим обліковим записом
      {providerName:string}. Якщо у вас є вказати ім’я користувача та пароль,
      ви можете ввести їх нижче, щоб пов’язати цього користувача з обліковим
      записом {providerName:string} для майбутніх входів.
    `,
  },
  generateMasterKey: {
    'en-us': 'Generate Master Key',
    'ru-ru': 'Сгенерировать мастер-ключ',
    'es-es': 'Generar clave maestra',
    'fr-fr': 'Générer la clé principale',
    'uk-ua': 'Створити головний ключ',
  },
  userPassword: {
    'en-us': 'User Password',
    'ru-ru': 'Пользовательский пароль',
    'es-es': 'Contraseña de usuario',
    'fr-fr': 'Mot de passe utilisateur',
    'uk-ua': 'Пароль користувача',
  },
  generate: {
    'en-us': 'Generate',
    'ru-ru': 'Создать',
    'es-es': 'Generar',
    'fr-fr': 'Générer',
    'uk-ua': 'Генерувати',
  },
  masterKeyGenerated: {
    'en-us': 'Master key generated',
    'ru-ru': 'Мастер-ключ сгенерирован',
    'es-es': 'Clave maestra generada',
    'fr-fr': 'Clé principale générée',
    'uk-ua': 'Створено головний ключ',
  },
  masterKeyFieldLabel: {
    'en-us': 'Master Key',
    'ru-ru': 'Мастер ключ',
    'es-es': 'Llave maestra',
    'fr-fr': 'Clé principale',
    'uk-ua': 'Головний ключ',
  },
  incorrectPassword: {
    'en-us': 'Password was incorrect.',
    'ru-ru': 'Неверный пароль.',
    'es-es': 'La contraseña era incorrecta.',
    'fr-fr': 'Le mot de passe était incorrect.',
    'uk-ua': 'Пароль був невірний.',
  },
  noAccessToResource: {
    'en-us': `
      You do not have access to any {collectionTable:string} containing this
      resource through the currently logged in account
    `,
    'ru-ru': `
      У вас нет доступа ни к одному {collectionTable:string}, содержащему этот
      ресурс, через текущий вход в учетную запись.
    `,
    'es-es': `
      No tiene acceso a ningún {collectionTable:string} que contenga este
      recurso a través de la cuenta actualmente iniciada
    `,
    'fr-fr': `
      Vous n'avez accès à aucun {collectionTable:string} contenant cette
      ressource via le compte actuellement connecté
    `,
    'uk-ua': `
      Ви не маєте доступу до {collectionTable:string}, що містить цей ресурс,
      через поточний обліковий запис
    `,
  },
  resourceInaccessible: {
    'en-us': `
      The requested resource cannot be accessed while logged into the current
      collection.
    `,
    'ru-ru': 'Запрошенный ресурс недоступен при входе в текущую коллекцию.',
    'es-es': `
      No se puede acceder al recurso solicitado mientras se está conectado a la
      colección actual.
    `,
    'fr-fr': `
      Impossible d'accéder à la ressource demandée lorsque vous êtes connecté à
      la collection actuelle.
    `,
    'uk-ua': `
      Неможливо отримати доступ до запитуваного ресурсу під час входу в поточну
      колекцію.
    `,
  },
  selectCollection: {
    'en-us': 'Select one of the following collections:',
    'ru-ru': 'Выберите одну из следующих коллекций:',
    'es-es': 'Seleccione una de las siguientes colecciones:',
    'fr-fr': "Sélectionnez l'une des collections suivantes :",
    'uk-ua': 'Виберіть одну з наступних колекцій:',
  },
  loginToProceed: {
    comment: 'Example: You can login to the Collection, to proceed:',
    'en-us': 'You can login to the {collectionTable:string}, to proceed:',
    'ru-ru': 'Вы можете войти в {collectionTable:string}, чтобы продолжить:',
    'es-es':
      'Puede iniciar sesión en el {collectionTable:string}, para continuar:',
    'fr-fr': `
      Vous pouvez vous connecter au {collectionTable:string}, pour continuer :
    `,
    'uk-ua': 'Ви можете увійти на {collectionTable:string}, щоб продовжити:',
  },
  sessionTimeOut: {
    'en-us': 'Insufficient Privileges',
    'ru-ru': 'Недостаточно прав',
    'es-es': 'Privilegios insuficientes',
    'fr-fr': 'Privilèges insuffisants',
    'uk-ua': 'Недостатні привілеї',
  },
  sessionTimeOutDescription: {
    'en-us': `
      You lack sufficient privileges for that action, or your current session
      has been logged out.
    `,
    'ru-ru': `
      У вас недостаточно прав для этого действия, или ваш текущий сеанс был
      завершен.
    `,
    'es-es': `
      Carece de suficientes privilegios para esa acción, o su sesión actual ha
      sido cerrada.
    `,
    'fr-fr': `
      Vous ne disposez pas des privilèges suffisants pour cette action ou votre
      session actuelle a été déconnectée.
    `,
    'uk-ua': `
      У вас немає достатніх привілеїв для цієї дії, або ваш поточний сеанс
      вийшов із системи.
    `,
  },
  noPermission: {
    comment: `
      Used in field formatter if user doesn't have read access to the related
      table
    `,
    'en-us': 'NO PERMISSION',
    'ru-ru': 'НЕТ РАЗРЕШЕНИЯ',
    'es-es': 'SIN AUTORIZACIÓN',
    'fr-fr': 'AUCUNE AUTORISATION',
    'uk-ua': 'НЕМАЄ ДОЗВОЛУ',
  },
  permissionDeniedError: {
    'en-us': 'Permission denied error',
    'ru-ru': 'Ошибка отказа в доступе',
    'es-es': 'Error de permiso denegado',
    'fr-fr': "Erreur d'autorisation refusée",
    'uk-ua': 'Помилка дозволу заборонено',
  },
  permissionDeniedDescription: {
    'en-us': `
      You don't have any policy or role that gives you permission to do the
      following action:
    `,
    'ru-ru': `
      У вас нет политики или роли, которая дает вам разрешение на выполнение
      следующих действий:
    `,
    'es-es': `
      No tiene ninguna política o rol que le dé permiso para realizar la
      siguiente acción:
    `,
    'fr-fr': `
      Vous ne disposez d'aucune stratégie ni d'aucun rôle vous autorisant à
      effectuer l'action suivante :
    `,
    'uk-ua': `
      У вас немає жодної політики чи ролі, які дають вам дозвіл виконувати такі
      дії:
    `,
  },
  emptyRecordSetsReadOnly: {
    'en-us': 'Cannot open empty {recordSetTable:string} when in Read-Only mode',
    'es-es': `
      No se puede abrir {recordSetTable:string} vacío cuando está en modo de
      solo lectura
    `,
    'fr-fr':
      "Impossible d'ouvrir {recordSetTable:string} vide en mode lecture seule",
    'ru-ru': `
      Невозможно открыть пустой {recordSetTable:string} в режиме только для
      чтения
    `,
    'uk-ua': `
      Неможливо відкрити порожній {recordSetTable:string} у режимі лише для
      читання
    `,
  },
  permissionDeniedForUrl: {
    'en-us': 'Permission denied when accessing <url />',
    'ru-ru': 'Отказано в доступе при доступе к <url />',
    'es-es': 'Permiso denegado al acceder a <url />',
    'fr-fr': "Autorisation refusée lors de l'accès à <url />",
    'uk-ua': 'У дозволі відмовлено під час доступу до <url />',
  },
  noAccessToCollections: {
    'en-us': `
      The logged in user has not been given access to any collections in this
      database. You must login as another user.
    `,
    'ru-ru': `
      Вошедшему в систему пользователю не был предоставлен доступ ни к каким
      коллекциям в этой базе данных. Вы должны войти в систему как другой
      пользователь.
    `,
    'es-es': `
      El usuario que ha iniciado sesión no tiene acceso a ninguna colección de
      esta base de datos. Debe iniciar sesión como otro usuario.
    `,
    'fr-fr': `
      L'utilisateur connecté n'a pas été autorisé à accéder aux collections de
      cette base de données. Vous devez vous connecter en tant qu'autre
      utilisateur.
    `,
    'uk-ua': `
      Увійшовши в систему користувач не отримав доступ до жодної колекції в цій
      базі даних. Ви повинні увійти як інший користувач.
    `,
  },
  userAccount: {
    'en-us': 'User Account',
    'ru-ru': 'Учетная запись пользователя',
    'es-es': 'Cuenta de usuario',
    'fr-fr': "Compte d'utilisateur",
    'uk-ua': 'Обліковий запис користувача',
  },
  removeAdmin: {
    'en-us': 'Remove Admin',
    'ru-ru': 'Удалить администратора',
    'es-es': 'Eliminar administrador',
    'fr-fr': "Supprimer l'administrateur",
    'uk-ua': 'Видалити адміністратора',
  },
  canNotRemoveYourself: {
    'en-us': 'You cannot revoke your own admin status',
    'ru-ru': 'Вы не можете отозвать свой собственный статус администратора',
    'es-es': 'No puede revocar su propio estado de administrador',
    'fr-fr': "Vous ne pouvez pas révoquer votre propre statut d'administrateur",
    'uk-ua': 'Ви не можете відкликати свій статус адміністратора',
  },
  makeAdmin: {
    'en-us': 'Make Admin',
    'ru-ru': 'Сделать администратором',
    'es-es': 'Hacer administrador',
    'fr-fr': 'Faire administrateur',
    'uk-ua': 'Зробити адміністратором',
  },
  saveUserFirst: {
    'en-us': 'Save user first',
    'ru-ru': 'Сначала сохраните пользователя',
    'es-es': 'Guardar usuario primero',
    'fr-fr': "Enregistrez d'abord l'utilisateur",
    'uk-ua': 'Спочатку збережіть користувача',
  },
  mustBeManager: {
    'en-us': 'User must be saved as Manager first',
    'ru-ru': 'Пользователь должен быть сначала сохранен как менеджер',
    'es-es': 'El usuario debe guardarse primero como Administrador',
    'fr-fr':
      "L'utilisateur doit d'abord être enregistré en tant que gestionnaire",
    'uk-ua': 'Спочатку користувача потрібно зберегти як менеджера',
  },
  users: {
    'en-us': 'User Accounts',
    'ru-ru': 'Учетные записи пользователей',
    'es-es': 'Cuentas de usuario',
    'fr-fr': 'Comptes utilisateur',
    'uk-ua': 'Облікові записи користувачів',
  },
  institutionUsers: {
    'en-us': 'User Accounts Defined in this {institutionTable:string}',
    'ru-ru': `
      Учетные записи пользователей, определенные в этом
      {institutionTable:string}
    `,
    'es-es': 'Cuentas de usuario definidas en este {institutionTable:string}',
    'fr-fr': "Comptes d'utilisateurs définis dans ce {institutionTable:string}",
    'uk-ua': `
      Облікові записи користувачів, визначені в цьому {institutionTable:string}
    `,
  },
  collectionUsers: {
    'en-us': 'User Accounts Assigned to this {collectionTable:string}',
    'ru-ru': `
      Учетные записи пользователей, назначенные этому {collectionTable:string}
    `,
    'es-es': 'Cuentas de usuario asignadas a este {collectionTable:string}',
    'fr-fr': "Comptes d'utilisateurs attribués à ce {collectionTable:string}",
    'uk-ua': `
      Облікові записи користувачів, призначені цьому {collectionTable:string}
    `,
  },
  setPassword: {
    'en-us': 'Set Password',
    'ru-ru': 'Установка пароля',
    'es-es': 'Configurar la clave',
    'fr-fr': 'Définir le mot de passe',
    'uk-ua': 'Встановити пароль',
  },
  passwordsDoNotMatchError: {
    'en-us': 'Passwords do not match.',
    'ru-ru': 'Пароли не совпадают.',
    'es-es': 'Las contraseñas no coinciden.',
    'fr-fr': 'Les mots de passe ne correspondent pas.',
    'uk-ua': 'Паролі не збігаються.',
  },
  confirmPassword: {
    'en-us': 'Confirm',
    'ru-ru': 'Подтверждать',
    'es-es': 'Confirmar',
    'fr-fr': 'Confirmer',
    'uk-ua': 'Підтвердити',
  },
  collections: {
    'en-us': 'Collections',
    'ru-ru': 'Коллекции',
    'es-es': 'Colecciones',
    'fr-fr': 'Collections',
    'uk-ua': 'Колекції',
  },
  notAvailableOnAdmins: {
    'en-us': 'This option is unavailable for admin users',
    'ru-ru': 'Эта опция недоступна для пользователей с правами администратора.',
    'es-es': 'Esta opción no está disponible para usuarios administradores',
    'fr-fr': "Cette option n'est pas disponible pour les administrateurs",
    'uk-ua': 'Ця опція недоступна для адміністраторів',
  },
  configureCollectionAccess: {
    'en-us': 'Select user collection access',
    'ru-ru': 'Выберите доступ к пользовательской коллекции',
    'es-es': 'Seleccione el acceso a la colección de usuarios',
    'fr-fr': "Sélectionnez l'accès à la collection d'utilisateurs",
    'uk-ua': 'Виберіть доступ до колекції користувачів',
  },
  securityPanel: {
    'en-us': 'Security and Accounts',
    'ru-ru': 'Безопасность и учетные записи',
    'es-es': 'Seguridad y Cuentas',
    'fr-fr': 'Sécurité et comptes',
    'uk-ua': 'Безпека та облікові записи',
  },
  userRoleLibrary: {
    'en-us': 'Institution Library of Role Templates',
    'ru-ru': 'Библиотека шаблонов ролей учреждения',
    'es-es': 'Biblioteca institucional de plantillas de roles',
    'fr-fr': 'Bibliothèque institutionnelle de modèles de rôle',
    'uk-ua': 'Бібліотека шаблонів ролей установи',
  },
  userRoles: {
    'en-us': 'User Roles',
    'ru-ru': 'Роли пользователей',
    'es-es': 'Roles del usuario',
    'fr-fr': 'Rôles utilisateur',
    'uk-ua': 'Ролі користувачів',
  },
  collectionUserRoles: {
    'en-us': '{collectionTable:string} User Roles',
    'ru-ru': '{collectionTable:string} Роли пользователей',
    'es-es': '{collectionTable:string} Funciones de usuario',
    'fr-fr': "{collectionTable:string} Rôles d'utilisateur",
    'uk-ua': '{collectionTable:string} Ролі користувачів',
  },
  assignedUserRoles: {
    'en-us': 'Assigned User Roles',
    'ru-ru': 'Назначенные роли пользователей',
    'es-es': 'Roles de usuario asignados',
    'fr-fr': 'Rôles utilisateur attribués',
    'uk-ua': 'Призначені ролі користувача',
  },
  rolePolicies: {
    'en-us': 'Role Permission Policies',
    'ru-ru': 'Политики разрешений ролей',
    'es-es': 'Políticas de permisos de funciones',
    'fr-fr': "Politiques d'autorisation de rôle",
    'uk-ua': 'Політики дозволів на роль',
  },
  userPolicies: {
    'en-us': 'User Permission Policies',
    'ru-ru': 'Политики разрешений пользователей',
    'es-es': 'Políticas de permisos de usuario',
    'fr-fr': "Politiques d'autorisation des utilisateurs",
    'uk-ua': 'Політика дозволів користувача',
  },
  customUserPolices: {
    'en-us':
      'Custom Collection-level Policies (applies to this collection only)',
    'ru-ru': `
      Пользовательские политики на уровне коллекции (применяется только к этой
      коллекции)
    `,
    'es-es': `
      Políticas de nivel de colección personalizadas (se aplica solo a esta
      colección)
    `,
    'fr-fr': `
      Politiques personnalisées au niveau de la collection (s'applique
      uniquement à cette collection)
    `,
    'uk-ua':
      'Спеціальна політика на рівні колекції (стосується лише цієї колекції)',
  },
  role: {
    'en-us': 'Role',
    'ru-ru': 'Роль',
    'es-es': 'Role',
    'fr-fr': 'Rôle',
    'uk-ua': 'Роль',
  },
  read: {
    'en-us': 'Read',
    'ru-ru': 'Читать',
    'es-es': 'Leer',
    'fr-fr': 'Lire',
    'uk-ua': 'Прочитайте',
  },
  userPermissionPreview: {
    'en-us': "User's Permission Profile (read-only)",
    'ru-ru': 'Профиль разрешений пользователя (только для чтения)',
    'es-es': 'Perfil de permisos del usuario (solo lectura)',
    'fr-fr': "Profil d'autorisation de l'utilisateur (lecture seule)",
    'uk-ua': 'Профіль дозволів користувача (лише читання)',
  },
  outOfDateWarning: {
    'en-us':
      'Note: preview may be out of date. Save changes to update the preview',
    'ru-ru': `
      Примечание. Предварительный просмотр может быть устаревшим. Сохраните
      изменения, чтобы обновить предварительный просмотр
    `,
    'es-es': `
      Nota: la vista previa puede estar desactualizada. Guardar cambios para
      actualizar la vista previa
    `,
    'fr-fr': `
      Remarque : l'aperçu peut être obsolète. Enregistrer les modifications pour
      mettre à jour l'aperçu
    `,
    'uk-ua': `
      Примітка: попередній перегляд може бути застарілим. Збережіть зміни, щоб
      оновити попередній перегляд
    `,
  },
  allUsers: {
    'en-us': 'All Users',
    'ru-ru': 'Все пользователи',
    'es-es': 'Todos los usuarios',
    'fr-fr': 'Tous les utilisateurs',
    'uk-ua': 'Всі користувачі',
  },
  thisUser: {
    'en-us': 'This user',
    'ru-ru': 'Этот пользователь',
    'es-es': 'este usuario',
    'fr-fr': 'Cet utilisateur',
    'uk-ua': 'Цей користувач',
  },
  action: {
    'en-us': 'Action',
    'ru-ru': 'Действие',
    'es-es': 'Acción',
    'fr-fr': 'Action',
    'uk-ua': 'Дія',
  },
  resource: {
    'en-us': 'Resource',
    'ru-ru': 'Ресурс',
    'es-es': 'Recurso',
    'fr-fr': 'Ressource',
    'uk-ua': 'Ресурс',
  },
  allCollections: {
    'en-us': 'All Collections',
    'ru-ru': 'Все коллекции',
    'es-es': 'Todas las colecciones',
    'fr-fr': 'Toutes les collections',
    'uk-ua': 'Всі колекції',
  },
  thisCollection: {
    'en-us': 'This collection',
    'ru-ru': 'Эта коллекция',
    'es-es': 'esta colección',
    'fr-fr': 'Cette collection',
    'uk-ua': 'Ця колекція',
  },
  allActions: {
    'en-us': 'All Actions',
    'ru-ru': 'Все действия',
    'es-es': 'Todas las acciones',
    'fr-fr': 'Toutes les actions',
    'uk-ua': 'Усі дії',
  },
  collectionAccess: {
    'en-us': 'Enable Collection Access',
    'ru-ru': 'Включить доступ к коллекции',
    'es-es': 'Habilitar acceso a la colección',
    'fr-fr': "Autoriser l'accès à la collection",
    'uk-ua': 'Увімкнути доступ до колекції',
  },
  createRole: {
    'en-us': 'Create Role',
    'ru-ru': 'Создать роль',
    'es-es': 'Crear rol',
    'fr-fr': 'Créer un rôle',
    'uk-ua': 'Створити роль',
  },
  newRole: {
    'en-us': 'New Role',
    'ru-ru': 'Новая роль',
    'es-es': 'Nuevo rol',
    'fr-fr': 'Nouveau rôle',
    'uk-ua': 'Нова роль',
  },
  fromLibrary: {
    'en-us': 'From library:',
    'ru-ru': 'Из библиотеки:',
    'es-es': 'De la biblioteca:',
    'fr-fr': 'Depuis la bibliothèque :',
    'uk-ua': 'З бібліотеки:',
  },
  fromExistingRole: {
    'en-us': 'From an existing role:',
    'ru-ru': 'Из существующей роли:',
    'es-es': 'Desde un rol existente:',
    'fr-fr': "À partir d'un rôle existant :",
    'uk-ua': 'З наявної ролі:',
  },
  createNewRoles: {
    'en-us': 'Create new roles:',
    'ru-ru': 'Создайте новые роли:',
    'es-es': 'Crear nuevos roles:',
    'fr-fr': 'Créez de nouveaux rôles :',
    'uk-ua': 'Створити нові ролі:',
  },
  updateExistingRoles: {
    'en-us': 'Update existing roles:',
    'ru-ru': 'Обновите существующие роли:',
    'es-es': 'Actualizar roles existentes:',
    'fr-fr': 'Mettez à jour les rôles existants :',
    'uk-ua': 'Оновіть наявні ролі:',
  },
  unchangedRoles: {
    'en-us': 'Unchanged roles:',
    'ru-ru': 'Неизменные роли:',
    'es-es': 'Roles sin cambios:',
    'fr-fr': 'Rôles inchangés :',
    'uk-ua': 'Незмінні ролі:',
  },
  institutionAdmin: {
    'en-us': 'Institution Admin',
    'ru-ru': 'Администратор учреждения',
    'es-es': 'Administrador de la institución',
    'fr-fr': "Administrateur de l'établissement",
    'uk-ua': 'Адмін закладу',
  },
  createInviteLink: {
    'en-us': 'Create Invite Link',
    'ru-ru': 'Создать пригласительную ссылку',
    'es-es': 'Crear enlace de invitación',
    'fr-fr': "Créer un lien d'invitation",
    'uk-ua': 'Створити посилання для запрошення',
  },
  userInviteLink: {
    'en-us': 'User Invite Link',
    'ru-ru': 'Ссылка для приглашения пользователя',
    'es-es': 'Enlace de invitación de usuario',
    'fr-fr': "Lien d'invitation utilisateur",
    'uk-ua': 'Посилання для запрошення користувача',
  },
  userInviteLinkDescription: {
    'en-us': `
      Send the following link to {userName:string} to allow them to log in for
      the first time.
    `,
    'ru-ru': `
      Отправьте следующую ссылку {userName:string}, чтобы они могли войти в
      систему в первый раз.
    `,
    'es-es': `
      Envíe el siguiente enlace a {userName:string} para permitirles iniciar
      sesión por primera vez.
    `,
    'fr-fr': `
      Envoyez le lien suivant à {userName:string} pour leur permettre de se
      connecter pour la première fois.
    `,
    'uk-ua': `
      Надішліть таке посилання на {userName:string}, щоб дозволити їм увійти в
      систему вперше.
    `,
  },
  noProvidersForUserInviteLink: {
    'en-us': `
      No external identity provider is configured. You can configure some in
      Specify 7 server settings
    `,
    'ru-ru': `
      Внешний поставщик удостоверений не настроен. Вы можете настроить некоторые
      в настройках сервера Specify 7.
    `,
    'es-es': `
      No se configura ningún proveedor de identidad externo. Puede configurar
      algunos en la configuración del servidor Especificar 7
    `,
    'fr-fr': `
      Aucun fournisseur d'identité externe n'est configuré. Vous pouvez en
      configurer certains dans les paramètres du serveur de Specify 7
    `,
    'uk-ua': `
      Жодного зовнішнього постачальника ідентифікаційної інформації не
      налаштовано. Ви можете налаштувати деякі параметри сервера Specify 7
    `,
  },
  legacyPermissions: {
    'en-us': 'Specify 6 Permissions',
    'ru-ru': 'Укажите 6 разрешений',
    'es-es': 'Especificar 6 permisos',
    'fr-fr': 'Autorisations de Specify 6',
    'uk-ua': 'Вкажіть 6 дозволів',
  },
  setPasswordBeforeSavePrompt: {
    'en-us': `
      Consider setting a password for this user. Users without a password won't
      be able to sign in
    `,
    'ru-ru': `
      Рассмотрите возможность установки пароля для этого пользователя.
      Пользователи без пароля не смогут войти
    `,
    'es-es': `
      Considere establecer una contraseña para este usuario. Los usuarios sin
      contraseña no podrán iniciar sesión
    `,
    'fr-fr': `
      Pensez à définir un mot de passe pour cet utilisateur. Les utilisateurs
      sans mot de passe ne pourront pas se connecter
    `,
    'uk-ua': `
      Розгляньте можливість встановлення пароля для цього користувача.
      Користувачі без пароля не зможуть увійти
    `,
  },
  setCollections: {
    'en-us': 'Set Collections',
    'ru-ru': 'Набор коллекций',
    'es-es': 'Establecer colecciones',
    'fr-fr': 'Ensemble de collections',
    'uk-ua': 'Набір колекцій',
  },
  agentInUse: {
    'en-us': 'This agent is already associated with a different user.',
    'ru-ru': 'Этот агент уже связан с другим пользователем.',
    'es-es': 'Este agente ya está asociado con un usuario diferente.',
    'fr-fr': 'Cet agent est déjà associé à un autre utilisateur.',
    'uk-ua': 'Цей агент уже пов’язаний з іншим користувачем.',
  },
  setAgentsBeforeProceeding: {
    'en-us': 'Please set the following agents before proceeding:',
    'ru-ru': 'Прежде чем продолжить, установите следующие агенты:',
    'es-es': 'Configure los siguientes agentes antes de continuar:',
    'fr-fr': 'Veuillez définir les agents suivants avant de continuer :',
    'uk-ua': 'Перш ніж продовжити, установіть такі агенти:',
  },
  externalIdentityProviders: {
    'en-us': 'External identity providers:',
    'ru-ru': 'Внешние поставщики удостоверений:',
    'es-es': 'Proveedores de identidad externos:',
    'fr-fr': "Fournisseurs d'identité externes :",
    'uk-ua': 'Зовнішні постачальники ідентифікаційної інформації:',
  },
  allTables: {
    'en-us': 'All tables',
    'ru-ru': 'Все столы',
    'es-es': 'Todas las mesas',
    'fr-fr': 'Tous les tableaux',
    'uk-ua': 'Всі столи',
  },
  loadingAdmins: {
    'en-us': 'Loading admins...',
    'ru-ru': 'Загрузка администраторов...',
    'es-es': 'Cargando administradores...',
    'fr-fr': 'Chargement des administrateurs…',
    'uk-ua': 'Завантаження адміністраторів...',
  },
  specifyAdmin: {
    comment: 'Shown next to user name for admin users',
    'en-us': '(Specify 7 Admin)',
    'ru-ru': '(указать 7 админ)',
    'es-es': '(Especifique 7 Administrador)',
    'fr-fr': '(Précisez 7 administrateurs)',
    'uk-ua': '(Вкажіть 7 адміністраторів)',
  },
  legacyAdmin: {
    comment: 'Shown next to user name for admin users',
    'en-us': '(Specify 6 Admin)',
    'ru-ru': '(указать 6 админ)',
    'es-es': '(Especifique 6 administradores)',
    'fr-fr': '(Précisez 6 administrateurs)',
    'uk-ua': '(Вкажіть 6 адміністраторів)',
  },
  deleteRoleWithUsers: {
    'en-us': 'Delete role that has users?',
    'ru-ru': 'Удалить роль, в которой есть пользователи?',
    'es-es': '¿Eliminar rol que tiene usuarios?',
    'fr-fr': 'Supprimer le rôle qui a des utilisateurs ?',
    'uk-ua': 'Видалити роль, яка має користувачів?',
  },
  deleteRoleWithUsersDescription: {
    'en-us': 'Users will not be deleted, but they would lose this role.',
    'ru-ru': 'Пользователи не будут удалены, но потеряют эту роль.',
    'es-es': 'Los usuarios no se eliminarán, pero perderían este rol.',
    'fr-fr':
      'Les utilisateurs ne seront pas supprimés, mais ils perdraient ce rôle.',
    'uk-ua': 'Користувачів не буде видалено, але вони втратять цю роль.',
  },
  institutionPolicies: {
    'en-us': `
      Custom Institution-level Policies (applies to all assigned collections)
    `,
    'ru-ru': `
      Пользовательские политики на уровне учреждения (применяются ко всем
      назначенным коллекциям)
    `,
    'es-es': `
      Políticas personalizadas a nivel de institución (se aplican a todas las
      colecciones asignadas)
    `,
    'fr-fr': `
      Politiques personnalisées au niveau de l'établissement (s'appliquent à
      toutes les collections attribuées)
    `,
    'uk-ua': `
      Спеціальна політика на рівні установи (застосовується до всіх призначених
      колекцій)
    `,
  },
  cantRemoveLastAdmin: {
    'en-us': "Can't remove Institution Admin status",
    'ru-ru': 'Не удается удалить статус администратора учреждения',
    'es-es':
      'No se puede eliminar el estado de administrador de la institución',
    'fr-fr':
      "Impossible de supprimer le statut d'administrateur de l'établissement",
    'uk-ua': 'Неможливо видалити статус адміністратора установи',
  },
  cantRemoveLastAdminDescription: {
    'en-us': 'There must be at least one Institution Admin in institution',
    'ru-ru': 'В учреждении должен быть хотя бы один администратор учреждения.',
    'es-es': `
      Debe haber al menos un administrador de la institución en la institución
    `,
    'fr-fr': `
      Il doit y avoir au moins un administrateur d'établissement dans
      l'établissement
    `,
    'uk-ua': 'У закладі має бути принаймні один адміністратор установи',
  },
  switchToHorizontalLayout: {
    'en-us': 'Switch to horizontal layout',
    'ru-ru': 'Переключиться на горизонтальную раскладку',
    'es-es': 'Cambiar a diseño horizontal',
    'fr-fr': "Passer à l'affichage horizontal",
    'uk-ua': 'Перейти до горизонтального розташування',
  },
  switchToVerticalLayout: {
    'en-us': 'Switch to vertical layout',
    'ru-ru': 'Переключиться на вертикальную компоновку',
    'es-es': 'Cambiar a diseño vertical',
    'fr-fr': "Passer à l'affichage vertical",
    'uk-ua': 'Переключитися на вертикальне розташування',
  },
  advancedTables: {
    'en-us': 'Advanced tables',
    'ru-ru': 'Расширенные таблицы',
    'es-es': 'Tablas avanzadas',
    'fr-fr': 'Tableaux avancés',
    'uk-ua': 'Розширені таблиці',
  },
  excludedInstitutionalPolicies: {
    'en-us': 'Excluded institutional policies:',
    'ru-ru': 'Исключенные институциональные политики:',
    'es-es': 'Pólizas institucionales excluidas:',
    'fr-fr': 'Polices institutionnelles exclues :',
    'uk-ua': 'Виключені інституційні політики:',
  },
  excludedInstitutionalPoliciesDescription: {
    'en-us': `
      (Some policies that apply only at the institution-level are not present
      here at the collection-level.)
    `,
    'ru-ru': `
      (Некоторые политики, которые применяются только на уровне учреждения,
      отсутствуют здесь на уровне коллекции.)
    `,
    'es-es': `
      (Algunas políticas que se aplican solo a nivel de institución no están
      presentes aquí a nivel de colección).
    `,
    'fr-fr': `
      (Certaines politiques qui s'appliquent uniquement au niveau de
      l'institution ne sont pas présentes ici au niveau de la collection.)
    `,
    'uk-ua': `
      (Деякі політики, які застосовуються лише на рівні установи, відсутні тут
      на рівні колекції.)
    `,
  },
  accountSetupOptions: {
    'en-us': 'Account Setup Options',
    'ru-ru': 'Параметры настройки учетной записи',
    'es-es': 'Opciones de configuración de cuenta',
    'fr-fr': 'Options de configuration du compte',
    'uk-ua': 'Параметри налаштування облікового запису',
  },
} as const);
