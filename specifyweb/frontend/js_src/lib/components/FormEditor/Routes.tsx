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
        element: async () =>
          import('./Table').then(({ FormEditorTable }) => FormEditorTable),
        children: [
          {
            path: ':name',
          },
        ],
      },
    ],
  },
]);
/* eslint-enable @typescript-eslint/explicit-function-return-type */
