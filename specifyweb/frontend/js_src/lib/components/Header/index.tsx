/**
 * Components for App's header and user tools
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useSearchParameter } from '../../hooks/navigation';
import { useTriggerState } from '../../hooks/useTriggerState';
import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import type { RR } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { Form, Input, Select } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import { Submit } from '../Atoms/Submit';
import type { MenuItem } from '../Core/Main';
import { schema } from '../DataModel/schema';
import { serializeResource } from '../DataModel/serializers';
import { userInformation } from '../InitialContext/userInformation';
import { toLargeSortConfig } from '../Molecules/Sorting';
import { formatUrl } from '../Router/queryString';
import { switchCollection } from '../RouterCommands/SwitchCollection';
import { usePref } from '../UserPreferences/usePref';
import { MenuContext } from './MenuContext';
import type { MenuItemName } from './menuItemDefinitions';

export function HeaderItems({
  menuItems,
}: {
  readonly menuItems: RR<MenuItemName, MenuItem>;
}): JSX.Element {
  const activeMenuItem = React.useContext(MenuContext);
  return (
    <nav
      aria-label={commonText.primary()}
      className={`
        order-2 -mt-2 flex flex-1 flex-row flex-wrap
        px-2 lg:justify-center xl:m-0
      `}
    >
      {Object.entries(menuItems).map(([name, menuItem]) => (
        <MenuItemComponent
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
}: MenuItem & { readonly isActive: boolean }): JSX.Element | null {
  const [isVisible] = usePref('header', 'menu', visibilityKey);
  return isVisible ? (
    <Link.Default
      aria-current={isActive ? 'page' : undefined}
      className={`
        relative
        inline-flex
        items-center
        gap-2
        rounded
        p-3
        text-gray-700
        active:bg-white
        dark:text-neutral-300
        active:dark:bg-neutral-600
        ${isActive ? 'bg-white dark:bg-neutral-600 lg:!bg-transparent' : ''}
        lg:after:absolute
        lg:after:-bottom-1
        lg:after:left-0
        lg:after:right-0
        lg:after:h-2
        lg:after:w-full
        lg:after:bg-transparent
        lg:hover:after:bg-gray-200
        lg:hover:after:dark:bg-neutral-800
        ${isActive ? 'lg:after:bg-gray-200' : ''}
        ${isActive ? 'lg:after:dark:bg-neutral-800' : ''}
      `}
      href={url}
      key={url}
    >
      {icon}
      {title}
    </Link.Default>
  ) : null;
}

export function CollectionSelector(): JSX.Element {
  const [sortOrder] = usePref('chooseCollection', 'general', 'sortOrder');
  const { direction, fieldNames } = toLargeSortConfig(sortOrder);
  const sortedCollections = React.useMemo(
    () =>
      Array.from(userInformation.availableCollections)
        .sort(
          sortFunction(
            // FEATURE: this only works for direct fields right now
            (collection) => collection[fieldNames.join('.') as 'id'],
            direction === 'desc'
          )
        )
        .map(serializeResource),
    [direction, fieldNames]
  );

  const navigate = useNavigate();
  return (
    <Select
      aria-label={headerText.currentCollection()}
      className="flex-1"
      title={headerText.currentCollection()}
      value={schema.domainLevelIds.collection}
      onValueChange={(value): void =>
        switchCollection(navigate, Number.parseInt(value), '/specify/')
      }
    >
      {sortedCollections?.map(({ id, collectionName }) => (
        <option key={id as number} value={id as number}>
          {collectionName}
        </option>
      ))}
    </Select>
  );
}

export function ExpressSearch(): JSX.Element {
  const [urlSearchQuery] = useSearchParameter('q');
  const [searchQuery = '', setSearchQuery] = useTriggerState(urlSearchQuery);
  const navigate = useNavigate();
  return (
    <Form
      className="contents"
      role="search"
      onSubmit={(): void => {
        const query = searchQuery.trim();
        if (query.length === 0) return;
        const url = formatUrl('/specify/express-search/', {
          q: query,
        });
        navigate(url);
      }}
    >
      <Input.Generic
        aria-label={commonText.search()}
        autoComplete="on"
        className="flex-1"
        /* Name is for autocomplete purposes only */
        name="searchQuery"
        placeholder={commonText.search()}
        type="search"
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <Submit.Blue className="sr-only">{commonText.search()}</Submit.Blue>
    </Form>
  );
}
