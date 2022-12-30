/**
 * Localization strings used in the Header, UserTools menu, Login page
 * and Choose collection page
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const mainText = createDictionary({
  appTitle: {
    comment: 'Formatting for the title in the web page title bar',
    'en-us': '{baseTitle:string} | Specify 7',
    'ru-ru': '{baseTitle:string} | Specify 7',
  },
  baseAppTitle: {
    comment: 'Default page title',
    'en-us': 'Specify 7',
    'ru-ru': 'Specify 7',
  },
  pageNotFound: {
    comment: 'Used in title',
    'en-us': 'Page Not Found',
    'ru-ru': 'Страница не найдена',
  },
  nothingWasFound: {
    comment: 'Used in the heading on 404 page',
    'en-us': 'Oops! Nothing was found',
    'ru-ru': 'Ой! Ничего не найдено',
  },
  pageNotFoundDescription: {
    comment: 'Used in the paragraph on 404 page',
    'en-us': `
      The page you are looking for might have been removed, had its name changed
      or is temporarily unavailable.
    `,
    'ru-ru': `
      Возможно, страница, которую вы ищете, была удалена, ее название изменилось
      или она временно недоступна.
    `,
  },
  returnToHomepage: {
    'en-us': 'Return to homepage',
    'ru-ru': 'Вернуться на главную страницу',
  },
  errorOccurred: {
    'en-us': "Sorry, something's gone a bit wrong",
    'ru-ru': 'Произошла неожиданная ошибка',
  },
  errorOccurredDescription: {
    'en-us': `
      We're sorry, it seems you have encountered an error in Specify 7 that we
      may not be aware of.
    `,
    'ru-ru': `
      Произошла неисправимая ошибка, которая не позволит нам безопасно вернуться
      к вашему текущему окну.
    `,
  },
  criticalErrorOccurredDescription: {
    'en-us': `
      To avoid corrupting data records, we need to start again from a safe
      spot--the Home page.
    `,
    'ru-ru': `
      Чтобы избежать повреждения записей данных, нам нужно начать заново с
      безопасного места — домашней страницы.
    `,
  },
  errorResolutionDescription: {
    'en-us': `
      If this issue persists, please contact your IT support. If this is a
      Specify Cloud database, please download the error message and send it to
      <email />.
    `,
    'ru-ru': `
      Если эта проблема не устраняется, обратитесь к вашей службе поддержки.
      Если это база данных Specify Cloud, загрузите сообщение об ошибке и
      отправьте его на <email />.
    `,
  },
  errorResolutionSecondDescription: {
    comment: 'Careful with the <xml> tags when localizing',
    'en-us': `
      Users from <memberLink>member institutions</memberLink> can search for
      answered questions and ask for help on our <discourseLink>Community
      Forum</discourseLink>.
    `,
    'ru-ru': `
      Пользователи из <memberLink>учреждений Консорциума</memberLink> могут
      искать ответы на вопросы и обращаться за помощью на нашем
      <discourseLink>форуме</discourseLink>.
    `,
  },
  errorMessage: {
    'en-us': 'Error Message',
    'ru-ru': 'Описание ошибки',
  },
  leavePageConfirmation: {
    'en-us': 'Are you sure you want to leave this page?',
    'ru-ru': 'Вы уверены, что хотите покинуть эту страницу?',
  },
  leavePageConfirmationDescription: {
    'en-us': 'Unsaved changes would be lost if your leave this page.',
    'ru-ru':
      'Несохраненные изменения будут потеряны, если вы покинете эту страницу.',
  },
  leave: {
    'en-us': 'Leave',
    'ru-ru': 'Покинуть',
  },
  versionMismatch: {
    'en-us': 'Specify version does not match database version',
    'ru-ru': 'Specify версия не соответствует версии базы данных',
  },
  versionMismatchDescription: {
    'en-us': `
      The Specify version {specifySixVersion:string} does not match the database
      version {databaseVersion:string}.
    `,
    'ru-ru': `
      Specify версия {specifySixVersion:string} не соответствует версии базы
      данных {databaseVersion:string}.
    `,
  },
  versionMismatchSecondDescription: {
    'en-us':
      'Some features of Specify 7 may therefore fail to operate correctly.',
    'ru-ru': 'Поэтому некоторые функции Specify 7 могут неработать.',
  },
  versionMismatchInstructions: {
    'en-us': 'Instructions for resolving Specify schema mismatch',
    'ru-ru': 'Инструкции по устранению несоответствия схемы Specify',
  },
} as const);
