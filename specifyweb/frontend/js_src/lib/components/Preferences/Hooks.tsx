import React from 'react';

import { eventListener } from '../../utils/events';
import { userPreferences } from './userPreferences';

function useMedia(query: string): boolean {
  const media = React.useMemo(() => globalThis.matchMedia(query), [query]);
  const eventsTarget = React.useMemo(
    () => eventListener<{ readonly change: undefined }>(media),
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
  const [pref] = userPreferences.use('general', 'ui', 'reduceMotion');
  const media = useMedia('(prefers-reduced-motion: reduce)');
  return pref === 'system' ? media : pref === 'reduce';
}

export function useHighContrast(): boolean {
  const [pref] = userPreferences.use('general', 'ui', 'contrast');
  const media = useMedia('(prefers-contrast: more)');
  return pref === 'system' ? media : pref === 'more';
}

const defaultTransitionDuration = 100;

export function useTransitionDuration(): number {
  const reduceMotion = useReducedMotion();
  return React.useMemo(
    () => (reduceMotion ? 0 : defaultTransitionDuration),
    [reduceMotion]
  );
}

function shouldReduceMotion(): boolean {
  const pref = userPreferences.get('general', 'ui', 'reduceMotion');
  return pref === 'system'
    ? globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
    : pref === 'reduce';
}

export const getTransitionDuration = (): number =>
  shouldReduceMotion() ? 0 : defaultTransitionDuration;

export function useDarkMode(): boolean {
  const [theme] = userPreferences.use('general', 'ui', 'theme');
  const media = useMedia('(prefers-color-scheme: dark)');
  return theme === 'system' ? media : theme === 'dark';
}

export function useReducedTransparency(): boolean {
  const [reduceTransparency] = userPreferences.use(
    'general',
    'ui',
    'reduceTransparency'
  );
  const media = useMedia('(prefers-reduced-transparency: reduce)');
  return reduceTransparency === 'system'
    ? media
    : reduceTransparency === 'reduce';
}
