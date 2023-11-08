import React from 'react';

import type { WritableArray } from '../../utils/types';
import { writable } from '../../utils/types';
import { removeItem } from '../../utils/utils';
import { SetMenuContext } from '../Core/Main';
import type { MenuItemName } from './menuItemDefinitions';

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
