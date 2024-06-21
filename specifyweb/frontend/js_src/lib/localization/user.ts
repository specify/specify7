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
    'de-ch': 'Anmelden',
  },
  username: {
    'en-us': 'Username',
    'ru-ru': 'Имя пользователя',
    'es-es': 'Nombre de usuario',
    'fr-fr': "Nom d'utilisateur",
    'uk-ua': "Ім'я користувача",
    'de-ch': 'Benutzername',
  },
  password: {
    'en-us': 'Password',
    'ru-ru': 'Пароль',
    'es-es': 'Contraseña',
    'fr-fr': 'Mot de passe',
    'uk-ua': 'Пароль',
    'de-ch': 'Kennwort',
  },
  collectionAccessDenied: {
    'en-us': 'You do not have access to this collection',
    'ru-ru': 'У вас нет доступа к этой коллекции',
    'es-es': 'No tiene acceso a esta colección',
    'fr-fr': "Vous n'avez pas accès à cette collection",
    'uk-ua': 'Ви не маєте доступу до цієї колекції',
    'de-ch': 'Sie haben keinen Zugang zu dieser Sammlung',
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
    'de-ch': `
      Das aktuell angemeldete Konto hat keinen Zugriff auf die
      {collectionName:string}-Sammlung.
    `,
  },
  changePassword: {
    'en-us': 'Change Password',
    'ru-ru': 'Изменить пароль',
    'es-es': 'Cambiar la contraseña',
    'fr-fr': 'Modifier le mot de passe',
    'uk-ua': 'Змінити пароль',
    'de-ch': 'Kennwort ändern',
  },
  oldPassword: {
    'en-us': 'Old password',
    'ru-ru': 'Старый пароль',
    'es-es': 'Contraseña anterior',
    'fr-fr': 'Mot de passe actuel',
    'uk-ua': 'Старий пароль',
    'de-ch': 'Altes Kennwort',
  },
  newPassword: {
    'en-us': 'New password',
    'ru-ru': 'Новый пароль',
    'es-es': 'Nueva contraseña',
    'fr-fr': 'Nouveau mot de passe',
    'uk-ua': 'Новий пароль',
    'de-ch': 'Neues Kennwort',
  },
  repeatPassword: {
    'en-us': 'Repeat new password',
    'ru-ru': 'повторите новый пароль',
    'es-es': 'repita la nueva contraseña',
    'fr-fr': 'Répéter le nouveau mot de passe',
    'uk-ua': 'Повторіть новий пароль',
    'de-ch': 'Wiederhole das neue Kennwort',
  },
  logOut: {
    'en-us': 'Log Out',
    'ru-ru': 'Выйти',
    'es-es': 'Cerrar sesión',
    'fr-fr': 'Se déconnecter',
    'uk-ua': 'Вийти',
    'de-ch': 'Ausloggen',
  },
  setUserAgents: {
    'en-us': 'Set User Agents',
    'ru-ru': 'Установить пользовательские агенты',
    'es-es': 'Establecer agentes usuarios',
    'fr-fr': 'Définir les agents utilisateurs',
    'uk-ua': 'Встановити агентів користувача',
    'de-ch': 'Benutzeragenten festlegen',
  },
  noAgent: {
    'en-us': 'Current user does not have an agent assigned',
    'ru-ru': 'Текущему пользователю не назначен агент',
    'es-es': 'El usuario actual no tiene un agente asignado',
    'fr-fr': "L'utilisateur actuel n'a pas d'agent attribué",
    'uk-ua': 'Поточний користувач не має призначеного агента',
    'de-ch': 'Dem aktuellen Benutzer ist kein Agent zugewiesen.',
  },
  noAgentDescription: {
    'en-us': 'Please log in as admin and assign an agent to this user',
    'ru-ru': `
      Пожалуйста, войдите в систему как администратор и назначьте агента этому
      пользователю.
    `,
    'es-es':
      'Iniciar sesión como administrador y asignar un agente a este usuario',
    'fr-fr': `
      Veuillez vous connecter en tant qu'administrateur et attribuer un agent à
      cet utilisateur
    `,
    'uk-ua': `
      Будь ласка, увійдіть як адміністратор і призначте агента цьому
      користувачеві
    `,
    'de-ch': `
      Bitte melden Sie sich als Administrator an und weisen Sie diesem Benutzer
      einen Agenten zu.
    `,
  },
  helloMessage: {
    'en-us': 'Hello, {userName:string}!',
    'ru-ru': 'Новый пароль',
    'es-es': '¡Hola, {userName:string}!',
    'fr-fr': 'Bonjour, {userName:string} !',
    'de-ch': 'Hallo, {userName:string}!',
    'uk-ua': 'Новий пароль',
  },
  oicWelcomeMessage: {
    'en-us': `
      You've been invited to associate an external login to your Specify user
      account. This will enable you to log in to Specify with your chosen
      provider going forward.
    `,
    'ru-ru': `
      Вам было предложено связать внешний логин с вашей учетной записью
      пользователя Specify. Это позволит вам в дальнейшем войти в систему
      Specify с выбранным вами провайдером.
    `,
    'es-es': `
      Se le ha invitado a asociar un inicio de sesión externo a su cuenta de
      usuario de Specify. Esto le permitirá en el futuro iniciar sesión en
      Specify con el proveedor elegido.
    `,
    'fr-fr': `
      Vous avez été invité à associer une connexion externe à votre compte
      utilisateur Specify. Cela vous permettra de vous connecter à Specify avec
      le fournisseur de votre choix à l'avenir.
    `,
    'uk-ua': `
      Вас запросили пов’язати зовнішній логін із вашим обліковим записом
      користувача Specify. Це дозволить вам увійти в систему Specify з вибраним
      постачальником надалі.
    `,
    'de-ch': `
      Sie wurden aufgefordert, Ihrem Specify-Benutzerkonto einen externen Login
      zuzuordnen. Dadurch können Sie sich künftig mit dem von Ihnen gewählten
      Anbieter bei Specify anmelden.
    `,
  },
  legacyLogin: {
    'en-us': 'Sign in with Specify Account',
    'ru-ru': 'Войдите, используя Указать учетную запись',
    'es-es': 'Iniciar sesión con una cuenta de Specify',
    'fr-fr': 'Connectez-vous avec Spécifier le compte',
    'uk-ua': 'Увійдіть за допомогою Вказати обліковий запис',
    'de-ch': 'Mit „Konto angeben“ anmelden',
  },
  unknownOicUser: {
    'en-us': `
      There is currently no Specify user associated with your
      {providerName:string} account. If you have a Specify user name and
      password, you can enter them below to associate that user with your
      {providerName:string} account for future logins.
    `,
    'ru-ru': `
      В настоящее время с вашей учетной записью {providerName:string} не связан
      ни один пользователь «Укажите». Если у вас есть имя пользователя и пароль
      «Укажите», вы можете ввести их ниже, чтобы связать этого пользователя с
      вашей учетной записью {providerName:string} для будущих входов в систему.
    `,
    'es-es': `
      Actualmente no hay ningún usuario de Specify asociado con su cuenta
      {providerName:string}. Si tiene un nombre de usuario y contraseña de
      Specify, puede ingresarlos a continuación para asociar ese usuario con su
      cuenta {providerName:string} para futuros inicios de sesión.
    `,
    'fr-fr': `
      Il n'y a actuellement aucun utilisateur Spécifier associé à votre compte
      {providerName:string}. Si vous disposez d'un nom d'utilisateur et d'un
      mot de passe Spécifier, vous pouvez les saisir ci-dessous pour associer
      cet utilisateur à votre compte {providerName:string} pour de futures
      connexions.
    `,
    'uk-ua': `
      Наразі немає жодного користувача, пов’язаного з вашим обліковим записом
      {providerName:string}. Якщо у вас є вказане ім’я користувача та пароль,
      ви можете ввести їх нижче, щоб пов’язати цього користувача з вашим
      обліковим записом {providerName:string} для майбутніх входів.
    `,
    'de-ch': `
      Derzeit ist Ihrem {providerName:string}-Konto kein Benutzer vom Typ
      „Specify“ zugeordnet. Wenn Sie einen Benutzernamen und ein Passwort vom
      Typ „Specify“ haben, können Sie diese unten eingeben, um diesen Benutzer
      bei zukünftigen Anmeldungen Ihrem {providerName:string}-Konto zuzuordnen.
    `,
  },
  generateMasterKey: {
    'en-us': 'Generate Master Key',
    'es-es': 'Generar clave maestra',
    'fr-fr': 'Générer la clé principale',
    'de-ch': 'Masterschlüssel generieren',
    'ru-ru': 'В учреждении должен быть хотя бы один администратор учреждения.',
    'uk-ua': 'У закладі має бути принаймні один адміністратор установи',
  },
  userPassword: {
    'en-us': 'User Password',
    'ru-ru': 'Пользовательский пароль',
    'es-es': 'Contraseña de usuario',
    'fr-fr': 'Mot de passe utilisateur',
    'uk-ua': 'Пароль користувача',
    'de-ch': 'Benutzer-Kennwort',
  },
  generate: {
    'en-us': 'Generate',
    'ru-ru': 'Генерировать',
    'es-es': 'Generar',
    'fr-fr': 'Générer',
    'uk-ua': 'Генерувати',
    'de-ch': 'Generieren',
  },
  masterKeyGenerated: {
    'en-us': 'Master key generated',
    'ru-ru': 'Мастер-ключ сгенерирован',
    'es-es': 'Clave maestra generada',
    'fr-fr': 'Clé principale générée',
    'uk-ua': 'Створено головний ключ',
    'de-ch': 'Hauptschlüssel wurde generiert',
  },
  masterKeyFieldLabel: {
    'en-us': 'Master Key',
    'ru-ru': 'Мастер ключ',
    'es-es': 'Clave maestra',
    'fr-fr': 'Clé principale',
    'uk-ua': 'Головний ключ',
    'de-ch': 'Hauptschlüssel',
  },
  incorrectPassword: {
    'en-us': 'Password was incorrect.',
    'ru-ru': 'Пароль был неправильным.',
    'es-es': 'La contraseña era incorrecta.',
    'fr-fr': 'Le mot de passe était incorrect.',
    'uk-ua': 'Пароль був невірний.',
    'de-ch': 'Das Passwort war falsch.',
  },
  noAccessToResource: {
    'en-us': `
      You do not have access to any {collectionTable:string} containing this
      resource through the currently logged in account
    `,
    'ru-ru': `
      У вас нет доступа ни к одному {collectionTable:string}, содержащему этот
      ресурс, через текущую учетную запись.
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
    'de-ch': 'Dieser Agent ist bereits einem anderen Benutzer zugeordnet.',
  },
  resourceInaccessible: {
    'en-us': `
      The requested resource cannot be accessed while logged into the current
      collection.
    `,
    'ru-ru': `
      Доступ к запрошенному ресурсу недоступен при входе в текущую коллекцию.
    `,
    'es-es': `
      No se puede acceder al recurso solicitado mientras se está conectado a la
      colección actual.
    `,
    'fr-fr': `
      La ressource demandée n’est pas accessible lorsque vous êtes connecté à la
      collection actuelle.
    `,
    'uk-ua': `
      Неможливо отримати доступ до запитуваного ресурсу під час входу в поточну
      колекцію.
    `,
    'de-ch': `
      Auf die angeforderte Ressource kann nicht zugegriffen werden, während Sie
      bei der aktuellen Sammlung angemeldet sind.
    `,
  },
  selectCollection: {
    'en-us': 'Select one of the following collections:',
    'ru-ru': 'Выберите одну из следующих коллекций:',
    'es-es': 'Seleccione una de las siguientes colecciones:',
    'uk-ua': 'Виберіть одну з наступних колекцій:',
    'de-ch': 'Wählen Sie eine der folgenden Sammlungen aus:',
    'fr-fr': "L'utilisateur actuel n'a pas d'agent attribué",
  },
  loginToProceed: {
    comment: 'Example: You can login to the Collection, to proceed:',
    'en-us': 'You can login to the {collectionTable:string}, to proceed:',
    'ru-ru':
      'Вы можете войти в систему {collectionTable:string}, чтобы продолжить:',
    'es-es': 'Puede iniciar sesión en {collectionTable:string} para continuar:',
    'fr-fr': `
      Vous pouvez vous connecter au {collectionTable:string}, pour procéder :
    `,
    'uk-ua': 'Ви можете увійти на {collectionTable:string}, щоб продовжити:',
    'de-ch': `
      Sie können sich beim {collectionTable:string} anmelden, um fortzufahren:
    `,
  },
  sessionTimeOut: {
    'en-us': 'Insufficient Privileges',
    'ru-ru': 'Недостаточно прав',
    'es-es': 'Privilegios insuficientes',
    'fr-fr': 'Privilèges insuffisants',
    'uk-ua': 'Недостатні привілеї',
    'de-ch': 'Keine ausreichenden Berechtigungen',
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
      No tiene privilegios suficientes para esa acción o se ha cerrado la sesión
      actual.
    `,
    'fr-fr': `
      Vous ne disposez pas de privilèges suffisants pour cette action ou votre
      session actuelle a été déconnectée.
    `,
    'uk-ua': `
      У вас немає достатніх привілеїв для цієї дії, або ваш поточний сеанс
      вийшов із системи.
    `,
    'de-ch': `
      Ihnen fehlen die erforderlichen Berechtigungen für diese Aktion oder Ihre
      aktuelle Sitzung wurde abgemeldet.
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
    'de-ch': 'KEINE ERLAUBNIS',
  },
  permissionDeniedError: {
    'en-us': 'Permission denied error',
    'ru-ru': 'Ошибка отказа в разрешении',
    'es-es': 'Error de permiso denegado',
    'fr-fr': "Erreur d'autorisation refusée",
    'uk-ua': 'Помилка дозволу заборонено',
    'de-ch': 'Fehler „Berechtigung verweigert“',
  },
  permissionDeniedDescription: {
    'en-us': `
      You don't have any policy or role that gives you permission to do the
      following action:
    `,
    'ru-ru': `
      У вас нет политики или роли, которая давала бы вам разрешение на
      выполнение следующих действий:
    `,
    'es-es': `
      No tiene ninguna política o función que le otorgue permiso para realizar
      la siguiente acción:
    `,
    'fr-fr': `
      Vous ne disposez d'aucune stratégie ou rôle qui vous autorise à effectuer
      l'action suivante :
    `,
    'uk-ua': `
      У вас немає жодної політики чи ролі, які дають вам дозвіл виконувати такі
      дії:
    `,
    'de-ch': `
      Sie verfügen über keine Richtlinie oder Rolle, die Ihnen die Berechtigung
      zur Ausführung der folgenden Aktion erteilt:
    `,
  },
  emptyRecordSetsReadOnly: {
    'en-us': 'Cannot open empty {recordSetTable:string} when in Read-Only mode',
    'es-es': `
      No se puede abrir {recordSetTable:string} vacío cuando está en modo de
      solo lectura
    `,
    'fr-fr': `
      Impossible d'ouvrir un {recordSetTable:string} vide en mode lecture seule
    `,
    'ru-ru': `
      Невозможно открыть пустой {recordSetTable:string} в режиме только для
      чтения.
    `,
    'uk-ua': `
      Неможливо відкрити порожній {recordSetTable:string} у режимі лише для
      читання
    `,
    'de-ch': `
      Leeres {recordSetTable:string} kann im schreibgeschützten Modus nicht
      geöffnet werden
    `,
  },
  permissionDeniedForUrl: {
    'en-us': 'Permission denied when accessing <url />',
    'ru-ru': 'Разрешение отклонено при доступе к <url />',
    'es-es': 'Permiso denegado al acceder a <url />',
    'fr-fr': "Autorisation refusée lors de l'accès à <url />",
    'uk-ua': 'У дозволі відмовлено під час доступу до <url />',
    'de-ch': 'Berechtigung beim Zugriff auf <url /> verweigert',
  },
  noAccessToCollections: {
    'en-us': `
      The logged in user has not been given access to any collections in this
      database. You must login as another user.
    `,
    'ru-ru': `
      Вошедшему в систему пользователю не предоставлен доступ ни к одной
      коллекции в этой базе данных. Вы должны войти в систему как другой
      пользователь.
    `,
    'es-es': `
      Al usuario que inició sesión no se le ha dado acceso a ninguna colección
      de esta base de datos. Debe iniciar sesión como otro usuario.
    `,
    'fr-fr': `
      L'utilisateur connecté n'a eu accès à aucune collection de cette base de
      données. Vous devez vous connecter en tant qu'autre utilisateur.
    `,
    'uk-ua': `
      Увійшовши в систему користувач не отримав доступ до жодної колекції в цій
      базі даних. Ви повинні увійти як інший користувач.
    `,
    'de-ch': `
      Dem angemeldeten Benutzer wurde kein Zugriff auf Sammlungen in dieser
      Datenbank gewährt. Sie müssen sich als anderer Benutzer anmelden.
    `,
  },
  userAccount: {
    'en-us': 'User Account',
    'ru-ru': 'Учетная запись пользователя',
    'es-es': 'Cuenta de usuario',
    'fr-fr': "Compte d'utilisateur",
    'uk-ua': 'Обліковий запис користувача',
    'de-ch': 'Benutzerkonto',
  },
  removeAdmin: {
    'en-us': 'Remove Admin',
    'ru-ru': 'Удалить администратора',
    'es-es': 'Eliminar administrador',
    'fr-fr': "Supprimer l'administrateur",
    'uk-ua': 'Видалити адміністратора',
    'de-ch': 'Administrator entfernen',
  },
  canNotRemoveYourself: {
    'en-us': 'You cannot revoke your own admin status',
    'ru-ru': 'Вы не можете отозвать свой собственный статус администратора',
    'es-es': 'No puede revocar su propio estatus de administrador',
    'fr-fr': "Vous ne pouvez pas révoquer votre propre statut d'administrateur",
    'uk-ua': 'Ви не можете відкликати свій статус адміністратора',
    'de-ch': 'Sie können Ihren eigenen Administratorstatus nicht widerrufen',
  },
  makeAdmin: {
    'en-us': 'Make Admin',
    'ru-ru': 'Сделать администратором',
    'es-es': 'Hacer administrador',
    'fr-fr': 'Faire administrateur',
    'uk-ua': 'Зробити адміністратором',
    'de-ch': 'Machen Admin',
  },
  saveUserFirst: {
    'en-us': 'Save user first',
    'ru-ru': 'Сначала сохраните пользователя',
    'es-es': 'Guardar usuario primero',
    'fr-fr': "Enregistrez d'abord l'utilisateur",
    'uk-ua': 'Спочатку збережіть користувача',
    'de-ch': 'Zuerst Benutzer speichern',
  },
  mustBeManager: {
    'en-us': 'User must be saved as Manager first',
    'ru-ru': `
      Пользовательские политики на уровне учреждения (применяются ко всем
      назначенным коллекциям)
    `,
    'es-es': 'El usuario debe guardarse primero como administrador',
    'de-ch': 'Der Benutzer muss zuerst als Manager gespeichert werden',
    'fr-fr': `
      Politiques personnalisées au niveau de l'établissement (s'appliquent à
      toutes les collections attribuées)
    `,
    'uk-ua': `
      Спеціальна політика на рівні установи (застосовується до всіх призначених
      колекцій)
    `,
  },
  users: {
    'en-us': 'User Accounts',
    'ru-ru': 'Учетные записи пользователей',
    'es-es': 'Cuentas de usuario',
    'fr-fr': 'Comptes utilisateur',
    'uk-ua': 'Облікові записи користувачів',
    'de-ch': 'Benutzerkonten',
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
    'de-ch': 'In diesem {institutionTable:string} definierte Benutzerkonten',
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
    'de-ch': 'Zugewiesene Benutzerkonten {collectionTable:string}',
  },
  setPassword: {
    'en-us': 'Set Password',
    'ru-ru': 'Установка пароля',
    'es-es': 'Establecer contraseña',
    'fr-fr': 'Définir le mot de passe',
    'uk-ua': 'Встановити пароль',
    'de-ch': 'Passwort festlegen',
  },
  passwordsDoNotMatchError: {
    'en-us': 'Passwords do not match.',
    'ru-ru': 'Пароли не совпадают.',
    'es-es': 'Las contraseñas no coinciden.',
    'fr-fr': 'Les mots de passe ne correspondent pas.',
    'uk-ua': 'Паролі не збігаються.',
    'de-ch': 'Passwörter stimmen nicht überein.',
  },
  confirmPassword: {
    'en-us': 'Confirm',
    'ru-ru': 'Подтверждать',
    'es-es': 'Confirmar',
    'fr-fr': 'Confirmer',
    'uk-ua': 'Підтвердити',
    'de-ch': 'Bestätigen',
  },
  collections: {
    'en-us': 'Collections',
    'ru-ru': 'Коллекции',
    'es-es': 'Colecciones',
    'fr-fr': 'Collections',
    'uk-ua': 'Колекції',
    'de-ch': 'Sammlungen',
  },
  configureCollectionAccess: {
    'en-us': 'Select user collection access',
    'ru-ru': 'Выберите доступ к коллекции пользователей',
    'es-es': 'Seleccionar acceso a la colección del usuario',
    'fr-fr': "Sélectionnez l'accès à la collection d'utilisateurs",
    'uk-ua': 'Виберіть доступ до колекції користувачів',
    'de-ch': 'Auswählen des Benutzersammlungszugriffs',
  },
  securityPanel: {
    'en-us': 'Security and Accounts',
    'es-es': 'Seguridad y cuentas',
    'fr-fr': 'Sécurité et comptes',
    'uk-ua': 'Безпека та облікові записи',
    'de-ch': 'Sicherheit und Konten',
    'ru-ru': 'Безопасность и учетные записи',
  },
  userRoleLibrary: {
    'en-us': 'Institution Library of Role Templates',
    'ru-ru': 'Библиотека шаблонов ролей учреждения',
    'es-es': 'Biblioteca institucional de plantillas de roles',
    'fr-fr': 'Bibliothèque institutionnelle de modèles de rôles',
    'uk-ua': 'Бібліотека шаблонів ролей установи',
    'de-ch': 'Institutionelle Bibliothek mit Rollenvorlagen',
  },
  userRoles: {
    'en-us': 'User Roles',
    'ru-ru': 'Роли пользователей',
    'es-es': 'Roles del usuario',
    'fr-fr': 'Rôles utilisateur',
    'uk-ua': 'Ролі користувачів',
    'de-ch': 'Benutzerregeln',
  },
  collectionUserRoles: {
    'en-us': '{collectionTable:string} User Roles',
    'ru-ru': '{collectionTable:string} Роли пользователей',
    'es-es': 'Roles de usuario de {collectionTable:string}',
    'fr-fr': '{collectionTable:string} Rôles des utilisateurs',
    'uk-ua': '{collectionTable:string} Ролі користувача',
    'de-ch': '{collectionTable:string} Benutzerrollen',
  },
  assignedUserRoles: {
    'en-us': 'Assigned User Roles',
    'es-es': 'Roles de usuario asignados',
    'fr-fr': 'Rôles utilisateur attribués',
    'uk-ua': 'Призначені ролі користувача',
    'de-ch': 'Zugewiesene Benutzerrollen',
    'ru-ru': 'Назначенные роли пользователей',
  },
  rolePolicies: {
    'en-us': 'Role Permission Policies',
    'ru-ru': 'Политики разрешений ролей',
    'es-es': 'Políticas de permisos',
    'fr-fr': "Politiques d'autorisation de rôle",
    'uk-ua': 'Політики дозволів на роль',
    'de-ch': 'Rollenberechtigungsrichtlinien',
  },
  userPolicies: {
    'en-us': 'User Permission Policies',
    'ru-ru': 'Политики разрешений пользователей',
    'es-es': 'Políticas de permisos de usuario',
    'fr-fr': "Politiques d'autorisation des utilisateurs",
    'uk-ua': 'Політика дозволів користувача',
    'de-ch': 'Richtlinien für Benutzerberechtigungen',
  },
  customUserPolices: {
    'en-us':
      'Custom Collection-level Policies (applies to this collection only)',
    'ru-ru': `
      Пользовательские политики на уровне коллекции (применимо только к этой
      коллекции)
    `,
    'es-es': `
      Políticas personalizadas a nivel de colección (sólo se aplican a esta
      colección)
    `,
    'fr-fr': `
      Stratégies personnalisées au niveau de la collection (s'applique
      uniquement à cette collection)
    `,
    'uk-ua':
      'Спеціальна політика на рівні колекції (стосується лише цієї колекції)',
    'de-ch': `
      Benutzerdefinierte Richtlinien auf Sammlungsebene (gilt nur für diese
      Sammlung)
    `,
  },
  role: {
    'en-us': 'Role',
    'ru-ru': 'Роль',
    'es-es': 'Rol',
    'fr-fr': 'Rôle',
    'uk-ua': 'Роль',
    'de-ch': 'Rolle',
  },
  read: {
    'en-us': 'Read',
    'ru-ru': 'Читать',
    'es-es': 'Leer',
    'fr-fr': 'Lire',
    'uk-ua': 'Прочитайте',
    'de-ch': 'Lesen',
  },
  userPermissionPreview: {
    'en-us': "User's Permission Profile (read-only)",
    'ru-ru': 'Профиль разрешений пользователя (только для чтения)',
    'es-es': 'Perfil de permisos del usuario (solo lectura)',
    'fr-fr': "Profil d'autorisation de l'utilisateur (lecture seule)",
    'uk-ua': 'Профіль дозволів користувача (тільки читання)',
    'de-ch': 'Berechtigungsprofil des Benutzers (schreibgeschützt)',
  },
  outOfDateWarning: {
    'en-us':
      'Note: preview may be out of date. Save changes to update the preview',
    'ru-ru': `
      Примечание: предварительный просмотр может быть устаревшим. Сохраните
      изменения, чтобы обновить предварительный просмотр.
    `,
    'es-es': `
      Nota: la vista previa puede estar desactualizada. Guarde los cambios para
      actualizar la vista previa
    `,
    'fr-fr': `
      Remarque : l'aperçu peut être obsolète. Enregistrez les modifications pour
      mettre à jour l'aperçu
    `,
    'uk-ua': `
      Примітка: попередній перегляд може бути застарілим. Збережіть зміни, щоб
      оновити попередній перегляд
    `,
    'de-ch': `
      Hinweis: Die Vorschau ist möglicherweise veraltet. Speichern Sie die
      Änderungen, um die Vorschau zu aktualisieren
    `,
  },
  allUsers: {
    'en-us': 'All Users',
    'ru-ru': 'Все пользователи',
    'es-es': 'Todos los usuarios',
    'fr-fr': 'Tous les utilisateurs',
    'uk-ua': 'Всі користувачі',
    'de-ch': 'Alle Nutzer',
  },
  thisUser: {
    'en-us': 'This user',
    'ru-ru': 'Этот пользователь',
    'es-es': 'Este usuario',
    'fr-fr': 'Cet utilisateur',
    'uk-ua': 'Цей користувач',
    'de-ch': 'Dieser Benutzer',
  },
  action: {
    'en-us': 'Action',
    'ru-ru': 'Действие',
    'es-es': 'Acción',
    'fr-fr': 'Action',
    'uk-ua': 'Дія',
    'de-ch': 'Aktion',
  },
  resource: {
    'en-us': 'Resource',
    'ru-ru': 'Ресурс',
    'es-es': 'Recurso',
    'fr-fr': 'Ressource',
    'uk-ua': 'Ресурс',
    'de-ch': 'Ressource',
  },
  allCollections: {
    'en-us': 'All Collections',
    'ru-ru': 'Все коллекции',
    'es-es': 'Todas las colecciones',
    'fr-fr': 'Toutes les collections',
    'uk-ua': 'Всі колекції',
    'de-ch': 'Optionen zur Kontoeinrichtung',
  },
  thisCollection: {
    'en-us': 'This collection',
    'ru-ru': 'Эта коллекция',
    'es-es': 'Esta colección',
    'fr-fr': 'Cette collection',
    'uk-ua': 'Ця колекція',
    'de-ch': 'Diese Sammlung',
  },
  allActions: {
    'en-us': 'All Actions',
    'ru-ru': 'Все действия',
    'es-es': 'Todas las acciones',
    'fr-fr': 'Toutes les actions',
    'uk-ua': 'Усі дії',
    'de-ch': 'Alle Aktionen',
  },
  collectionAccess: {
    'en-us': 'Enable Collection Access',
    'ru-ru': 'Включить доступ к коллекции',
    'es-es': 'Habilitar acceso a la colección',
    'fr-fr': "Autoriser l'accès à la collection",
    'uk-ua': 'Увімкнути доступ до колекції',
    'de-ch': 'Sammlungszugriff aktivieren',
  },
  createRole: {
    'en-us': 'Create Role',
    'ru-ru': 'Создать роль',
    'es-es': 'Crear rol',
    'fr-fr': 'Créer un rôle',
    'uk-ua': 'Створити роль',
    'de-ch': 'Rolle erstellen',
  },
  newRole: {
    'en-us': 'New Role',
    'ru-ru': 'Новая роль',
    'es-es': 'Nuevo rol',
    'fr-fr': 'Nouveau rôle',
    'uk-ua': 'Нова роль',
    'de-ch': 'Neue Rolle',
  },
  fromLibrary: {
    'en-us': 'From library:',
    'ru-ru': 'Из библиотеки:',
    'es-es': 'De la biblioteca:',
    'fr-fr': 'Depuis la bibliothèque :',
    'uk-ua': 'З бібліотеки:',
    'de-ch': 'Aus der Bibliothek:',
  },
  fromExistingRole: {
    'en-us': 'From an existing role:',
    'ru-ru': 'Из существующей роли:',
    'es-es': 'Desde un rol existente:',
    'fr-fr': "À partir d'un rôle existant :",
    'uk-ua': 'З наявної ролі:',
    'de-ch': 'Aus einer vorhandenen Rolle:',
  },
  createNewRoles: {
    'en-us': 'Create new roles:',
    'ru-ru': 'Создайте новые роли:',
    'es-es': 'Crear nuevos roles:',
    'fr-fr': 'Créez de nouveaux rôles :',
    'uk-ua': 'Створити нові ролі:',
    'de-ch': 'Neue Rollen erstellen:',
  },
  updateExistingRoles: {
    'en-us': 'Update existing roles:',
    'ru-ru': 'Обновите существующие роли:',
    'es-es': 'Actualizar roles existentes:',
    'fr-fr': 'Mettre à jour les rôles existants :',
    'uk-ua': 'Оновіть наявні ролі:',
    'de-ch': 'Vorhandene Rollen aktualisieren:',
  },
  unchangedRoles: {
    'en-us': 'Unchanged roles:',
    'ru-ru': 'Неизменные роли:',
    'es-es': 'Roles sin cambios:',
    'fr-fr': 'Rôles inchangés :',
    'uk-ua': 'Незмінні ролі:',
    'de-ch': 'Unveränderte Rollen:',
  },
  institutionAdmin: {
    'en-us': 'Institution Admin',
    'ru-ru': 'Администратор учреждения',
    'es-es': 'Administrador de la institución',
    'fr-fr': "Administrateur de l'établissement",
    'uk-ua': 'Адмін закладу',
    'de-ch': 'Institutionsadministrator',
  },
  createInviteLink: {
    'en-us': 'Create Invite Link',
    'ru-ru': 'Создать ссылку для приглашения',
    'es-es': 'Crear enlace de invitación',
    'fr-fr': "Créer un lien d'invitation",
    'uk-ua': 'Створити посилання для запрошення',
    'de-ch': 'Einladungslink erstellen',
  },
  userInviteLink: {
    'en-us': 'User Invite Link',
    'ru-ru': 'Ссылка для приглашения пользователя',
    'es-es': 'Enlace de invitación de usuario',
    'fr-fr': "Lien d'invitation utilisateur",
    'uk-ua': 'Посилання для запрошення користувача',
    'de-ch': 'Link zur Benutzereinladung',
  },
  userInviteLinkDescription: {
    'en-us': `
      Send the following link to {userName:string} to allow them to log in for
      the first time.
    `,
    'ru-ru': `
      Отправьте следующую ссылку на {userName:string}, чтобы позволить им войти
      в систему в первый раз.
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
    'de-ch': 'Ausgeschlossene institutionelle Richtlinien:',
  },
  noProvidersForUserInviteLink: {
    'en-us': `
      No external identity provider is configured. You can configure some in
      Specify 7 server settings
    `,
    'ru-ru': `
      Внешний поставщик удостоверений не настроен. Некоторые настройки можно
      настроить в разделе «Укажите 7 настроек сервера».
    `,
    'es-es': `
      No hay configurado ningún proveedor de identidad externo. Puede configurar
      algunos en configuraciones de servidor de Specify 7
    `,
    'fr-fr': `
      Aucun fournisseur d'identité externe n'est configuré. Vous pouvez en
      configurer certains dans les paramètres du serveur de Specify 7
    `,
    'uk-ua': `
      Жодного зовнішнього постачальника ідентифікаційної інформації не
      налаштовано. Ви можете налаштувати деякі параметри сервера Specify 7
    `,
    'de-ch': `
      Es ist kein externer Identitätsanbieter konfiguriert. Sie können einige in
      den 7 Servereinstellungen konfigurieren.
    `,
  },
  legacyPermissions: {
    'en-us': 'Specify 6 Permissions',
    'ru-ru': 'Укажите 6 разрешений',
    'es-es': 'Permisos de Specify 6',
    'fr-fr': 'Autorisations de Specify 6',
    'uk-ua': 'Вкажіть 6 дозволів',
    'de-ch': 'Geben Sie 6 Berechtigungen an',
  },
  setPasswordBeforeSavePrompt: {
    'en-us': `
      Consider setting a password for this user. Users without a password won't
      be able to sign in
    `,
    'ru-ru': `
      Рассмотрите возможность установки пароля для этого пользователя.
      Пользователи без пароля не смогут войти в систему
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
    'de-ch': `
      Erwägen Sie, für diesen Benutzer ein Passwort festzulegen. Benutzer ohne
      Passwort können sich nicht anmelden.
    `,
  },
  setCollections: {
    'en-us': 'Set Collections',
    'ru-ru': 'Коллекции наборов',
    'es-es': 'Establecer colecciones',
    'fr-fr': 'Définir les collections',
    'uk-ua': 'Набір колекцій',
    'de-ch': 'Sammlungen festlegen',
  },
  agentInUse: {
    'en-us': 'This agent is already associated with a different user.',
    'ru-ru': 'Этот агент уже связан с другим пользователем.',
    'es-es': 'Este agente ya está asociado con un usuario diferente.',
    'fr-fr': 'Cet agent est déjà associé à un autre utilisateur.',
    'uk-ua': 'Цей агент уже пов’язаний з іншим користувачем.',
    'de-ch': 'Dieser Agent ist bereits einem anderen Benutzer zugeordnet.',
  },
  setAgentsBeforeProceeding: {
    'en-us': 'Please set the following agents before proceeding:',
    'ru-ru': 'Прежде чем продолжить, установите следующие агенты:',
    'es-es': 'Configure los siguientes agentes antes de continuar:',
    'uk-ua': 'Перш ніж продовжити, установіть такі агенти:',
    'de-ch':
      'Bitte legen Sie die folgenden Agenten fest, bevor Sie fortfahren:',
    'fr-fr': `
      L'utilisateur connecté n'a eu accès à aucune collection de cette base de
      données. Vous devez vous connecter en tant qu'autre utilisateur.
    `,
  },
  externalIdentityProviders: {
    'en-us': 'External identity providers:',
    'es-es': 'Proveedores de identidad externos:',
    'fr-fr': "Fournisseurs d'identité externes :",
    'de-ch': 'Wählen Sie eine der folgenden Sammlungen aus:',
    'ru-ru': 'Выберите одну из следующих коллекций:',
    'uk-ua': 'Виберіть одну з наступних колекцій:',
  },
  allTables: {
    'en-us': 'All tables',
    'ru-ru': 'Все столы',
    'es-es': 'Todas las tablas',
    'fr-fr': 'Tous les tableaux',
    'uk-ua': 'Всі столи',
    'de-ch': 'Alle Tabellen',
  },
  loadingAdmins: {
    'en-us': 'Loading admins...',
    'ru-ru': 'Загрузка администраторов...',
    'es-es': 'Cargando administradores...',
    'fr-fr': 'Chargement des administrateurs…',
    'uk-ua': 'Завантаження адміністраторів...',
    'de-ch': 'Administratoren werden geladen …',
  },
  specifyAdmin: {
    comment: 'Shown next to user name for admin users',
    'en-us': '(Specify 7 Admin)',
    'ru-ru': '(Указать 7 Админ)',
    'es-es': '(Administradores de Specify 7)',
    'fr-fr': '(Spécifiez 7 Administrateur)',
    'uk-ua': '(Вкажіть 7 адміністраторів)',
    'de-ch': '(Geben Sie 7 Admins an)',
  },
  legacyAdmin: {
    comment: 'Shown next to user name for admin users',
    'en-us': '(Specify 6 Admin)',
    'ru-ru': '(Укажите 6 администраторов)',
    'es-es': '(Administradores de Specify 6)',
    'fr-fr': '(Spécifiez 6 Administrateur)',
    'uk-ua': '(Вкажіть 6 адміністраторів)',
    'de-ch': '(Geben Sie 6 Admins an)',
  },
  deleteRoleWithUsers: {
    'en-us': 'Delete role that has users?',
    'ru-ru': 'Удалить роль, в которой есть пользователи?',
    'es-es': '¿Eliminar rol que tiene usuarios?',
    'fr-fr': 'Supprimer le rôle comportant des utilisateurs ?',
    'uk-ua': 'Видалити роль, яка має користувачів?',
    'de-ch': 'Rolle löschen, die Benutzer hat?',
  },
  deleteRoleWithUsersDescription: {
    'en-us': 'Users will not be deleted, but they would lose this role.',
    'ru-ru': 'Пользователи не будут удалены, но потеряют эту роль.',
    'es-es': 'Los usuarios no serán eliminados, pero perderán este rol.',
    'fr-fr':
      'Les utilisateurs ne seront pas supprimés, mais ils perdront ce rôle.',
    'uk-ua': 'Користувачів не буде видалено, але вони втратять цю роль.',
    'de-ch': 'Benutzer werden nicht gelöscht, verlieren jedoch diese Rolle.',
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
      Políticas personalizadas a nivel de Institución (se aplican a todas las
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
    'de-ch': `
      Benutzerdefinierte Richtlinien auf Institutionsebene (gilt für alle
      zugewiesenen Sammlungen)
    `,
  },
  cantRemoveLastAdmin: {
    'en-us': "Can't remove Institution Admin status",
    'ru-ru': 'Невозможно удалить статус администратора учреждения.',
    'es-es':
      'No se puede eliminar el estatus de Administrador de la Institución',
    'fr-fr':
      "Impossible de supprimer le statut d'administrateur de l'établissement",
    'uk-ua': 'Неможливо видалити статус адміністратора установи',
    'de-ch': 'Der Institutionsadministratorstatus kann nicht entfernt werden',
  },
  cantRemoveLastAdminDescription: {
    'en-us': 'There must be at least one Institution Admin in institution',
    'ru-ru': 'В учреждении должен быть хотя бы один администратор учреждения.',
    'es-es': `
      En la Institución debe haber al menos un Administrador de la Institución
    `,
    'fr-fr': `
      Il doit y avoir au moins un administrateur d'établissement dans
      l'établissement
    `,
    'uk-ua': 'У закладі має бути принаймні один адміністратор установи',
    'de-ch': `
      Es muss mindestens einen Institutionsadministrator in der Institution
      geben
    `,
  },
  switchToHorizontalLayout: {
    'en-us': 'Switch to horizontal layout',
    'ru-ru': 'Переключиться на горизонтальную раскладку',
    'es-es': 'Cambiar a diseño horizontal',
    'fr-fr': "Passer à l'affichage horizontal",
    'uk-ua': 'Перейти до горизонтального розташування',
    'de-ch': 'Zum horizontalen Layout wechseln',
  },
  switchToVerticalLayout: {
    'en-us': 'Switch to vertical layout',
    'ru-ru': 'Сначала сохраните пользователя',
    'es-es': 'Cambiar al diseño vertical',
    'fr-fr': "Passer à l'affichage vertical",
    'de-ch': 'Zum vertikalen Layout wechseln',
    'uk-ua': 'Спочатку збережіть користувача',
  },
  advancedTables: {
    'en-us': 'Advanced tables',
    'ru-ru': 'Расширенные таблицы',
    'es-es': 'Tablas avanzadas',
    'fr-fr': 'Tableaux avancés',
    'uk-ua': 'Розширені таблиці',
    'de-ch': 'Erweiterte Tabellen',
  },
  excludedInstitutionalPolicies: {
    'en-us': 'Excluded institutional policies:',
    'ru-ru': 'Исключенные институциональные политики:',
    'es-es': 'Políticas institucionales excluidas:',
    'fr-fr': 'Politiques institutionnelles exclues :',
    'uk-ua': 'Виключені інституційні політики:',
    'de-ch': 'Ausgeschlossene institutionelle Richtlinien:',
  },
  excludedInstitutionalPoliciesDescription: {
    'en-us': `
      (Some policies that apply only at the institution-level are not present
      here at the collection-level.)
    `,
    'ru-ru': `
      (Некоторые политики, применимые только на уровне учреждения, здесь
      отсутствуют на уровне коллекции.)
    `,
    'es-es': `
      (Algunas políticas que se aplican solo a nivel de institución no están
      presentes aquí, a nivel de colección)
    `,
    'fr-fr': `
      (Certaines politiques qui s'appliquent uniquement au niveau de
      l'institution ne sont pas présentes ici au niveau de la collection.)
    `,
    'uk-ua': `
      (Деякі політики, які застосовуються лише на рівні установи, відсутні тут
      на рівні колекції.)
    `,
    'de-ch': `
      (Einige Richtlinien, die nur auf Institutionsebene gelten, sind hier auf
      Sammlungsebene nicht vorhanden.)
    `,
  },
  accountSetupOptions: {
    'en-us': 'Account Setup Options',
    'ru-ru': 'Параметры настройки учетной записи',
    'es-es': 'Opciones de configuración de cuenta',
    'fr-fr': 'Options de configuration du compte',
    'uk-ua': 'Параметри налаштування облікового запису',
    'de-ch': 'Optionen zur Kontoeinrichtung',
  },
  currentUser: {
    'en-us': 'Current User',
    'ru-ru': 'Текущий пользователь',
    'de-ch': 'Aktueller Benutzer',
    'es-es': 'Usuario actual',
    'fr-fr': 'Utilisateur actuel',
    'uk-ua': 'Поточний користувач',
  },
  addRole: {
    'en-us': 'Add Role',
    'de-ch': 'Rolle hinzufügen',
    'es-es': 'Agregar rol',
    'fr-fr': 'Ajouter un rôle',
    'ru-ru': 'Добавить роль',
    'uk-ua': 'Додати роль',
  },
  addUser: {
    'en-us': 'Add User',
    'de-ch': 'Benutzer hinzufügen',
    'es-es': 'Agregar usuario',
    'fr-fr': 'Ajouter un utilisateur',
    'ru-ru': 'Политики разрешений ролей',
    'uk-ua': 'Політики дозволів на роль',
  },
} as const);
