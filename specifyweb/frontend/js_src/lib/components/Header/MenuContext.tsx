import React from 'react';

import { f } from '../../utils/functools';
import type { GetOrSet, WritableArray } from '../../utils/types';
import { writable } from '../../utils/types';
import { removeItem } from '../../utils/utils';
import type { MenuItemName } from './menuItemDefinitions';

/** Identifies active menu item */
export const MenuContext = React.createContext<MenuItemName | undefined>(
  undefined
);
MenuContext.displayName = 'MenuContext';

export const SetMenuContext = React.createContext<
  GetOrSet<MenuItemName | undefined>[1]
>(f.never);
SetMenuContext.displayName = 'SetMenuContext';

let activeMenuItems: WritableArray<MenuItemName> = [];

/**
 * Marks the corresponding menu item as active while the component with this
 * hook is active
 */
export function useMenuItem(menuItem: MenuItemName): void {
  const setMenuItem = React.useContext(SetMenuContext);
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
