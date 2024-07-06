import React from 'react';

import { Redirect } from '../Router/Redirect';
import { toReactRoutes } from '../Router/RouterUtils';

/* eslint-disable @typescript-eslint/explicit-function-return-type */
export const fieldFormattersRoutes = toReactRoutes([
  {
    index: true,
    element: <Redirect to="./field-formatters/" />,
  },
  {
    path: 'field-formatters',
    children: [
      {
        index: true,
        element: async () =>
          import('./Table').then(
            ({ FieldFormatterTablesList }) => FieldFormatterTablesList
          ),
      },
      {
        path: ':tableName',
        element: async () =>
          import('./List').then(
            ({ FieldFormatterEditorWrapper }) => FieldFormatterEditorWrapper
          ),
        children: [
          {
            index: true,
            element: async () =>
              import('./List').then(
                ({ FieldFormattersList }) => FieldFormattersList
              ),
          },
          {
            path: ':index',
            element: async () =>
              import('./Element').then(
                ({ FieldFormatterWrapper }) => FieldFormatterWrapper
              ),
          },
        ],
      },
    ],
  },
]);
/* eslint-enable @typescript-eslint/explicit-function-return-type */
