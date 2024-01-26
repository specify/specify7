import { theories } from '../../tests/utils';
import { hexToHsl } from '../utils';

theories(hexToHsl, [
  { in: ['#f78605'], out: { hue: 32, saturation: 96, lightness: 49 } },
  { in: ['#b1ff14'], out: { hue: 80, saturation: 100, lightness: 54 } },
  { in: ['#8368e3'], out: { hue: 253, saturation: 69, lightness: 65 } },
  { in: ['#ffffff'], out: { hue: 0, saturation: 0, lightness: 100 } },
  { in: ['#000000'], out: { hue: 0, saturation: 0, lightness: 0 } },
  { in: ['#ff0000'], out: { hue: 0, saturation: 100, lightness: 50 } },
]);
