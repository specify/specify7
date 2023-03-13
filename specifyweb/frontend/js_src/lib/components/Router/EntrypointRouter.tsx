import React from 'react';
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from 'react-router-dom';

import { commonText } from '../../localization/common';
import { userText } from '../../localization/user';
import type { RA } from '../../utils/types';
import { NotFoundView } from './NotFoundView';
import type { EnhancedRoute } from './RouterUtils';
import { toReactRoutes } from './RouterUtils';

/* eslint-disable @typescript-eslint/promise-function-async */
export const entrypointRoutes: RA<EnhancedRoute> = [
  {
    path: 'accounts',
    children: [
      {
        path: 'login',
        title: userText.logIn(),
        element: () => import('../Login').then(({ Login }) => Login),
      },
      {
        path: 'legacy_login',
        title: userText.logIn(),
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
  // This should never be reached as back-end has a redict, but good to have it just in case
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

const routes = toReactRoutes(entrypointRoutes, undefined, false);
const router = createBrowserRouter(routes);

export function EntrypointRouter(): JSX.Element {
  return <RouterProvider router={router} />;
}
