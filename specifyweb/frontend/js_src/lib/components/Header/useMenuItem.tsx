import { writable, WritableArray } from '../../utils/types';
import { MenuItemName } from './menuItemDefinitions';
import React from 'react';
import { MenuContext } from '../Core/Contexts';
import { removeItem } from '../../utils/utils';

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
