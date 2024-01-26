import type { Path } from '@remix-run/router';
import React from 'react';
import { useLocation } from 'react-router-dom';

import { Link } from '../Atoms/Link';
import { locationToUrl } from './queryString';

/**
 * Mark link that points to the current page
 * Based on react-router's <NavLink>
 */
export function ActiveLink<T extends Parameters<typeof Link.Default>[0]>({
  component: LinkComponent = Link.Default,
  'aria-current': ariaCurrent = 'page',
  mode = 'exact',
  activeOverride,
  className,
  ...props
}: Omit<T, 'className'> & {
  readonly mode?: 'exact' | 'startsWith';
  readonly activeOverride?: boolean;
  readonly component?: (props: T) => JSX.Element;
  readonly className?: string | ((isActive: boolean) => string);
}): JSX.Element {
  const rawIsActive = useIsActive(props.href, mode === 'exact');
  const isActive = activeOverride ?? rawIsActive;
  return (
    <LinkComponent
      {...(props as T)}
      aria-current={isActive ? ariaCurrent : undefined}
      className={
        typeof className === 'function' ? className(isActive) : className
      }
    />
  );
}

export function useIsActive(rawHref: string, isExact: boolean): boolean {
  const location = useLocation();
  return isSameUrl(location, rawHref, isExact);
}

export function isSameUrl(
  location: Path,
  path: string,
  isExact: boolean
): boolean {
  const pathName = location.pathname.endsWith('/')
    ? location.pathname
    : `${location.pathname}/`;
  const currentUrl = locationToUrl(location);
  const rawUrl = new URL(path, `${globalThis.location.origin}${currentUrl}`);
  const url = {
    pathName: rawUrl.pathname.endsWith('/')
      ? rawUrl.pathname
      : `${rawUrl.pathname}/`,
    hash: rawUrl.hash,
  };
  const fullUrl = `${url.pathName}${url.hash}`;
  return isExact
    ? fullUrl === `${pathName}${location.hash}`
    : pathName.startsWith(url.pathName);
}
