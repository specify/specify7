import React from 'react';
import { Navigate, useRoutes } from 'react-router-dom';

import { commonText } from '../../localization/common';
import type { RA } from '../../utils/types';
import { NotFoundView } from './NotFoundView';
import type { EnhancedRoute } from './RouterUtils';
import { toReactRoutes } from './RouterUtils';
import { userText } from '../../localization/user';

/* eslint-disable @typescript-eslint/promise-function-async */
export const entrypointRoutes: RA<EnhancedRoute> = [
  {
    path: 'accounts',
    children: [
      {
        path: 'login',
        title: commonText.login(),
        element: () => import('../Login').then(({ Login }) => Login),
      },
      {
        path: 'legacy_login',
        title: commonText.login(),
        element: () => import('../Login').then(({ Login }) => Login),
      },
      {
        path: 'choose_collection',
        title: commonText.chooseCollection(),
        element: () =>
          import('../ChooseCollection').then(
            ({ ChooseCollection }) => ChooseCollection
          ),
      },
      {
        path: 'password_change',
        title: userText.changePassword(),
        element: () =>
          import('../PasswordChange').then(
            ({ PasswordChange }) => PasswordChange
          ),
      },
    ],
  },
  {
    path: 'specify/*',
    element: () =>
      import('../Core/ContextLoader').then(
        ({ ContextLoader }) => ContextLoader
      ),
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
