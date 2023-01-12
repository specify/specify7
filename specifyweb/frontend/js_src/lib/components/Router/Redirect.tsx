import React from 'react';
import { generatePath, useLocation, useParams } from 'react-router';
import { useNavigate } from 'react-router-dom';

import { toRelativeUrl } from '../../utils/ajax/helpers';

/**
 * Does a redirect to another page using React Router
 *
 * Preserves current query string and hash
 *
 * Handles URL params. Accepts relative URLs
 */
export function Redirect({ to }: { readonly to: string }): null {
  const location = useLocation();
  const parameters = useParams();
  const navigate = useNavigate();
  React.useEffect(() => {
    const { search, hash, pathname } = location;
    const rawPath = generatePath(to, parameters);
    const path = `${rawPath}${rawPath.endsWith('/') ? '' : '/'}`;
    // Handle both relative and absolute URL
    const url = path.startsWith('.')
      ? new URL(path, `${globalThis.location?.origin}${pathname}`)
      : new URL(path, globalThis.location?.origin);
    url.hash = hash;
    url.search = search;
    const completeUrl = url.toString();
    navigate(toRelativeUrl(completeUrl) ?? completeUrl, {
      replace: true,
    });
  }, [to, parameters, location, navigate]);
  return null;
}
