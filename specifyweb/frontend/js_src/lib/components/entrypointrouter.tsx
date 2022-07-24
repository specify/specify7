import React from 'react';
import { Navigate, useRoutes } from 'react-router-dom';

import { commonText } from '../localization/common';
import type { RA } from '../types';
import { NotFoundView } from './notfoundview';
import type { EnhancedRoute } from './routerutils';
import { toReactRoutes } from './routerutils';

/* eslint-disable @typescript-eslint/promise-function-async */
export const entrypointRoutes: RA<EnhancedRoute> = [
  {
    path: 'accounts',
    children: [
      {
        path: 'login',
        title: commonText('login'),
        element: () => import('./login').then(({ Login }) => Login),
      },
      {
        path: 'choose_collection',
        title: commonText('chooseCollection'),
        element: () =>
          import('./choosecollection').then(
            ({ ChooseCollection }) => ChooseCollection
          ),
      },
      {
        path: 'password_change',
        title: commonText('changePassword'),
        element: () =>
          import('./passwordchange').then(
            ({ PasswordChange }) => PasswordChange
          ),
      },
    ],
  },
  {
    path: 'specify/*',
    title: '',
    element: () => import('./specify').then(({ Root }) => Root),
  },
  {
    index: true,
    element: <Navigate to="/specify/" />,
  },
  {
    path: '*',
    element: <NotFoundView />,
  },
];
/* eslint-enable @typescript-eslint/promise-function-async */

export function EntrypointRouter(): JSX.Element {
  const routes = React.useMemo(() => toReactRoutes(entrypointRoutes), []);
  return useRoutes(routes) ?? <NotFoundView />;
}
