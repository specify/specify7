/**
 * Localization strings for the preferences menu
 *
 * @module
 */

import { createDictionary } from './utils';
import { Key } from '../components/basic';
import React from 'react';

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
      not in the list. A comma separated list of fonts is also supported, where
      second font would be used if first one is not installed and so on`,
    'ru-ru': `Вы можете указать любой шрифт, который есть на вашем компьютере,
      даже если он нет в списке. Поддерживается список шрифтов, разделенных
      запятыми, где второй шрифт будет использоваться, если первый не установлен
      и т.д.`,
    ca: `You can specify any font that is on your computer, even if it is
      not in the list. A comma separated list of fonts is also supported, where
      second font would be used if first one is not installed and so on`,
    'es-es': `You can specify any font that is on your computer, even if it is
      not in the list. A comma separated list of fonts is also supported, where
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
  fieldBackgrounds: {
    'en-us': 'Field backgrounds',
    'ru-ru': 'Фон полей',
    ca: 'Field backgrounds',
    'es-es': 'Field backgrounds',
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
  treeAccentColor: {
    'en-us': 'Tree accent color',
    'ru-ru': 'Акцентный цвет дерева',
    ca: 'Tree accent color',
    'es-es': 'Tree accent color',
  },
  synonymColor: {
    'en-us': 'Synonym color',
    'ru-ru': 'Цвет синонима',
    ca: 'Synonym color',
    'es-es': 'Synonym color',
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
  reset: {
    'en-us': 'Reset',
    'ru-ru': 'Сброс',
    ca: 'Reset',
    'es-es': 'Reset',
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
    'en-us': 'Welcome Page',
    'ru-ru': 'Страница Приветствия',
    ca: 'Welcome Page',
    'es-es': 'Welcome Page',
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
  embeddedWebpage: {
    'en-us': 'Embedded web page',
    'ru-ru': 'Обернутая веб-страница',
    ca: 'Embedded web page',
    'es-es': 'Embedded web page',
  },
  embeddedWebpageDescription: {
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
  stickyScrolling: {
    'en-us': 'Sticky scroll bar',
    'ru-ru': 'Липкая полоса прокрутки',
    ca: 'Sticky scroll bar',
    'es-es': 'Sticky scroll bar',
  },
  foreground: {
    'en-us': 'Foreground',
    'ru-ru': 'Передний план',
    ca: 'Foreground',
    'es-es': 'Foreground',
  },
  background: {
    'en-us': 'Background',
    'ru-ru': 'Задний план',
    ca: 'Background',
    'es-es': 'Background',
  },
  darkForeground: {
    'en-us': 'Foreground (dark theme)',
    'ru-ru': 'Передний план (темная тема)',
    ca: 'Foreground (dark theme)',
    'es-es': 'Foreground (dark theme)',
  },
  darkBackground: {
    'en-us': 'Background (dark theme)',
    'ru-ru': 'Задний план (темная тема)',
    ca: 'Background (dark theme)',
    'es-es': 'Background (dark theme)',
  },
  accentColor1: {
    'en-us': 'Accent color 1',
    'ru-ru': 'Акцентный цвет 1',
    ca: 'Accent color 1',
    'es-es': 'Accent color 1',
  },
  accentColor2: {
    'en-us': 'Accent color 2',
    'ru-ru': 'Акцентный цвет 2',
    ca: 'Accent color 2',
    'es-es': 'Accent color 2',
  },
  accentColor3: {
    'en-us': 'Accent color 3',
    'ru-ru': 'Акцентный цвет 3',
    ca: 'Accent color 3',
    'es-es': 'Accent color 3',
  },
  accentColor4: {
    'en-us': 'Accent color 4',
    'ru-ru': 'Акцентный цвет 4',
    ca: 'Accent color 4',
    'es-es': 'Accent color 5',
  },
  accentColor5: {
    'en-us': 'Accent color 5',
    'ru-ru': 'Акцентный цвет 5',
    ca: 'Accent color 5',
    'es-es': 'Accent color 5',
  },
  spreadsheet: {
    'en-us': 'Spreadsheet',
    'ru-ru': 'Таблица',
    ca: 'Spreadsheet',
    'es-es': 'Spreadsheet',
  },
  minSpareRows: {
    'en-us': 'Number of blank rows at the bottom',
    'ru-ru': 'Количество пустых строк внизу',
    ca: 'Number of blank rows at the bottom',
    'es-es': 'Number of blank rows at the bottom',
  },
  autoWrapCols: {
    'en-us': 'Navigate to the other side when reached the edge column',
    'ru-ru': 'Перейты на другую сторону, когда достигнете краевого столбца.',
    ca: 'Navigate to the other side when reached the edge column',
    'es-es': 'Navigate to the other side when reached the edge column',
  },
  autoWrapRows: {
    'en-us': 'Navigate to the other side when reached the edge row',
    'ru-ru': 'Перейты на другую сторону, когда достигнете краевого ряда',
    ca: 'Navigate to the other side when reached the edge row',
    'es-es': 'Navigate to the other side when reached the edge row',
  },
  enterBeginsEditing: {
    'en-us': 'Enter key begins editing cell',
    'ru-ru': 'Клавиша Enter начинает редактирование ячейки',
    ca: 'Enter key begins editing cell',
    'es-es': 'Enter key begins editing cell',
  },
  tabMoveDirection: {
    'en-us': (
      <span>
        Direction of movement when <Key>Tab</Key> key is pressed
      </span>
    ),
    'ru-ru': (
      <span>
        Направление движения при нажатии клавиши <Key>Tab</Key>
      </span>
    ),
    ca: (
      <span>
        Direction of movement when <Key>Tab</Key> key is pressed
      </span>
    ),
    'es-es': (
      <span>
        Direction of movement when <Key>Tab</Key> key is pressed
      </span>
    ),
  },
  tabMoveDirectionDescription: {
    'en-us': (
      <span>
        You can move in the opposite direction by pressing <Key>Shift</Key>+
        <Key>Tab</Key>
      </span>
    ),
    'ru-ru': (
      <span>
        Вы можете двигаться в противоположном направлении, нажав{' '}
        <Key>Shift</Key>+<Key>Tab</Key>
      </span>
    ),
    ca: (
      <span>
        You can move in the opposite direction by pressing <Key>Shift</Key>+
        <Key>Tab</Key>
      </span>
    ),
    'es-es': (
      <span>
        You can move in the opposite direction by pressing <Key>Shift</Key>+
        <Key>Tab</Key>
      </span>
    ),
  },
  column: {
    'en-us': 'Column',
    'ru-ru': 'Столбец',
    ca: 'Column',
    'es-es': 'Column',
  },
  row: {
    'en-us': 'Row',
    'ru-ru': 'Ряд',
    ca: 'Row',
    'es-es': 'Row',
  },
  enterMoveDirection: {
    'en-us': (
      <span>
        Direction of movement when <Key>Enter</Key> key is pressed
      </span>
    ),
    'ru-ru': (
      <span>
        Направление движения при нажатии клавиши <Key>Enter</Key>
      </span>
    ),
    ca: (
      <span>
        Direction of movement when <Key>Enter</Key> key is pressed
      </span>
    ),
    'es-es': (
      <span>
        Direction of movement when <Key>Enter</Key> key is pressed
      </span>
    ),
  },
  enterMoveDirectionDescription: {
    'en-us': (
      <span>
        You can move in the opposite direction by pressing <Key>Shift</Key>+
        <Key>Enter</Key>
      </span>
    ),
    'ru-ru': (
      <span>
        Вы можете двигаться в противоположном направлении, нажав{' '}
        <Key>Shift</Key>+<Key>Enter</Key>
      </span>
    ),
    ca: (
      <span>
        You can move in the opposite direction by pressing <Key>Shift</Key>+
        <Key>Enter</Key>
      </span>
    ),
    'es-es': (
      <span>
        You can move in the opposite direction by pressing <Key>Shift</Key>+
        <Key>Enter</Key>
      </span>
    ),
  },
  filterPickLists: {
    'en-us': 'Filter pick list items',
    'ru-ru': 'Отфильтровать элементы списка выбора',
    ca: 'Filter pick list items',
    'es-es': 'Filter pick list items',
  },
  caseSensitive: {
    'en-us': 'Case-sensitive',
    'ru-ru': 'С учетом регистра',
    ca: 'Case-sensitive',
    'es-es': 'Case-sensitive',
  },
  caseInsensitive: {
    'en-us': 'Case-insensitive',
    'ru-ru': 'Без учета регистра',
    ca: 'Case-insensitive',
    'es-es': 'Case-insensitive',
  },
  showNoReadTables: {
    'en-us': 'Show tables without "Read" access',
    'ru-ru': 'Показать таблицы без доступа «Чтение»',
    ca: 'Show tables without "Read" access',
    'es-es': 'Show tables without "Read" access',
  },
  showNoAccessTables: {
    'en-us': 'Show tables without "Create" access',
    'ru-ru': 'Показать таблицы без доступа «Создать»',
    ca: 'Show tables without "Create" access',
    'es-es': 'Show tables without "Create" access',
  },
  textAreaAutoGrow: {
    'en-us': 'Text boxes grow automatically',
    'ru-ru': 'Текстовое поле увеличивается автоматически',
    ca: 'Text boxes grow automatically',
    'es-es': 'Text boxes grow automatically',
  },
  clearQueryFilters: {
    'en-us': 'Reset query filters',
    'ru-ru': 'Очистить фильтры запросов',
    ca: 'Reset query filters',
    'es-es': 'Reset query filters',
  },
  autoGrowAutoComplete: {
    'en-us': 'Allow autocomplete to grow as wide as need',
    'ru-ru':
      'Разрешить автозаполнение расширяться настолько, насколько это необходимо',
    ca: 'Allow autocomplete to grow as wide as need',
    'es-es': 'Allow autocomplete to grow as wide as need',
  },
  tableNameInTitle: {
    'en-us': 'Include table name in the page title',
    'ru-ru': 'Включить название таблицы в заголовок страницы',
    ca: 'Include table name in the page title',
    'es-es': 'Include table name in the page title',
  },
  doubleClickZoom: {
    'en-us': 'Double click to zoom',
    'ru-ru': 'Дважды щелкните, чтобы увеличить',
    ca: 'Double click to zoom',
    'es-es': 'Double click to zoom',
  },
  closePopupOnClick: {
    'en-us': 'Close pop-up on outside click',
    'ru-ru': 'Закрыть всплывающее окно по внешнему клику',
    ca: 'Close pop-up on outside click',
    'es-es': 'Close pop-up on outside click',
  },
  animateTransitions: {
    'en-us': 'Animate transitions',
    'ru-ru': 'Анимация переходов',
    ca: 'Animate transitions',
    'es-es': 'Animate transitions',
  },
  panInertia: {
    'en-us': 'Pan inertia',
    'ru-ru': 'Инерция панорамирования',
    ca: 'Pan inertia',
    'es-es': 'Pan inertia',
  },
  mouseDrags: {
    'en-us': 'Mouse drags',
    'ru-ru': 'Мышь может двигать карту',
    ca: 'Mouse drags',
    'es-es': 'Mouse drags',
  },
  scrollWheelZoom: {
    'en-us': 'Scroll wheel zoom',
    'ru-ru': 'Колесо прокрутки может масштабировать',
    ca: 'Scroll wheel zoom',
    'es-es': 'Scroll wheel zoom',
  },
  // FIXME: localize
  definition: {
    'en-us': 'Definition',
    'ru-ru': 'Definition',
    ca: 'Definition',
    'es-es': 'Definition',
  },
  flexibleColumnWidth: {
    'en-us': 'Flexible column width',
    'ru-ru': 'Flexible column width',
    ca: 'Flexible column width',
    'es-es': 'Flexible column width',
  },
  closeOnEsc: {
    'en-us': (
      <>
        Close on <Key>ESC</Key> key press
      </>
    ),
    'ru-ru': (
      <>
        Close on <Key>ESC</Key> key press
      </>
    ),
    ca: (
      <>
        Close on <Key>ESC</Key> key press
      </>
    ),
    'es-es': (
      <>
        Close on <Key>ESC</Key> key press
      </>
    ),
  },
  closeOnOutsideClick: {
    'en-us': 'Close on outside click',
    'ru-ru': 'Close on outside click',
    ca: 'Close on outside click',
    'es-es': 'Close on outside click',
  },
  specifyNetworkBadge: {
    'en-us': 'Specify Network Badge',
    'ru-ru': 'Specify Network Badge',
    ca: 'Specify Network Badge',
    'es-es': 'Specify Network Badge',
  },
  useAccessibleFullDatePicker: {
    'en-us': 'Use accessible full date picker',
    'ru-ru': 'Use accessible full date picker',
    ca: 'Use accessible full date picker',
    'es-es': 'Use accessible full date picker',
  },
  useAccessibleMonthPicker: {
    'en-us': 'Use accessible month picker',
    'ru-ru': 'Use accessible month picker',
    ca: 'Use accessible month picker',
    'es-es': 'Use accessible month picker',
  },
  condensedQueryResult: {
    'en-us': 'Condensed Query Result',
    'ru-ru': 'Condensed Query Result',
    ca: 'Condensed Query Result',
    'es-es': 'Condensed Query Result',
  },
});
