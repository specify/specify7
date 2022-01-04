import { createDictionary, jsxHeader } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const lifemapperText = createDictionary({
  specifyNetwork: {
    'en-us': 'Specify Network (opens in new tab)',
    'ru-ru': 'Specify Network (открывается в новой вкладке)',
    ca: 'Specify Network (opens in new tab)',
  },
  failedToOpenPopUpDialogTitle: {
    'en-us': 'Failed to open the page',
    'ru-ru': 'Не удалось открыть страницу',
    ca: "No s'ha pogut obrir la pàgina",
  },
  failedToOpenPopUpDialogHeader: {
    'en-us': jsxHeader('Failed to open Specify Network Page'),
    'ru-ru': jsxHeader('Не удалось открыть страницу Specify Network'),
    ca: jsxHeader("No s'ha pogut obrir la pàgina de Specify Network"),
  },
  failedToOpenPopUpDialogMessage: {
    'en-us': `
      Please make sure your browser is not blocking pop-up windows and
      try again
    `,
    'ru-ru': `
      Убедитесь, что ваш браузер не блокирует всплывающие окна, и
      повторите попытку.
    `,
    ca: `
      Assegureu-vos que el vostre navegador no bloqueja les finestres
      emergents i torneu-ho a provar
    `,
  },
});

export default lifemapperText;
