/**
 * Localization strings for the Specify Network integration
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const specifyNetworkText = createDictionary({
  specifyNetwork: {
    'en-us': 'Specify Network',
    'ru-ru': 'Specify Network',
    'es-es': 'Especificar red',
    'fr-fr': 'Spécifiez le réseau',
    'uk-ua': 'Вкажіть мережу',
  },
  failedToOpenPopUp: {
    'en-us': 'Failed to open Specify Network Page',
    'ru-ru': 'Не удалось открыть страницу Specify Network',
    'es-es': 'No se pudo abrir la página Especificar red',
    'fr-fr': "Échec de l'ouverture de la page Spécifier le réseau",
    'uk-ua': 'Не вдалося відкрити сторінку вказати мережу',
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
    'es-es': `
      Asegúrese de que su navegador no esté bloqueando las ventanas emergentes y
      vuelva a intentarlo.
    `,
    'fr-fr': `
      Assurez-vous que votre navigateur ne bloque pas les fenêtres pop-up et
      réessayez.
    `,
    'uk-ua': `
      Переконайтеся, що ваш браузер не блокує спливаючі вікна, і повторіть
      спробу.
    `,
  },
} as const);
