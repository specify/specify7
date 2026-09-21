import React from 'react';
import { useNavigate } from 'react-router-dom';

import { usePromise } from '../../hooks/useAsyncState';
import { isExternalUrl } from '../../utils/ajax/helpers';
import type { MenuItem } from '../Core/Main';
import { rawUserToolsPromise } from '../Header/userToolDefinitions';
import { userPreferences } from '../Preferences/userPreferences';
import { bindKeyboardShortcut } from './context';

export function useUrlShortcuts(): void {
  const [shortcuts] = userPreferences.use('header', 'actions', 'urlShortcuts');
  const [userTools] = usePromise(rawUserToolsPromise(), false);
  const navigate = useNavigate();
  React.useEffect(() => {
    const userToolsByUrl = new Map<string, MenuItem>();
    Object.values(userTools ?? {}).forEach((tools) =>
      Object.values(tools).forEach((tool) => userToolsByUrl.set(tool.url, tool))
    );
    const cleanup = Object.entries(shortcuts).map(([path, shortcuts]) =>
      shortcuts === undefined
        ? undefined
        : bindKeyboardShortcut(shortcuts, () => {
            const userTool = userToolsByUrl.get(path);
            if (userTool?.onClick !== undefined)
              void userTool.onClick().then(() =>
                globalThis.location.assign(path)
              );
            else if (isExternalUrl(path)) globalThis.open(path, '_blank');
            else if (userTool !== undefined)
              globalThis.location.assign(path);
            else navigate(path);
          })
    );
    return (): void => cleanup.forEach((cleanup) => cleanup?.());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortcuts, userTools, navigate]);
}
