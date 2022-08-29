import React from 'react';

import type { GetSet } from '../../utils/types';
import type { preferenceDefinitions, Preferences } from './Definitions';
import { getPrefDefinition, getUserPref, setPref } from './helpers';
import { PreferencesContext, prefEvents } from './Hooks';

/**
 * React Hook to listen to preferences changes
 * (this allows to change UI preferences without restarting the application)
 */
export function usePref<
  CATEGORY extends keyof Preferences,
  SUBCATEGORY extends CATEGORY extends keyof typeof preferenceDefinitions
    ? keyof Preferences[CATEGORY]['subCategories']
    : never,
  ITEM extends keyof Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items']
>(
  category: CATEGORY,
  subcategory: SUBCATEGORY,
  item: ITEM
): GetSet<
  Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue']
> {
  const [getPref, setUserPref] = React.useContext(PreferencesContext) ?? [
    getUserPref,
    setPref,
  ];

  const [pref, setLocalPref] = React.useState<
    Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue']
  >(() => getPref(category, subcategory, item));

  const currentPref = React.useRef(pref);
  React.useEffect(
    () =>
      prefEvents.on('update', (definition) => {
        if (
          definition !== undefined &&
          // Ignore changes to other prefs
          definition !== getPrefDefinition(category, subcategory, item)
        )
          return;
        const newValue = getPref(category, subcategory, item);
        if (newValue === currentPref.current) return;
        setLocalPref(newValue);
        currentPref.current = newValue;
      }),
    [category, subcategory, item]
  );

  const updatePref = React.useCallback(
    (
      newPref: Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue']
    ): void => setUserPref(category, subcategory, item, newPref),
    [category, subcategory, item]
  );

  return [pref, updatePref] as const;
}
