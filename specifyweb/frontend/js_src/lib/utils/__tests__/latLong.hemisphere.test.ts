/**
 * Regression tests for two coordinate-parsing defects that silently placed
 * specimens in the wrong hemisphere.
 *
 * Discovered at the California Academy of Sciences: 2,534 localities in the
 * botany collection carry Spanish `O` (Oeste = West) longitudes, 1,939 of them
 * stored correctly negative. Opening one in the Specify 7 UI rewrote it to a
 * POSITIVE longitude and stripped the `O` from the verbatim text — moving the
 * record to the opposite side of the planet and destroying the evidence that it
 * was ever West. No user edit was required.
 *
 * Both defects are fixed by REFUSING TO PARSE rather than by guessing. An
 * unparseable coordinate raises a validation message, which is how out-of-range
 * values such as 19°49'60" are already handled — a visible failure instead of a
 * silent one.
 *
 * The companion fix in LatLongUi.tsx stops the plugin writing to the resource on
 * render, so merely opening a record can no longer modify it.
 */

import { Coord, Lat, Long } from '../latLong';

describe('unrecognised direction letters are rejected, not silently dropped', () => {
  /*
   * We deliberately do NOT map `O` to west. The letter is ambiguous across
   * languages — Oeste/Ouest (es/pt/fr) mean west, but Ost/Oost (de/nl) mean
   * east. Guessing would repair one set of collections while silently corrupting
   * another, so an unknown direction is treated as unparseable and surfaced to
   * the user.
   */
  test.each(["96° 57' O", "97° 52' O", '90° 20\'14" O'])(
    'parse(%s) is rejected rather than guessed',
    (raw) => {
      expect(Long.parse(raw)).toBeUndefined();
    }
  );

  test('the specific corruption is gone: Oeste never yields a positive longitude', () => {
    // Previously returned +96.95 — Oaxaca, Mexico relocated to Anhui, China.
    const parsed = Long.parse("96° 57' O");
    expect(parsed?.asFloat()).not.toBe(96.95);
    expect(parsed).toBeUndefined();
  });

  test.each(["12° 30' Ouest", "12° 30' X"])(
    'parse(%s) with any other unknown direction is also rejected',
    (raw) => {
      expect(Coord.parse(raw)).toBeUndefined();
    }
  );

  /*
   * KNOWN LIMITATION, not fixed here. German "Ost" (East) still mis-reads: the O
   * and t are discarded but the `s` survives and is taken as SOUTH. A direction
   * letter did survive, so the guard above does not fire. Catching this needs
   * real localised direction words, which is a larger change than this fix.
   * Documented so the next reader does not assume it is covered.
   */
  test("KNOWN LIMITATION: German 'Ost' is misread as south", () => {
    expect(Coord.parse("12° 30' Ost")?.asFloat()).toBeCloseTo(-12.5, 6);
  });

  /*
   * The guard fires only when trimming destroyed the ONLY direction indicator.
   * When a recognised n/s/e/w survives, the discarded letters were noise and the
   * value is left alone — the masculine ordinal U+00BA (º) that Spanish and
   * Portuguese transcribers type instead of the degree sign is a Unicode Letter,
   * so an unconditional "any discarded letter is fatal" rule would have caught it
   * too.
   *
   * Note these particular strings do not parse either way: removing the º fuses
   * the digits ("42º20'N" -> "4220'N"). They are asserted here to pin that this
   * change does not make them WORSE, and to document why the guard is conditional.
   */
  test.each(["42º20'N", '99º58\'3"N', "4 deg. 11' S"])(
    'parse(%s) is unaffected by this change',
    (raw) => {
      expect(Coord.parse(raw)).toBeUndefined();
    }
  );
});

describe('a leading minus and a direction letter are reconciled, not multiplied', () => {
  /*
   * makeLatLong used to compute
   *     sign = (direction === 's' || direction === 'w' ? -1 : 1) * originalSign
   * so "-157.14015 W" — where BOTH the minus and the W mean west — multiplied
   * -1 by -1 and produced +157.14015, the opposite hemisphere.
   *
   * They are now reconciled by agreement rather than rejected outright, because
   * the intent is unambiguous when both point the same way. Across the CAS
   * collections this corrects 934 coordinates that previously parsed with a
   * flipped sign, instead of blocking them behind a validation error.
   */
  test.each([
    ['-157.14015° W', -157.14015],
    ["-96° 57' W", -96.95],
    ['-23°2\'45.1"S', -23.045_861_111_1],
    ['-1 01 W', -1.016_666_666_7],
  ])(
    'parse(%s) agrees with itself and stays western/southern',
    (raw, expected) => {
      expect(Coord.parse(raw)?.asFloat()).toBeCloseTo(expected, 6);
    }
  );

  test('the specific corruption is gone: -157 W is no longer positive', () => {
    // Previously returned +157.14015 — the eastern hemisphere.
    expect(Long.parse('-157.14015° W')?.asFloat()).toBeCloseTo(-157.14015, 6);
  });

  /*
   * A minus that CONTRADICTS its direction letter is still ambiguous and is
   * rejected. Both cases below are already in the upstream suite's
   * makeParseInvalidTest list and must stay invalid.
   */
  test('contradicting sign and direction remain invalid', () => {
    expect(Lat.parse('-124:34:23 N')).toBeUndefined();
    expect(Coord.parse('-12:30 N')).toBeUndefined();
  });

  test('agreement does not rescue an out-of-range latitude', () => {
    // -90:05 S agrees to -90.083, which still exceeds the 90 degree limit.
    expect(Lat.parse('-90:05 S')).toBeUndefined();
  });
});

describe('regression guards — correct input must keep working', () => {
  test.each([
    ['115° 34\' 59.872" W', -115.583_297_777_8],
    ['28° 19\' 0.121" N', 28.316_700_277_8],
    ["96° 57' W", -96.95],
    ["96° 57' E", 96.95],
  ])('%s still parses correctly', (raw, expected) => {
    expect(Coord.parse(raw)?.asFloat()).toBeCloseTo(expected, 6);
  });

  test('a plain negative decimal with no direction is untouched', () => {
    expect(Coord.parse('-96.95')?.asFloat()).toBeCloseTo(-96.95, 6);
  });

  test('a plain positive decimal with no direction is untouched', () => {
    expect(Coord.parse('96.95')?.asFloat()).toBeCloseTo(96.95, 6);
  });

  test('degree/minute/second forms without a direction still parse', () => {
    expect(Coord.parse('-39:51:41')?.asFloat()).toBeCloseTo(
      -39.861_388_888_9,
      6
    );
  });
});
