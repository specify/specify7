import React, { forwardRef } from 'react';
import { useLocation } from 'react-router-dom';

import { Link } from '../Atoms/Link';

/**
 * Mark link that points to the current page
 * Based on react-router's <NavLink>
 */
export function ActiveLink<T extends Parameters<typeof Link.Default>[0]>({
  component: LinkComponent = Link.Default,
  'aria-current': ariaCurrent = 'page',
  end = false,
  ...props
}: T & {
  readonly end?: boolean;
  readonly component?: (props: T) => JSX.Element;
}): JSX.Element {
  const isActive = useIsActive(props.href, end);
  return (
    <LinkComponent
      {...(props as T)}
      aria-current={isActive ? ariaCurrent : undefined}
    />
  );
}

export function useIsActive(href: string, end: boolean): boolean {
  const location = useLocation();
  return (
    location.pathname === href ||
    `${location.pathname}${location.hash}` === href ||
    location.hash === href ||
    (!end &&
      location.pathname.startsWith(href) &&
      location.pathname.charAt(href.length) === '/')
  );
}
