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
  end = false,
  ...props
}: T & {
  readonly end?: boolean;
  readonly component?: (props: T) => JSX.Element;
}): JSX.Element {
  const location = useLocation();
  const isActive =
    location.pathname === props.href ||
    `${location.pathname}${location.hash}` === props.href ||
    location.hash === props.href ||
    (!end &&
      location.pathname.startsWith(props.href) &&
      location.pathname.charAt(props.href.length) === '/');
  return (
    <LinkComponent
      {...(props as T)}
      aria-current={isActive ? ariaCurrent : undefined}
    />
  );
}
