/**
 * React Hooks to listen to preferences changes
 * (this allows to change UI preferences without restarting the application)
 */

import React from 'react';

import { eventListener } from '../events';
import type { Preferences } from '../preferences';
import { getPrefDefinition, getUserPref, setPref } from '../preferencesutils';
import { crash } from './errorboundary';
import { useLiveState } from './hooks';
import { MILLISECONDS } from './internationalization';
import { f } from '../functools';

export const prefEvents = eventListener<{
  update: undefined;
  synchronized: undefined;
}>();

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
  >(() => getUserPref(category, subcategory, item));

  const currentPref = React.useRef(pref);
  React.useEffect(
    () =>
      prefEvents.on('update', () => {
        const newValue = getUserPref(category, subcategory, item);
        if (newValue === currentPref.current) return;
        setLocalPref(newValue);
        currentPref.current = newValue;
      }),
    [category, subcategory, item]
  );

  const updatePref = React.useCallback(
    function updatePref(
      newPref: Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue']
    ): void {
      const definition = getPrefDefinition(category, subcategory, item);
      if (typeof definition.onChange === 'function')
        Promise.resolve(definition.onChange(newPref)).catch(crash);
      else setPref(category, subcategory, item, newPref);
    },
    [category, subcategory, item]
  );

  return [pref, updatePref] as const;
}

/**
 * Like usePref, but with useRef instead of useState. Useful for cases when
 * pref value updates often, or you don't need to trigger a reRender.
 */
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
  >(getUserPref(category, subcategory, item));

  React.useEffect(
    () =>
      prefEvents.on('update', () => {
        pref.current = getUserPref(category, subcategory, item);
      }),
    [category, subcategory, item]
  );

  const updatePref = React.useCallback(
    function updatePref(
      newPref: Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue']
    ): void {
      const definition = getPrefDefinition(category, subcategory, item);
      if (typeof definition.onChange === 'function')
        Promise.resolve(definition.onChange(newPref)).catch(crash);
      else setPref(category, subcategory, item, newPref);
    },
    [category, subcategory, item]
  );

  return [pref, updatePref] as const;
}

export function useReducedMotion(): boolean {
  const [pref] = usePref('general', 'ui', 'reduceMotion');
  const [value] = useLiveState(
    React.useCallback(
      () =>
        pref === 'system'
          ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
          : pref === 'reduce',
      [pref]
    )
  );
  return value;
}

const defaultTransitionDuration = 100;

export function useTransitionDuration(): number {
  const reduceMotion = useReducedMotion();
  const [value] = useLiveState(
    React.useCallback(
      () => (reduceMotion ? 0 : defaultTransitionDuration),
      [reduceMotion]
    )
  );
  return value;
}

const shouldReduceMotion = (): boolean =>
  f.var(getUserPref('general', 'ui', 'reduceMotion'), (pref) =>
    pref === 'system'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : pref === 'reduce'
  );

export const getTransitionDuration = (): number =>
  shouldReduceMotion() ? 0 : defaultTransitionDuration;

export function useDarkMode(): boolean {
  const [theme] = usePref('general', 'ui', 'theme');
  const [value] = useLiveState(
    React.useCallback(
      () =>
        theme === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
          : theme === 'dark',
      [theme]
    )
  );
  return value;
}

export const shouldUseDarkMode = (): boolean =>
  f.var(getUserPref('general', 'ui', 'theme'), (theme) =>
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : theme === 'dark'
  );

export function SetCssVariables(): null {
  const transitionDuration = useTransitionDuration();
  React.useEffect(() => {
    document.body.style.setProperty(
      '--transitionDuration',
      `${transitionDuration / MILLISECONDS}s`
    );
  }, [transitionDuration]);

  const darkMode = useDarkMode();
  React.useEffect(
    () =>
      darkMode
        ? document.body.classList.add('dark')
        : document.body.classList.remove('dark'),
    [darkMode]
  );

  return null;
}
