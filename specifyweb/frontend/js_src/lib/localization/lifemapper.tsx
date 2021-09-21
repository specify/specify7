import { createDictionary, createJsxHeader } from './utils';

// Refer to "Guidelines for Programmers" in ./utils.tsx before editing this file

const lifemapperText = createDictionary({
  specifyNetwork: 'Specify Network',
  failedToOpenPopUpDialogTitle: 'Failed to open the page',
  failedToOpenPopUpDialogHeader: createJsxHeader(
    'Failed to open Specify Network Page'
  ),
  failedToOpenPopUpDialogMessage: `
    Please make sure your browser is not blocking pop-up windows and try again
  `,
  overLimitMessage: (limit: number) =>
    `Only the first ${limit} specimens are shown`,
});

export default lifemapperText;
