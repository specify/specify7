/**
 * Components for App's header and user tools
 */

import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useCachedState } from '../../hooks/useCachedState';
import { commonText } from '../../localization/common';
import type { RR } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import type { TagProps } from '../Atoms/wrapper';
import { MenuContext } from '../Core/Contexts';
import type { MenuItem } from '../Core/Main';
import { ActiveLink } from '../Router/ActiveLink';
import { usePref } from '../UserPreferences/usePref';
import type { MenuItemName } from './menuItemDefinitions';
import { Notifications } from './Notifications';
import { UserTools } from './UserTools';
import { className } from '../Atoms/className';

export function Header({
  menuItems,
}: {
  readonly menuItems: RR<MenuItemName, MenuItem>;
}): JSX.Element {
  const [isCollapsed = false, setIsCollapsed] = useCachedState(
    'header',
    'isCollapsed'
  );

  return (
    <header
      className={`
        flex shadow-md shadow-gray-400 [z-index:1] print:hidden
      `}
    >
      <div className="flex flex-1 flex-col bg-gray-100 dark:bg-neutral-900">
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
              `}
              src="/static/img/short_logo.svg"
            />
            <span className="sr-only">{commonText.goToHomepage()}</span>
          </a>
        </h1>
        <nav className="flex flex-1 flex-col overflow-auto">
          <HeaderItems isCollapsed={isCollapsed} menuItems={menuItems} />
          <span className="flex-1" />
          <MenuButton
            icon={icons.archive}
            isCollapsed={isCollapsed}
            title={commonText.chooseCollection()}
            onClick="/specify/overlay/choose-collection/"
          />
          <UserTools isCollapsed={isCollapsed} />
          <Notifications isCollapsed={isCollapsed} />
          <MenuButton
            icon={icons.search}
            isCollapsed={isCollapsed}
            title={commonText.search()}
            onClick="/specify/express-search/"
          />
          <MenuButton
            icon={isCollapsed ? icons.arrowRight : icons.arrowLeft}
            isCollapsed={isCollapsed}
            title={isCollapsed ? commonText.expand() : commonText.collapse()}
            onClick={(): void => setIsCollapsed(!isCollapsed)}
          />
        </nav>
      </div>
    </header>
  );
}

function HeaderItems({
  menuItems,
  isCollapsed,
}: {
  readonly menuItems: RR<MenuItemName, MenuItem>;
  readonly isCollapsed: boolean;
}): JSX.Element {
  const [activeMenuItem] = React.useContext(MenuContext);
  return (
    <>
      {Object.entries(menuItems).map(([name, menuItem]) => (
        <MenuItemComponent
          isCollapsed={isCollapsed}
          key={name}
          {...menuItem}
          isActive={name === activeMenuItem}
        />
      ))}
    </>
  );
}

function MenuItemComponent({
  title,
  url,
  icon,
  visibilityKey,
  isActive,
  isCollapsed,
}: MenuItem & {
  readonly isCollapsed: boolean;
  readonly isActive: boolean;
}): JSX.Element | null {
  const [isVisible] = usePref('header', 'menu', visibilityKey);
  return isVisible ? (
    <MenuButton
      icon={icon}
      isActive={isActive}
      isCollapsed={isCollapsed}
      title={title}
      onClick={url}
    />
  ) : null;
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
          <span className="absolute w-[inherit] overflow-hidden text-ellipsis">
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
