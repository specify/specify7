/**
 * Components for App's header and user tools
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useCachedState } from '../../hooks/useCachedState';
import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { userText } from '../../localization/user';
import { ajax } from '../../utils/ajax';
import type { RA, RR, WritableArray } from '../../utils/types';
import { writable } from '../../utils/types';
import { removeItem, sortFunction, toLowerCase } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Select } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { MenuContext } from '../Core/Contexts';
import type { MenuItem } from '../Core/Main';
import { serializeResource } from '../DataModel/helpers';
import type { SerializedModel } from '../DataModel/helperTypes';
import type { Collection } from '../DataModel/types';
import { userInformation } from '../InitialContext/userInformation';
import { switchCollection } from '../RouterCommands/SwitchCollection';
import { usePref } from '../UserPreferences/usePref';
import type { MenuItemName } from './menuItemDefinitions';
import { Notifications } from './Notifications';
import { UserTools } from './UserTools';
import { listen } from '../../utils/events';

const collapseThreshold = 900;

export function Header({
  menuItems,
}: {
  readonly menuItems: RR<MenuItemName, MenuItem>;
}): JSX.Element {
  const [rawIsCollapsed = false, setIsCollapsed] = useCachedState(
    'header',
    'isCollapsed'
  );

  // Collapse the menu on narrow screens
  const [forceCollapse, setForceCollapse] = React.useState(false);
  React.useEffect(() => {
    if (rawIsCollapsed) {
      setForceCollapse(false);
      return undefined;
    }
    const handleChange = (): void =>
      document.body.clientWidth < collapseThreshold
        ? setForceCollapse(true)
        : setForceCollapse(false);
    handleChange();
    return listen(window, 'resize', handleChange);
  }, [rawIsCollapsed, setIsCollapsed]);

  const isCollapsed = rawIsCollapsed || forceCollapse;
  const title = isCollapsed ? commonText.expand() : commonText.collapse();

  return (
    <header
      className={`flex [z-index:1] print:hidden ${className.hasAltBackground}`}
    >
      <div
        className={`
        flex flex-1 flex-col bg-gray-200 dark:bg-neutral-800
        ${isCollapsed ? '' : 'w-72 gap-2'}
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
            <img
              alt=""
              className="hover:animate-hue-rotate"
              src={
                isCollapsed
                  ? '/static/img/short_logo.svg'
                  : '/static/img/logo.svg'
              }
            />
            <span className="sr-only">{commonText.goToHomepage()}</span>
          </a>
        </h1>
        <div
          className={
            isCollapsed
              ? 'flex flex-1 flex-col gap-2 overflow-auto'
              : 'contents'
          }
        >
          <HeaderItems isCollapsed={isCollapsed} menuItems={menuItems} />
          <div
            className={`
            grid
            ${isCollapsed ? '' : 'grid-cols-[1fr_min-content] gap-2 p-4'}
          `}
          >
            <UserTools isCollapsed={isCollapsed} />
            {!userInformation.isauthenticated ? (
              isCollapsed ? (
                <Link.Icon
                  className={`${className.navigationHandled} p-4`}
                  href="/accounts/login/"
                  icon="login"
                  title={userText.logIn()}
                />
              ) : (
                <Link.Default
                  className={className.navigationHandled}
                  href="/accounts/login/"
                >
                  {userText.logIn()}
                </Link.Default>
              )
            ) : undefined}
            <Notifications isCollapsed={isCollapsed} />
            <CollectionSelector
              onClick={
                isCollapsed ? (): void => setIsCollapsed(false) : undefined
              }
            />
            {isCollapsed ? (
              <Link.Icon
                className="p-4"
                href="/specify/express-search/"
                icon="search"
                title={commonText.search()}
              />
            ) : (
              <Link.Small
                aria-label={commonText.search()}
                href="/specify/express-search/"
                title={commonText.search()}
              >
                {icons.search}
              </Link.Small>
            )}
          </div>
        </div>
      </div>
      {forceCollapse ? (
        <div className="h-full w-1.5 bg-brand-200 dark:bg-brand-400" />
      ) : (
        <button
          aria-label={title}
          className="flex h-full w-1.5 items-center bg-brand-200 dark:bg-brand-400"
          title={title}
          type="button"
          onClick={(): void => setIsCollapsed(!isCollapsed)}
        >
          <span className="h-6 w-6 rounded-full bg-brand-400 dark:bg-brand-500" />
        </button>
      )}
    </header>
  );
}

let activeMenuItems: WritableArray<MenuItemName> = [];

/**
 * Marks the corresponding menu item as active while the component with this
 * hook is active
 */
export function useMenuItem(menuItem: MenuItemName): void {
  const [_menuItem, setMenuItem] = React.useContext(MenuContext);
  React.useEffect(() => {
    activeMenuItems.push(menuItem);
    setMenuItem(menuItem);
    return () => {
      const index = activeMenuItems.lastIndexOf(menuItem);
      if (index !== -1)
        activeMenuItems = writable(removeItem(activeMenuItems, index));
      setMenuItem(activeMenuItems.at(-1));
    };
  }, [menuItem, setMenuItem]);
}

export function HeaderItems({
  menuItems,
  isCollapsed,
}: {
  readonly menuItems: RR<MenuItemName, MenuItem>;
  readonly isCollapsed: boolean;
}): JSX.Element {
  const [activeMenuItem] = React.useContext(MenuContext);
  return (
    <nav
      aria-label={commonText.primary()}
      className={`flex flex-1 flex-col ${isCollapsed ? '' : 'overflow-auto'}`}
    >
      {Object.entries(menuItems).map(([name, menuItem]) => (
        <MenuItemComponent
          isCollapsed={isCollapsed}
          key={name}
          {...menuItem}
          isActive={name === activeMenuItem}
        />
      ))}
    </nav>
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
    <Link.Default
      aria-current={isActive ? 'page' : undefined}
      aria-label={isCollapsed ? title : undefined}
      className={`
        relative p-4 text-gray-700 active:bg-white dark:text-neutral-300
        active:dark:bg-neutral-600
        ${isActive ? 'bg-white dark:bg-neutral-600' : ''}
      `}
      href={url}
      key={url}
      title={isCollapsed ? title : undefined}
    >
      {icon}
      {isCollapsed ? undefined : title}
    </Link.Default>
  ) : null;
}

type Collections = {
  readonly available: RA<SerializedModel<Collection>>;
  readonly current: number | null;
};

export function CollectionSelector({
  onClick: handleClick,
}: {
  readonly onClick: (() => void) | undefined;
}): JSX.Element {
  const [collections] = useAsyncState<Collections>(
    React.useCallback(
      async () =>
        ajax<Collections>('/context/collection/', {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          headers: { Accept: 'application/json' },
        }).then(({ data }) => data),
      []
    ),
    false
  );

  const [sortOrder] = usePref('chooseCollection', 'general', 'sortOrder');
  const isReverseSort = sortOrder.startsWith('-');
  const sortField = (isReverseSort ? sortOrder.slice(1) : sortOrder) as string &
    keyof Collection['fields'];
  const sortedCollections = React.useMemo(
    () =>
      typeof collections === 'object'
        ? Array.from(collections.available)
            .sort(
              sortFunction(
                (collection) => collection[toLowerCase(sortField)],
                isReverseSort
              )
            )
            .map(serializeResource)
        : undefined,
    [collections, isReverseSort, sortField]
  );

  const navigate = useNavigate();
  return typeof handleClick === 'function' ? (
    <Button.Icon
      className="p-4"
      icon="archive"
      title={commonText.chooseCollection()}
      onClick={handleClick}
    />
  ) : (
    <Select
      aria-label={headerText.currentCollection()}
      className="flex-1"
      title={headerText.currentCollection()}
      value={collections?.current ?? undefined}
      onValueChange={(value): void =>
        switchCollection(navigate, Number.parseInt(value), '/specify/')
      }
    >
      {collections === undefined && (
        <option disabled>{commonText.loading()}</option>
      )}
      {sortedCollections?.map(({ id, collectionName }) => (
        <option key={id} value={id}>
          {collectionName}
        </option>
      ))}
    </Select>
  );
}
