/**
 * Post-process menu item and user tool definitions (re-order or hide
 * according to user preferences)
 */

import React from 'react';

import { usePromise } from '../../hooks/useAsyncState';
import { headerText } from '../../localization/header';
import { f } from '../../utils/functools';
import type { IR, RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import type { MenuItem } from '../Core/Main';
import { userPreferences } from '../Preferences/userPreferences';
import { rawMenuItemsPromise } from './menuItemDefinitions';
import { rawUserToolsPromise } from './userToolDefinitions';

const itemsPromise = f.store(async () =>
  f.all({
    menuItems: rawMenuItemsPromise,
    userTools: rawUserToolsPromise,
  })
);
export function useMenuItems(): RA<MenuItem> | undefined {
  const [preference] = userPreferences.use('header', 'appearance', 'items');
  const [items] = usePromise(itemsPromise(), false);
  return React.useMemo(() => {
    if (items === undefined) return undefined;
    const { menuItems, userTools } = items;
    const { visible: rawVisible, hidden } = preference;
    const visible =
      rawVisible.length === 0 ? menuItems.map(({ name }) => name) : rawVisible;

    // If new menu items were added to Specify, add them to the user's preferences
    const addedItems = menuItems
      .map(({ name }) => name)
      .filter((name) => !visible.includes(name) && !hidden.includes(name));
    if (addedItems.length > 0)
      userPreferences.set('header', 'appearance', 'items', {
        visible: [...visible, ...addedItems],
        hidden,
      });

    const allUserTools = Object.fromEntries(
      Object.values(userTools).flatMap((items) => Object.entries(items))
    );
    return filterArray(
      visible.map(
        (name) =>
          menuItems.find((item) => item.name === name) ?? allUserTools[name]
      )
    );
  }, [preference, items]);
}

export function useUserTools(): IR<IR<MenuItem>> | undefined {
  const [{ visible }] = userPreferences.use('header', 'appearance', 'items');
  const [items] = usePromise(itemsPromise(), false);
  return React.useMemo(() => {
    if (items === undefined) return undefined;
    const { menuItems, userTools } = items;
    return {
      // If some menu items are hidden, they should be displayed in user tools
      [headerText.main()]:
        visible.length === 0
          ? {}
          : Object.fromEntries(
              menuItems
                .filter(({ name }) => !visible.includes(name))
                .map((item) => [item.name, item])
            ),
      ...userTools,
    };
  }, [visible, items]);
}

export const filterMenuItems = async (
  menuItems: IR<Omit<MenuItem, 'name'>>
): Promise<RA<MenuItem>> =>
  Promise.all(
    Object.entries(menuItems).map(async ([name, entry]) =>
      (await entry.enabled?.()) === false
        ? undefined
        : {
            ...entry,
            name,
          }
    )
  ).then(filterArray);
