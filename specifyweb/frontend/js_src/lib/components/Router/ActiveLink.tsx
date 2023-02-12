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

export function useIsActive(href: string, isExact: boolean): boolean {
  const location = useLocation();
  return (
    location.pathname === href ||
    `${location.pathname}${location.hash}` === href ||
    location.hash === href ||
    (!isExact &&
      location.pathname.startsWith(href) &&
      location.pathname.charAt(href.length) === '/')
  );
}
