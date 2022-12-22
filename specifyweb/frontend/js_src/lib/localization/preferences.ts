/**
 * Localization strings for the preferences menu
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const preferencesText = createDictionary({
  preferences: {
    'en-us': 'Preferences',
    'ru-ru': 'Настройки',
  },
  customization: {
    'en-us': 'Customization',
    'ru-ru': 'Настройка',
  },
  userPreferences: {
    'en-us': 'User Preferences',
    'ru-ru': 'Пользовательские настройки',
  },
  defaultUserPreferences: {
    'en-us': 'Default User Preferences',
    'ru-ru': 'Пользовательские настройки по умолчанию',
  },
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
  useSystemSetting: {
    'en-us': 'Use system setting',
    'ru-ru': 'Использовать системные настройки',
  },
  inheritOsSettings: {
    'en-us': 'Copies value from your Operating System settings',
    'ru-ru': 'Копирует значение из настроек вашей операционной системы',
  },
  light: {
    comment: 'Light mode',
    'en-us': 'Light',
    'ru-ru': 'Белая',
  },
  dark: {
    comment: 'Dark mode',
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
    'en-us': `
      Whether to disable translucent backgrounds for user interface components
      whenever possible (for example, table headers in tree view)
    `,
    'ru-ru': `
      Отключить ли полупрозрачный фон для пользовательского интерфейса, когда
      это возможно (например, заголовки таблиц в просмотрщике деревьев)
    `,
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
    'en-us': `
      You can specify any font that is on your computer, even if it is not in
      the list. A comma separated list of fonts is also supported, where second
      font would be used if first one is not available and so on
    `,
    'ru-ru': `
      Вы можете указать любой шрифт, который есть на вашем компьютере, даже если
      он нет в списке. Поддерживается список шрифтов, разделенных запятыми, где
      второй шрифт будет использоваться, если первый не доступен и т.д
    `,
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
    'ru-ru': 'Фон поля',
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
    'ru-ru': `
      Обновлять ли заголовок страницы в соответствии с заголовком диалогового
      окна
    `,
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
  containsInsensitive: {
    'en-us': 'Contains (case-insensitive)',
    'ru-ru': 'Содержит (без учета регистра)',
  },
  containsCaseSensitive: {
    'en-us': 'Contains (case-sensitive)',
    'ru-ru': 'Содержит (с учетом регистра)',
  },
  containsDescription: {
    'en-us': `
      Search for values that contain a given query string (case-insensitive).
    `,
    'ru-ru': `
      Поиск значений, содержащих заданную строку запроса (без учета регистра).
    `,
  },
  containsCaseSensitiveDescription: {
    'en-us':
      'Search for values that contain a given query string (case-sensitive).',
    'ru-ru': `
      Поиск значений, содержащих заданную строку запроса (с учетом регистра).
    `,
  },
  containsSecondDescription: {
    'en-us': `
      Can use _ to match any single character or % to match any number of
      characters
    `,
    'ru-ru': `
      Можно использовать _ для соответствия любому символу или % для
      соответствия любому количеству символов
    `,
  },
  highlightMatch: {
    'en-us': 'Highlight matched substring',
    'ru-ru': 'Выделить совпадающую подстроку',
  },
  languageDescription: {
    'en-us': 'Determines field captions, usage notes and table captions',
    'ru-ru': `
      Определяет заголовки полей, примечания по использованию и заголовки таблиц
    `,
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
      WARNING: enabling this may lead to data loss or database corruption.
      Please make sure you know what you are doing
    `,
    'ru-ru': `
      ВНИМАНИЕ: включение этого параметра может привести к потере данных или
      повреждению базы данных. Пожалуйста, убедитесь, что вы знаете, что делаете
    `,
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
    'en-us': 'Direction of movement when <key>Tab</key> key is pressed',
    'ru-ru': 'Направление движения при нажатии клавиши <key>Tab</key>',
  },
  tabMoveDirectionDescription: {
    'en-us': `
      You can move in the opposite direction by pressing
      <key>Shift</key>+<key>Tab</key>
    `,
    'ru-ru': `
      Вы можете двигаться в противоположном направлении, нажав
      <key>Shift</key>+<key>Tab</key>
    `,
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
    'en-us': 'Direction of movement when <key>Enter</key> key is pressed',
    'ru-ru': 'Направление движения при нажатии клавиши <key>Enter</key>',
  },
  enterMoveDirectionDescription: {
    'en-us': `
      You can move in the opposite direction by pressing
      <key>Shift</key>+<key>Enter</key>
    `,
    'ru-ru': `
      Вы можете двигаться в противоположном направлении, нажав
      <key>Shift</key>+<key>Enter</key>
    `,
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
    'ru-ru': `
      Разрешить автозаполнение расширяться настолько, насколько это необходимо
    `,
  },
  tableNameInTitle: {
    'en-us': 'Include table name in the browser page title',
    'ru-ru': 'Включить название таблицы в заголовок страницы браузера',
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
    'en-us': 'Close on <key>ESC</key> key press',
    'ru-ru': 'Закрыть при нажатии клавиши <key>ESC</key>',
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
    'ru-ru': 'Запись для открытия по умолчанию',
  },
  altClickToSupressNewTab: {
    'en-us':
      '<key>{altKeyName:string}</key>+<key>Click</key> to suppress new tab',
    'ru-ru': `
      <key>{altKeyName:string}</key>+<key>Клик</key>, чтобы скрыть новую вкладку
    `,
  },
  altClickToSupressNewTabDescription: {
    'en-us': `
      <key>{altKeyName:string}</key>+<key>Click</key> on a link that normally
      opens in a new tab to open it in the current tab
    `,
    'ru-ru': `
      <key>{altKeyName:string}</key>+<key>Клик</key> на ссылку, которая обычно
      открывается в новой вкладке, чтобы открыть ее в текущей вкладке
    `,
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
    'en-us': 'Indent with <key>Tab</key>',
    'ru-ru': 'Используйте <key>Tab</key> для отступа',
  },
  formHeaderFormat: {
    'en-us': 'Form header format',
    'ru-ru': 'Формат заголовка формы',
  },
  iconAndTableName: {
    'en-us': 'Icon and table name',
    'ru-ru': 'Иконка и название таблицы',
  },
  tableIcon: {
    'en-us': 'Table icon',
    'ru-ru': 'Иконка таблицы',
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
} as const);
