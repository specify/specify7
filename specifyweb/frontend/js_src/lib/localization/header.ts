/**
 * Localization strings used in top menu and user tools
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const headerText = createDictionary({
  skipToContent: {
    comment: 'For accessibility purposes. Allows jumping to page content',
    'en-us': 'Skip to Content',
    'ru-ru': 'Перейти к содержанию',
    'es-es': 'Saltar al contenido',
    'fr-fr': 'Aller au contenu',
    'uk-ua': 'Перейти до вмісту',
  },
  currentUser: {
    'en-us': 'Current User',
    'ru-ru': 'Текущий пользователь',
    'es-es': 'Usuario actual',
    'fr-fr': 'Utilisateur actuel',
    'uk-ua': 'Поточний користувач',
  },
  currentCollection: {
    'en-us': 'Current Collection',
    'ru-ru': 'Текущая коллекция',
    'es-es': 'Colección actual',
    'fr-fr': 'Collection actuelle',
    'uk-ua': 'Поточна колекція',
  },
  dataEntry: {
    'en-us': 'Data Entry',
    'ru-ru': 'Ввод данных',
    'es-es': 'Entrada de datos',
    'fr-fr': 'Saisie des données',
    'uk-ua': 'Введення даних',
  },
  makeDwca: {
    'en-us': 'Create DwC Archive',
    'ru-ru': 'Создать архив DwC',
    'es-es': 'Crear archivo DwC',
    'fr-fr': 'Créer une archive DwC',
    'uk-ua': 'Створити архів DwC',
  },
  updateExportFeed: {
    'en-us': 'Update RSS Feed',
    'ru-ru': 'Обновить RSS-канал',
    'es-es': 'Actualizar fuente RSS',
    'fr-fr': 'Mettre à jour le flux RSS',
    'uk-ua': 'Оновити RSS-канал',
  },
  updateExportFeedConfirmation: {
    'en-us': 'Update export feed?',
    'ru-ru': 'Обновить фид экспорта?',
    'es-es': '¿Actualizar feed de exportación?',
    'fr-fr': "Mettre à jour le flux d'exportation ?",
    'uk-ua': 'Оновити канал експорту?',
  },
  updateExportFeedConfirmationDescription: {
    'en-us': 'Update all RSS export feed items now?',
    'ru-ru': 'Обновить все элементы RSS-канала экспорта сейчас?',
    'es-es':
      '¿Actualizar todos los elementos de fuente de exportación RSS ahora?',
    'fr-fr':
      "Mettre à jour tous les éléments du flux d'exportation RSS maintenant ?",
    'uk-ua': 'Оновити зараз усі елементи експорту RSS?',
  },
  feedExportStarted: {
    'en-us': 'Export feed update started',
    'ru-ru': 'Начато обновление фида экспорта',
    'es-es': 'Se inició la actualización del feed de exportación',
    'fr-fr': "La mise à jour du flux d'exportation a commencé",
    'uk-ua': 'Розпочато оновлення каналу експорту',
  },
  feedExportStartedDescription: {
    'en-us': `
      Update started. You will receive a notification for each feed item
      updated.
    `,
    'ru-ru': `
      Обновление запущено. Вы будете получать уведомление о каждом обновлении
      элемента фида.
    `,
    'es-es': `
      Actualización iniciada. Recibirá una notificación por cada elemento de
      feed actualizado.
    `,
    'fr-fr': `
      La mise à jour a commencé. Vous recevrez une notification pour chaque
      élément de flux mis à jour.
    `,
    'uk-ua': `
      Оновлення розпочато. Ви отримаєте сповіщення про кожен оновлений елемент
      каналу.
    `,
  },
  dwcaExportStarted: {
    'en-us': 'DwCA export started',
    'ru-ru': 'Начат экспорт DwCA',
    'es-es': 'Exportación de DwCA iniciada',
    'fr-fr': "L'exportation DwCA a commencé",
    'uk-ua': 'Розпочато експорт DwCA',
  },
  dwcaExportStartedDescription: {
    'en-us': `
      Export started. You will receive a notification when the export is
      complete.
    `,
    'ru-ru': `
      Экспорт запущен. Вы получите уведомление, когда экспорт будет завершен.
    `,
    'es-es': `
      Exportación iniciada. Recibirá una notificación cuando se complete la
      exportación.
    `,
    'fr-fr': `
      L'exportation a commencé. Vous recevrez une notification lorsque
      l'exportation sera terminée.
    `,
    'uk-ua':
      'Експорт розпочато. Коли експорт завершиться, ви отримаєте сповіщення.',
  },
  labelName: {
    'en-us': 'Label Name',
    'ru-ru': 'Название ярлыка',
    'es-es': 'Nombre de etiqueta',
    'fr-fr': "Nom de l'étiquette",
    'uk-ua': 'Назва мітки',
  },
  reportName: {
    'en-us': 'Report Name',
    'ru-ru': 'Название отчета',
    'es-es': 'Reportar nombre',
    'fr-fr': 'Nom du rapport',
    'uk-ua': 'Назва звіту',
  },
  createLabel: {
    'en-us': 'Create new label',
    'ru-ru': 'Создать новый ярлык',
    'es-es': 'Crear nueva etiqueta',
    'fr-fr': 'Créer une nouvelle étiquette',
    'uk-ua': 'Створити нову мітку',
  },
  createReport: {
    'en-us': 'Create new report',
    'ru-ru': 'Создать новый отчет',
    'es-es': 'Crear nuevo informe',
    'fr-fr': 'Créer un nouveau rapport',
    'uk-ua': 'Створити новий звіт',
  },
  repairTree: {
    'en-us': 'Repair Tree',
    'ru-ru': 'Ремонтное дерево',
    'es-es': 'Árbol de reparación',
    'fr-fr': 'Arbre de réparation',
    'uk-ua': 'Ремонтне дерево',
  },
  treeRepairComplete: {
    'en-us': 'Tree repair is complete.',
    'ru-ru': 'Ремонт дерева завершен.',
    'es-es': 'La reparación del árbol está completa.',
    'fr-fr': "La réparation de l'arbre est terminée.",
    'uk-ua': 'Ремонт дерева завершено.',
  },
  chooseDwca: {
    'en-us': 'Choose DwCA',
    'ru-ru': 'Выберите ДвКА',
    'es-es': 'Elija DwCA',
    'fr-fr': 'Choisissez DwCA',
    'uk-ua': 'Виберіть DwCA',
  },
  chooseMetadataResource: {
    'en-us': 'Choose Metadata resource',
    'ru-ru': 'Выберите ресурс метаданных',
    'es-es': 'Elija el recurso de metadatos',
    'fr-fr': 'Choisissez la ressource de métadonnées',
    'uk-ua': 'Виберіть ресурс метаданих',
  },
  expressSearch: {
    'en-us': 'Express Search',
    'ru-ru': 'Экспресс-поиск',
    'es-es': 'Búsqueda rápida',
    'fr-fr': 'Recherche express',
    'uk-ua': 'Експрес-пошук',
  },
  primarySearch: {
    'en-us': 'Primary Search',
    'ru-ru': 'Основной поиск',
    'es-es': 'Búsqueda principal',
    'fr-fr': 'Recherche principale',
    'uk-ua': 'Первинний пошук',
  },
  secondarySearch: {
    'en-us': 'Secondary Search',
    'ru-ru': 'Вторичный поиск',
    'es-es': 'Búsqueda secundaria',
    'fr-fr': 'Recherche secondaire',
    'uk-ua': 'Вторинний пошук',
  },
  userTools: {
    'en-us': 'User Tools',
    'ru-ru': 'Инструменты пользователя',
    'es-es': 'Herramientas de usuario',
    'fr-fr': 'Outils utilisateur',
    'uk-ua': 'Інструменти користувача',
  },
  helpLocalizeSpecify: {
    'en-us': 'Help Localize Specify 7',
    'ru-ru': 'Помогите локализовать Укажите 7',
    'es-es': 'Ayuda Localizar Especificar 7',
    'fr-fr': 'Aide Localiser Spécifier 7',
    'uk-ua': 'Допоможіть локалізувати Specify 7',
  },
  helpLocalizeSpecifyDescription: {
    'en-us': `
      We would be very grateful for your support localizing Specify 7 User
      Interface. If you are interested, please <link>see the
      instructions</link>.
    `,
    'ru-ru': `
      Мы будем очень признательны за вашу поддержку в локализации
      пользовательского интерфейса Specify 7. Если вы заинтересованы, отправьте
      электронное письмо по адресу <link>см. Инструкции</link>.
    `,
    'es-es': `
      Estaríamos muy agradecidos por su apoyo para localizar la interfaz de
      usuario de Specific 7. Si está interesado, <link> consulte las
      instrucciones </link>.
    `,
    'fr-fr': `
      Nous vous serions très reconnaissants de votre aide pour la localisation
      de l'interface utilisateur Spécifiez 7. Si vous êtes intéressé, veuillez
      <link>voir les instructions</link>.
    `,
    'uk-ua': `
      Ми будемо дуже вдячні за вашу підтримку в локалізації інтерфейсу
      користувача Specify 7. Якщо ви зацікавлені, <link>перегляньте
      інструкції</link>.
    `,
  },
  incompleteInline: {
    'en-us': '(incomplete)',
    'es-es': '(incompleto)',
    'fr-fr': '(incomplet)',
    'ru-ru': '(неполный)',
    'uk-ua': '(неповний)',
  },
  incompleteLocalization: {
    'en-us': 'Incomplete localization',
    'es-es': 'Localización incompleta',
    'fr-fr': 'Localisation incomplète',
    'ru-ru': 'Неполная локализация',
    'uk-ua': 'Неповна локалізація',
  },
  incompleteLocalizationDescription: {
    'en-us': `
      Translation to this language is not yet complete. Some elements may be
      missing localization, or have incorrect localization. If you are
      interested in helping us complete localization, please <link>follow the
      instructions.</link>
    `,
    'es-es': `
      La traducción a este idioma aún no está completa. Es posible que a algunos
      elementos les falte la localización o tengan una localización
      incorrecta. Si está interesado en ayudarnos a completar la
      localización, <link>siga las instrucciones.</link>
    `,
    'fr-fr': `
      La traduction dans cette langue n'est pas encore terminée. Certains
      éléments peuvent manquer de localisation ou avoir une localisation
      incorrecte. Si vous souhaitez nous aider à terminer la localisation,
      veuillez <link>suivre les instructions.</link>
    `,
    'ru-ru': `
      Перевод на этот язык еще не завершен. У некоторых элементов может
      отсутствовать локализация или они имеют неправильную локализацию. Если вы
      хотите помочь нам завершить локализацию, <link>следуйте
      инструкциям.</link>
    `,
    'uk-ua': `
      Переклад цією мовою ще не завершено. Деякі елементи можуть не мати
      локалізації або мати неправильну локалізацію. Якщо ви зацікавлені в тому,
      щоб допомогти нам завершити локалізацію, <link>дотримуйтесь
      інструкцій.</link>
    `,
  },
  tableApi: {
    'en-us': 'Tables API',
    'ru-ru': 'API таблиц',
    'es-es': 'API de tablas',
    'fr-fr': 'API Tableaux',
    'uk-ua': 'API таблиць',
  },
  operationsApi: {
    'en-us': 'Operations API',
    'ru-ru': 'Операционный API',
    'es-es': 'API de operaciones',
    'fr-fr': 'API des opérations',
    'uk-ua': 'Операційний API',
  },
  documentation: {
    'en-us': 'Documentation',
    'ru-ru': 'Документация',
    'es-es': 'Documentación',
    'fr-fr': 'Documentation',
    'uk-ua': 'Документація',
  },
  administration: {
    'en-us': 'Administrative Tools',
    'ru-ru': 'Инструменты управления',
    'es-es': 'Herramientas administrativas',
    'fr-fr': 'Outils administratifs',
    'uk-ua': 'Інструменти адміністрування',
  },
  developers: {
    'en-us': 'Developer Resources',
    'ru-ru': 'Ресурсы для разработчиков',
    'es-es': 'Recursos para desarrolladores',
    'fr-fr': 'Ressources pour les développeurs',
    'uk-ua': 'Ресурси для розробників',
  },
  forum: {
    'en-us': 'Community Forum',
    'ru-ru': 'форум сообщества',
    'es-es': 'foro de la Comunidad',
    'fr-fr': 'Forum de la communauté',
    'uk-ua': 'Форум спільноти',
  },
  clearCache: {
    'en-us': 'Clear Browser Cache',
    'ru-ru': 'Очистить кеш браузера',
    'es-es': 'Borrar caché del navegador',
    'fr-fr': 'Effacer le cache du navigateur',
    'uk-ua': 'Очистити кеш браузера',
  },
  cacheCleared: {
    'en-us': 'Cache has been cleared. Please reload the page.',
    'ru-ru': 'Кэш очищен. Пожалуйста, перезагрузите страницу.',
    'es-es': 'Se ha borrado la memoria caché. Por favor recarga la página.',
    'fr-fr': 'Le cache a été vidé. Veuillez recharger la page.',
    'uk-ua': 'Кеш очищено. Перезавантажте сторінку.',
  },
  technicalDocumentation: {
    'en-us': 'Technical Docs',
    'ru-ru': 'Технические документы',
    'es-es': 'Documentos técnicos',
    'fr-fr': 'Documents techniques',
    'uk-ua': 'Технічні документи',
  },
} as const);
