import { userPreferences } from '../components/Preferences/userPreferences';
import { hexToHsl } from '../utils/utils';

export function useHueDifference(): number {
  const [userAccentColorPref] = userPreferences.use(
    'general',
    'appearance',
    'accentColor3'
  );
  const brandColor = userPreferences.definition(
    'general',
    'appearance',
    'accentColor3'
  ).defaultValue;

  const userAccentHsl = hexToHsl(userAccentColorPref);
  const brandHsl = hexToHsl(brandColor);

  let hueDifference = userAccentHsl.hue - brandHsl.hue;
  if (hueDifference < 0) {
    hueDifference += 360;
  }

  return hueDifference;
}
