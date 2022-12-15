/**
 * Localization strings used in the Header, UserTools menu, Login page
 * and Choose collection page
 *
 * @module
 */

import React from 'react';

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

/* eslint-disable react/jsx-no-literals */
/* eslint-disable @typescript-eslint/naming-convention */
export const mainText = createDictionary({
  appTitle: {
    'en-us': (baseTitle: string) => `${baseTitle} | Specify 7`,
    'ru-ru': (baseTitle: string) => `${baseTitle} | Specify 7`,
  },
  baseAppTitle: {
    'en-us': 'Specify 7',
    'ru-ru': 'Specify 7',
  },
  pageNotFound: {
    'en-us': 'Page Not Found',
    'ru-ru': 'Страница не найдена',
  },
  nothingWasFound: {
    'en-us': 'Oops! Nothing was found',
    'ru-ru': 'Ой! Ничего не найдено',
  },
  pageNotFoundDescription: {
    'en-us': `
      The page you are looking for might have been removed, had its name changed
      or is temporarily unavailable.`,
    'ru-ru': `
      Возможно, страница, которую вы ищете, была удалена, ее название изменилось
      или она временно недоступна.`,
  },
  returnToHomepage: {
    'en-us': 'Return to homepage',
    'ru-ru': 'Вернуться на главную страницу',
  },
  errorBoundaryDialogHeader: {
    'en-us': "Sorry, something's gone a bit wrong",
    'ru-ru': 'Произошла неожиданная ошибка',
  },
  errorBoundaryDialogText: {
    'en-us': `We're sorry, it seems you have encountered an error in Specify 7
      that we may not be aware of.`,
    'ru-ru': `Произошла неисправимая ошибка, которая не позволит нам безопасно
      вернуться к вашему текущему окну.`,
  },
  errorBoundaryCriticalDialogText: {
    'en-us': `To avoid corrupting data records, we need to start again from a
      safe spot--the Home page.`,
    'ru-ru': `Чтобы избежать повреждения записей данных, нам нужно начать
      заново с безопасного места — домашней страницы.`,
  },
  errorBoundaryDialogMessage: {
    'en-us': (email: JSX.Element) => (
      <>
        If this issue persists, please contact your IT support or if this is a
        Specify Cloud database, contact {email}
      </>
    ),
    'ru-ru': (email: JSX.Element) => (
      <>
        Если проблема не исчезнет, обратитесь в вашу IT службу поддержки или
        свяжитесь с нами: {email}
      </>
    ),
  },
  errorBoundaryDialogSecondMessage: {
    'en-us': (
      memberLink: (label: string) => JSX.Element,
      discourseLink: (label: string) => JSX.Element
    ) => (
      <>
        Users from {memberLink('member institutions')} can search for answered
        questions and ask for help on our {discourseLink('Community Forum')}.
      </>
    ),
    'ru-ru': (
      memberLink: (label: string) => JSX.Element,
      discourseLink: (label: string) => JSX.Element
    ) => (
      <>
        Пользователи из {memberLink('учреждений Консорциума')} могут искать
        ответы на вопросы и обращаться за помощью на нашем
        {discourseLink('форуме')}.
      </>
    ),
  },
  errorMessage: {
    'en-us': 'Error Message',
    'ru-ru': 'Описание ошибки',
  },
  leavePageDialogHeader: {
    'en-us': 'Are you sure you want to leave this page?',
    'ru-ru': 'Вы уверены, что хотите покинуть эту страницу?',
  },
  leavePageDialogText: {
    'en-us': 'Unsaved changes would be lost if your leave this page.',
    'ru-ru':
      'Несохраненные изменения будут потеряны, если вы покинете эту страницу.',
  },
  leave: {
    'en-us': 'Leave',
    'ru-ru': 'Покинуть',
  },
  versionMismatchDialogHeader: {
    'en-us': 'Specify version does not match database version',
    'ru-ru': 'Specify версия не соответствует версии базы данных',
  },
  versionMismatchDialogText: {
    'en-us': (specifySixVersion: string, databaseVersion: string) => `
      The Specify version ${specifySixVersion} does not match the database
      version ${databaseVersion}.`,
    'ru-ru': (specifySixVersion: string, databaseVersion: string) => `
      Specify версия ${specifySixVersion} не соответствует версии базы
      данных ${databaseVersion}.`,
  },
  versionMismatchSecondDialogText: {
    'en-us':
      'Some features of Specify 7 may therefore fail to operate correctly.',
    'ru-ru': 'Поэтому некоторые функции Specify 7 могут неработать.',
  },
  versionMismatchThirdDialogText: {
    'en-us': 'Instructions for resolving Specify schema mismatch',
    'ru-ru': 'Инструкции по устранению несоответствия схемы Specify',
  },
});
/* eslint-enable react/jsx-no-literals */
/* eslint-enable @typescript-eslint/naming-convention */
