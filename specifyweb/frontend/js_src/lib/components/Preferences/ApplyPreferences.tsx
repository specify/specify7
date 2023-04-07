import React from 'react';

import { MILLISECONDS } from '../Atoms/Internationalization';
import {
  useDarkMode,
  useHighContrast,
  useReducedMotion,
  useTransitionDuration,
} from './Hooks';
import { defaultFont } from './Renderers';
import { userPreferences } from './userPreferences';

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
    document.body.classList[reduceMotion ? 'remove' : 'add']('motion-normal');
    document.documentElement.classList[reduceMotion ? 'remove' : 'add'](
      'scroll-smooth'
    );
  }, [reduceMotion]);

  const darkMode = useDarkMode();
  React.useEffect(
    () => document.body.classList[darkMode ? 'add' : 'remove']('dark'),
    [darkMode]
  );

  const highContrast = useHighContrast();
  React.useEffect(
    () => document.body.classList[highContrast ? 'add' : 'remove']('contrast'),
    [highContrast]
  );

  const [version, setVersion] = React.useState(0);
  React.useEffect(
    () =>
      userPreferences.events.on('update', () =>
        setVersion((version) => version + 1)
      ),
    []
  );
  /*
   * Could do this using usePref, but I am afraid about the performance impact
   * of ~30 user hooks, each of which has ~5 React hooks.
   */
  const prefs = React.useMemo(
    () => ({
      fontSize: userPreferences.get('general', 'ui', 'fontSize'),
      scaleUi: userPreferences.get('general', 'ui', 'scaleInterface'),
      fontFamily: userPreferences.get('general', 'ui', 'fontFamily'),
      formMaxWidth: userPreferences.get('form', 'ui', 'maxWidth'),
      fieldBackground: userPreferences.get(
        'form',
        'fieldBackground',
        'default'
      ),
      darkFieldBackground: userPreferences.get(
        'form',
        'fieldBackground',
        'darkDefault'
      ),
      disabledFieldBackground: userPreferences.get(
        'form',
        'fieldBackground',
        'disabled'
      ),
      darkDisabledFieldBackground: userPreferences.get(
        'form',
        'fieldBackground',
        'darkDisabled'
      ),
      invalidFieldBackground: userPreferences.get(
        'form',
        'fieldBackground',
        'invalid'
      ),
      darkInvalidFieldBackground: userPreferences.get(
        'form',
        'fieldBackground',
        'darkInvalid'
      ),
      requiredFieldBackground: userPreferences.get(
        'form',
        'fieldBackground',
        'required'
      ),
      darkRequiredFieldBackground: userPreferences.get(
        'form',
        'fieldBackground',
        'darkRequired'
      ),
      background: userPreferences.get('general', 'appearance', 'background'),
      darkBackground: userPreferences.get(
        'general',
        'appearance',
        'darkBackground'
      ),
      accentColor1: userPreferences.get(
        'general',
        'appearance',
        'accentColor1'
      ),
      accentColor2: userPreferences.get(
        'general',
        'appearance',
        'accentColor2'
      ),
      accentColor3: userPreferences.get(
        'general',
        'appearance',
        'accentColor3'
      ),
      accentColor4: userPreferences.get(
        'general',
        'appearance',
        'accentColor4'
      ),
      accentColor5: userPreferences.get(
        'general',
        'appearance',
        'accentColor5'
      ),
      roundedCorners: userPreferences.get(
        'general',
        'appearance',
        'roundedCorners'
      ),
      formForeground: userPreferences.get('form', 'appearance', 'foreground'),
      darkFormForeground: userPreferences.get(
        'form',
        'appearance',
        'darkForeground'
      ),
      formBackground: userPreferences.get('form', 'appearance', 'background'),
      darkFormBackground: userPreferences.get(
        'form',
        'appearance',
        'darkBackground'
      ),
      formFontFamily: userPreferences.get('form', 'ui', 'fontFamily'),
      formFontSize: userPreferences.get('form', 'ui', 'fontSize'),
      limitMaxFieldWidth: userPreferences.get(
        'form',
        'ui',
        'limitMaxFieldWidth'
      ),
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
