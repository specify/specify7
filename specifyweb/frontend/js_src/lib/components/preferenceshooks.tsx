import React from 'react';

import type { Preferences } from '../preferences';
import { getPrefValue, setPref } from '../preferencesutils';

export const prefUpdateListeners = new Set<() => void>();

export function usePref<
  CATEGORY extends keyof Preferences,
  SUBCATEGORY extends keyof Preferences[CATEGORY]['subCategories'],
  ITEM extends keyof Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items']
>(
  category: CATEGORY,
  subcategory: SUBCATEGORY,
  item: ITEM
): Readonly<
  [
    pref: Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue'],
    setPref: (
      newPref: Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue']
    ) => void
  ]
> {
  const [pref, setLocalPref] = React.useState<
    Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue']
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
      newPref: Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue']
    ): void {
      if (newPref == currentPref.current) return;
      setPref(category, subcategory, item, newPref);
    },
    [category, subcategory, item]
  );

  return [pref, updatePref] as const;
}

export function usePrefRef<
  CATEGORY extends keyof Preferences,
  SUBCATEGORY extends keyof Preferences[CATEGORY]['subCategories'],
  ITEM extends keyof Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items']
>(
  category: CATEGORY,
  subcategory: SUBCATEGORY,
  item: ITEM
): Readonly<
  [
    pref: Readonly<
      React.MutableRefObject<
        Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue']
      >
    >,
    setPref: (
      newPref: Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue']
    ) => void
  ]
> {
  const pref = React.useRef<
    Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue']
  >(getPrefValue(category, subcategory, item));

  React.useEffect(() => {
    function handleUpdate(): void {
      pref.current = getPrefValue(category, subcategory, item);
    }

    prefUpdateListeners.add(handleUpdate);
    return (): void => void prefUpdateListeners.delete(handleUpdate);
  }, [category, subcategory, item]);

  const updatePref = React.useCallback(
    function updatePref(
      newPref: Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue']
    ): void {
      if (newPref == pref.current) return;
      setPref(category, subcategory, item, newPref);
    },
    [category, subcategory, item]
  );

  return [pref, updatePref] as const;
}
