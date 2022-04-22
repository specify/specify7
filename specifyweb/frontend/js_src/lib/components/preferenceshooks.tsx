/**
 * React Hooks to listen to preferences changes
 * (this allows to change UI preferences without restarting the application)
 */

import React from 'react';

import { eventListener } from '../events';
import { f } from '../functools';
import type { Preferences } from '../preferences';
import { getPrefDefinition, getUserPref, setPref } from '../preferencesutils';
import { crash } from './errorboundary';
import { MILLISECONDS } from './internationalization';
import { defaultFont } from './preferencesrenderers';

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

function useMedia(query: string): boolean {
  const media = React.useMemo(() => window.matchMedia(query), [query]);
  const eventsTarget = React.useMemo(
    () => eventListener<{ change: undefined }>(media),
    [media]
  );
  const [matches, setMatches] = React.useState(media.matches);
  React.useEffect(
    () => eventsTarget.on('change', () => setMatches(media.matches), true),
    [eventsTarget, media]
  );
  return matches;
}

export function useReducedMotion(): boolean {
  const [pref] = usePref('general', 'ui', 'reduceMotion');
  const media = useMedia('(prefers-reduced-motion: reduce)');
  return pref === 'system' ? media : pref === 'reduce';
}

const defaultTransitionDuration = 100;

export function useTransitionDuration(): number {
  const reduceMotion = useReducedMotion();
  const value = React.useMemo(
    () => (reduceMotion ? 0 : defaultTransitionDuration),
    [reduceMotion]
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
  const media = useMedia('(prefers-color-scheme: dark)');
  return theme === 'system' ? media : theme === 'dark';
}

export function useReducedTransparency(): boolean {
  const [reduceTransparency] = usePref('general', 'ui', 'reduceTransparency');
  const media = useMedia('(prefers-reduced-transparency: reduce)');
  return reduceTransparency === 'system'
    ? media
    : reduceTransparency === 'reduce';
}

export const shouldUseDarkMode = (): boolean =>
  f.var(getUserPref('general', 'ui', 'theme'), (theme) =>
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : theme === 'dark'
  );

export function SetCssVariables(): null {
  const transitionDuration = useTransitionDuration();
  React.useEffect(
    () =>
      document.body.style.setProperty(
        '--transitionDuration',
        `${transitionDuration / MILLISECONDS}s`
      ),
    [transitionDuration]
  );

  const reduceMotion = useReducedMotion();
  React.useEffect(
    () =>
      reduceMotion
        ? document.body.classList.add('reduce-motion')
        : document.body.classList.remove('reduce-motion'),
    [reduceMotion]
  );

  const darkMode = useDarkMode();
  React.useEffect(
    () =>
      darkMode
        ? document.body.classList.add('dark')
        : document.body.classList.remove('dark'),
    [darkMode]
  );

  const [fontSize] = usePref('general', 'ui', 'fontSize');
  const [scaleUi] = usePref('general', 'ui', 'scaleInterface');
  const scaleTarget = scaleUi ? document.documentElement : document.body;
  React.useEffect(
    () => () => {
      scaleTarget.style.removeProperty('--font-scale');
      scaleTarget.style.removeProperty('font-size');
    },
    [scaleTarget]
  );
  React.useEffect(() => {
    scaleTarget.style.setProperty('--font-scale', `${fontSize / 100}`);
    scaleTarget.style.setProperty('font-size', `${fontSize}%`);
  }, [scaleTarget, fontSize]);

  const [fontFamily] = usePref('general', 'ui', 'fontFamily');
  React.useEffect(
    () =>
      fontFamily === defaultFont
        ? void document.body.style.removeProperty('font-family')
        : document.body.style.setProperty('font-family', fontFamily),
    [fontFamily]
  );

  const [formMaxWidth] = usePref('form', 'ui', 'maxWidth');
  React.useEffect(
    () =>
      document.body.style.setProperty('--form-max-width', `${formMaxWidth}px`),
    [formMaxWidth]
  );

  const [fieldBackground] = usePref('form', 'appearance', 'fieldBackground');
  const [darkFieldBackground] = usePref(
    'form',
    'appearance',
    'darkFieldBackground'
  );
  React.useEffect(
    () =>
      document.body.style.setProperty(
        '--field-background',
        darkMode ? darkFieldBackground : fieldBackground
      ),
    [darkMode, darkFieldBackground, fieldBackground]
  );

  const [disabledFieldBackground] = usePref(
    'form',
    'appearance',
    'fieldBackground'
  );
  const [darkDisabledFieldBackground] = usePref(
    'form',
    'appearance',
    'darkDisabledFieldBackground'
  );
  React.useEffect(
    () =>
      document.body.style.setProperty(
        '--disabled-field-background',
        darkMode ? darkDisabledFieldBackground : disabledFieldBackground
      ),
    [darkMode, darkDisabledFieldBackground, disabledFieldBackground]
  );

  const [invalidFieldBackground] = usePref(
    'form',
    'appearance',
    'fieldBackground'
  );
  const [darkInvalidFieldBackground] = usePref(
    'form',
    'appearance',
    'darkInvalidFieldBackground'
  );
  React.useEffect(
    () =>
      document.body.style.setProperty(
        '--invalid-field-background',
        darkMode ? darkInvalidFieldBackground : invalidFieldBackground
      ),
    [darkMode, darkInvalidFieldBackground, invalidFieldBackground]
  );

  const [requiredFieldBackground] = usePref(
    'form',
    'appearance',
    'fieldBackground'
  );
  const [darkRequiredFieldBackground] = usePref(
    'form',
    'appearance',
    'darkRequiredFieldBackground'
  );
  React.useEffect(
    () =>
      document.body.style.setProperty(
        '--required-field-background',
        darkMode ? darkRequiredFieldBackground : requiredFieldBackground
      ),
    [darkMode, darkRequiredFieldBackground, requiredFieldBackground]
  );

  return null;
}
