import { toReactRoutes } from '../Router/RouterUtils';

/* eslint-disable @typescript-eslint/explicit-function-return-type */
export const webLinkRoutes = toReactRoutes([
  {
    element: async () =>
      import('./Editor').then(
        ({ WebLinkEditorWrapper }) => WebLinkEditorWrapper
      ),
    children: [
      {
        index: true,
        element: async () =>
          import('./List').then(({ WebLinkList }) => WebLinkList),
      },
      {
        path: 'web-link/:index',
        element: async () =>
          import('./Element').then(({ WebLinkWrapper }) => WebLinkWrapper),
      },
    ],
  },
]);
/* eslint-enable @typescript-eslint/explicit-function-return-type */
