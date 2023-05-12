import { hexToHsl } from '../utils';

describe('hexToHsl', () => {
  test('should return HSL for red color', () => {
    const hexColor = '#ff0000';
    const expectedHsl = { hue: 0, saturation: 100, lightness: 50 };
    expect(hexToHsl(hexColor)).toEqual(expectedHsl);
  });

  test('should return HSL for hex color #000000', () => {
    const hexColor = '#000000';
    const expectedHsl = { hue: 0, saturation: 0, lightness: 0 };
    expect(hexToHsl(hexColor)).toEqual(expectedHsl);
  });

  test('should return HSL for hex color #ffffff', () => {
    const hexColor = '#ffffff';
    const expectedHsl = { hue: 0, saturation: 0, lightness: 100 };
    expect(hexToHsl(hexColor)).toEqual(expectedHsl);
  });

  test('should return HSL for hex color #8368e3', () => {
    const hexColor = '#8368e3';
    const expectedHsl = { hue: 253, saturation: 69, lightness: 65 };
    expect(hexToHsl(hexColor)).toEqual(expectedHsl);
  });

  test('should return HSL for hex color #b1ff14', () => {
    const hexColor = '#b1ff14';
    const expectedHsl = { hue: 80, saturation: 100, lightness: 54 };
    expect(hexToHsl(hexColor)).toEqual(expectedHsl);
  });

  test('should return HSL for hex color #f78605', () => {
    const hexColor = '#f78605';
    const expectedHsl = { hue: 32, saturation: 96, lightness: 49 };
    expect(hexToHsl(hexColor)).toEqual(expectedHsl);
  });
});
