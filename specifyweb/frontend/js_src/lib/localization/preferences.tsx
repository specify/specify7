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
  // FIXME: localize
  reduceTransparency: {
    'en-us': 'Reduce transparency',
    'ru-ru': 'Reduce transparency',
    ca: 'Reduce transparency',
    'es-es': 'Reduce transparency',
  },
  reduceTransparencyDescription: {
    'en-us': `Whether to disable translucent backgrounds for user interface
      components whenever possible (for example, table headers in tree view)`,
    'ru-ru': `Whether to disable translucent backgrounds for user interface
      components whenever possible (for example, table headers in tree view)`,
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
    'ru-ru': 'Font size',
    ca: 'Font size',
    'es-es': 'Font size',
  },
  fontFamily: {
    'en-us': 'Font family',
    'ru-ru': 'Font family',
    ca: 'Font family',
    'es-es': 'Font family',
  },
  fontFamilyDescription: {
    'en-us': `You can specify any font that is on your computer, even if it is
      not in the list. A comma separated list of fonts is supported, where
      second font would be used if first one is not installed and so on`,
    'ru-ru': `You can specify any font that is on your computer, even if it is
      not in the list. A comma separated list of fonts is supported, where
      second font would be used if first one is not installed and so on`,
    ca: `You can specify any font that is on your computer, even if it is
      not in the list. A comma separated list of fonts is supported, where
      second font would be used if first one is not installed and so on`,
    'es-es': `You can specify any font that is on your computer, even if it is
      not in the list. A comma separated list of fonts is supported, where
      second font would be used if first one is not installed and so on`,
  },
  defaultFont: {
    'en-us': '(default font)',
    'ru-ru': '(default font)',
    ca: '(default font)',
    'es-es': '(default font)',
  },
  maxWidth: {
    'en-us': 'Max form width',
    'ru-ru': 'Max form width',
    ca: 'Max form width',
    'es-es': 'Max form width',
  },
  fieldBackground: {
    'en-us': 'Field background',
    'ru-ru': 'Field background',
    ca: 'Field background',
    'es-es': 'Field background',
  },
  disabledFieldBackground: {
    'en-us': 'Disabled field background',
    'ru-ru': 'Disabled field background',
    ca: 'Disabled field background',
    'es-es': 'Disabled field background',
  },
  invalidFieldBackground: {
    'en-us': 'Invalid field background',
    'ru-ru': 'Invalid field background',
    ca: 'Invalid field background',
    'es-es': 'Invalid field background',
  },
  requiredFieldBackground: {
    'en-us': 'Required field background',
    'ru-ru': 'Required field background',
    ca: 'Required field background',
    'es-es': 'Required field background',
  },
  darkFieldBackground: {
    'en-us': 'Field background (dark theme)',
    'ru-ru': 'Field background (dark theme)',
    ca: 'Field background (dark theme)',
    'es-es': 'Field background (dark theme)',
  },
  darkDisabledFieldBackground: {
    'en-us': 'Disabled field background (dark theme)',
    'ru-ru': 'Disabled field background (dark theme)',
    ca: 'Disabled field background (dark theme)',
    'es-es': 'Disabled field background (dark theme)',
  },
  darkInvalidFieldBackground: {
    'en-us': 'Invalid field background (dark theme)',
    'ru-ru': 'Invalid field background (dark theme)',
    ca: 'Invalid field background (dark theme)',
    'es-es': 'Invalid field background (dark theme)',
  },
  darkRequiredFieldBackground: {
    'en-us': 'Required field background (dark theme)',
    'ru-ru': 'Required field background (dark theme)',
    ca: 'Required field background (dark theme)',
    'es-es': 'Required field background (dark theme)',
  },
  dialogs: {
    'en-us': 'Dialogs',
    'ru-ru': 'Dialogs',
    ca: 'Dialogs',
    'es-es': 'Dialogs',
  },
  appearance: {
    'en-us': 'Appearance',
    'ru-ru': 'Appearance',
    ca: 'Appearance',
    'es-es': 'Appearance',
  },
  translucentDialog: {
    'en-us': 'Translucent dialogs',
    'ru-ru': 'Translucent dialogs',
    ca: 'Translucent dialogs',
    'es-es': 'Translucent dialogs',
  },
  translucentDialogDescription: {
    'en-us': 'Whether dialogs have translucent background (easter egg)',
    'ru-ru': 'Whether dialogs have translucent background (easter egg)',
    ca: 'Whether dialogs have translucent background (easter egg)',
    'es-es': 'Whether dialogs have translucent background (easter egg)',
  },
  alwaysPrompt: {
    'en-us': 'Always prompt to choose collection',
    'ru-ru': 'Always prompt to choose collection',
    ca: 'Always prompt to choose collection',
    'es-es': 'Always prompt to choose collection',
  },
  treeEditor: {
    'en-us': 'Tree Editor',
    'ru-ru': 'Tree Editor',
    ca: 'Tree Editor',
    'es-es': 'Tree Editor',
  },
  treeColor: {
    'en-us': 'Tree color',
    'ru-ru': 'Tree color',
    ca: 'Tree color',
    'es-es': 'Tree color',
  },
  synonomyColor: {
    'en-us': 'Synonomy color',
    'ru-ru': 'Synonomy color',
    ca: 'Synonomy color',
    'es-es': 'Synonomy color',
  },
  showNewDataSetWarning: {
    'en-us': 'Show new Data Set warning',
    'ru-ru': 'Show new Data Set warning',
    ca: 'Show new Data Set warning',
    'es-es': 'Show new Data Set warning',
  },
  showNewDataSetWarningDescription: {
    'en-us': 'Show an informational message when creating a new Data Set',
    'ru-ru': 'Show an informational message when creating a new Data Set',
    ca: 'Show an informational message when creating a new Data Set',
    'es-es': 'Show an informational message when creating a new Data Set',
  },
  header: {
    'en-us': 'Header',
    'ru-ru': 'Header',
    ca: 'Header',
    'es-es': 'Header',
  },
  menu: {
    'en-us': 'Menu',
    'ru-ru': 'Menu',
    ca: 'Menu',
    'es-es': 'Menu',
  },
  showDataEntry: {
    'en-us': 'Show Data Entry',
    'ru-ru': 'Show Data Entry',
    ca: 'Show Data Entry',
    'es-es': 'Show Data Entry',
  },
  showInteractions: {
    'en-us': 'Show Interactions',
    'ru-ru': 'Show Interactions',
    ca: 'Show Interactions',
    'es-es': 'Show Interactions',
  },
  showTrees: {
    'en-us': 'Show Trees',
    'ru-ru': 'Show Trees',
    ca: 'Show Trees',
    'es-es': 'Show Trees',
  },
  showRecordSets: {
    'en-us': 'Show Record Sets',
    'ru-ru': 'Show Record Sets',
    ca: 'Show Record Sets',
    'es-es': 'Show Record Sets',
  },
  showQueries: {
    'en-us': 'Show Queries',
    'ru-ru': 'Show Queries',
    ca: 'Show Queries',
    'es-es': 'Show Queries',
  },
  showReports: {
    'en-us': 'Show Reports',
    'ru-ru': 'Show Reports',
    ca: 'Show Reports',
    'es-es': 'Show Reports',
  },
  showAttachments: {
    'en-us': 'Show Attachments',
    'ru-ru': 'Show Attachments',
    ca: 'Show Attachments',
    'es-es': 'Show Attachments',
  },
  showWorkBench: {
    'en-us': 'Show WorkBench',
    'ru-ru': 'Show WorkBench',
    ca: 'Show WorkBench',
    'es-es': 'Show WorkBench',
  },
  application: {
    'en-us': 'Application',
    'ru-ru': 'Application',
    ca: 'Application',
    'es-es': 'Application',
  },
  allowDismissingErrors: {
    'en-us': 'Allow dismissing error messages',
    'ru-ru': 'Allow dismissing error messages',
    ca: 'Allow dismissing error messages',
    'es-es': 'Allow dismissing error messages',
  },
  updatePageTitle: {
    'en-us': 'Update page title',
    'ru-ru': 'Update page title',
    ca: 'Update page title',
    'es-es': 'Update page title',
  },
  updatePageTitleDialogDescription: {
    'en-us': "Whether to update the title of the page to match dialog's header",
    'ru-ru': "Whether to update the title of the page to match dialog's header",
    ca: "Whether to update the title of the page to match dialog's header",
    'es-es': "Whether to update the title of the page to match dialog's header",
  },
  updatePageTitleFormDescription: {
    'en-us': 'Whether to update the title of the page to match current record',
    'ru-ru': 'Whether to update the title of the page to match current record',
    ca: 'Whether to update the title of the page to match current record',
    'es-es': 'Whether to update the title of the page to match current record',
  },
  queryComboBox: {
    'en-us': 'Query Combo Box',
    'ru-ru': 'Query Combo Box',
    ca: 'Query Combo Box',
    'es-es': 'Query Combo Box',
  },
  searchAlgorithm: {
    'en-us': 'Search Algorithm',
    'ru-ru': 'Search Algorithm',
    ca: 'Search Algorithm',
    'es-es': 'Search Algorithm',
  },
  startsWith: {
    'en-us': 'Starts With (case-insensitive)',
    'ru-ru': 'Starts With (case-insensitive)',
    ca: 'Starts With (case-insensitive)',
    'es-es': 'Starts With (case-insensitive)',
  },
  startsWithDescription: {
    'en-us': 'Search for values that begin with a given query string',
    'ru-ru': 'Search for values that begin with a given query string',
    ca: 'Search for values that begin with a given query string',
    'es-es': 'Search for values that begin with a given query string',
  },
  startsWithCaseSensitive: {
    'en-us': 'Starts With (case-sensitive)',
    'ru-ru': 'Starts With (case-sensitive)',
    ca: 'Starts With (case-sensitive)',
    'es-es': 'Starts With (case-sensitive)',
  },
  startsWithCaseSensitiveDescription: {
    'en-us':
      'Search for values that begin with a given query string. Can use wildcards',
    'ru-ru':
      'Search for values that begin with a given query string. Can use wildcards',
    ca: 'Search for values that begin with a given query string. Can use wildcards',
    'es-es':
      'Search for values that begin with a given query string. Can use wildcards',
  },
  contains: {
    'en-us': 'Contains (case-sensitive)',
    'ru-ru': 'Contains (case-sensitive)',
    ca: 'Contains (case-sensitive)',
    'es-es': 'Contains (case-sensitive)',
  },
  containsDescription: {
    'en-us': 'Search for values that contain a given query string',
    'ru-ru':
      'Search for values that contain a given query string (case-sensitive)',
    ca: 'Search for values that contain a given query string (case-sensitive)',
    'es-es':
      'Search for values that contain a given query string (case-sensitive)',
  },
  highlightMatch: {
    'en-us': 'Highlight matched substring',
    'ru-ru': 'Highlight matched substring',
    ca: 'Highlight matched substring',
    'es-es': 'Highlight matched substring',
  },
  language: {
    'en-us': 'Language',
    'ru-ru': 'Language',
    ca: 'Language',
    'es-es': 'Language',
  },
  languageDescription: {
    'en-us': 'Determines field captions, usage notes and table captions',
    'ru-ru': 'Determines field captions, usage notes and table captions',
    ca: 'Determines field captions, usage notes and table captions',
    'es-es': 'Determines field captions, usage notes and table captions',
  },
  resetToDefault: {
    'en-us': 'Reset to default',
    'ru-ru': 'Reset to default',
    ca: 'Reset to default',
    'es-es': 'Reset to default',
  },
  definition: {
    'en-us': 'Definition',
    'ru-ru': 'Definition',
    ca: 'Definition',
    'es-es': 'Definition',
  },
  showDialogIcon: {
    'en-us': 'Show icon in the header',
    'ru-ru': 'Show icon in the header',
    ca: 'Show icon in the header',
    'es-es': 'Show icon in the header',
  },
  scaleInterface: {
    'en-us': 'Scale Interface',
    'ru-ru': 'Scale Interface',
    ca: 'Scale Interface',
    'es-es': 'Scale Interface',
  },
  scaleInterfaceDescription: {
    'en-us': 'Scale interface to match font size',
    'ru-ru': 'Scale interface to match font size',
    ca: 'Scale interface to match font size',
    'es-es': 'Scale interface to match font size',
  },
  welcomePage: {
    'en-us': 'Welcome page',
    'ru-ru': 'Welcome page',
    ca: 'Welcome page',
    'es-es': 'Welcome page',
  },
  content: {
    'en-us': 'Content',
    'ru-ru': 'Content',
    ca: 'Content',
    'es-es': 'Content',
  },
  defaultImage: {
    'en-us': 'Specify Logo',
    'ru-ru': 'Specify Logo',
    ca: 'Specify Logo',
    'es-es': 'Specify Logo',
  },
  customImage: {
    'en-us': 'Custom image',
    'ru-ru': 'Custom image',
    ca: 'Custom image',
    'es-es': 'Custom image',
  },
  customImageDescription: {
    'en-us': 'A URL to an image that would be displayed on the home page:',
    'ru-ru': 'A URL to an image that would be displayed on the home page:',
    ca: 'A URL to an image that would be displayed on the home page:',
    'es-es': 'A URL to an image that would be displayed on the home page:',
  },
  embeededWebpage: {
    'en-us': 'Embedded web page',
    'ru-ru': 'Embedded web page',
    ca: 'Embedded web page',
    'es-es': 'Embedded web page',
  },
  embeededWebpageDescription: {
    'en-us': 'A URL to a page that would be embedded on the home page:',
    'ru-ru': 'A URL to a page that would be embedded on the home page:',
    ca: 'A URL to a page that would be embedded on the home page:',
    'es-es': 'A URL to a page that would be embedded on the home page:',
  },
  behavior: {
    'en-us': 'Behavior',
    'ru-ru': 'Behaviour',
    ca: 'Behavior',
    'es-es': 'Behavior',
  },
  enableAutoNumbering: {
    'en-us': 'Enable auto numbering',
    'ru-ru': 'Enable auto numbering',
    ca: 'Enable auto numbering',
    'es-es': 'Enable auto numbering',
  },
  enableAutoNumberingDescription: {
    'en-us':
      'If field has a formatter, whose placeholder value was used, the placeholder would be replaced with the autonumbered value',
    'ru-ru':
      'If field has a formatter, whose placeholder value was used, the placeholder would be replaced with the autonumbered value',
    ca: 'If field has a formatter, whose placeholder value was used, the placeholder would be replaced with the autonumbered value',
    'es-es':
      'If field has a formatter, whose placeholder value was used, the placeholder would be replaced with the autonumbered value',
  },
});
