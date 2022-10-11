/**
 * Localization strings for the preferences menu
 *
 * @module
 */

import React from 'react';

import { Key } from '../components/Atoms';
import { createDictionary } from './utils';

const altKeyName = globalThis.navigator?.appVersion.includes('Mac')
  ? 'Option'
  : 'Alt';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

/* eslint-disable react/jsx-no-literals */
/* eslint-disable @typescript-eslint/naming-convention */
export const preferencesText = createDictionary({
  general: {
    'en-us': 'General',
    'ru-ru': 'Основные',
  },
  ui: {
    'en-us': 'User Interface',
    'ru-ru': 'Пользовательский интерфейс',
  },
  theme: {
    'en-us': 'Theme',
    'ru-ru': 'Тема',
  },
  system: {
    'en-us': 'Use system setting',
    'ru-ru': 'Использовать системные настройки',
  },
  inheritOsSettings: {
    'en-us': 'Copies value from your Operating System settings',
    'ru-ru': 'Копирует значение из настроек вашей операционной системы',
  },
  light: {
    'en-us': 'White',
    'ru-ru': 'Белая',
  },
  dark: {
    'en-us': 'Dark',
    'ru-ru': 'Темная',
  },
  reduceMotion: {
    'en-us': 'Reduce motion',
    'ru-ru': 'Уменьшить движение',
  },
  reduceMotionDescription: {
    'en-us': 'Disable non-essential animations and transitions',
    'ru-ru': 'Отключить ненужные анимации и переходы',
  },
  reduceTransparency: {
    'en-us': 'Reduce transparency',
    'ru-ru': 'Уменьшить прозрачность',
  },
  reduceTransparencyDescription: {
    'en-us': `Whether to disable translucent backgrounds for user interface
      components whenever possible (for example, table headers in tree view)`,
    'ru-ru': `Отключить ли полупрозрачный фон для пользовательского интерфейса,
      когда это возможно (например, заголовки таблиц в просмотрщике деревьев)`,
  },
  contrast: {
    'en-us': 'Contrast',
    'ru-ru': 'Контраст',
  },
  increase: {
    'en-us': 'Increase',
    'ru-ru': 'Увеличить',
  },
  reduce: {
    'en-us': 'Reduce',
    'ru-ru': 'Уменьшать',
  },
  noPreference: {
    'en-us': 'No preference',
    'ru-ru': 'Нет предпочтений',
  },
  fontSize: {
    'en-us': 'Font size',
    'ru-ru': 'Размер шрифта',
  },
  fontFamily: {
    'en-us': 'Font family',
    'ru-ru': 'Шрифт',
  },
  fontFamilyDescription: {
    'en-us': `You can specify any font that is on your computer, even if it is
      not in the list. A comma separated list of fonts is also supported, where
      second font would be used if first one is not available and so on`,
    'ru-ru': `Вы можете указать любой шрифт, который есть на вашем компьютере,
      даже если он нет в списке. Поддерживается список шрифтов, разделенных
      запятыми, где второй шрифт будет использоваться, если первый не доступен
      и т.д.`,
  },
  defaultFont: {
    'en-us': '(default font)',
    'ru-ru': '(шрифт по умолчанию)',
  },
  maxFormWidth: {
    'en-us': 'Max form width',
    'ru-ru': 'Максимальная ширина формы',
  },
  fieldBackgrounds: {
    'en-us': 'Field backgrounds',
    'ru-ru': 'Фон полей',
  },
  fieldBackground: {
    'en-us': 'Field background',
    'ru-ru': 'Фон полей',
  },
  disabledFieldBackground: {
    'en-us': 'Disabled field background',
    'ru-ru': 'Фон полей только для чтения',
  },
  invalidFieldBackground: {
    'en-us': 'Invalid field background',
    'ru-ru': 'Фон недействительных полей',
  },
  requiredFieldBackground: {
    'en-us': 'Required field background',
    'ru-ru': 'Фон обязательных полей',
  },
  darkFieldBackground: {
    'en-us': 'Field background (dark theme)',
    'ru-ru': 'Фон полей (темная тема)',
  },
  darkDisabledFieldBackground: {
    'en-us': 'Disabled field background (dark theme)',
    'ru-ru': 'Фон полей только для чтения (темная тема)',
  },
  darkInvalidFieldBackground: {
    'en-us': 'Invalid field background (dark theme)',
    'ru-ru': 'Фон недействительных полей (темная тема)',
  },
  darkRequiredFieldBackground: {
    'en-us': 'Required field background (dark theme)',
    'ru-ru': 'Фон обязательных полей (темная тема)',
  },
  dialogs: {
    'en-us': 'Dialogs',
    'ru-ru': 'Диалоги',
  },
  appearance: {
    'en-us': 'Appearance',
    'ru-ru': 'Внешний вид',
  },
  translucentDialog: {
    'en-us': 'Translucent dialogs',
    'ru-ru': 'Полупрозрачные диалоги',
  },
  translucentDialogDescription: {
    'en-us': 'Whether dialogs have translucent background',
    'ru-ru': 'Диалоги имеют полупрозрачный фон',
  },
  alwaysPrompt: {
    'en-us': 'Always prompt to choose collection',
    'ru-ru': 'Всегда просить выбрать коллекцию',
  },
  treeEditor: {
    'en-us': 'Tree Editor',
    'ru-ru': 'Редактор дерева',
  },
  treeAccentColor: {
    'en-us': 'Tree accent color',
    'ru-ru': 'Акцентный цвет дерева',
  },
  synonymColor: {
    'en-us': 'Synonym color',
    'ru-ru': 'Цвет синонима',
  },
  showNewDataSetWarning: {
    'en-us': 'Show new Data Set warning',
    'ru-ru': 'Показать предупреждение в новых наборах данных',
  },
  showNewDataSetWarningDescription: {
    'en-us': 'Show an informational message when creating a new Data Set',
    'ru-ru':
      'Показывать информационное сообщение при создании нового набора данных',
  },
  header: {
    'en-us': 'Top Level Menu',
    'ru-ru': 'Главное меню',
  },
  menu: {
    'en-us': 'Menu',
    'ru-ru': 'Меню',
  },
  showDataEntry: {
    'en-us': 'Show Data Entry',
    'ru-ru': 'Показать ввод данных',
  },
  showInteractions: {
    'en-us': 'Show Interactions',
    'ru-ru': 'Показать взаимодействия',
  },
  showTrees: {
    'en-us': 'Show Trees',
    'ru-ru': 'Показать деревья',
  },
  showRecordSets: {
    'en-us': 'Show Record Sets',
    'ru-ru': 'Показать наборы записей',
  },
  showQueries: {
    'en-us': 'Show Queries',
    'ru-ru': 'Показать запросы',
  },
  showReports: {
    'en-us': 'Show Reports',
    'ru-ru': 'Показать отчеты',
  },
  showAttachments: {
    'en-us': 'Show Attachments',
    'ru-ru': 'Показать вложения',
  },
  showWorkBench: {
    'en-us': 'Show WorkBench',
    'ru-ru': 'Показать WorkBench',
  },
  application: {
    'en-us': 'Application',
    'ru-ru': 'Программа',
  },
  allowDismissingErrors: {
    'en-us': 'Allow dismissing error messages',
    'ru-ru': 'Разрешить отклонять сообщения об ошибках',
  },
  updatePageTitle: {
    'en-us': 'Update page title',
    'ru-ru': 'Обновить заголовок страницы',
  },
  updatePageTitleDialogDescription: {
    'en-us': "Whether to update the title of the page to match dialog's header",
    'ru-ru':
      'Обновлять ли заголовок страницы в соответствии с заголовком диалогового окна',
  },
  updatePageTitleFormDescription: {
    'en-us': 'Whether to update the title of the page to match current record',
    'ru-ru':
      'Обновлять ли заголовок страницы в соответствии с текущим объектом',
  },
  queryComboBox: {
    'en-us': 'Query Combo Box',
    'ru-ru': 'Поле автозаполнения',
  },
  searchAlgorithm: {
    'en-us': 'Search Algorithm',
    'ru-ru': 'Алгоритм поиска',
  },
  treeSearchAlgorithm: {
    'en-us': 'Search Algorithm (for relationships with tree tables)',
    'ru-ru': 'Алгоритм поиска (для деревьев)',
  },
  startsWith: {
    'en-us': 'Starts with',
    'ru-ru': 'Начинается с',
  },
  startsWithInsensitive: {
    'en-us': 'Starts With (case-insensitive)',
    'ru-ru': 'Начинается с (без учета регистра)',
  },
  startsWithDescription: {
    'en-us': 'Search for values that begin with a given query string',
    'ru-ru': 'Поиск значений, начинающихся с заданной строки запроса',
  },
  startsWithCaseSensitive: {
    'en-us': 'Starts With (case-sensitive)',
    'ru-ru': 'Начинается с (с учетом регистра)',
  },
  startsWithCaseSensitiveDescription: {
    'en-us': 'Search for values that begin with a given query string.',
    'ru-ru': 'Поиск значений, начинающихся с заданной строки запроса.',
  },
  startsWithCaseSensitiveSecondDescription: {
    'en-us':
      'Can use _ to match any single character or % to match any number of characters',
    'ru-ru':
      'Можно использовать _ для соответствия любому символу или % для соответствия любому количеству символов',
  },
  contains: {
    'en-us': 'Contains',
    'ru-ru': 'Содержит',
  },
  containsInsensitive: {
    'en-us': 'Contains (case-insensitive)',
    'ru-ru': 'Содержит (без учета регистра)',
  },
  containsCaseSensitive: {
    'en-us': 'Contains (case-sensitive)',
    'ru-ru': 'Содержит (с учетом регистра)',
  },
  containsDescription: {
    'en-us': 'Search for values that contain a given query string.',
    'ru-ru': 'Поиск значений, содержащих заданную строку запроса.',
  },
  containsCaseSensitiveDescription: {
    'en-us':
      'Search for values that contain a given query string (case-sensitive).',
    'ru-ru':
      'Поиск значений, содержащих заданную строку запроса (с учетом регистра).',
  },
  containsSecondDescription: {
    'en-us':
      'Can use _ to match any single character or % to match any number of characters',
    'ru-ru':
      'Можно использовать _ для соответствия любому символу или % для соответствия любому количеству символов',
  },
  highlightMatch: {
    'en-us': 'Highlight matched substring',
    'ru-ru': 'Выделить совпадающую подстроку',
  },
  language: {
    'en-us': 'Language',
    'ru-ru': 'Язык',
  },
  languageDescription: {
    'en-us': 'Determines field captions, usage notes and table captions',
    'ru-ru':
      'Определяет заголовки полей, примечания по использованию и заголовки таблиц',
  },
  showDialogIcon: {
    'en-us': 'Show icon in the header',
    'ru-ru': 'Показать значок в шапке',
  },
  scaleInterface: {
    'en-us': 'Scale Interface',
    'ru-ru': 'Масштаб интерфейса',
  },
  scaleInterfaceDescription: {
    'en-us': 'Scale interface to match font size',
    'ru-ru': 'Масштабировать интерфейс, чтобы он соответствовал размеру шрифта',
  },
  welcomePage: {
    'en-us': 'Home Page',
    'ru-ru': 'Страница Приветствия',
  },
  content: {
    'en-us': 'Content',
    'ru-ru': 'Содержание',
  },
  defaultImage: {
    'en-us': 'Specify Logo',
    'ru-ru': 'Логотип Specify',
  },
  customImage: {
    'en-us': 'Custom Image',
    'ru-ru': 'Произвольное Изображение',
  },
  customImageDescription: {
    'en-us': 'A URL to an image that would be displayed on the home page:',
    'ru-ru':
      'URL-адрес изображения, которое будет отображаться на главной странице:',
  },
  embeddedWebpage: {
    'en-us': 'Embedded web page',
    'ru-ru': 'Обернутая веб-страница',
  },
  embeddedWebpageDescription: {
    'en-us': 'A URL to a page that would be embedded on the home page:',
    'ru-ru': 'URL-адрес страницы, которая будет встроена в домашнюю страницу:',
  },
  behavior: {
    'en-us': 'Behavior',
    'ru-ru': 'Поведение',
  },
  noRestrictionsMode: {
    'en-us': 'No restrictions mode',
    'ru-ru': 'Режим без ограничений',
  },
  noRestrictionsModeWbDescription: {
    'en-us': 'Allows uploading data to any field in any table.',
    'ru-ru': 'Позволяет загружать данные в любое поле любой таблицы.',
  },
  noRestrictionsModeQueryDescription: {
    'en-us': 'Allows querying data from any field in any table.',
    'ru-ru': 'Позволяет видеть данные из любого поля в любой таблице.',
  },
  noRestrictionsModeWarning: {
    'en-us': `
      WARNING: enabling this may lead to data loss or database
      corruption. Please make sure you know what you are doing`,
    'ru-ru': `
      ВНИМАНИЕ: включение этого параметра может привести к потере данных или
      повреждению базы данных. Пожалуйста, убедитесь, что вы знаете, что
      делаете`,
  },
  adminsOnlyPreference: {
    'en-us': "You don't have permission to change this option",
    'ru-ru': 'У вас недостаточно прав для изменения этого параметра.',
  },
  stickyScrolling: {
    'en-us': 'Sticky scroll bar',
    'ru-ru': 'Липкая полоса прокрутки',
  },
  foreground: {
    'en-us': 'Foreground',
    'ru-ru': 'Передний план',
  },
  background: {
    'en-us': 'Background',
    'ru-ru': 'Задний план',
  },
  darkForeground: {
    'en-us': 'Foreground (dark theme)',
    'ru-ru': 'Передний план (темная тема)',
  },
  darkBackground: {
    'en-us': 'Background (dark theme)',
    'ru-ru': 'Задний план (темная тема)',
  },
  accentColor1: {
    'en-us': 'Accent color 1',
    'ru-ru': 'Акцентный цвет 1',
  },
  accentColor2: {
    'en-us': 'Accent color 2',
    'ru-ru': 'Акцентный цвет 2',
  },
  accentColor3: {
    'en-us': 'Accent color 3',
    'ru-ru': 'Акцентный цвет 3',
  },
  accentColor4: {
    'en-us': 'Accent color 4',
    'ru-ru': 'Акцентный цвет 4',
  },
  accentColor5: {
    'en-us': 'Accent color 5',
    'ru-ru': 'Акцентный цвет 5',
  },
  spreadsheet: {
    'en-us': 'Spreadsheet',
    'ru-ru': 'Таблица',
  },
  minSpareRows: {
    'en-us': 'Number of blank rows at the end',
    'ru-ru': 'Количество пустых строк внизу',
  },
  autoWrapCols: {
    'en-us': 'Navigate to the other side when reaching the edge column',
    'ru-ru': 'Перейты на другую сторону, когда достигнете краевого столбца.',
  },
  autoWrapRows: {
    'en-us': 'Navigate to the other side when reaching the edge row',
    'ru-ru': 'Перейты на другую сторону, когда достигнете краевого ряда',
  },
  enterBeginsEditing: {
    'en-us': 'Enter key begins editing cell',
    'ru-ru': 'Клавиша Enter начинает редактирование ячейки',
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
  },
  column: {
    'en-us': 'Column',
    'ru-ru': 'Столбец',
  },
  row: {
    'en-us': 'Row',
    'ru-ru': 'Ряд',
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
  },
  filterPickLists: {
    'en-us': 'Filter pick list items',
    'ru-ru': 'Отфильтровать элементы списка выбора',
  },
  exportFileDelimiter: {
    'en-us': 'Export file delimiter',
    'ru-ru': 'Разделитель полей в файле экспорта',
  },
  caseSensitive: {
    'en-us': 'Case-sensitive',
    'ru-ru': 'С учетом регистра',
  },
  caseInsensitive: {
    'en-us': 'Case-insensitive',
    'ru-ru': 'Без учета регистра',
  },
  showNoReadTables: {
    'en-us': 'Show tables without "Read" access',
    'ru-ru': 'Показать таблицы без доступа «Чтение»',
  },
  showNoAccessTables: {
    'en-us': 'Show tables without "Create" access',
    'ru-ru': 'Показать таблицы без доступа «Создать»',
  },
  textAreaAutoGrow: {
    'en-us': 'Text boxes grow automatically',
    'ru-ru': 'Текстовое поле увеличивается автоматически',
  },
  clearQueryFilters: {
    'en-us': 'Reset query filters',
    'ru-ru': 'Очистить фильтры запросов',
  },
  autoGrowAutoComplete: {
    'en-us': 'Allow autocomplete to grow as wide as need',
    'ru-ru':
      'Разрешить автозаполнение расширяться настолько, насколько это необходимо',
  },
  tableNameInTitle: {
    'en-us': 'Include table name in the page title',
    'ru-ru': 'Включить название таблицы в заголовок страницы',
  },
  doubleClickZoom: {
    'en-us': 'Double click to zoom',
    'ru-ru': 'Дважды щелкните, чтобы увеличить',
  },
  closePopupOnClick: {
    'en-us': 'Close pop-up on outside click',
    'ru-ru': 'Закрыть всплывающее окно по внешнему клику',
  },
  animateTransitions: {
    'en-us': 'Animate transitions',
    'ru-ru': 'Анимация переходов',
  },
  panInertia: {
    'en-us': 'Pan inertia',
    'ru-ru': 'Инерция панорамирования',
  },
  mouseDrags: {
    'en-us': 'Mouse drags',
    'ru-ru': 'Мышь может двигать карту',
  },
  scrollWheelZoom: {
    'en-us': 'Scroll wheel zoom',
    'ru-ru': 'Колесо прокрутки может масштабировать',
  },
  flexibleColumnWidth: {
    'en-us': 'Flexible column width',
    'ru-ru': 'Гибкая ширина столбцов',
  },
  flexibleSubGridColumnWidth: {
    'en-us': 'Flexible subview grid column width',
    'ru-ru': 'Гибкая ширина столбцов в сетке подвидa',
  },
  closeOnEsc: {
    'en-us': (
      <span>
        Close on <Key>ESC</Key> key press
      </span>
    ),
    'ru-ru': (
      <span>
        Закрыть при нажатии клавиши <Key>ESC</Key>
      </span>
    ),
  },
  closeOnOutsideClick: {
    'en-us': 'Close on outside click',
    'ru-ru': 'Закрыть по внешнему клику',
  },
  specifyNetworkBadge: {
    'en-us': 'Specify Network Badge',
    'ru-ru': 'Значок «Specify Network»',
  },
  useAccessibleFullDatePicker: {
    'en-us': 'Use accessible full date picker',
    'ru-ru': 'Включить умный полный выбор даты',
  },
  useAccessibleMonthPicker: {
    'en-us': 'Use accessible month picker',
    'ru-ru': 'Включить умный выбор месяца',
  },
  rightAlignNumberFields: {
    'en-us': 'Right-Justify numeric fields',
    'ru-ru': 'Выровнять числовые поля по правому краю',
  },
  roundedCorners: {
    'en-us': 'Rounded corners',
    'ru-ru': 'Закругленные углы',
  },
  limitMaxFieldWidth: {
    'en-us': 'Limit max field width',
    'ru-ru': 'Ограничить максимальную ширину поля',
  },
  condenseQueryResults: {
    'en-us': 'Condense query results',
    'ru-ru': 'Сжатые результаты',
  },
  blurContentBehindDialog: {
    'en-us': 'Blur content behind the dialog',
    'ru-ru': 'Размыть содержимое за диалогом',
  },
  collectionSortOrderDescription: {
    'en-us': 'This determines the visual order of collections',
    'ru-ru': 'Это определяет порядок коллекций',
  },
  recordSetRecordToOpen: {
    'en-us': 'Record to open by default',
    'ru-ru': 'Размыть содержимое за диалогом',
  },
  firstRecord: {
    'en-us': 'First record',
    'ru-ru': 'First record',
  },
  lastRecord: {
    'en-us': 'Last record',
    'ru-ru': 'Last record',
  },
  altClickToSupressNewTab: {
    'en-us': (
      <span>
        <Key>{altKeyName}</Key>+<Key>Click</Key> to suppress new tab
      </span>
    ),
    'ru-ru': (
      <span>
        <Key>{altKeyName}</Key>+<Key>Клик</Key>, чтобы скрыть новую вкладку
      </span>
    ),
  },
  altClickToSupressNewTabDescription: {
    'en-us': (
      <span>
        <Key>{altKeyName}</Key>+<Key>Click</Key> on a link that normally opens
        in a new tab to open it in the current tab
      </span>
    ),
    'ru-ru': (
      <span>
        <Key>{altKeyName}</Key>+<Key>Клик</Key> на ссылку, которая обычно
        открывается в новой вкладке, чтобы открыть ее в текущей вкладке
      </span>
    ),
  },
  makeFormDialogsModal: {
    'en-us': 'Make form dialogs gray out the background',
    'ru-ru': 'Сделать диалоги формы серым фоном',
  },
  autoScrollTree: {
    'en-us': 'Auto scroll tree to focused node',
    'ru-ru':
      'Автоматически прокручивать страницу до сфокусированного узла дерева',
  },
  lineWrap: {
    'en-us': 'Line wrap',
    'ru-ru': 'Перенос строк',
  },
  indentSize: {
    'en-us': 'Indent size',
    'ru-ru': 'Размер отступа',
  },
  indentWithTab: {
    'en-us': (
      <span>
        Indent with <Key>Tab</Key>
      </span>
    ),
    'ru-ru': (
      <span>
        Используйте <Key>Tab</Key> для отступа
      </span>
    ),
  },
  formHeaderFormat: {
    'en-us': 'Form header format',
    'ru-ru': 'Формат заголовка формы',
  },
  iconAndTableName: {
    'en-us': 'Icon and table name',
    'ru-ru': 'Иконка и название таблицы',
  },
  tableName: {
    'en-us': 'Table name',
    'ru-ru': 'Название таблицы',
  },
  tableIcon: {
    'en-us': 'Table icon',
    'ru-ru': 'Иконка таблицы',
  },
  formTable: {
    'en-us': 'Form table',
    'ru-ru': 'Форма таблицы',
  },
  maxHeight: {
    'en-us': 'Max height',
    'ru-ru': 'Максимальная высота',
  },
  autoComplete: {
    'en-us': 'Auto complete',
    'ru-ru': 'Автозаполнение',
  },
  searchCaseSensitive: {
    'en-us': 'Case-sensitive search',
    'ru-ru': 'С учетом регистра',
  },
  searchField: {
    'en-us': 'Search field',
    'ru-ru': 'Поле поиска',
  },
  showStatistics: {
    'en-us': 'Show Statistics',
    'ru-ru': 'Показать статистику',
  },
  createInteractions: {
    'en-us': 'Create interactions',
    'ru-ru': 'Создать взаимодействия',
  },
  useSpaceAsDelimiter: {
    'en-us': 'Use space as delimiter',
    'ru-ru': 'Использовать пробел как разделитель',
  },
  useCommaAsDelimiter: {
    'en-us': 'Use comma as delimiter',
    'ru-ru': 'Использовать запятую как разделитель',
  },
  useNewLineAsDelimiter: {
    'en-us': 'Use new line as delimiter',
    'ru-ru': 'Использовать новую строку как разделитель',
  },
  detectAutomatically: {
    'en-us': 'Detect automatically',
    'ru-ru': 'Определить автоматически',
  },
  useCustomDelimiters: {
    'en-us': 'Use custom delimiters',
    'ru-ru': 'Использовать пользовательские разделители',
  },
  useCustomDelimitersDescription: {
    'en-us': `
      A list of delimiters to use, in addition to the ones defined above. Put
      one delimiter per line
    `,
    'ru-ru': `
      Список разделителей, которые будут использоваться в дополнение к тем,
      которые определены выше. Поместите один разделитель на строку
    `,
  },
  detectAutomaticallyDescription: {
    'en-us': 'Detect automatically based on catalog number format',
    'ru-ru': 'Определить автоматически на основе формата номера каталога',
  },
  use: {
    'en-us': 'Use',
    'ru-ru': 'Использовать',
  },
  dontUse: {
    'en-us': 'Don’t use',
    'ru-ru': 'Не использовать',
  },
});
/* eslint-enable react/jsx-no-literals */
/* eslint-enable @typescript-eslint/naming-convention */
