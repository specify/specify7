/**
 * Components for App's header and user tools
 */

import React from 'react';
import { useLocation } from 'react-router-dom';
import type { LocalizedString } from 'typesafe-i18n';

import { useCachedState } from '../../hooks/useCachedState';
import { commonText } from '../../localization/common';
import { listen } from '../../utils/events';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { icons } from '../Atoms/Icons';
import type { TagProps } from '../Atoms/wrapper';
import type { MenuItem } from '../Core/Main';
import { MenuContext } from '../Core/Main';
import { schema } from '../DataModel/schema';
import { userInformation } from '../InitialContext/userInformation';
import { titleDelay, titlePosition } from '../Molecules/Tooltips';
import { ActiveLink } from '../Router/ActiveLink';
import type { MenuItemName } from './menuItemDefinitions';
import { useUserTools } from './menuItemProcessing';
import { Notifications } from './Notifications';
import { UserTools } from './UserTools';
import { userPreferences } from '../Preferences/userPreferences';

const collapseThreshold = 900;

export function Header({
  menuItems,
}: {
  readonly menuItems: RA<MenuItem>;
}): JSX.Element {
  const [rawIsCollapsed = false, setIsCollapsed] = useCachedState(
    'header',
    'isCollapsed'
  );

  const { pathname } = useLocation();
  const userTools = useUserTools() ?? {};
  const isInUserTool = Object.values(userTools)
    .flatMap((group) => Object.values(group))
    .some(
      ({ url, name }) =>
        pathname.startsWith(url) &&
        !menuItems.some((item) => item.name === name)
    );

  // Collapse the menu on narrow screens
  const [forceCollapse, setForceCollapse] = React.useState(false);
  React.useEffect(() => {
    const handleChange = (): void =>
      document.body.clientWidth < collapseThreshold
        ? setForceCollapse(true)
        : setForceCollapse(false);
    handleChange();
    return listen(window, 'resize', handleChange);
  }, [rawIsCollapsed, setIsCollapsed]);

  const [position] = userPreferences.use('header', 'appearance', 'position');
  const isHorizontal = position === 'top' || position === 'bottom';
  // Top menu is only available as collapsed
  const isCollapsed = rawIsCollapsed || isHorizontal || forceCollapse;

  React.useLayoutEffect(() => {
    const root = document.getElementById('root');
    if (root === null) throw new Error('Unable to find root element');
    const classNames = {
      top: 'flex-col',
      left: 'flex-row',
      bottom: 'flex-col-reverse',
      right: 'flex-row-reverse',
    };
    Object.entries(classNames).forEach(([key, className]) =>
      root.classList.toggle(className, position === key)
    );
  }, [position]);

  const collectionLabel = React.useMemo(
    () =>
      userInformation.availableCollections.find(
        ({ id }) => id === schema.domainLevelIds.collection
      )?.collectionName ?? commonText.chooseCollection(),
    []
  );

  const activeMenuItem = React.useContext(MenuContext);
  return (
    <header
      className={`
        flex bg-gray-100 shadow-md shadow-gray-400 [z-index:1]
        dark:border-neutral-700 dark:bg-neutral-900
        print:hidden
        ${isHorizontal ? '' : 'flex-col'}
        ${
          position === 'left'
            ? 'dark:border-r'
            : position === 'top'
            ? 'dark:border-b'
            : position === 'right'
            ? 'dark:border-l'
            : 'dark:border-t'
        }
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
              ${isHorizontal ? 'w-10' : ''}
            `}
            src="/static/img/short_logo.svg"
          />
          <span className="sr-only">{commonText.goToHomepage()}</span>
        </a>
      </h1>
      <nav
        className={`
          flex flex-1 overflow-auto
          ${isHorizontal ? '' : 'flex-col'}
        `}
      >
        <HeaderItems
          activeMenuItem={activeMenuItem}
          isCollapsed={isCollapsed}
          menuItems={menuItems}
        />
        <span className="flex-1" />
        <MenuButton
          icon={icons.search}
          isActive={activeMenuItem === 'search'}
          isCollapsed={isCollapsed}
          title={commonText.search()}
          onClick="/specify/overlay/express-search/"
        />
        <Notifications isCollapsed={isCollapsed} />
        <UserTools isCollapsed={isCollapsed} isInUserTool={isInUserTool} />
        <MenuButton
          icon={icons.archive}
          isCollapsed={isCollapsed}
          preventOverflow
          title={collectionLabel}
          onClick="/specify/overlay/choose-collection/"
        />
        {!isHorizontal && !forceCollapse ? (
          <MenuButton
            icon={
              isCollapsed === (position === 'left')
                ? icons.arrowRight
                : icons.arrowLeft
            }
            isCollapsed={isCollapsed}
            title={isCollapsed ? commonText.expand() : commonText.collapse()}
            onClick={(): void => setIsCollapsed(!isCollapsed)}
          />
        ) : undefined}
      </nav>
    </header>
  );
}

function HeaderItems({
  menuItems,
  isCollapsed,
  activeMenuItem,
}: {
  readonly menuItems: RA<MenuItem>;
  readonly isCollapsed: boolean;
  readonly activeMenuItem: MenuItemName | undefined;
}): JSX.Element {
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
  const [position] = userPreferences.use('header', 'appearance', 'position');
  const getClassName = (isActive: boolean): string => `
    p-[1.4vh]
    ${isActive ? 'bg-brand-300 !text-white' : 'text-gray-700'}
    ${className.ariaHandled}
    ${extraProps?.className ?? ''}
  `;
  const props = {
    ...extraProps,
    [titleDelay]: 0,
    [titlePosition]:
      position === 'left' ? 'right' : position === 'right' ? 'left' : undefined,
    'aria-current': isActive ? 'page' : undefined,
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
      className={getClassName}
      href={handleClick}
    >
      {children}
    </ActiveLink>
  ) : (
    <Button.LikeLink
      onClick={handleClick}
      {...props}
      className={getClassName(isActive)}
    >
      {children}
    </Button.LikeLink>
  );
}
