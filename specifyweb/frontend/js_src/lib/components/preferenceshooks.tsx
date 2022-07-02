/**
 * React Hooks to listen to preferences changes
 * (this allows to change UI preferences without restarting the application)
 */

import React from 'react';

import { eventListener } from '../events';
import { f } from '../functools';
import { getUserPref, setPref } from '../preferencesutils';
import { MILLISECONDS } from './internationalization';
import type {
  preferenceDefinitions,
  PreferenceItem,
  Preferences,
} from './preferences';
import { defaultFont } from './preferencesrenderers';

export const prefEvents = eventListener<{
  update: PreferenceItem<unknown> | undefined;
  synchronized: undefined;
}>();

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
    (
      newPref: Preferences[CATEGORY]['subCategories'][SUBCATEGORY]['items'][ITEM]['defaultValue']
    ): void => setPref(category, subcategory, item, newPref),
    [category, subcategory, item]
  );

  return [pref, updatePref] as const;
}

function useMedia(query: string): boolean {
  const media = React.useMemo(() => globalThis.matchMedia(query), [query]);
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
  return React.useMemo(
    () => (reduceMotion ? 0 : defaultTransitionDuration),
    [reduceMotion]
  );
}

const shouldReduceMotion = (): boolean =>
  f.var(getUserPref('general', 'ui', 'reduceMotion'), (pref) =>
    pref === 'system'
      ? globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
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
      ? globalThis.matchMedia('(prefers-color-scheme: dark)').matches
      : theme === 'dark'
  );

export function SetCssVariables(): null {
  const transitionDuration = useTransitionDuration();
  React.useEffect(
    () =>
      document.body.style.setProperty(
        '--transition-duration',
        `${transitionDuration / MILLISECONDS}s`
      ),
    [transitionDuration]
  );

  const reduceMotion = useReducedMotion();
  React.useEffect(() => {
    document.body.classList[reduceMotion ? 'add' : 'remove']('reduce-motion');
    document.documentElement.classList[reduceMotion ? 'remove' : 'add'](
      'scroll-smooth'
    );
  }, [reduceMotion]);

  const darkMode = useDarkMode();
  React.useEffect(
    () => document.body.classList[darkMode ? 'add' : 'remove']('dark'),
    [darkMode]
  );

  const [version, setVersion] = React.useState(0);
  React.useEffect(
    () => prefEvents.on('update', () => setVersion((version) => version + 1)),
    []
  );
  /*
   * Could do this using usePref, but I am afraid about the performance impact
   * of ~30 user hooks, each of which has ~5 React hooks.
   */
  const prefs = React.useMemo(
    () => ({
      fontSize: getUserPref('general', 'ui', 'fontSize'),
      scaleUi: getUserPref('general', 'ui', 'scaleInterface'),
      fontFamily: getUserPref('general', 'ui', 'fontFamily'),
      formMaxWidth: getUserPref('form', 'ui', 'maxWidth'),
      fieldBackground: getUserPref('form', 'fieldBackground', 'default'),
      darkFieldBackground: getUserPref(
        'form',
        'fieldBackground',
        'darkDefault'
      ),
      disabledFieldBackground: getUserPref(
        'form',
        'fieldBackground',
        'disabled'
      ),
      darkDisabledFieldBackground: getUserPref(
        'form',
        'fieldBackground',
        'darkDisabled'
      ),
      invalidFieldBackground: getUserPref('form', 'fieldBackground', 'invalid'),
      darkInvalidFieldBackground: getUserPref(
        'form',
        'fieldBackground',
        'darkInvalid'
      ),
      requiredFieldBackground: getUserPref(
        'form',
        'fieldBackground',
        'required'
      ),
      darkRequiredFieldBackground: getUserPref(
        'form',
        'fieldBackground',
        'darkRequired'
      ),
      background: getUserPref('general', 'appearance', 'background'),
      darkBackground: getUserPref('general', 'appearance', 'darkBackground'),
      accentColor1: getUserPref('general', 'appearance', 'accentColor1'),
      accentColor2: getUserPref('general', 'appearance', 'accentColor2'),
      accentColor3: getUserPref('general', 'appearance', 'accentColor3'),
      accentColor4: getUserPref('general', 'appearance', 'accentColor4'),
      accentColor5: getUserPref('general', 'appearance', 'accentColor5'),
      roundedCorners: getUserPref('general', 'appearance', 'roundedCorners'),
      formForeground: getUserPref('form', 'appearance', 'foreground'),
      darkFormForeground: getUserPref('form', 'appearance', 'darkForeground'),
      formBackground: getUserPref('form', 'appearance', 'background'),
      darkFormBackground: getUserPref('form', 'appearance', 'darkBackground'),
      formFontFamily: getUserPref('form', 'ui', 'fontFamily'),
      formFontSize: getUserPref('form', 'ui', 'fontSize'),
      limitMaxFieldWidth: getUserPref('form', 'ui', 'limitMaxFieldWidth'),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version]
  );

  const scaleTarget = prefs.scaleUi ? document.documentElement : document.body;
  React.useEffect(
    () => () => void scaleTarget.style.removeProperty('font-size'),
    [scaleTarget]
  );
  React.useEffect(
    () => scaleTarget.style.setProperty('font-size', `${prefs.fontSize}%`),
    [scaleTarget, prefs.fontSize]
  );

  React.useEffect(
    () =>
      prefs.fontFamily === defaultFont
        ? void document.body.style.removeProperty('font-family')
        : document.body.style.setProperty('font-family', prefs.fontFamily),
    [prefs.fontFamily]
  );

  React.useEffect(
    () =>
      document.body.style.setProperty(
        '--form-max-width',
        `${prefs.formMaxWidth}px`
      ),
    [prefs.formMaxWidth]
  );

  const fieldBackground = darkMode
    ? prefs.darkFieldBackground
    : prefs.fieldBackground;
  React.useEffect(
    () =>
      document.body.style.setProperty('--field-background', fieldBackground),
    [fieldBackground]
  );

  const disabledFieldBackground = darkMode
    ? prefs.darkDisabledFieldBackground
    : prefs.disabledFieldBackground;
  React.useEffect(
    () =>
      document.body.style.setProperty(
        '--disabled-field-background',
        disabledFieldBackground
      ),
    [disabledFieldBackground]
  );

  const invalidFieldBackground = darkMode
    ? prefs.darkInvalidFieldBackground
    : prefs.invalidFieldBackground;
  React.useEffect(
    () =>
      document.body.style.setProperty(
        '--invalid-field-background',
        invalidFieldBackground
      ),
    [invalidFieldBackground]
  );

  const requiredFieldBackground = darkMode
    ? prefs.darkRequiredFieldBackground
    : prefs.requiredFieldBackground;
  React.useEffect(
    () =>
      document.body.style.setProperty(
        '--required-field-background',
        requiredFieldBackground
      ),
    [requiredFieldBackground]
  );

  const background = darkMode ? prefs.darkBackground : prefs.background;
  React.useEffect(
    () => document.body.style.setProperty('--background', background),
    [background]
  );

  React.useEffect(
    () =>
      document.body.style.setProperty('--accent-color-100', prefs.accentColor1),
    [prefs.accentColor1]
  );

  React.useEffect(
    () =>
      document.body.style.setProperty('--accent-color-200', prefs.accentColor2),
    [prefs.accentColor2]
  );

  React.useEffect(
    () =>
      document.body.style.setProperty('--accent-color-300', prefs.accentColor3),
    [prefs.accentColor3]
  );

  React.useEffect(
    () =>
      document.body.style.setProperty('--accent-color-400', prefs.accentColor4),
    [prefs.accentColor4]
  );

  React.useEffect(
    () =>
      document.body.style.setProperty('--accent-color-500', prefs.accentColor5),
    [prefs.accentColor5]
  );

  React.useEffect(
    () =>
      document.body.classList[prefs.roundedCorners ? 'remove' : 'add'](
        'no-rounded-corners'
      ),
    [prefs.roundedCorners]
  );

  const formForeground = darkMode
    ? prefs.darkFormForeground
    : prefs.formForeground;
  React.useEffect(
    () => document.body.style.setProperty('--form-foreground', formForeground),
    [formForeground]
  );

  const formBackground = darkMode
    ? prefs.darkFormBackground
    : prefs.formBackground;
  React.useEffect(
    () => document.body.style.setProperty('--form-background', formBackground),
    [formBackground]
  );

  React.useEffect(
    () =>
      document.body.style.setProperty(
        '--form-font-family',
        prefs.formFontFamily
      ),
    [prefs.formFontFamily]
  );

  React.useEffect(
    () =>
      document.body.style.setProperty(
        '--form-font-size',
        `${prefs.formFontSize}%`
      ),
    [prefs.formFontSize]
  );

  React.useEffect(
    () =>
      document.body.style.setProperty(
        '--max-field-width',
        `${prefs.limitMaxFieldWidth ? '40' : '4000'}rem`
      ),
    [prefs.limitMaxFieldWidth]
  );

  return null;
}
