/**
 * Control page title as a function, hook or component
 */

import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { mainText } from '../../localization/main';
import { UnloadProtectsContext } from '../Core/Contexts';
import { usePref } from '../UserPreferences/usePref';

export function AppTitle({ title }: { readonly title: LocalizedString }): null {
  const [updateTitle] = usePref('form', 'behavior', 'updatePageTitle');
  useTitle(updateTitle ? title : undefined);
  return null;
}

/** Set title of the webpage. Restores previous title on component destruction */
export function useTitle(title: LocalizedString | undefined): void {
  const [unsavedIndicator] = usePref('general', 'behavior', 'unsavedIndicator');
  const blockers = React.useContext(UnloadProtectsContext)!;
  const isBlocked = unsavedIndicator && blockers.length > 0;
  const id = React.useRef({});
  // Change page's title
  React.useEffect(() => {
    if (typeof title === 'string')
      titleStack.set(id.current, `${isBlocked ? '*' : ''}${title}`);
    refreshTitle();
    return (): void => {
      titleStack.delete(id.current);
      refreshTitle();
    };
  }, [title, isBlocked]);
}

const refreshTitle = (): void =>
  setTitle(Array.from(titleStack.values()).at(-1) ?? '');

/**
 * Store all tiles in a stack. This allows to restore previous title when curren
 * component is closed
 */
const titleStack = new Map<unknown, LocalizedString>();

function setTitle(title: LocalizedString | ''): void {
  globalThis.document.title =
    title.length === 0
      ? mainText.baseAppTitle()
      : mainText.appTitle({ baseTitle: title });
}
