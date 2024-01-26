import { Coord, Lat, Long } from '../latLong';
import type { RA } from '../types';

function compareCoords(coord: Coord, [sign, ...components]: RA<number>): void {
  expect(coord.components).toHaveLength(components.length);
  expect(coord.sign).toBe(sign);
  compareArray(coord.components, components);
}

const compareArray = (source: RA<number>, target: RA<number>): void =>
  source.forEach((source, index) => expect(source).toBeCloseTo(target[index]));

describe('latLongUtils', () => {
  describe('parse valid', () =>
    (
      [
        [Lat, '34.123 N', [1, 34.123]],
        [Lat, '36:07 N', [1, 36, 7]],
        [Lat, '39:51:41 N', [1, 39, 51, 41]],
        [Lat, '00.07152778 N', [1, 0.071_527_78]],
        [Lat, '17:22.88 N', [1, 17, 22.88]],
        [Lat, '39:51:41.02 N', [1, 39, 51, 41.02]],
        [Coord, '-39:51:41', [-1, 39, 51, 41]],
        [Lat, '39:51:41 s', [-1, 39, 51, 41]],
        [Long, '39:51.41 w', [-1, 39, 51.41]],
        [Coord, '.34', [1, 0.34]],
        [Coord, '-.34', [-1, 0.34]],
        [Long, '17:22.88 E', [1, 17, 22.88]],
        [Lat, '28° N', [1, 28]],
        [Lat, "28° 19' N", [1, 28, 19]],
        [Lat, '28° 19\' 0.121" N', [1, 28, 19, 0.121]],
        [Long, '115° 34\' 59.872" W', [-1, 115, 34, 59.872]],
        [Lat, '1 01 S', [-1, 1, 1]],
        [Long, '1 01 W', [-1, 1, 1]],
        [Lat, '0 01 S', [-1, 0, 1]],
        [Long, '0 01 W', [-1, 0, 1]],
        [Coord, '0', [1, 0]],
        [Coord, '0 58 0', [1, 0, 58, 0]],
        [Coord, '-0 58 0', [-1, 0, 58, 0]],
      ] as const
    ).forEach(([type, raw, components]) =>
      test(`${raw} is ${type.name}`, () => {
        const result = Coord.parse(raw)!;
        expect(result).toBeInstanceOf(type);
        expect([result.sign, ...result.components]).toEqual(components);
      })
    ));

  describe('parse invalid', () =>
    [
      '',
      ' ',
      'foobar',
      '180:00:01',
      '-90:05 S',
      '124:34:23 N',
      '200:34',
      '15:75',
      '-124:34:23 N',
      '-200.34',
      '-15:75',
      '90.01 N',
      '90:01 N',
    ].forEach((value) =>
      [Lat, Long, Coord].map((parser) =>
        test(`${value} on ${parser.name}`, () =>
          expect(parser.parse(value)).toBeUndefined())
      )
    ));

  describe('toDegs', () =>
    Object.entries({
      '28° 19\' 0.121" N': [1, 28.316_700_277_8],
      '115° 34\' 59.872" W': [-1, 115.583_297_777_8],
      '0': [1, 0],
    }).forEach(([raw, expectedComponents]) =>
      test(raw, () => {
        const result = Coord.parse(raw)!.toDegs();
        compareCoords(result, expectedComponents);
      })
    ));

  describe('toDegsMinsSecs', () =>
    Object.entries({
      '28.3167002778': [1, 28, 19, 0.121],
      '-115.5832977778': [-1, 115, 34, 59.872],
      '28': [1, 28, 0, 0],
      '-115.5': [-1, 115, 30, 0],
      '-115.51': [-1, 115, 30, 36],
    }).forEach(([raw, expectedComponents]) =>
      test(raw, () => {
        const coord = new Coord(Number.parseFloat(raw));
        const result = coord.toDegsMinsSecs();
        compareCoords(result, expectedComponents);
      })
    ));

  describe('toDegsMins', () =>
    Object.entries({
      '28.5': [1, 28, 30],
      '-115.25': [-1, 115, 15],
    }).forEach(([raw, expectedComponents]) =>
      test(raw, () => {
        const coord = new Coord(Number.parseFloat(raw));
        const result = coord.toDegsMins();
        compareCoords(result, expectedComponents);
      })
    ));

  describe('format', () =>
    Object.entries({
      '28° 19\' 0.121"': [1, 28, 19, 0.121],
      '-115° 34\' 59.872"': [-1, 115, 34, 59.872],
      "28° 19'": [1, 28, 19],
      "-115° 34.44'": [-1, 115, 34.44],
      "-1° 1'": [-1, 1, 1],
      "-0° 1'": [-1, 0, 1],
    }).forEach(([formatted, components]) =>
      test(formatted, () => {
        const coord = new Coord();
        coord.sign = components.shift()!;
        coord.components = components;
        expect(coord.format(undefined)).toBe(formatted);
      })
    ));

  describe('toDegsMinsSecs', () =>
    Object.entries({
      '28° 30\' 36" N': new Lat(28.51),
      '115° 30\' 36" W': new Long(-115.51),
      '0° 30\' 36" W': new Long(-0.51),
      '28° 30\' 36" S': new Lat(-28.51),
      '0° 30\' 36" S': new Lat(-0.51),
      '115° 30\' 36" E': new Long(115.51),
      '28° 30\' 36"': new Coord(28.51),
      '-115° 30\' 36"': new Coord(-115.51),
      '-0° 30\' 36"': new Coord(-0.51),
    }).forEach(([formatted, instance]) =>
      test(formatted, () =>
        expect(instance.toDegsMinsSecs().format(undefined)).toBe(formatted)
      )
    ));

  describe('Lat.parse, Long.parse, Coord.parse', () =>
    (
      [
        [Lat, '34.123 N', [1, 34.123]],
        [Lat, '36:07 N', [1, 36, 7]],
        [Lat, '39:51:41 N', [1, 39, 51, 41]],
        [Lat, '00.07152778 N', [1, 0.071_527_78]],
        [Lat, '17:22.88 N', [1, 17, 22.88]],
        [Lat, '39:51:41.02 N', [1, 39, 51, 41.02]],
        [Coord, '-39:51:41', [-1, 39, 51, 41]],
        [Lat, '39:51:41 s', [-1, 39, 51, 41]],
        [Long, '39:51.41 w', [-1, 39, 51.41]],
        [Coord, '.34', [1, 0.34]],
        [Coord, '-.34', [-1, 0.34]],
        [Long, '17:22.88 E', [1, 17, 22.88]],
        [Lat, '28° N', [1, 28]],
        [Lat, "28° 19' N", [1, 28, 19]],
        [Lat, '28° 19\' 0.121" N', [1, 28, 19, 0.121]],
        [Lat, '  28° 19\' 0.121" N  ', [1, 28, 19, 0.121]],
        [Long, '115° 34\' 59.872" W', [-1, 115, 34, 59.872]],
      ] as const
    ).forEach(([givenType, formatted, components]) => {
      [Coord, Lat, Long].forEach((type) =>
        test(`${formatted} as ${type.name}`, () => {
          const result = type.parse(formatted)!;
          if (type === Coord || givenType === Coord || givenType === type)
            expect([result.sign, ...result.components]).toEqual(components);
          else expect(result).toBeUndefined();
        })
      );
    }));

  describe('Longitudes are handled appropriately by all parsers', () =>
    ['124:34:23', '-124:34:23', '90.1', '90:00:01'].forEach((raw) =>
      [Coord, Lat, Long].map((type) =>
        test(`${raw} as ${type.name}`, () => {
          const result = type.parse(raw);
          if (type === Lat) expect(result).toBeUndefined();
          else expect(result).toBeInstanceOf(Long);
        })
      )
    ));
});
