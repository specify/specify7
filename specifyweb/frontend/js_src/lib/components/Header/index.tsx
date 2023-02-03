/**
 * Components for App's header and user tools
 */

import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useCachedState } from '../../hooks/useCachedState';
import { commonText } from '../../localization/common';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { icons } from '../Atoms/Icons';
import type { TagProps } from '../Atoms/wrapper';
import { MenuContext } from '../Core/Contexts';
import type { MenuItem } from '../Core/Main';
import { ActiveLink } from '../Router/ActiveLink';
import { usePref } from '../UserPreferences/usePref';
import { Notifications } from './Notifications';
import { UserTools } from './UserTools';
import { schema } from '../DataModel/schema';
import { userInformation } from '../InitialContext/userInformation';

export function Header({
  menuItems,
}: {
  readonly menuItems: RA<MenuItem>;
}): JSX.Element {
  const [rawIsCollapsed = false, setIsCollapsed] = useCachedState(
    'header',
    'isCollapsed'
  );
  const [position] = usePref('header', 'appearance', 'position');
  // Top menu is only available as collapsed
  const isCollapsed = rawIsCollapsed || position === 'top';

  React.useLayoutEffect(() => {
    const root = document.getElementById('root');
    if (root === null) throw new Error('Unable to find root element');
    root.classList.toggle('flex-col', position === 'top');
  }, [position]);

  const collectionLabel = React.useMemo(
    () =>
      userInformation.availableCollections.find(
        ({ id }) => id === schema.domainLevelIds.collection
      )?.collectionName ?? commonText.chooseCollection(),
    []
  );

  return (
    <header
      className={`
        flex bg-gray-100 shadow-md shadow-gray-400 [z-index:1]
        dark:border-neutral-700 dark:bg-neutral-900
        print:hidden
        ${position === 'top' ? 'dark:border-b' : 'flex-col dark:border-r'}
      `}
    >
      <h1 className="contents">
        <a
          className={`
              flex items-center
              ${isCollapsed ? 'p-2' : 'p-4'}
            `}
          href="/specify/"
        >
          {/* Both logs are loaded to prevent flickering on collapse/expand */}
          <img
            alt=""
            className={`
                hover:animate-hue-rotate
                ${isCollapsed ? 'hidden' : ''}
              `}
            src="/static/img/logo.svg"
          />
          <img
            alt=""
            className={`
              hover:animate-hue-rotate
              ${isCollapsed ? '' : 'hidden'}
              ${position === 'top' ? 'w-10' : ''}
            `}
            src="/static/img/short_logo.svg"
          />
          <span className="sr-only">{commonText.goToHomepage()}</span>
        </a>
      </h1>
      <nav
        className={`
          flex flex-1 overflow-auto
          ${position === 'top' ? '' : 'flex-col'}
        `}
      >
        <HeaderItems isCollapsed={isCollapsed} menuItems={menuItems} />
        <span className="flex-1" />
        <MenuButton
          icon={icons.archive}
          isCollapsed={isCollapsed}
          title={collectionLabel}
          onClick="/specify/overlay/choose-collection/"
          preventOverflow
        />
        <UserTools isCollapsed={isCollapsed} />
        <Notifications isCollapsed={isCollapsed} />
        <MenuButton
          icon={icons.search}
          isCollapsed={isCollapsed}
          title={commonText.search()}
          onClick="/specify/express-search/"
        />
        {position !== 'top' && (
          <MenuButton
            icon={isCollapsed ? icons.arrowRight : icons.arrowLeft}
            isCollapsed={isCollapsed}
            title={isCollapsed ? commonText.expand() : commonText.collapse()}
            onClick={(): void => setIsCollapsed(!isCollapsed)}
          />
        )}
      </nav>
    </header>
  );
}

function HeaderItems({
  menuItems,
  isCollapsed,
}: {
  readonly menuItems: RA<MenuItem>;
  readonly isCollapsed: boolean;
}): JSX.Element {
  const [activeMenuItem] = React.useContext(MenuContext);
  return (
    <>
      {menuItems.map(({ url, name, ...menuItem }) => (
        <MenuButton
          {...menuItem}
          isActive={name === activeMenuItem}
          isCollapsed={isCollapsed}
          key={name}
          onClick={url}
        />
      ))}
    </>
  );
}

export function MenuButton({
  title,
  icon,
  isActive = false,
  isCollapsed,
  preventOverflow = false,
  onClick: handleClick,
  props: extraProps,
}: {
  readonly title: LocalizedString;
  readonly icon: JSX.Element;
  readonly isCollapsed: boolean;
  readonly isActive?: boolean;
  readonly preventOverflow?: boolean;
  readonly onClick: string | (() => void);
  readonly props?: TagProps<'a'> & TagProps<'button'>;
}): JSX.Element | null {
  const props = {
    ...extraProps,
    'aria-current': isActive ? 'page' : undefined,
    className: `
      p-4
      ${isActive ? 'bg-brand-300 !text-white' : 'text-gray-700'}
      ${className.ariaHandled}
      ${extraProps?.className ?? ''}
    `,
    title: isCollapsed ? title : undefined,
  } as const;
  const children = (
    <>
      {icon}
      {preventOverflow && !isCollapsed ? (
        <span className="relative flex w-full flex-1 items-center">
          <span className="absolute w-[inherit] overflow-hidden text-ellipsis whitespace-nowrap">
            {title}
          </span>
        </span>
      ) : (
        <span className={isCollapsed ? 'sr-only' : undefined}>{title}</span>
      )}
    </>
  );
  return typeof handleClick === 'string' ? (
    <ActiveLink
      {...props}
      activeOverride={isActive ? true : undefined}
      href={handleClick}
    >
      {children}
    </ActiveLink>
  ) : (
    <Button.LikeLink onClick={handleClick} {...props}>
      {children}
    </Button.LikeLink>
  );
}
