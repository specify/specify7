import React from 'react';
import { useNavigate } from 'react-router-dom';

import { usePromise } from '../../hooks/useAsyncState';
import { isExternalUrl } from '../../utils/ajax/helpers';
import { localized } from '../../utils/types';
import type { MenuItem } from '../Core/Main';
import { rawMenuItemsPromise } from '../Header/menuItemDefinitions';
import { rawUserToolsPromise } from '../Header/userToolDefinitions';
import { userPreferences } from '../Preferences/userPreferences';
import { bindKeyboardShortcut, setKeyboardShortcutsEnabled } from './context';

export function useUrlShortcuts(): void {
  const [shortcuts] = userPreferences.use('header', 'actions', 'urlShortcuts');
  const [shortcutsEnabled] = userPreferences.use(
    'header',
    'actions',
    'shortcutsEnabled'
  );
  const [menuItems] = usePromise(rawMenuItemsPromise(), false);
  const [userTools] = usePromise(rawUserToolsPromise(), false);
  const navigate = useNavigate();
  React.useEffect(() => {
    setKeyboardShortcutsEnabled(shortcutsEnabled);
  }, [shortcutsEnabled]);
  React.useEffect(() => {
    const userToolsByUrl = new Map<string, MenuItem>();
    menuItems?.forEach((tool) => userToolsByUrl.set(tool.url, tool));
    Object.values(userTools ?? {}).forEach((tools) =>
      Object.values(tools).forEach((tool) => userToolsByUrl.set(tool.url, tool))
    );
    const cleanup = Object.entries(shortcuts).map(([path, shortcuts]) => {
      const userTool = userToolsByUrl.get(path);
      return shortcuts === undefined
        ? undefined
        : bindKeyboardShortcut(
            shortcuts,
            () => {
              if (userTool?.onClick !== undefined)
                void userTool
                  .onClick()
                  .then(() => globalThis.location.assign(path));
              else if (isExternalUrl(path))
                globalThis.open(path, '_blank', 'noopener,noreferrer');
              else if (
                !path.startsWith('/specify/') &&
                !path.startsWith('/accounts/')
              )
                globalThis.location.assign(path);
              else navigate(path);
            },
            userTool?.title ?? localized(path),
            'global'
          );
    });
    return (): void => cleanup.forEach((cleanup) => cleanup?.());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortcuts, menuItems, userTools, navigate]);
}
