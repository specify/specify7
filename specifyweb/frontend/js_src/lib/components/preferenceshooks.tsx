import React from 'react';

import type { PreferenceTypes } from '../preferencesutils';
import { getPrefValue, setPref } from '../preferencesutils';

export const prefUpdateListeners = new Set<() => void>();

export function usePref<
  CATEGORY extends keyof PreferenceTypes,
  SUBCATEGORY extends keyof PreferenceTypes[CATEGORY],
  ITEM extends keyof PreferenceTypes[CATEGORY][SUBCATEGORY]
>(
  category: CATEGORY,
  subcategory: SUBCATEGORY,
  item: ITEM
): Readonly<
  [
    pref: PreferenceTypes[CATEGORY][SUBCATEGORY][ITEM],
    setPref: (newPref: PreferenceTypes[CATEGORY][SUBCATEGORY][ITEM]) => void
  ]
> {
  const [pref, setLocalPref] = React.useState<
    PreferenceTypes[CATEGORY][SUBCATEGORY][ITEM]
  >(getPrefValue(category, subcategory, item));

  const currentPref = React.useRef(pref);
  React.useEffect(() => {
    function handleUpdate(): void {
      const newValue = getPrefValue(category, subcategory, item);
      if (newValue === currentPref.current) return;
      setLocalPref(newValue);
      currentPref.current = newValue;
    }

    prefUpdateListeners.add(handleUpdate);
    return (): void => void prefUpdateListeners.delete(handleUpdate);
  }, [category, subcategory, item]);

  const updatePref = React.useCallback(
    function updatePref(
      newPref: PreferenceTypes[CATEGORY][SUBCATEGORY][ITEM]
    ): void {
      if (newPref == currentPref.current) return;
      setPref(category, subcategory, item, newPref);
    },
    [category, subcategory, item]
  );

  return [pref, updatePref] as const;
}
