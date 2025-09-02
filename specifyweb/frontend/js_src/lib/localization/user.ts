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
    'pt-br': 'Conecte-se',
  },
  username: {
    'en-us': 'Username',
    'ru-ru': 'Имя пользователя',
    'es-es': 'Nombre de usuario',
    'fr-fr': "Nom d'utilisateur",
    'uk-ua': "Ім'я користувача",
    'de-ch': 'Benutzername',
    'pt-br': 'Nome de usuário',
  },
  password: {
    'en-us': 'Password',
    'ru-ru': 'Пароль',
    'es-es': 'Contraseña',
    'fr-fr': 'Mot de passe',
    'uk-ua': 'Пароль',
    'de-ch': 'Kennwort',
    'pt-br': 'Senha',
  },
  collectionAccessDenied: {
    'en-us': 'You do not have access to this collection',
    'ru-ru': 'У вас нет доступа к этой коллекции',
    'es-es': 'No tiene acceso a esta colección',
    'fr-fr': "Vous n'avez pas accès à cette collection",
    'uk-ua': 'У вас немає доступу до цієї колекції',
    'de-ch': 'Sie haben keinen Zugang zu dieser Sammlung',
    'pt-br': 'Você não tem acesso a esta coleção',
  },
  collectionAccessDeniedDescription: {
    'en-us':
      'The currently logged in account does not have access to the {collectionName:string} collection.',
    'ru-ru':
      'Текущая учетная запись не имеет доступа к коллекции {collectionName:string}.',
    'es-es':
      'La cuenta actualmente iniciada no tiene acceso a la colección {collectionName:string}.',
    'fr-fr':
      "Le compte actuellement connecté n'a pas accès à la collection {collectionName:string}.",
    'uk-ua':
      'Поточний обліковий запис, у який ви ввійшли, не має доступу до колекції {collectionName:string}.',
    'de-ch':
      'Das aktuell angemeldete Konto hat keinen Zugriff auf die {collectionName:string}-Sammlung.',
    'pt-br':
      'A conta atualmente conectada não tem acesso à coleção {collectionName:string}.',
  },
  changePassword: {
    'en-us': 'Change Password',
    'ru-ru': 'Изменить пароль',
    'es-es': 'Cambiar la contraseña',
    'fr-fr': 'Modifier le mot de passe',
    'uk-ua': 'Змінити пароль',
    'de-ch': 'Kennwort ändern',
    'pt-br': 'Alterar a senha',
  },
  oldPassword: {
    'en-us': 'Old password',
    'ru-ru': 'Старый пароль',
    'es-es': 'Contraseña anterior',
    'fr-fr': 'Mot de passe actuel',
    'uk-ua': 'Старий пароль',
    'de-ch': 'Altes Kennwort',
    'pt-br': 'Senha Antiga',
  },
  newPassword: {
    'en-us': 'New password',
    'ru-ru': 'Новый пароль',
    'es-es': 'Nueva contraseña',
    'fr-fr': 'Nouveau mot de passe',
    'uk-ua': 'Новий пароль',
    'de-ch': 'Neues Kennwort',
    'pt-br': 'Nova Senha',
  },
  repeatPassword: {
    'en-us': 'Repeat new password',
    'ru-ru': 'Повторите новый пароль',
    'es-es': 'repita la nueva contraseña',
    'fr-fr': 'Répéter le nouveau mot de passe',
    'uk-ua': 'Повторіть новий пароль',
    'de-ch': 'Wiederhole das neue Kennwort',
    'pt-br': 'Repita a nova senha',
  },
  logOut: {
    'en-us': 'Log Out',
    'ru-ru': 'Выйти',
    'es-es': 'Cerrar sesión',
    'fr-fr': 'Se déconnecter',
    'uk-ua': 'Вийти',
    'de-ch': 'Ausloggen',
    'pt-br': 'Sair',
  },
  setUserAgents: {
    'en-us': 'Set User Agents',
    'ru-ru': 'Установить пользовательские агенты',
    'es-es': 'Establecer agentes usuarios',
    'fr-fr': 'Définir les agents utilisateurs',
    'uk-ua': 'Налаштування агентів користувачів',
    'de-ch': 'Benutzeragenten festlegen',
    'pt-br': 'Definir agentes de usuário',
  },
  noAgent: {
    'en-us': 'Current user does not have an agent assigned',
    'ru-ru': 'Текущий пользователь не имеет назначенного агента.',
    'es-es': 'El usuario actual no tiene un agente asignado',
    'fr-fr': "L'utilisateur actuel n'a pas d'agent attribué",
    'uk-ua': 'Поточному користувачеві не призначено агента',
    'de-ch': 'Dem aktuellen Benutzer ist kein Agent zugewiesen',
    'pt-br': 'O usuário atual não tem um agente atribuído',
  },
  noAgentDescription: {
    'en-us': 'Please log in as admin and assign an agent to this user',
    'ru-ru':
      'Пожалуйста, войдите в систему как администратор и назначьте агента этому пользователю.',
    'es-es':
      'Iniciar sesión como administrador y asignar un agente a este usuario',
    'fr-fr':
      "Veuillez vous connecter en tant qu'administrateur et attribuer un agent à cet utilisateur",
    'uk-ua':
      'Будь ласка, увійдіть як адміністратор і призначте агента цьому користувачеві',
    'de-ch':
      'Bitte melden Sie sich als Administrator an und weisen Sie diesem Benutzer einen Agenten zu',
    'pt-br':
      'Por favor, faça login como administrador e atribua um agente a este usuário',
  },
  helloMessage: {
    'en-us': 'Hello, {userName:string}!',
    'ru-ru': 'Привет, {userName:string}!',
    'es-es': '¡Hola, {userName:string}!',
    'fr-fr': 'Bonjour, {userName:string} !',
    'de-ch': 'Hallo, {userName:string}!',
    'uk-ua': 'Привіт, {userName:string}!',
    'pt-br': 'Olá, {userName:string}!',
  },
  oicWelcomeMessage: {
    'en-us':
      "You've been invited to associate an external login to your Specify user account. This will enable you to log in to Specify with your chosen provider going forward.",
    'ru-ru':
      'Вам предложено связать внешний логин с вашей учётной записью Specify. Это позволит вам в дальнейшем входить в Specify через выбранного вами провайдера.',
    'es-es':
      'Se le ha invitado a asociar un inicio de sesión externo a su cuenta de usuario de Specify. Esto le permitirá en el futuro iniciar sesión en Specify con el proveedor elegido.',
    'fr-fr':
      'Vous avez été invité à associer un identifiant externe à votre compte utilisateur Specify. Cela vous permettra de vous connecter à Specify avec le fournisseur de votre choix.',
    'uk-ua':
      'Вам запропоновано пов’язати зовнішній логін із вашим обліковим записом користувача Specify. Це дозволить вам надалі входити в Specify за допомогою обраного вами постачальника.',
    'de-ch':
      'Sie wurden aufgefordert, Ihrem Specify-Benutzerkonto einen externen Login zuzuordnen. Dadurch können Sie sich künftig mit Ihrem gewählten Anbieter bei Specify anmelden.',
    'pt-br':
      'Você foi convidado a associar um login externo à sua conta de usuário do Specify. Isso permitirá que você faça login no Specify com o provedor escolhido a partir de agora.',
  },
  legacyLogin: {
    'en-us': 'Sign in with Specify Account',
    'ru-ru': 'Войти, указав учетную запись',
    'es-es': 'Iniciar sesión con una cuenta de Specify',
    'fr-fr': 'Connectez-vous avec un compte spécifié',
    'uk-ua': 'Увійти за допомогою Вказати обліковий запис',
    'de-ch': 'Mit „Konto angeben“ anmelden',
    'pt-br': 'Entrar com Especificar Conta',
  },
  unknownOicUser: {
    'en-us':
      'There is currently no Specify user associated with your {providerName:string} account. If you have a Specify user name and password, you can enter them below to associate that user with your {providerName:string} account for future logins.',
    'ru-ru':
      'В настоящее время с вашей учётной записью {providerName:string} не связан пользователь «Specified». Если у вас есть имя пользователя и пароль «Specified», введите их ниже, чтобы связать этого пользователя с вашей учётной записью {providerName:string} для последующих входов в систему.',
    'es-es':
      'Actualmente no hay ningún usuario de Specify asociado con su cuenta {providerName:string}. Si tiene un nombre de usuario y contraseña de Specify, puede ingresarlos a continuación para asociar ese usuario con su cuenta {providerName:string} para futuros inicios de sesión.',
    'fr-fr':
      "Aucun utilisateur spécifié n'est actuellement associé à votre compte {providerName:string}. Si vous possédez un nom d'utilisateur et un mot de passe spécifiés, saisissez-les ci-dessous pour associer cet utilisateur à votre compte {providerName:string} lors de vos prochaines connexions.",
    'uk-ua':
      'Наразі з вашим обліковим записом {providerName:string} не пов’язано жодного користувача типу «Вказати». Якщо у вас є ім’я користувача та пароль типу «Вказати», ви можете ввести їх нижче, щоб пов’язати цього користувача з вашим обліковим записом {providerName:string} для майбутніх входів.',
    'de-ch':
      'Derzeit ist Ihrem {providerName:string}-Konto kein Benutzer zugewiesen. Wenn Sie über einen Benutzernamen und ein Kennwort verfügen, können Sie diese unten eingeben, um diesen Benutzer für zukünftige Anmeldungen Ihrem {providerName:string}-Konto zuzuweisen.',
    'pt-br':
      'Atualmente, não há nenhum usuário específico associado à sua conta {providerName:string}. Se você tiver um nome de usuário e uma senha específicos, poderá inseri-los abaixo para associar esse usuário à sua conta {providerName:string} para logins futuros.',
  },
  generateMasterKey: {
    'en-us': 'Generate Master Key',
    'es-es': 'Generar clave maestra',
    'fr-fr': 'Générer la clé principale',
    'de-ch': 'Masterschlüssel generieren',
    'ru-ru': 'Сгенерировать главный ключ',
    'uk-ua': 'Згенерувати головний ключ',
    'pt-br': 'Gerar Chave Mestra',
  },
  userPassword: {
    'en-us': 'User Password',
    'ru-ru': 'Пароль пользователя',
    'es-es': 'Contraseña de usuario',
    'fr-fr': 'Mot de passe utilisateur',
    'uk-ua': 'Пароль користувача',
    'de-ch': 'Benutzer-Kennwort',
    'pt-br': 'Senha do usuário',
  },
  generate: {
    'en-us': 'Generate',
    'ru-ru': 'Генерировать',
    'es-es': 'Generar',
    'fr-fr': 'Générer',
    'uk-ua': 'Згенерувати',
    'de-ch': 'Generieren',
    'pt-br': 'Gerar',
  },
  masterKeyGenerated: {
    'en-us': 'Master key generated',
    'ru-ru': 'Мастер-ключ сгенерирован',
    'es-es': 'Clave maestra generada',
    'fr-fr': 'Clé principale générée',
    'uk-ua': 'Згенеровано головний ключ',
    'de-ch': 'Hauptschlüssel wurde generiert',
    'pt-br': 'Chave mestra gerada',
  },
  masterKeyFieldLabel: {
    'en-us': 'Master Key',
    'ru-ru': 'Мастер-ключ',
    'es-es': 'Clave maestra',
    'fr-fr': 'Clé principale',
    'uk-ua': 'Головний ключ',
    'de-ch': 'Hauptschlüssel',
    'pt-br': 'Chave Mestra',
  },
  incorrectPassword: {
    'en-us': 'Password was incorrect.',
    'ru-ru': 'Пароль был неверным.',
    'es-es': 'La contraseña era incorrecta.',
    'fr-fr': 'Le mot de passe était incorrect.',
    'uk-ua': 'Пароль був неправильним.',
    'de-ch': 'Das Passwort war falsch.',
    'pt-br': 'A senha estava incorreta.',
  },
  noAccessToResource: {
    'en-us':
      'You do not have access to any {collectionTable:string} containing this resource through the currently logged in account',
    'ru-ru':
      'У вас нет доступа к {collectionTable:string}, содержащим этот ресурс, через текущую учетную запись.',
    'es-es':
      'No tiene acceso a ningún {collectionTable:string} que contenga este recurso a través de la cuenta actualmente iniciada',
    'fr-fr':
      "Vous n'avez accès à aucun {collectionTable:string} contenant cette ressource via le compte actuellement connecté",
    'uk-ua':
      'Ви не маєте доступу до жодного {collectionTable:string}, що містить цей ресурс, через обліковий запис, у який ви зараз увійшли',
    'de-ch':
      'Sie haben über das aktuell angemeldete Konto keinen Zugriff auf {collectionTable:string}, das diese Ressource enthält',
    'pt-br':
      'Você não tem acesso a nenhum {collectionTable:string} contendo este recurso por meio da conta atualmente conectada',
  },
  resourceInaccessible: {
    'en-us':
      'The requested resource cannot be accessed while logged into the current collection.',
    'ru-ru':
      'Запрошенный ресурс не может быть доступен во время входа в текущую коллекцию.',
    'es-es':
      'No se puede acceder al recurso solicitado mientras se está conectado a la colección actual.',
    'fr-fr':
      "La ressource demandée n'est pas accessible lorsque vous êtes connecté à la collection actuelle.",
    'uk-ua': 'Запитаний ресурс недоступний під час входу в поточну колекцію.',
    'de-ch':
      'Auf die angeforderte Ressource kann nicht zugegriffen werden, während Sie bei der aktuellen Sammlung angemeldet sind.',
    'pt-br':
      'O recurso solicitado não pode ser acessado enquanto estiver conectado à coleção atual.',
  },
  selectCollection: {
    'en-us': 'Select one of the following collections:',
    'ru-ru': 'Выберите одну из следующих коллекций:',
    'es-es': 'Seleccione una de las siguientes colecciones:',
    'uk-ua': 'Виберіть одну з наступних колекцій:',
    'de-ch': 'Wählen Sie eine der folgenden Sammlungen aus:',
    'fr-fr': "Sélectionnez l'une des collections suivantes :",
    'pt-br': 'Selecione uma das seguintes coleções:',
  },
  loginToProceed: {
    comment: 'Example: You can login to the Collection, to proceed:',
    'en-us': 'You can login to the {collectionTable:string}, to proceed:',
    'ru-ru': 'Вы можете войти в {collectionTable:string}, чтобы продолжить:',
    'es-es': 'Puede iniciar sesión en {collectionTable:string} para continuar:',
    'fr-fr':
      'Vous pouvez vous connecter au {collectionTable:string} pour continuer :',
    'uk-ua': 'Ви можете увійти до {collectionTable:string}, щоб продовжити:',
    'de-ch':
      'Sie können sich bei {collectionTable:string} anmelden, um fortzufahren:',
    'pt-br':
      'Você pode fazer login no {collectionTable:string}, para prosseguir:',
  },
  sessionTimeOut: {
    'en-us': 'Insufficient Privileges',
    'ru-ru': 'Недостаточно привилегий',
    'es-es': 'Privilegios insuficientes',
    'fr-fr': 'Privilèges insuffisants',
    'uk-ua': 'Недостатньо привілеїв',
    'de-ch': 'Unzureichende Berechtigungen',
    'pt-br': 'Privilégios Insuficientes',
  },
  sessionTimeOutDescription: {
    'en-us':
      'You lack sufficient privileges for that action, or your current session has been logged out.',
    'ru-ru':
      'У вас недостаточно прав для этого действия, или ваш текущий сеанс был завершен.',
    'es-es':
      'No tiene privilegios suficientes para esa acción o se ha cerrado la sesión actual.',
    'fr-fr':
      'Vous ne disposez pas des privilèges suffisants pour cette action ou votre session actuelle a été déconnectée.',
    'uk-ua':
      'У вас недостатньо прав для цієї дії, або ваш поточний сеанс завершено.',
    'de-ch':
      'Ihnen fehlen die erforderlichen Berechtigungen für diese Aktion oder Ihre aktuelle Sitzung wurde abgemeldet.',
    'pt-br':
      'Você não tem privilégios suficientes para essa ação ou sua sessão atual foi desconectada.',
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
    'uk-ua': 'ДОЗВІЛУ НЕ ПОТРІБНО',
    'de-ch': 'KEINE ERLAUBNIS',
    'pt-br': 'SEM PERMISSÃO',
  },
  permissionDeniedError: {
    'en-us': 'Permission denied error',
    'ru-ru': 'Ошибка «Отказано в доступе»',
    'es-es': 'Error de permiso denegado',
    'fr-fr': "Erreur d'autorisation refusée",
    'uk-ua': 'Помилка відмови у доступі',
    'de-ch': 'Fehler „Berechtigung verweigert“',
    'pt-br': 'Erro de permissão negada',
  },
  permissionDeniedDescription: {
    'en-us':
      "You don't have any policy or role that gives you permission to do the following action:",
    'ru-ru':
      'У вас нет политики или роли, которая дает вам разрешение на выполнение следующих действий:',
    'es-es':
      'No tiene ninguna política o función que le otorgue permiso para realizar la siguiente acción:',
    'fr-fr':
      "Vous ne disposez d'aucune politique ni d'aucun rôle vous autorisant à effectuer l'action suivante :",
    'uk-ua':
      'У вас немає жодної політики чи ролі, яка б давала вам дозвіл на виконання наступної дії:',
    'de-ch':
      'Sie verfügen über keine Richtlinie oder Rolle, die Ihnen die Berechtigung zur Ausführung der folgenden Aktion erteilt:',
    'pt-br':
      'Você não tem nenhuma política ou função que lhe dê permissão para executar a seguinte ação:',
  },
  emptyRecordSetsReadOnly: {
    'en-us': 'Cannot open empty {recordSetTable:string} when in Read-Only mode',
    'es-es':
      'No se puede abrir {recordSetTable:string} vacío cuando está en modo de solo lectura',
    'fr-fr':
      "Impossible d'ouvrir un {recordSetTable:string} vide en mode lecture seule",
    'ru-ru':
      'Невозможно открыть пустой {recordSetTable:string} в режиме «Только чтение»',
    'uk-ua':
      'Не вдається відкрити порожній {recordSetTable:string} у режимі лише для читання',
    'de-ch':
      'Leeres {recordSetTable:string} kann im schreibgeschützten Modus nicht geöffnet werden',
    'pt-br':
      'Não é possível abrir {recordSetTable:string} vazio no modo somente leitura',
  },
  permissionDeniedForUrl: {
    'en-us': 'Permission denied when accessing <url />',
    'ru-ru': 'Отказано в доступе при доступе <url />',
    'es-es': 'Permiso denegado al acceder a <url />',
    'fr-fr': "Autorisation refusée lors de l'accès à <url />",
    'uk-ua': 'Відмовлено в доступі під час доступу до <url />',
    'de-ch': 'Zugriff verweigert beim Zugriff auf <url />',
    'pt-br': 'Permissão negada ao acessar <url />',
  },
  noAccessToCollections: {
    'en-us':
      'The logged in user has not been given access to any collections in this database. You must login as another user.',
    'ru-ru':
      'Вошедший в систему пользователь не имеет доступа ни к одной коллекции в этой базе данных. Вам необходимо войти как другой пользователь.',
    'es-es':
      'Al usuario que inició sesión no se le ha dado acceso a ninguna colección de esta base de datos. Debe iniciar sesión como otro usuario.',
    'fr-fr':
      "L'utilisateur connecté n'a accès à aucune collection de cette base de données. Vous devez vous connecter sous un autre nom d'utilisateur.",
    'uk-ua':
      'Користувач, який зареєстрований, не має доступу до жодної колекції в цій базі даних. Ви повинні увійти як інший користувач.',
    'de-ch':
      'Dem angemeldeten Benutzer wurde kein Zugriff auf Sammlungen in dieser Datenbank gewährt. Sie müssen sich als anderer Benutzer anmelden.',
    'pt-br':
      'O usuário logado não recebeu acesso a nenhuma coleção neste banco de dados. Você deve efetuar login como outro usuário.',
  },
  userAccount: {
    'en-us': 'User Account',
    'ru-ru': 'Учетная запись пользователя',
    'es-es': 'Cuenta de usuario',
    'fr-fr': 'Compte utilisateur',
    'uk-ua': 'Обліковий запис користувача',
    'de-ch': 'Benutzerkonto',
    'pt-br': 'Conta de usuário',
  },
  removeAdmin: {
    'en-us': 'Remove Admin',
    'ru-ru': 'Удалить администратора',
    'es-es': 'Eliminar administrador',
    'fr-fr': "Supprimer l'administrateur",
    'uk-ua': 'Видалити адміністратора',
    'de-ch': 'Administrator entfernen',
    'pt-br': 'Remover administrador',
  },
  canNotRemoveYourself: {
    'en-us': 'You cannot revoke your own admin status',
    'ru-ru': 'Вы не можете отозвать свой собственный статус администратора.',
    'es-es': 'No puede revocar su propio estatus de administrador',
    'fr-fr': "Vous ne pouvez pas révoquer votre propre statut d'administrateur",
    'uk-ua': 'Ви не можете скасувати свій власний статус адміністратора',
    'de-ch': 'Sie können Ihren eigenen Administratorstatus nicht widerrufen',
    'pt-br': 'Você não pode revogar seu próprio status de administrador',
  },
  makeAdmin: {
    'en-us': 'Make Admin',
    'ru-ru': 'Сделать администратором',
    'es-es': 'Hacer administrador',
    'fr-fr': 'Créer un administrateur',
    'uk-ua': 'Зробити адміністратором',
    'de-ch': 'Zum Administrator machen',
    'pt-br': 'Tornar administrador',
  },
  saveUserFirst: {
    'en-us': 'Save user first',
    'ru-ru': 'Сначала сохраните пользователя',
    'es-es': 'Guardar usuario primero',
    'fr-fr': "Enregistrer l'utilisateur en premier",
    'uk-ua': 'Спочатку збережіть користувача',
    'de-ch': 'Benutzer zuerst speichern',
    'pt-br': 'Salvar usuário primeiro',
  },
  mustBeManager: {
    'en-us': 'User must be saved as Manager first',
    'ru-ru': 'Сначала пользователь должен быть сохранен как менеджер.',
    'es-es': 'El usuario debe guardarse primero como administrador',
    'de-ch': 'Der Benutzer muss zuerst als Manager gespeichert werden',
    'fr-fr':
      "L'utilisateur doit d'abord être enregistré en tant que gestionnaire",
    'uk-ua': 'Спочатку користувача потрібно зберегти як менеджера',
    'pt-br': 'O usuário deve ser salvo como gerente primeiro',
  },
  users: {
    'en-us': 'User Accounts',
    'ru-ru': 'Учетные записи пользователей',
    'es-es': 'Cuentas de usuario',
    'fr-fr': "Comptes d'utilisateurs",
    'uk-ua': 'Облікові записи користувачів',
    'de-ch': 'Benutzerkonten',
    'pt-br': 'Contas de usuário',
  },
  institutionUsers: {
    'en-us': 'User Accounts Defined in this {institutionTable:string}',
    'ru-ru':
      'Учетные записи пользователей, определенные в этом {institutionTable:string}',
    'es-es': 'Cuentas de usuario definidas en este {institutionTable:string}',
    'fr-fr': "Comptes d'utilisateurs définis dans ce {institutionTable:string}",
    'uk-ua':
      'Облікові записи користувачів, визначені в цьому {institutionTable:string}',
    'de-ch': 'In diesem {institutionTable:string} definierte Benutzerkonten',
    'pt-br': 'Contas de usuário definidas neste {institutionTable:string}',
  },
  collectionUsers: {
    'en-us': 'User Accounts Assigned to this {collectionTable:string}',
    'ru-ru':
      'Учетные записи пользователей, назначенные этому {collectionTable:string}',
    'es-es': 'Cuentas de usuario asignadas a este {collectionTable:string}',
    'fr-fr': "Comptes d'utilisateurs attribués à ce {collectionTable:string}",
    'uk-ua':
      'Облікові записи користувачів, призначені цьому {collectionTable:string}',
    'de-ch': 'Diesem {collectionTable:string} zugewiesene Benutzerkonten',
    'pt-br': 'Contas de usuário atribuídas a este {collectionTable:string}',
  },
  setPassword: {
    'en-us': 'Set Password',
    'ru-ru': 'Установить пароль',
    'es-es': 'Establecer contraseña',
    'fr-fr': 'Définir le mot de passe',
    'uk-ua': 'Встановити пароль',
    'de-ch': 'Passwort festlegen',
    'pt-br': 'Definir senha',
  },
  passwordsDoNotMatchError: {
    'en-us': 'Passwords do not match.',
    'ru-ru': 'Пароли не совпадают.',
    'es-es': 'Las contraseñas no coinciden.',
    'fr-fr': 'Les mots de passe ne correspondent pas.',
    'uk-ua': 'Паролі не збігаються.',
    'de-ch': 'Die Passwörter stimmen nicht überein.',
    'pt-br': 'As senhas não coincidem.',
  },
  confirmPassword: {
    'en-us': 'Confirm',
    'ru-ru': 'Подтверждать',
    'es-es': 'Confirmar',
    'fr-fr': 'Confirmer',
    'uk-ua': 'Підтвердити',
    'de-ch': 'Bestätigen',
    'pt-br': 'Confirmar',
  },
  collections: {
    'en-us': 'Collections',
    'ru-ru': 'Коллекции',
    'es-es': 'Colecciones',
    'fr-fr': 'Collections',
    'uk-ua': 'Колекції',
    'de-ch': 'Sammlungen',
    'pt-br': 'Coleções',
  },
  configureCollectionAccess: {
    'en-us': 'Select user collection access',
    'ru-ru': 'Выберите доступ к коллекции пользователей',
    'es-es': 'Seleccionar acceso a la colección del usuario',
    'fr-fr': "Sélectionner l'accès à la collection d'utilisateurs",
    'uk-ua': 'Виберіть доступ до колекції користувачів',
    'de-ch': 'Auswählen des Benutzerzugriffs auf die Sammlung',
    'pt-br': 'Selecione o acesso à coleção de usuários',
  },
  securityPanel: {
    'en-us': 'Security and Accounts',
    'es-es': 'Seguridad y cuentas',
    'fr-fr': 'Sécurité et comptes',
    'uk-ua': 'Безпека та облікові записи',
    'de-ch': 'Sicherheit und Konten',
    'ru-ru': 'Безопасность и учетные записи',
    'pt-br': 'Segurança e Contas',
  },
  userRoleLibrary: {
    'en-us': 'Institution Library of Role Templates',
    'ru-ru': 'Библиотека шаблонов ролей учреждения',
    'es-es': 'Biblioteca institucional de plantillas de roles',
    'fr-fr': 'Bibliothèque institutionnelle de modèles de rôles',
    'uk-ua': 'Бібліотека шаблонів ролей установи',
    'de-ch': 'Institutionsbibliothek mit Rollenvorlagen',
    'pt-br': 'Biblioteca de Modelos de Funções da Instituição',
  },
  userRoles: {
    'en-us': 'User Roles',
    'ru-ru': 'Роли пользователей',
    'es-es': 'Roles del usuario',
    'fr-fr': 'Rôles utilisateur',
    'uk-ua': 'Ролі користувачів',
    'de-ch': 'Benutzerrollen',
    'pt-br': 'Funções do usuário',
  },
  collectionUserRoles: {
    'en-us': '{collectionTable:string} User Roles',
    'ru-ru': '{collectionTable:string} Роли пользователей',
    'es-es': 'Roles de usuario de {collectionTable:string}',
    'fr-fr': '{collectionTable:string} Rôles utilisateur',
    'uk-ua': 'Ролі користувачів {collectionTable:string}',
    'de-ch': '{collectionTable:string} Benutzerrollen',
    'pt-br': '{collectionTable:string} Funções do usuário',
  },
  assignedUserRoles: {
    'en-us': 'Assigned User Roles',
    'es-es': 'Roles de usuario asignados',
    'fr-fr': 'Rôles utilisateur attribués',
    'uk-ua': 'Призначені ролі користувачів',
    'de-ch': 'Zugewiesene Benutzerrollen',
    'ru-ru': 'Назначенные роли пользователей',
    'pt-br': 'Funções de usuário atribuídas',
  },
  rolePolicies: {
    'en-us': 'Role Permission Policies',
    'ru-ru': 'Политики разрешений ролей',
    'es-es': 'Políticas de permisos',
    'fr-fr': "Politiques d'autorisation des rôles",
    'uk-ua': 'Політики дозволів для ролей',
    'de-ch': 'Rollenberechtigungsrichtlinien',
    'pt-br': 'Políticas de permissão de função',
  },
  userPolicies: {
    'en-us': 'User Permission Policies',
    'ru-ru': 'Политики разрешений пользователей',
    'es-es': 'Políticas de permisos de usuario',
    'fr-fr': "Politiques d'autorisation des utilisateurs",
    'uk-ua': 'Політики дозволів користувачів',
    'de-ch': 'Richtlinien für Benutzerberechtigungen',
    'pt-br': 'Políticas de permissão do usuário',
  },
  customUserPolices: {
    'en-us':
      'Custom Collection-level Policies (applies to this collection only)',
    'ru-ru':
      'Политики на уровне пользовательской коллекции (применяются только к этой коллекции)',
    'es-es':
      'Políticas personalizadas a nivel de colección (sólo se aplican a esta colección)',
    'fr-fr':
      "Politiques personnalisées au niveau de la collection (s'applique uniquement à cette collection)",
    'uk-ua':
      'Політики на рівні користувацьких колекцій (стосуються лише цієї колекції)',
    'de-ch':
      'Benutzerdefinierte Richtlinien auf Sammlungsebene (gilt nur für diese Sammlung)',
    'pt-br':
      'Políticas personalizadas em nível de coleção (aplica-se somente a esta coleção)',
  },
  role: {
    'en-us': 'Role',
    'ru-ru': 'Роль',
    'es-es': 'Rol',
    'fr-fr': 'Rôle',
    'uk-ua': 'Роль',
    'de-ch': 'Rolle',
    'pt-br': 'Papel',
  },
  read: {
    'en-us': 'Read',
    'ru-ru': 'Читать',
    'es-es': 'Leer',
    'fr-fr': 'Lire',
    'uk-ua': 'Читати',
    'de-ch': 'Lesen',
    'pt-br': 'Ler',
  },
  userPermissionPreview: {
    'en-us': "User's Permission Profile (read-only)",
    'ru-ru': 'Профиль разрешений пользователя (только для чтения)',
    'es-es': 'Perfil de permisos del usuario (solo lectura)',
    'fr-fr': "Profil d'autorisation de l'utilisateur (lecture seule)",
    'uk-ua': 'Профіль дозволів користувача (лише для читання)',
    'de-ch': 'Berechtigungsprofil des Benutzers (schreibgeschützt)',
    'pt-br': 'Perfil de permissão do usuário (somente leitura)',
  },
  outOfDateWarning: {
    'en-us':
      'Note: preview may be out of date. Save changes to update the preview',
    'ru-ru':
      'Примечание: предварительный просмотр может быть устаревшим. Сохраните изменения, чтобы обновить предварительный просмотр.',
    'es-es':
      'Nota: la vista previa puede estar desactualizada. Guarde los cambios para actualizar la vista previa',
    'fr-fr':
      "Remarque : l'aperçu peut être obsolète. Enregistrez les modifications pour le mettre à jour.",
    'uk-ua':
      'Примітка: попередній перегляд може бути застарілим. Збережіть зміни, щоб оновити попередній перегляд',
    'de-ch':
      'Hinweis: Die Vorschau ist möglicherweise veraltet. Speichern Sie die Änderungen, um die Vorschau zu aktualisieren',
    'pt-br':
      'Observação: a pré-visualização pode estar desatualizada. Salve as alterações para atualizar a pré-visualização.',
  },
  allUsers: {
    'en-us': 'All Users',
    'ru-ru': 'Все пользователи',
    'es-es': 'Todos los usuarios',
    'fr-fr': 'Tous les utilisateurs',
    'uk-ua': 'Усі користувачі',
    'de-ch': 'Alle Benutzer',
    'pt-br': 'Todos os usuários',
  },
  thisUser: {
    'en-us': 'This user',
    'ru-ru': 'Этот пользователь',
    'es-es': 'Este usuario',
    'fr-fr': 'Cet utilisateur',
    'uk-ua': 'Цей користувач',
    'de-ch': 'Dieser Benutzer',
    'pt-br': 'Este usuário',
  },
  action: {
    'en-us': 'Action',
    'ru-ru': 'Действие',
    'es-es': 'Acción',
    'fr-fr': 'Action',
    'uk-ua': 'Дія',
    'de-ch': 'Aktion',
    'pt-br': 'Ação',
  },
  resource: {
    'en-us': 'Resource',
    'ru-ru': 'Ресурс',
    'es-es': 'Recurso',
    'fr-fr': 'Ressource',
    'uk-ua': 'Ресурс',
    'de-ch': 'Ressource',
    'pt-br': 'Recurso',
  },
  allCollections: {
    'en-us': 'All Collections',
    'ru-ru': 'Все коллекции',
    'es-es': 'Todas las colecciones',
    'fr-fr': 'Toutes les collections',
    'uk-ua': 'Усі колекції',
    'de-ch': 'Alle Kollektionen',
    'pt-br': 'Todas as coleções',
  },
  thisCollection: {
    'en-us': 'This collection',
    'ru-ru': 'Эта коллекция',
    'es-es': 'Esta colección',
    'fr-fr': 'Cette collection',
    'uk-ua': 'Ця колекція',
    'de-ch': 'Diese Sammlung',
    'pt-br': 'Esta coleção',
  },
  allActions: {
    'en-us': 'All Actions',
    'ru-ru': 'Все действия',
    'es-es': 'Todas las acciones',
    'fr-fr': 'Toutes les actions',
    'uk-ua': 'Усі дії',
    'de-ch': 'Alle Aktionen',
    'pt-br': 'Todas as ações',
  },
  collectionAccess: {
    'en-us': 'Enable Collection Access',
    'ru-ru': 'Включить доступ к коллекции',
    'es-es': 'Habilitar acceso a la colección',
    'fr-fr': "Autoriser l'accès à la collection",
    'uk-ua': 'Увімкнути доступ до колекції',
    'de-ch': 'Zugriff auf die Sammlung aktivieren',
    'pt-br': 'Habilitar acesso à coleção',
  },
  createRole: {
    'en-us': 'Create Role',
    'ru-ru': 'Создать роль',
    'es-es': 'Crear rol',
    'fr-fr': 'Créer un rôle',
    'uk-ua': 'Створити роль',
    'de-ch': 'Rolle erstellen',
    'pt-br': 'Criar função',
  },
  newRole: {
    'en-us': 'New Role',
    'ru-ru': 'Новая роль',
    'es-es': 'Nuevo rol',
    'fr-fr': 'Nouveau rôle',
    'uk-ua': 'Нова роль',
    'de-ch': 'Neue Rolle',
    'pt-br': 'Nova função',
  },
  fromLibrary: {
    'en-us': 'From library:',
    'ru-ru': 'Из библиотеки:',
    'es-es': 'De la biblioteca:',
    'fr-fr': 'Depuis la bibliothèque :',
    'uk-ua': 'З бібліотеки:',
    'de-ch': 'Aus der Bibliothek:',
    'pt-br': 'Da biblioteca:',
  },
  fromExistingRole: {
    'en-us': 'From an existing role:',
    'ru-ru': 'Из существующей роли:',
    'es-es': 'Desde un rol existente:',
    'fr-fr': "À partir d'un rôle existant :",
    'uk-ua': 'З існуючої ролі:',
    'de-ch': 'Aus einer vorhandenen Rolle:',
    'pt-br': 'De uma função existente:',
  },
  createNewRoles: {
    'en-us': 'Create new roles:',
    'ru-ru': 'Создайте новые роли:',
    'es-es': 'Crear nuevos roles:',
    'fr-fr': 'Créer de nouveaux rôles :',
    'uk-ua': 'Створити нові ролі:',
    'de-ch': 'Neue Rollen erstellen:',
    'pt-br': 'Criar novas funções:',
  },
  updateExistingRoles: {
    'en-us': 'Update existing roles:',
    'ru-ru': 'Обновить существующие роли:',
    'es-es': 'Actualizar roles existentes:',
    'fr-fr': 'Mettre à jour les rôles existants :',
    'uk-ua': 'Оновити існуючі ролі:',
    'de-ch': 'Vorhandene Rollen aktualisieren:',
    'pt-br': 'Atualizar funções existentes:',
  },
  unchangedRoles: {
    'en-us': 'Unchanged roles:',
    'ru-ru': 'Неизменные роли:',
    'es-es': 'Roles sin cambios:',
    'fr-fr': 'Rôles inchangés :',
    'uk-ua': 'Незмінні ролі:',
    'de-ch': 'Unveränderte Rollen:',
    'pt-br': 'Funções inalteradas:',
  },
  institutionAdmin: {
    'en-us': 'Institution Admin',
    'ru-ru': 'Администратор учреждения',
    'es-es': 'Administrador de la institución',
    'fr-fr': "Administrateur de l'établissement",
    'uk-ua': 'Адміністратор установи',
    'de-ch': 'Institutionsadministrator',
    'pt-br': 'Administrador da Instituição',
  },
  createInviteLink: {
    'en-us': 'Create Invite Link',
    'ru-ru': 'Создать ссылку-приглашение',
    'es-es': 'Crear enlace de invitación',
    'fr-fr': "Créer un lien d'invitation",
    'uk-ua': 'Створити посилання для запрошення',
    'de-ch': 'Einladungslink erstellen',
    'pt-br': 'Criar link de convite',
  },
  userInviteLink: {
    'en-us': 'User Invite Link',
    'ru-ru': 'Ссылка для приглашения пользователя',
    'es-es': 'Enlace de invitación de usuario',
    'fr-fr': "Lien d'invitation utilisateur",
    'uk-ua': 'Посилання для запрошення користувача',
    'de-ch': 'Benutzereinladungslink',
    'pt-br': 'Link de convite do usuário',
  },
  userInviteLinkDescription: {
    'en-us':
      'Send the following link to {userName:string} to allow them to log in for the first time.',
    'ru-ru':
      'Отправьте следующую ссылку {userName:string}, чтобы разрешить ему войти в систему в первый раз.',
    'es-es':
      'Envíe el siguiente enlace a {userName:string} para permitirles iniciar sesión por primera vez.',
    'fr-fr':
      'Envoyez le lien suivant à {userName:string} pour leur permettre de se connecter pour la première fois.',
    'uk-ua':
      'Надішліть наступне посилання користувачу {userName:string}, щоб дозволити йому вперше увійти в систему.',
    'de-ch':
      'Senden Sie den folgenden Link an {userName:string}, um ihnen die erstmalige Anmeldung zu ermöglichen.',
    'pt-br':
      'Envie o seguinte link para {userName:string} para permitir que eles façam login pela primeira vez.',
  },
  noProvidersForUserInviteLink: {
    'en-us':
      'No external identity provider is configured. You can configure some in Specify 7 server settings',
    'ru-ru':
      'Внешний поставщик удостоверений не настроен. Вы можете настроить его в разделе «Укажите 7 параметров сервера».',
    'es-es':
      'No hay configurado ningún proveedor de identidad externo. Puede configurar algunos en configuraciones de servidor de Specify 7',
    'fr-fr':
      "Aucun fournisseur d'identité externe n'est configuré. Vous pouvez en configurer certains dans les paramètres du serveur de Specify 7",
    'uk-ua':
      'Зовнішнього постачальника ідентифікаційних даних не налаштовано. Ви можете налаштувати деякі з них у розділі «Specify 7 параметрів сервера»',
    'de-ch':
      'Es ist kein externer Identitätsanbieter konfiguriert. Sie können einige in den 7 Servereinstellungen konfigurieren.',
    'pt-br':
      'Nenhum provedor de identidade externo está configurado. Você pode configurar alguns em "Especificar 7 configurações do servidor".',
  },
  legacyPermissions: {
    'en-us': 'Specify 6 Permissions',
    'ru-ru': 'Укажите 6 разрешений',
    'es-es': 'Permisos de Specify 6',
    'fr-fr': 'Autorisations de Specify 6',
    'uk-ua': 'Specify 6 дозволів',
    'de-ch': 'Geben Sie 6 Berechtigungen an',
    'pt-br': 'Especifique 6 permissões',
  },
  setPasswordBeforeSavePrompt: {
    'en-us':
      "Consider setting a password for this user. Users without a password won't be able to sign in",
    'ru-ru':
      'Попробуйте установить пароль для этого пользователя. Пользователи без пароля не смогут войти в систему.',
    'es-es':
      'Considere establecer una contraseña para este usuario. Los usuarios sin contraseña no podrán iniciar sesión',
    'fr-fr':
      'Pensez à définir un mot de passe pour cet utilisateur. Les utilisateurs sans mot de passe ne pourront pas se connecter',
    'uk-ua':
      'Спробуйте встановити пароль для цього користувача. Користувачі без пароля не зможуть увійти',
    'de-ch':
      'Erwägen Sie, für diesen Benutzer ein Kennwort festzulegen. Benutzer ohne Kennwort können sich nicht anmelden.',
    'pt-br':
      'Considere definir uma senha para este usuário. Usuários sem senha não conseguirão fazer login.',
  },
  setCollections: {
    'en-us': 'Set Collections',
    'ru-ru': 'Наборы коллекций',
    'es-es': 'Establecer colecciones',
    'fr-fr': "Collections d'ensembles",
    'uk-ua': 'Колекції наборів',
    'de-ch': 'Sammlungen festlegen',
    'pt-br': 'Conjuntos de coleções',
  },
  agentInUse: {
    'en-us': 'This agent is already associated with a different user.',
    'ru-ru': 'Этот агент уже связан с другим пользователем.',
    'es-es': 'Este agente ya está asociado con un usuario diferente.',
    'fr-fr': 'Cet agent est déjà associé à un autre utilisateur.',
    'uk-ua': "Цей агент вже пов'язаний з іншим користувачем.",
    'de-ch': 'Dieser Agent ist bereits einem anderen Benutzer zugeordnet.',
    'pt-br': 'Este agente já está associado a um usuário diferente.',
  },
  setAgentsBeforeProceeding: {
    'en-us': 'Please set the following agents before proceeding:',
    'ru-ru': 'Перед продолжением установите следующие агенты:',
    'es-es': 'Configure los siguientes agentes antes de continuar:',
    'uk-ua': 'Будь ласка, налаштуйте наступних агентів, перш ніж продовжити:',
    'de-ch':
      'Bitte legen Sie die folgenden Agenten fest, bevor Sie fortfahren:',
    'fr-fr': 'Veuillez définir les agents suivants avant de continuer :',
    'pt-br': 'Defina os seguintes agentes antes de prosseguir:',
  },
  externalIdentityProviders: {
    'en-us': 'External identity providers:',
    'es-es': 'Proveedores de identidad externos:',
    'fr-fr': "Fournisseurs d'identité externes :",
    'de-ch': 'Externe Identitätsanbieter:',
    'ru-ru': 'Внешние поставщики удостоверений:',
    'uk-ua': 'Зовнішні постачальники ідентифікаційних даних:',
    'pt-br': 'Provedores de identidade externos:',
  },
  allTables: {
    'en-us': 'All tables',
    'ru-ru': 'Все таблицы',
    'es-es': 'Todas las tablas',
    'fr-fr': 'Tous les tableaux',
    'uk-ua': 'Усі столи',
    'de-ch': 'Alle Tabellen',
    'pt-br': 'Todas as tabelas',
  },
  loadingAdmins: {
    'en-us': 'Loading admins...',
    'ru-ru': 'Загрузка администраторов...',
    'es-es': 'Cargando administradores...',
    'fr-fr': 'Chargement des administrateurs…',
    'uk-ua': 'Завантаження адміністраторів...',
    'de-ch': 'Administratoren werden geladen …',
    'pt-br': 'Carregando administradores...',
  },
  specifyAdmin: {
    comment: 'Shown next to user name for admin users',
    'en-us': '(Specify 7 Admin)',
    'ru-ru': '(Укажите 7 Администратор)',
    'es-es': '(Administradores de Specify 7)',
    'fr-fr': '(Spécifiez 7 Admin)',
    'uk-ua': '(Specify 7 Адміністратор)',
    'de-ch': '(Geben Sie 7 Admin an)',
    'pt-br': '(Especifique 7 Admin)',
  },
  legacyAdmin: {
    comment: 'Shown next to user name for admin users',
    'en-us': '(Specify 6 Admin)',
    'ru-ru': '(Укажите 6 Администратор)',
    'es-es': '(Administradores de Specify 6)',
    'fr-fr': '(Spécifiez 6 Admin)',
    'uk-ua': '(Specify 6 Адміністратор)',
    'de-ch': '(Geben Sie 6 Admin an)',
    'pt-br': '(Especifique 6 Admin)',
  },
  deleteRoleWithUsers: {
    'en-us': 'Delete role that has users?',
    'ru-ru': 'Удалить роль, в которой есть пользователи?',
    'es-es': '¿Eliminar rol que tiene usuarios?',
    'fr-fr': 'Supprimer le rôle qui a des utilisateurs ?',
    'uk-ua': 'Видалити роль, яка має користувачів?',
    'de-ch': 'Rolle mit Benutzern löschen?',
    'pt-br': 'Excluir função que possui usuários?',
  },
  deleteRoleWithUsersDescription: {
    'en-us': 'Users will not be deleted, but they would lose this role.',
    'ru-ru': 'Пользователи не будут удалены, но потеряют эту роль.',
    'es-es': 'Los usuarios no serán eliminados, pero perderán este rol.',
    'fr-fr':
      'Les utilisateurs ne seront pas supprimés, mais ils perdront ce rôle.',
    'uk-ua': 'Користувачів не буде видалено, але вони втратять цю роль.',
    'de-ch':
      'Benutzer werden nicht gelöscht, sie würden jedoch diese Rolle verlieren.',
    'pt-br': 'Os usuários não serão excluídos, mas perderão essa função.',
  },
  institutionPolicies: {
    'en-us':
      'Custom Institution-level Policies (applies to all assigned collections)',
    'ru-ru':
      'Пользовательские политики на уровне учреждения (применяются ко всем назначенным коллекциям)',
    'es-es':
      'Políticas personalizadas a nivel de Institución (se aplican a todas las colecciones asignadas)',
    'fr-fr':
      "Politiques personnalisées au niveau de l'institution (s'appliquent à toutes les collections attribuées)",
    'uk-ua':
      'Спеціальні правила на рівні установи (стосуються всіх призначених колекцій)',
    'de-ch':
      'Benutzerdefinierte Richtlinien auf Institutionsebene (gilt für alle zugewiesenen Sammlungen)',
    'pt-br':
      'Políticas personalizadas em nível de instituição (aplica-se a todas as coleções atribuídas)',
  },
  cantRemoveLastAdmin: {
    'en-us': "Can't remove Institution Admin status",
    'ru-ru': 'Невозможно удалить статус администратора учреждения',
    'es-es':
      'No se puede eliminar el estatus de Administrador de la Institución',
    'fr-fr':
      "Impossible de supprimer le statut d'administrateur de l'établissement",
    'uk-ua': 'Не вдається видалити статус адміністратора установи',
    'de-ch':
      'Der Status „Institutionsadministrator“ kann nicht entfernt werden',
    'pt-br': 'Não é possível remover o status de administrador da instituição',
  },
  cantRemoveLastAdminDescription: {
    'en-us': 'There must be at least one Institution Admin in institution',
    'ru-ru':
      'В учреждении должен быть по крайней мере один администратор учреждения.',
    'es-es':
      'En la Institución debe haber al menos un Administrador de la Institución',
    'fr-fr':
      "Il doit y avoir au moins un administrateur d'établissement dans l'établissement",
    'uk-ua': 'У закладі має бути принаймні один адміністратор закладу',
    'de-ch':
      'Es muss mindestens einen Institutionsadministrator in der Institution geben',
    'pt-br':
      'Deve haver pelo menos um administrador da instituição na instituição',
  },
  switchToHorizontalLayout: {
    'en-us': 'Switch to horizontal layout',
    'ru-ru': 'Переключиться на горизонтальную компоновку',
    'es-es': 'Cambiar a diseño horizontal',
    'fr-fr': "Passer à l'affichage horizontal",
    'uk-ua': 'Перейти до горизонтального розташування',
    'de-ch': 'Wechseln Sie zum horizontalen Layout',
    'pt-br': 'Mudar para layout horizontal',
  },
  switchToVerticalLayout: {
    'en-us': 'Switch to vertical layout',
    'ru-ru': 'Переключиться на вертикальную компоновку',
    'es-es': 'Cambiar al diseño vertical',
    'fr-fr': "Passer à l'affichage vertical",
    'de-ch': 'Zum vertikalen Layout wechseln',
    'uk-ua': 'Перейти до вертикального розташування',
    'pt-br': 'Mudar para layout vertical',
  },
  advancedTables: {
    'en-us': 'Advanced tables',
    'ru-ru': 'Расширенные таблицы',
    'es-es': 'Tablas avanzadas',
    'fr-fr': 'Tableaux avancés',
    'uk-ua': 'Розширені таблиці',
    'de-ch': 'Erweiterte Tabellen',
    'pt-br': 'Tabelas avançadas',
  },
  excludedInstitutionalPolicies: {
    'en-us': 'Excluded institutional policies:',
    'ru-ru': 'Исключенные институциональные политики:',
    'es-es': 'Políticas institucionales excluidas:',
    'fr-fr': 'Politiques institutionnelles exclues :',
    'uk-ua': 'Виключені інституційні політики:',
    'de-ch': 'Ausgeschlossene institutionelle Richtlinien:',
    'pt-br': 'Políticas institucionais excluídas:',
  },
  excludedInstitutionalPoliciesDescription: {
    'en-us':
      '(Some policies that apply only at the institution-level are not present here at the collection-level.)',
    'ru-ru':
      '(Некоторые политики, которые применяются только на уровне учреждения, не представлены здесь на уровне сбора.)',
    'es-es':
      '(Algunas políticas que se aplican solo a nivel de institución no están presentes aquí, a nivel de colección)',
    'fr-fr':
      '(Certaines politiques qui s’appliquent uniquement au niveau de l’institution ne sont pas présentes ici au niveau de la collection.)',
    'uk-ua':
      '(Деякі політики, що застосовуються лише на рівні установи, відсутні тут на рівні колекції.)',
    'de-ch':
      '(Einige Richtlinien, die nur auf Institutionsebene gelten, sind hier auf Sammlungsebene nicht vorhanden.)',
    'pt-br':
      '(Algumas políticas que se aplicam apenas ao nível da instituição não estão presentes aqui no nível da coleção.)',
  },
  accountSetupOptions: {
    'en-us': 'Account Setup Options',
    'ru-ru': 'Параметры настройки учетной записи',
    'es-es': 'Opciones de configuración de cuenta',
    'fr-fr': 'Options de configuration du compte',
    'uk-ua': 'Параметри налаштування облікового запису',
    'de-ch': 'Kontoeinrichtungsoptionen',
    'pt-br': 'Opções de configuração de conta',
  },
  currentUser: {
    'en-us': 'Current User',
    'ru-ru': 'Текущий пользователь',
    'de-ch': 'Aktueller Benutzer',
    'es-es': 'Usuario actual',
    'fr-fr': 'Utilisateur actuel',
    'uk-ua': 'Поточний користувач',
    'pt-br': 'Usuário atual',
  },
  addRole: {
    'en-us': 'Add Role',
    'de-ch': 'Rolle hinzufügen',
    'es-es': 'Agregar rol',
    'fr-fr': 'Ajouter un rôle',
    'ru-ru': 'Добавить роль',
    'uk-ua': 'Додати роль',
    'pt-br': 'Adicionar função',
  },
  addUser: {
    'en-us': 'Add User',
    'de-ch': 'Benutzer hinzufügen',
    'es-es': 'Agregar usuario',
    'fr-fr': 'Ajouter un utilisateur',
    'ru-ru': 'Добавить пользователя',
    'uk-ua': 'Додати користувача',
    'pt-br': 'Adicionar usuário',
  },
  systemConfigurationTool: {
    'en-us': 'System Configuration Tool',
  },
} as const);
