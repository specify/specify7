/**
 * Control page title as a function, hook or component
 */

import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { mainText } from '../../localization/main';
import { localized } from '../../utils/types';
import { userPreferences } from '../Preferences/userPreferences';
import { UnloadProtectsContext } from '../Router/UnloadProtect';

export function AppTitle({
  title,
  source = 'form',
}: {
  readonly title: LocalizedString;
  readonly source?: 'form' | undefined;
}): null {
  const [updateFormTitle] = userPreferences.use(
    'form',
    'behavior',
    'updatePageTitle'
  );
  useTitle(source !== 'form' || updateFormTitle ? title : undefined);
  return null;
}

/** Set title of the webpage. Restores previous title on component destruction */
export function useTitle(title: LocalizedString | undefined): void {
  const [unsavedIndicator] = userPreferences.use(
    'general',
    'behavior',
    'unsavedIndicator'
  );
  const blockers = React.useContext(UnloadProtectsContext)!;
  const isBlocked = unsavedIndicator && blockers.length > 0;
  const id = React.useRef({});
  // Change page's title
  React.useEffect(() => {
    if (title === undefined) return undefined;
    const ref = id.current;
    titleStack.set(ref, localized(`${isBlocked ? '*' : ''}${title}`));
    refreshTitle();
    return (): void => {
      titleStack.delete(ref);
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
