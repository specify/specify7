/**
 * Localization strings for the Specify Network integration
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const specifyNetworkText = createDictionary({
  specifyNetwork: {
    'en-us': 'Specify Network',
    'ru-ru': 'Specify Network',
  },
  failedToOpenPopUp: {
    'en-us': 'Failed to open Specify Network Page',
    'ru-ru': 'Не удалось открыть страницу Specify Network',
  },
  failedToOpenPopUpDescription: {
    'en-us': `
      Please make sure your browser is not blocking pop-up windows and try
      again.
    `,
    'ru-ru': `
      Убедитесь, что ваш браузер не блокирует всплывающие окна, и повторите
      попытку.
    `,
  },
} as const);
