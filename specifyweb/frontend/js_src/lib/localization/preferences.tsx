/**
 * Localization strings for the preferences menu
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const preferencesText = createDictionary({
  general: {
    'en-us': 'General',
    'ru-ru': 'Основные',
    ca: 'General',
    'es-es': 'General',
  },
  ui: {
    'en-us': 'User Interface',
    'ru-ru': 'Пользовательский интерфейс',
    ca: 'User Interface',
    'es-es': 'User Interface',
  },
  theme: {
    'en-us': 'Theme',
    'ru-ru': 'Тема',
    ca: 'Theme',
    'es-es': 'Theme',
  },
  system: {
    'en-us': 'Use system setting',
    'ru-ru': 'Использовать системные настройки',
    ca: 'Use system setting',
    'es-es': 'Use system setting',
  },
  inheritOsSettings: {
    'en-us': 'Copies value from your Operating System settings',
    'ru-ru': 'Копирует значение из настроек вашей операционной системы',
    ca: 'Copies value from your Operating System settings',
    'es-es': 'Copies value from your Operating System settings',
  },
  light: {
    'en-us': 'White',
    'ru-ru': 'Белая',
    ca: 'White',
    'es-es': 'White',
  },
  dark: {
    'en-us': 'Dark',
    'ru-ru': 'Темная',
    ca: 'Dark',
    'es-es': 'Dark',
  },
  reduceMotion: {
    'en-us': 'Reduce motion',
    'ru-ru': 'Уменьшить движение',
    ca: 'Reduce motion',
    'es-es': 'Reduce motion',
  },
  reduceMotionDescription: {
    'en-us': 'Disable non-essential animations and transitions',
    'ru-ru': 'Отключить ненужные анимации и переходы',
    ca: 'Disable non-essential animations and transitions',
    'es-es': 'Disable non-essential animations and transitions',
  },
  reduceTransparency: {
    'en-us': 'Reduce transparency',
    'ru-ru': 'Уменьшить прозрачность',
    ca: 'Reduce transparency',
    'es-es': 'Reduce transparency',
  },
  reduceTransparencyDescription: {
    'en-us': `Whether to disable translucent backgrounds for user interface
      components whenever possible (for example, table headers in tree view)`,
    'ru-ru': `Отключить ли полупрозрачный фон для пользовательского интерфейса,
      когда это возможно (например, заголовки таблиц в просмотрщике деревьев)`,
    ca: `Whether to disable translucent backgrounds for user interface
      components whenever possible (for example, table headers in tree view)`,
    'es-es': `Whether to disable translucent backgrounds for user interface
      components whenever possible (for example, table headers in tree view)`,
  },
  reduce: {
    'en-us': 'Reduce',
    'ru-ru': 'Уменьшать',
    ca: 'Reduce',
    'es-es': 'Reduce',
  },
  noPreference: {
    'en-us': 'No preference',
    'ru-ru': 'Нет предпочтений',
    ca: 'No preference',
    'es-es': 'No preference',
  },
  fontSize: {
    'en-us': 'Font size',
    'ru-ru': 'Размер шрифта',
    ca: 'Font size',
    'es-es': 'Font size',
  },
  fontFamily: {
    'en-us': 'Font family',
    'ru-ru': 'Шрифт',
    ca: 'Font family',
    'es-es': 'Font family',
  },
  fontFamilyDescription: {
    'en-us': `You can specify any font that is on your computer, even if it is
      not in the list. A comma separated list of fonts is supported, where
      second font would be used if first one is not installed and so on`,
    'ru-ru': `Вы можете указать любой шрифт, который есть на вашем компьютере,
      даже если он нет в списке. Поддерживается список шрифтов, разделенных
      запятыми, где второй шрифт будет использоваться, если первый не установлен
      и т.д.`,
    ca: `You can specify any font that is on your computer, even if it is
      not in the list. A comma separated list of fonts is supported, where
      second font would be used if first one is not installed and so on`,
    'es-es': `You can specify any font that is on your computer, even if it is
      not in the list. A comma separated list of fonts is supported, where
      second font would be used if first one is not installed and so on`,
  },
  defaultFont: {
    'en-us': '(default font)',
    'ru-ru': '(шрифт по умолчанию)',
    ca: '(default font)',
    'es-es': '(default font)',
  },
  maxWidth: {
    'en-us': 'Max form width',
    'ru-ru': 'Максимальная ширина формы',
    ca: 'Max form width',
    'es-es': 'Max form width',
  },
  fieldBackground: {
    'en-us': 'Field background',
    'ru-ru': 'Фон полей',
    ca: 'Field background',
    'es-es': 'Field background',
  },
  disabledFieldBackground: {
    'en-us': 'Disabled field background',
    'ru-ru': 'Фон полей только для чтения',
    ca: 'Disabled field background',
    'es-es': 'Disabled field background',
  },
  invalidFieldBackground: {
    'en-us': 'Invalid field background',
    'ru-ru': 'Фон недействительных полей',
    ca: 'Invalid field background',
    'es-es': 'Invalid field background',
  },
  requiredFieldBackground: {
    'en-us': 'Required field background',
    'ru-ru': 'Фон обязательных полей',
    ca: 'Required field background',
    'es-es': 'Required field background',
  },
  darkFieldBackground: {
    'en-us': 'Field background (dark theme)',
    'ru-ru': 'Фон полей (темная тема)',
    ca: 'Field background (dark theme)',
    'es-es': 'Field background (dark theme)',
  },
  darkDisabledFieldBackground: {
    'en-us': 'Disabled field background (dark theme)',
    'ru-ru': 'Фон полей только для чтения (темная тема)',
    ca: 'Disabled field background (dark theme)',
    'es-es': 'Disabled field background (dark theme)',
  },
  darkInvalidFieldBackground: {
    'en-us': 'Invalid field background (dark theme)',
    'ru-ru': 'Фон недействительных полей (темная тема)',
    ca: 'Invalid field background (dark theme)',
    'es-es': 'Invalid field background (dark theme)',
  },
  darkRequiredFieldBackground: {
    'en-us': 'Required field background (dark theme)',
    'ru-ru': 'Фон обязательных полей (темная тема)',
    ca: 'Required field background (dark theme)',
    'es-es': 'Required field background (dark theme)',
  },
  dialogs: {
    'en-us': 'Dialogs',
    'ru-ru': 'Диалоги',
    ca: 'Dialogs',
    'es-es': 'Dialogs',
  },
  appearance: {
    'en-us': 'Appearance',
    'ru-ru': 'Внешний вид',
    ca: 'Appearance',
    'es-es': 'Appearance',
  },
  translucentDialog: {
    'en-us': 'Translucent dialogs',
    'ru-ru': 'Полупрозрачные диалоги',
    ca: 'Translucent dialogs',
    'es-es': 'Translucent dialogs',
  },
  translucentDialogDescription: {
    'en-us': 'Whether dialogs have translucent background (easter egg)',
    'ru-ru': 'Диалоги имеют полупрозрачный фон',
    ca: 'Whether dialogs have translucent background (easter egg)',
    'es-es': 'Whether dialogs have translucent background (easter egg)',
  },
  alwaysPrompt: {
    'en-us': 'Always prompt to choose collection',
    'ru-ru': 'Всегда просить выбрать коллекцию',
    ca: 'Always prompt to choose collection',
    'es-es': 'Always prompt to choose collection',
  },
  treeEditor: {
    'en-us': 'Tree Editor',
    'ru-ru': 'Редактор дерева',
    ca: 'Tree Editor',
    'es-es': 'Tree Editor',
  },
  treeColor: {
    'en-us': 'Tree color',
    'ru-ru': 'Цвет дерева',
    ca: 'Tree color',
    'es-es': 'Tree color',
  },
  synonomyColor: {
    'en-us': 'Synonomy color',
    'ru-ru': 'Цвет синонимии',
    ca: 'Synonomy color',
    'es-es': 'Synonomy color',
  },
  showNewDataSetWarning: {
    'en-us': 'Show new Data Set warning',
    'ru-ru': 'Показать предупреждение в новых наборах данных',
    ca: 'Show new Data Set warning',
    'es-es': 'Show new Data Set warning',
  },
  showNewDataSetWarningDescription: {
    'en-us': 'Show an informational message when creating a new Data Set',
    'ru-ru':
      'Показывать информационное сообщение при создании нового набора данных',
    ca: 'Show an informational message when creating a new Data Set',
    'es-es': 'Show an informational message when creating a new Data Set',
  },
  header: {
    'en-us': 'Header',
    'ru-ru': 'Главное меню',
    ca: 'Header',
    'es-es': 'Header',
  },
  menu: {
    'en-us': 'Menu',
    'ru-ru': 'Меню',
    ca: 'Menu',
    'es-es': 'Menu',
  },
  showDataEntry: {
    'en-us': 'Show Data Entry',
    'ru-ru': 'Показать ввод данных',
    ca: 'Show Data Entry',
    'es-es': 'Show Data Entry',
  },
  showInteractions: {
    'en-us': 'Show Interactions',
    'ru-ru': 'Показать взаимодействия',
    ca: 'Show Interactions',
    'es-es': 'Show Interactions',
  },
  showTrees: {
    'en-us': 'Show Trees',
    'ru-ru': 'Показать деревья',
    ca: 'Show Trees',
    'es-es': 'Show Trees',
  },
  showRecordSets: {
    'en-us': 'Show Record Sets',
    'ru-ru': 'Показать наборы записей',
    ca: 'Show Record Sets',
    'es-es': 'Show Record Sets',
  },
  showQueries: {
    'en-us': 'Show Queries',
    'ru-ru': 'Показать запросы',
    ca: 'Show Queries',
    'es-es': 'Show Queries',
  },
  showReports: {
    'en-us': 'Show Reports',
    'ru-ru': 'Показать отчеты',
    ca: 'Show Reports',
    'es-es': 'Show Reports',
  },
  showAttachments: {
    'en-us': 'Show Attachments',
    'ru-ru': 'Показать вложения',
    ca: 'Show Attachments',
    'es-es': 'Show Attachments',
  },
  showWorkBench: {
    'en-us': 'Show WorkBench',
    'ru-ru': 'Показать WorkBench',
    ca: 'Show WorkBench',
    'es-es': 'Show WorkBench',
  },
  application: {
    'en-us': 'Application',
    'ru-ru': 'Программа',
    ca: 'Application',
    'es-es': 'Application',
  },
  allowDismissingErrors: {
    'en-us': 'Allow dismissing error messages',
    'ru-ru': 'Разрешить отклонять сообщения об ошибках',
    ca: 'Allow dismissing error messages',
    'es-es': 'Allow dismissing error messages',
  },
  updatePageTitle: {
    'en-us': 'Update page title',
    'ru-ru': 'Обновить заголовок страницы',
    ca: 'Update page title',
    'es-es': 'Update page title',
  },
  updatePageTitleDialogDescription: {
    'en-us': "Whether to update the title of the page to match dialog's header",
    'ru-ru':
      'Обновлять ли заголовок страницы в соответствии с заголовком диалогового окна',
    ca: "Whether to update the title of the page to match dialog's header",
    'es-es': "Whether to update the title of the page to match dialog's header",
  },
  updatePageTitleFormDescription: {
    'en-us': 'Whether to update the title of the page to match current record',
    'ru-ru':
      'Обновлять ли заголовок страницы в соответствии с текущим объектом',
    ca: 'Whether to update the title of the page to match current record',
    'es-es': 'Whether to update the title of the page to match current record',
  },
  queryComboBox: {
    'en-us': 'Query Combo Box',
    'ru-ru': 'Поле автозаполнения',
    ca: 'Query Combo Box',
    'es-es': 'Query Combo Box',
  },
  searchAlgorithm: {
    'en-us': 'Search Algorithm',
    'ru-ru': 'Алгоритм поиска',
    ca: 'Search Algorithm',
    'es-es': 'Search Algorithm',
  },
  startsWith: {
    'en-us': 'Starts With (case-insensitive)',
    'ru-ru': 'Начинается с (без учета регистра)',
    ca: 'Starts With (case-insensitive)',
    'es-es': 'Starts With (case-insensitive)',
  },
  startsWithDescription: {
    'en-us': 'Search for values that begin with a given query string',
    'ru-ru': 'Поиск значений, начинающихся с заданной строки запроса',
    ca: 'Search for values that begin with a given query string',
    'es-es': 'Search for values that begin with a given query string',
  },
  startsWithCaseSensitive: {
    'en-us': 'Starts With (case-sensitive)',
    'ru-ru': 'Начинается с (с учетом регистра)',
    ca: 'Starts With (case-sensitive)',
    'es-es': 'Starts With (case-sensitive)',
  },
  startsWithCaseSensitiveDescription: {
    'en-us':
      'Search for values that begin with a given query string. Can use wildcards',
    'ru-ru':
      'Поиск значений, начинающихся с заданной строки запроса. Можно использовать подстановочные знаки',
    ca: 'Search for values that begin with a given query string. Can use wildcards',
    'es-es':
      'Search for values that begin with a given query string. Can use wildcards',
  },
  contains: {
    'en-us': 'Contains (case-sensitive)',
    'ru-ru': 'Содержит (с учетом регистра)',
    ca: 'Contains (case-sensitive)',
    'es-es': 'Contains (case-sensitive)',
  },
  containsDescription: {
    'en-us': 'Search for values that contain a given query string',
    'ru-ru':
      'Поиск значений, содержащих заданную строку запроса (с учетом регистра)',
    ca: 'Search for values that contain a given query string (case-sensitive)',
    'es-es':
      'Search for values that contain a given query string (case-sensitive)',
  },
  highlightMatch: {
    'en-us': 'Highlight matched substring',
    'ru-ru': 'Выделить совпадающую подстроку',
    ca: 'Highlight matched substring',
    'es-es': 'Highlight matched substring',
  },
  language: {
    'en-us': 'Language',
    'ru-ru': 'Язык',
    ca: 'Language',
    'es-es': 'Language',
  },
  languageDescription: {
    'en-us': 'Determines field captions, usage notes and table captions',
    'ru-ru':
      'Определяет заголовки полей, примечания по использованию и заголовки таблиц',
    ca: 'Determines field captions, usage notes and table captions',
    'es-es': 'Determines field captions, usage notes and table captions',
  },
  resetToDefault: {
    'en-us': 'Reset to default',
    'ru-ru': 'Сброс по умолчанию',
    ca: 'Reset to default',
    'es-es': 'Reset to default',
  },
  showDialogIcon: {
    'en-us': 'Show icon in the header',
    'ru-ru': 'Показать значок в шапке',
    ca: 'Show icon in the header',
    'es-es': 'Show icon in the header',
  },
  scaleInterface: {
    'en-us': 'Scale Interface',
    'ru-ru': 'Масштаб интерфейса',
    ca: 'Scale Interface',
    'es-es': 'Scale Interface',
  },
  scaleInterfaceDescription: {
    'en-us': 'Scale interface to match font size',
    'ru-ru': 'Масштабировать интерфейс, чтобы он соответствовал размеру шрифта',
    ca: 'Scale interface to match font size',
    'es-es': 'Scale interface to match font size',
  },
  welcomePage: {
    'en-us': 'Welcome page',
    'ru-ru': 'Страница приветствия',
    ca: 'Welcome page',
    'es-es': 'Welcome page',
  },
  content: {
    'en-us': 'Content',
    'ru-ru': 'Содержание',
    ca: 'Content',
    'es-es': 'Content',
  },
  defaultImage: {
    'en-us': 'Specify Logo',
    'ru-ru': 'Логотип Specify',
    ca: 'Specify Logo',
    'es-es': 'Specify Logo',
  },
  customImage: {
    'en-us': 'Custom image',
    'ru-ru': 'Произвольное изображение',
    ca: 'Custom image',
    'es-es': 'Custom image',
  },
  customImageDescription: {
    'en-us': 'A URL to an image that would be displayed on the home page:',
    'ru-ru':
      'URL-адрес изображения, которое будет отображаться на главной странице:',
    ca: 'A URL to an image that would be displayed on the home page:',
    'es-es': 'A URL to an image that would be displayed on the home page:',
  },
  embeededWebpage: {
    'en-us': 'Embedded web page',
    'ru-ru': 'Обернутая веб-страница',
    ca: 'Embedded web page',
    'es-es': 'Embedded web page',
  },
  embeededWebpageDescription: {
    'en-us': 'A URL to a page that would be embedded on the home page:',
    'ru-ru': 'URL-адрес страницы, которая будет встроена в домашнюю страницу:',
    ca: 'A URL to a page that would be embedded on the home page:',
    'es-es': 'A URL to a page that would be embedded on the home page:',
  },
  behavior: {
    'en-us': 'Behavior',
    'ru-ru': 'Поведение',
    ca: 'Behavior',
    'es-es': 'Behavior',
  },
  enableAutoNumbering: {
    'en-us': 'Enable auto numbering',
    'ru-ru': 'Включить автоматическую нумерацию',
    ca: 'Enable auto numbering',
    'es-es': 'Enable auto numbering',
  },
  enableAutoNumberingDescription: {
    'en-us': `If field has a formatter, whose placeholder value was used, the
      placeholder would be replaced with the auto numbered value`,
    'ru-ru': `Если поле имеет средство форматирования, значение заполнителя
      которого было использовано, заполнитель будет заменен значением с
      автоматической нумерацией`,
    ca: `If field has a formatter, whose placeholder value was used, the
      placeholder would be replaced with the auto numbered value`,
    'es-es': `If field has a formatter, whose placeholder value was used, the
      placeholder would be replaced with the auto numbered value`,
  },
  noRestrictionsMode: {
    'en-us': 'No restrictions mode',
    'ru-ru': 'Режим без ограничений',
    ca: 'No restrictions mode',
    'es-es': 'No restrictions mode',
  },
  noRestrictionsModeWbDescription: {
    'en-us': 'Allows uploading data to any field in any table',
    'ru-ru': 'Позволяет загружать данные в любое поле любой таблицы',
    ca: 'Allows uploading data to any field in any table',
    'es-es': 'Allows uploading data to any field in any table',
  },
  noRestrictionsModeQueryDescription: {
    'en-us': 'Allows querying data from any field in any table',
    'ru-ru': 'Позволяет видеть данные из любого поля в любой таблице',
    ca: 'Allows querying data from any field in any table',
    'es-es': 'Allows querying data from any field in any table',
  },
  adminsOnlyPreference: {
    'en-us': "You don't have permission to change this option",
    'ru-ru': 'У вас недостаточно прав для изменения этого параметра.',
    ca: "You don't have permission to change this option",
    'es-es': "You don't have permission to change this option",
  },
  // FIXME: localize
  stickyScrolling: {
    'en-us': 'Sticky scroll bar',
    'ru-ru': 'Sticky scroll bar',
    ca: 'Sticky scroll bar',
    'es-es': 'Sticky scroll bar',
  },
});
