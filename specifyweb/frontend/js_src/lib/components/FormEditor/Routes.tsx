import { toReactRoutes } from '../Router/RouterUtils';

/* eslint-disable @typescript-eslint/explicit-function-return-type */
export const formEditorRoutes = toReactRoutes([
  {
    element: async () =>
      import('./').then(({ FormEditorWrapper }) => FormEditorWrapper),
    children: [
      {
        index: true,
        element: async () =>
          import('./List').then(({ FormEditorList }) => FormEditorList),
      },
      {
        path: ':tableName',
        children: [
          {
            index: true,
            element: async () =>
              import('./Table').then(({ FormEditorTable }) => FormEditorTable),
          },
          {
            path: ':viewName',
            element: async () =>
              import('./Editor').then(({ FormEditor }) => FormEditor),
          },
        ],
      },
    ],
  },
]);
/* eslint-enable @typescript-eslint/explicit-function-return-type */
