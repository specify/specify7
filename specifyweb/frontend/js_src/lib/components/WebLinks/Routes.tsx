import React from 'react';

import { Redirect } from '../Router/Redirect';
import { toReactRoutes } from '../Router/RouterUtils';

/* eslint-disable @typescript-eslint/explicit-function-return-type */
export const webLinkRoutes = toReactRoutes([
  {
    index: true,
    element: <Redirect to="./web-link/" />,
  },
  {
    path: 'web-link',
    element: async () =>
      import('./Editor').then(
        ({ WebLinkEditorWrapper }) => WebLinkEditorWrapper
      ),
    children: [
      {
        index: true,
      },
      {
        path: ':index',
        element: async () =>
          import('./Element').then(({ WebLinkWrapper }) => WebLinkWrapper),
      },
    ],
  },
]);
/* eslint-enable @typescript-eslint/explicit-function-return-type */
