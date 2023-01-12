import React from 'react';
import { useLocation } from 'react-router-dom';

import { Link } from '../Atoms/Link';

/**
 * Mark link that points to the current page
 * Based on react-router's <NavLink>
 */
export function ActiveLink<T extends Parameters<typeof Link.Default>[0]>({
  component: LinkComponent = Link.Default,
  'aria-current': ariaCurrent = 'page',
  mode = 'exact',
  ...props
}: T & {
  readonly mode?: 'exact' | 'startsWith';
  readonly component?: (props: T) => JSX.Element;
}): JSX.Element {
  const location = useLocation();
  const isActive =
    mode === 'exact'
      ? location.pathname === props.href ||
        `${location.pathname}${location.hash}` === props.href ||
        location.hash === props.href
      : location.pathname.startsWith(props.href) &&
        location.pathname.charAt(props.href.length - 1) === '/';
  return (
    <LinkComponent
      {...(props as T)}
      aria-current={isActive ? ariaCurrent : undefined}
    />
  );
}
