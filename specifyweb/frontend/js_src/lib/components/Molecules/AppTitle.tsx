/**
 * Control page title as a function, hook or component
 */

import React from 'react';

import { usePref } from '../UserPreferences/usePref';
import { mainText } from '../../localization/main';
import { LocalizedString } from 'typesafe-i18n';

export function AppTitle({
  title,
  type,
}: {
  readonly title: LocalizedString;
  readonly type?: 'form';
}): null {
  const [updateTitle] = usePref('form', 'behavior', 'updatePageTitle');
  useTitle(type !== 'form' || updateTitle ? title : undefined);
  return null;
}

/** Set title of the webpage. Restores previous title on component destruction */
export function useTitle(title: LocalizedString | undefined): void {
  // Change page's title
  React.useEffect(() => {
    const id = {};
    if (typeof title === 'string') titleStack.set(id, title);
    refreshTitle();
    return (): void => {
      titleStack.delete(id);
      refreshTitle();
    };
  }, [title]);
}

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

const refreshTitle = (): void =>
  setTitle(Array.from(titleStack.values()).at(-1) ?? '');
