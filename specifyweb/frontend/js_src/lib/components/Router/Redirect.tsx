import React from 'react';
import { generatePath, useLocation, useParams } from 'react-router';
import { useNavigate } from 'react-router-dom';

import { toRelativeUrl } from '../../utils/ajax/helpers';

/**
 * Does a redirect to another page using React Router
 *
 * Preserves current query string and hash
 *
 * Handles URL params too
 *
 * REFACTOR: migrate to using react-routers redirects instead
 *  See https://reactrouter.com/en/6.7.0/start/overview#redirects
 */
export function Redirect({ to }: { readonly to: string }): null {
  const { search, hash } = useLocation();
  const parameters = useParams();
  const navigate = useNavigate();
  React.useEffect(() => {
    const path = generatePath(to, parameters);
    const url = new URL(
      `${path}${path.endsWith('/') ? '' : '/'}`,
      globalThis.location?.origin
    );
    url.hash = hash;
    url.search = search;
    const completeUrl = url.toString();
    navigate(toRelativeUrl(completeUrl) ?? completeUrl, {
      replace: true,
    });
  }, [to, parameters, search, hash, navigate]);
  return null;
}
