import React from 'react';

import type { GetOrSet } from '../../utils/types';
import type {
  GenericPreferences,
  preferenceDefinitions,
  Preferences,
} from './Definitions';
import { getPref, setPref } from './helpers';
import { CollectionPreferencesContext, PreferencesContext } from './Hooks';
import { collectionPreferenceDefinitions } from './CollectionPreferenceDefinitions';

/**
 * React Hook to listen to preferences changes
 * (this allows to change UI preferences without restarting the application)
 */

function useUnsafePref<
  CATEGORY extends keyof GenericPreferences,
  SUBCATEGORY extends keyof GenericPreferences[CATEGORY]['subCategories'],
  ITEM extends keyof GenericPreferences[CATEGORY]['subCategories'][SUBCATEGORY]['items']
>(
  category: CATEGORY,
  subcategory: SUBCATEGORY,
  item: ITEM,
  getPref: (
    category: CATEGORY,
    subcategory: SUBCATEGORY,
    item: ITEM
  ) => GenericPreferences[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue'],
  setPref: (
    category: CATEGORY,
    subcategory: SUBCATEGORY,
    item: ITEM,
    value: GenericPreferences[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue']
  ) => GenericPreferences[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue']
): GetOrSet<
  GenericPreferences[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue']
> {
  const [pref, setLocalPref] = React.useState<
    GenericPreferences[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue']
  >(() => getPref(category, subcategory, item));

  const currentPref = React.useRef(pref);

  const updatePref = React.useCallback(
    (
      newPref:
        | Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue']
        | ((
            oldPref: Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue']
          ) => Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue'])
    ): void => {
      let x =
        typeof newPref === 'function'
          ? (
              newPref as (
                oldPref: Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue']
              ) => Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue']
            )(currentPref.current)
          : newPref;

      const newValue = setPref(category, subcategory, item, x);
      if (newValue === currentPref.current) return;
      setLocalPref(newValue);
      currentPref.current = newValue;
    },
    [category, subcategory, item, setPref]
  );

  return [pref, updatePref] as const;
}

export function usePref<
  CATEGORY extends keyof typeof preferenceDefinitions,
  SUBCATEGORY extends CATEGORY extends keyof typeof preferenceDefinitions
    ? keyof typeof preferenceDefinitions[CATEGORY]['subCategories']
    : never,
  // @ts-expect-error
  ITEM extends keyof typeof preferenceDefinitions[CATEGORY]['subCategories'][SUBCATEGORY]['items']
>(
  category: CATEGORY,
  subcategory: SUBCATEGORY,
  item: ITEM
): GetOrSet<
  // @ts-expect-error
  typeof preferenceDefinitions[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue']
> {
  const [getPrefMain, setUserPref] = React.useContext(PreferencesContext) ?? [
    getPref.userPreferences,
    setPref.userPreferences,
  ];

  return useUnsafePref(
    category,
    subcategory,
    item,
    getPrefMain,
    // @ts-expect-error
    setUserPref
  ) as unknown as GetOrSet<
    // @ts-expect-error
    typeof preferenceDefinitions[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue']
  >;
}

export function useCollectionPref<
  CATEGORY extends keyof typeof collectionPreferenceDefinitions,
  SUBCATEGORY extends CATEGORY extends keyof typeof collectionPreferenceDefinitions
    ? keyof typeof collectionPreferenceDefinitions[CATEGORY]['subCategories']
    : never,
  ITEM extends keyof typeof collectionPreferenceDefinitions[CATEGORY]['subCategories'][SUBCATEGORY]['items']
>(
  category: CATEGORY,
  subcategory: SUBCATEGORY,
  item: ITEM
): GetOrSet<
  // @ts-expect-error
  typeof collectionPreferenceDefinitions[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue']
> {
  const [getPrefMain, setUserPref] = React.useContext(
    CollectionPreferencesContext
  ) ?? [getPref.collectionPreferences, setPref.collectionPreferences];

  return useUnsafePref(
    category,
    subcategory,
    item,
    getPrefMain,
    // @ts-expect-error
    setUserPref
  ) as unknown as GetOrSet<
    // @ts-expect-error
    typeof collectionPreferenceDefinitions[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue']
  >;
}
