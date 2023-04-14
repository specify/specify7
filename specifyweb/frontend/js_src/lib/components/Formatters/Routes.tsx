import React from 'react';

import { Redirect } from '../Router/Redirect';
import { toReactRoutes } from '../Router/RouterUtils';

/* eslint-disable @typescript-eslint/explicit-function-return-type */
export const formattersRoutes = toReactRoutes([
  {
    index: true,
    element: <Redirect to="./formatter/" />,
  },
  {
    path: ':type',
    element: async () =>
      import('./Types').then(({ FormatterTypes }) => FormatterTypes),
    children: [
      {
        index: true,
        element: async () =>
          import('./Table').then(
            ({ FormatterTablesList }) => FormatterTablesList
          ),
      },
      {
        path: ':tableName',
        element: async () =>
          import('./List').then(({ FormatterList }) => FormatterList),
        children: [
          {
            index: true,
          },
          {
            path: ':index',
            element: async () =>
              import('./Element').then(
                ({ FormatterWrapper }) => FormatterWrapper
              ),
          },
        ],
      },
    ],
  },
]);
/* eslint-enable @typescript-eslint/explicit-function-return-type */
