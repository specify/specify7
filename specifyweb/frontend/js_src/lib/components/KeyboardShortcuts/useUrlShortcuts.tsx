import React from 'react';
import { useNavigate } from 'react-router-dom';

import { isExternalUrl } from '../../utils/ajax/helpers';
import { userPreferences } from '../Preferences/userPreferences';
import { bindKeyboardShortcut } from './context';

export function useUrlShortcuts(): void {
  const [shortcuts] = userPreferences.use('header', 'actions', 'urlShortcuts');
  const navigate = useNavigate();
  React.useEffect(() => {
    const cleanup = Object.entries(shortcuts).map(([path, shortcuts]) =>
      shortcuts === undefined
        ? undefined
        : bindKeyboardShortcut(shortcuts, () => {
            if (isExternalUrl(path)) globalThis.open(path, '_blank');
            else navigate(path);
          })
    );
    return (): void => cleanup.forEach((cleanup) => cleanup?.());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortcuts]);
}
