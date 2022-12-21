/**
 * Localization strings used in top menu and user tools
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const headerText = createDictionary({
  skipToContent: {
    'en-us': 'Skip to Content',
    'ru-ru': 'Перейти к содержанию',
  },
  currentUser: {
    'en-us': 'Current User',
    'ru-ru': 'Текущий пользователь',
  },
  currentCollection: {
    'en-us': 'Current Collection',
    'ru-ru': 'Текущая коллекция',
  },
  dataEntry: {
    'en-us': 'Data Entry',
    'ru-ru': 'Ввод данных',
  },
  makeDwca: {
    'en-us': 'Create DwC Archive',
    'ru-ru': 'Создать DwC архив',
  },
  updateExportFeed: {
    'en-us': 'Update RSS Feed',
    'ru-ru': 'Обновить RSS фид',
  },
  updateExportFeedDialogTitle: {
    'en-us': 'Update export feed?',
    'ru-ru': 'Обновить все элементы фида экспорта сейчас?',
  },
  updateExportFeedDialogText: {
    'en-us': 'Update all RSS export feed items now?',
    'ru-ru': 'Обновить все элементы RSS фида экспорта сейчас?',
  },
  feedExportStartedDialogHeader: {
    'en-us': 'Export feed update started',
    'ru-ru': 'Начато обновление экспортного фида',
  },
  feedExportStartedDialogText: {
    'en-us': `
      Update started. You will receive a notification for each feed item
      updated.
    `,
    'ru-ru':
      'Обновление началось. Вы получите уведомление о каждом элементе фида',
  },
  dwcaExportStartedDialogHeader: {
    'en-us': 'DwCA export started',
    'ru-ru': 'DwCA экспорт начат',
  },
  dwcaExportStartedDialogText: {
    'en-us': `
      Export started. You will receive a notification when the export is
      complete.
    `,
    'ru-ru':
      'Экспорт начат. Вы получите уведомление когда экспорт будет завершен.',
  },
  labelName: {
    'en-us': 'Label Name',
    'ru-ru': 'Название ярлыка',
  },
  reportName: {
    'en-us': 'Report Name',
    'ru-ru': 'Название отчета',
  },
  createLabelDialogHeader: {
    'en-us': 'Create new label',
    'ru-ru': 'Создать новую этикетку',
  },
  createReportDialogHeader: {
    'en-us': 'Create new report',
    'ru-ru': 'Создать новый отчет',
  },
  repairTree: {
    'en-us': 'Repair Tree',
    'ru-ru': 'Ремонтировать дерево',
  },
  treeRepairComplete: {
    'en-us': 'Tree repair is complete.',
    'ru-ru': 'Ремонт дерева завершен.',
  },
  chooseDwcaDialogTitle: {
    'en-us': 'Choose DwCA',
    'ru-ru': 'Выберите DwCA',
  },
  chooseMetadataResource: {
    'en-us': 'Choose Metadata resource',
    'ru-ru': 'Выберите Ресурс метаданных',
  },
  expressSearch: {
    'en-us': 'Express Search',
    'ru-ru': 'Экспресс поиск',
  },
  primarySearch: {
    'en-us': 'Primary Search',
    'ru-ru': 'Первичный поиск',
  },
  secondarySearch: {
    'en-us': 'Secondary Search',
    'ru-ru': 'Вторичный поиск',
  },
  userToolsDialogTitle: {
    'en-us': 'User Tools',
    'ru-ru': 'Инструменты',
  },
  helpLocalizeSpecify: {
    'en-us': 'Help Localize Specify 7',
    'ru-ru': 'Помогти локализовать Specify 7',
  },
  helpLocalizeSpecifyDialogText: {
    'en-us': `
      We would be very grateful for your support localizing Specify 7 User
      Interface. If you are interested, please send an email to <emailLink />
    `,
    'ru-ru': `
      Мы будем очень благодарны за вашу поддержку в локализации пользовательский
      интерфейс Specify 7. Если вы заинтересованы, пожалуйста, отправьте письмо
      по адресу <emailLink />
    `,
  },
  tableApi: {
    'en-us': 'Tables API',
    'ru-ru': 'API таблиц',
  },
  operationsApi: {
    'en-us': 'Operations API',
    'ru-ru': 'API операций',
  },
  documentation: {
    'en-us': 'Documentation',
    'ru-ru': 'Документация',
  },
  developers: {
    'en-us': 'Developer Resources',
    'ru-ru': 'Инструменты разработчика',
  },
  forum: {
    'en-us': 'Community Forum',
    'ru-ru': 'Specify Форум',
  },
  clearCache: {
    'en-us': 'Clear Browser Cache',
    'ru-ru': 'Очистить кеш',
  },
  clearedCacheDialogText: {
    'en-us': 'Cache has been cleared. Please reload the page.',
    'ru-ru': 'Кэш очищен. Пожалуйста, перезагрузите страницу.',
  },
  technicalDocumentation: {
    'en-us': 'Technical Docs',
    'ru-ru': 'Тех. Документы',
  },
} as const);
