/**
 * Utilities for parsing and converting latitudes and longitudes
 *
 * Believe it or not, there is no good coordate parsing library out there.
 *
 * I tested the following: "coordinate-parser", "geo-coordinates-parser",
 * "coordinate-formats", and a few even more obscure ones.
 *
 * They are all designed to parse coordinates in parts, rather than latitude
 * and longitude separately. Simply concatenating the parts together does not
 * work either because they assume both coordinates are in the same format.
 */

import { f } from './functools';
import type { RA } from './types';
import { mappedFind, toLowerCase } from './utils';

const Parts = {
  DEGS: 1,
  DEGS_MINS: 2,
  DEGS_MINS_SECS: 3,
} as const;

const blackList = /[^\s\d"'\-.:ensw°]/giu;
export const trimLatLong = (value: string): string =>
  value.replaceAll(blackList, '').trimStart();

const parsers = [
  {
    regex: /^(-?\d{0,3}(\.\d*)?)[^\d.ensw]*([ensw]?)$/i,
    components: [Parts.DEGS],
    // What match group to use for each component
    direction: 3,
  },
  {
    regex: /^(-?\d{1,3})[^\d.]+(\d{0,2}(\.\d*)?)[^\d.ensw]*([ensw]?)$/i,
    components: [Parts.DEGS, Parts.DEGS_MINS],
    direction: 4,
  },
  {
    regex:
      /^(-?\d{1,3})[^\d.]+(\d{1,2})[^\d.]+(\d{0,2}(\.\d*)?)[^\d.ensw]*([ensw]?)$/i,
    components: [Parts.DEGS, Parts.DEGS_MINS, Parts.DEGS_MINS_SECS],
    direction: 5,
  },
] as const;

/**
 * Any alphabetic character among the ones blackList discards is a direction
 * indicator we do not understand — most often a non-English one.
 */
const unrecognizedDirection = /\p{Letter}/u;

function parse(rawValue: string): Coord | undefined {
  /*
   * Refuse to parse rather than silently discarding an unrecognised direction
   * letter.
   *
   * The blackList strips every character outside [\s\d"'\-.:ensw°], so a Spanish
   * "96° 57' O" (Oeste = West) loses its O, no direction is found, and a POSITIVE
   * longitude is returned — the wrong hemisphere, with nothing to indicate that
   * anything was dropped.
   *
   * We deliberately do NOT map O to west. The letter is ambiguous across
   * languages: Oeste/Ouest (es/pt/fr) mean west, while Ost/Oost (de/nl) mean
   * east. Guessing would fix one set of collections and silently corrupt
   * another. Returning undefined surfaces a validation message instead, which is
   * how out-of-range values such as 19°49'60" are already handled.
   */
  const value = trimLatLong(rawValue).trim();

  /*
   * Only reject when trimming destroyed the ONLY direction indicator. If a
   * recognised n/s/e/w survives, the discarded letters were noise — a spelled-out
   * "deg", or the masculine ordinal U+00BA (º) that Spanish and Portuguese
   * transcribers type instead of the degree sign — and the coordinate still means
   * what it says. Rejecting those too would break ~423 real localities across the
   * CAS collections that parse correctly today, e.g. "42º20'N" and "4 deg. 11' S".
   */
  if (
    !/[ensw]$/iu.test(value) &&
    unrecognizedDirection.test(rawValue.match(blackList)?.join('') ?? '')
  )
    return undefined;
  return mappedFind(parsers, ({ regex, components, direction }) => {
    const match = regex.exec(value);
    if (match === null) return undefined;
    const sign = match[components[0]].startsWith('-') ? -1 : 1;
    const parsedDirection = match[direction].toLowerCase() as
      | 'e'
      | 'n'
      | 's'
      | 'w';
    const comps = components
      .slice(0, -1)
      .map((index) => Math.abs(Number.parseInt(match[index])));
    comps.push(Math.abs(Number.parseFloat(match[components.at(-1)!])));
    const result = makeLatLong(sign, comps, parsedDirection);
    if (result) return result;
    return undefined;
  });
}

function makeLatLong(
  originalSign: number,
  components: RA<number>,
  originalDirection?: 'e' | 'n' | 's' | 'w'
): Coord | undefined {
  if (components.some(Number.isNaN)) return undefined;

  const direction = toLowerCase(originalDirection ?? '');

  /*
   * A leading minus and a direction letter each carry a sign. Multiplying them,
   * as this used to, made them CANCEL: "-157.14015 W" — where the minus and the
   * W both mean west — produced +157.14015, the opposite hemisphere.
   *
   * They are instead reconciled by agreement:
   *   - no direction letter        -> the minus decides
   *   - minus AND s/w              -> they agree; the value is negative
   *   - minus AND n/e              -> they contradict; the value is ambiguous
   *                                   and is rejected rather than guessed
   *
   * This keeps both pre-existing invalid cases invalid — '-124:34:23 N'
   * contradicts, and '-90:05 S' agrees to -90.083 which still exceeds the 90
   * degree latitude limit — while reading the 934 agreeing coordinates in the CAS
   * collections (e.g. "-23°2'45.1\"S") the way they were plainly meant, instead
   * of blocking them behind a validation error.
   */
  const directionSign =
    direction === '' ? undefined : direction === 's' || direction === 'w' ? -1 : 1;
  if (originalSign < 0 && directionSign === 1) return undefined;

  const sign = directionSign ?? originalSign;

  let result: Coord;
  if (direction === 's' || direction === 'n') result = new Lat();
  else if (
    direction === 'w' ||
    direction === 'e' ||
    // If the coord is greater in magnitude than 90 it has to be a long
    Math.abs(adjustComponents(components, 1)[0]) > 90
  )
    result = new Long();
  else result = new Coord();

  result.sign = sign;
  result.components = components;
  return result;
}

export class Coord {
  // eslint-disable-next-line functional/prefer-readonly-type
  public sign;

  // eslint-disable-next-line functional/prefer-readonly-type
  public components: RA<number>;

  public constructor(float = 0) {
    this.sign = Math.sign(float);
    this.components = [Math.abs(float)];
  }

  public isValid(): boolean {
    for (let index = 0; index < this.components.length; index += 1) {
      const x = this.components[index];
      if (x < 0) return false;
      if (index === 0 && Math.abs(x) > 180) return false;
      if (index > 0 && Math.abs(x) >= 60) return false;
    }
    return Math.abs(this.toDegs().components[0]) <= 180;
  }

  public format(step: number | undefined): string {
    return `${this.sign < 0 ? '-' : ''}${format(this.components, step)}`;
  }

  private adjustTerms(componentCount: number): this {
    const result = Object.create(this) as this;
    result.components = adjustComponents(this.components, componentCount);
    return result;
  }

  public toDegs(): this {
    return this.adjustTerms(Parts.DEGS);
  }

  public toDegsMins(): this {
    return this.adjustTerms(Parts.DEGS_MINS);
  }

  public toDegsMinsSecs(): this {
    return this.adjustTerms(Parts.DEGS_MINS_SECS);
  }

  public asLat(): Lat | undefined {
    const result = new Lat();
    result.sign = this.sign;
    result.components = Array.from(this.components);
    return result.isValid() ? result : undefined;
  }

  public asLong(): Long | undefined {
    const result = new Long();
    result.sign = this.sign;
    result.components = Array.from(this.components);
    return result.isValid() ? result : undefined;
  }

  public asFloat(): number {
    return this.toDegs().components[0] * this.sign;
  }

  /** This is the "Locality.originalLatLongUnit" value for Specify 6 */
  public soCalledUnit(): number | undefined {
    if (this.components.length === Parts.DEGS) return 0;
    else if (this.components.length === Parts.DEGS_MINS) return 2;
    else if (this.components.length === Parts.DEGS_MINS_SECS) return 1;
    else return undefined;
  }

  public static parse(string: string): Coord | undefined {
    const result = parse(string);
    return result?.isValid() === true ? result : undefined;
  }
}

export type ConversionFunction = keyof Coord &
  ('toDegs' | 'toDegsMins' | 'toDegsMinsSecs');

export class Lat extends Coord {
  public isValid(): boolean {
    const decDegs = this.toDegs();
    if (Math.abs(decDegs.components[0]) > 90) return false;
    return Coord.prototype.isValid.call(this);
  }

  public format(step: number | undefined): string {
    const direction = this.sign < 0 ? 'S' : 'N';
    return `${format(this.components, step)} ${direction}`;
  }

  public asLong(): undefined {
    return undefined;
  }

  public static parse(string: string): Lat | undefined {
    const result = Coord.parse(string);
    return result?.asLat();
  }
}

export class Long extends Coord {
  public format(step: number | undefined) {
    const direction = this.sign < 0 ? 'W' : 'E';
    return `${format(this.components, step)} ${direction}`;
  }

  public asLat(): undefined {
    return undefined;
  }

  public static parse(string: string): Long | undefined {
    const result = Coord.parse(string);
    return result?.asLong();
  }
}

/**
 * Combine and split coordinate components
 */
function adjustComponents(
  originalComponents: RA<number>,
  componentCount: number
): RA<number> {
  if (componentCount < 1 || originalComponents.length === 0)
    throw new RangeError('Arguments outside of allowed range');
  const components = Array.from(originalComponents);

  /*
   * If there are fever components available, round the lsat one and
   * make children out of it
   */
  while (components.length < componentCount) {
    const part = components.pop()!;
    components.push(Math.floor(part), 60 * (part - Math.floor(part)));
  }

  /*
   * If therea are extra components available, merge them one by one into the
   * last one
   */
  while (components.length > componentCount)
    components[components.length - 2] += components.pop()! / 60;

  // Try and truncate some rounding errors
  components.push(Math.round(components.pop()! * 1e9) / 1e9);
  return components;
}

const signs = ['°', "'", '"'];
const format = (components: RA<number>, step: number | undefined): string =>
  components
    .map((digit) => (typeof step === 'number' ? f.round(digit, step) : digit))
    .flatMap((digit, index) => [digit, signs[index]].join(''))
    .join(' ')
    .trim();
