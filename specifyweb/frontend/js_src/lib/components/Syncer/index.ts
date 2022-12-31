import type { IR, RA } from '../../utils/types';

/**
 * Transformer was the original name, but that clashes with Node.js
 */
export type Syncer<RAW, PARSED> = {
  readonly serializer: Serializer<RAW, PARSED>;
  readonly deserializer: Deserializer<PARSED>;
};

// FIXME: consider getting rid of notes and giving oldValue instead
type Serializer<RAW, PARSED> = (input: RAW) => PARSED;

type Deserializer<PARSED> = (value: PARSED, element: Element) => void;

export const syncer = <RAW, PARSED>(
  serializer: Serializer<RAW, PARSED>,
  deserializer: Deserializer<PARSED>
): Syncer<RAW, PARSED> => ({ serializer, deserializer });

/**
 * Merge multiple transformers. If need to merge more than 6 at once, then
 * just nest multiple pipe() functions
 */
export function pipe<R1, R2, R3, R4, R5, R6, R7>(
  t1: Syncer<R1, R2>,
  t2: Syncer<R2, R3>,
  t3: Syncer<R3, R4>,
  t4: Syncer<R4, R5>,
  t5: Syncer<R5, R6>,
  t6: Syncer<R6, R7>
): Syncer<R1, R7>;
export function pipe<R1, R2, R3, R4, R5, R6>(
  t1: Syncer<R1, R2>,
  t2: Syncer<R2, R3>,
  t3: Syncer<R3, R4>,
  t4: Syncer<R4, R5>,
  t5: Syncer<R5, R6>
): Syncer<R1, R6>;
export function pipe<R1, R2, R3, R4, R5>(
  t1: Syncer<R1, R2>,
  t2: Syncer<R2, R3>,
  t3: Syncer<R3, R4>,
  t4: Syncer<R4, R5>
): Syncer<R1, R5>;
export function pipe<R1, R2, R3, R4>(
  t1: Syncer<R1, R2>,
  t2: Syncer<R2, R3>,
  t3: Syncer<R3, R4>
): Syncer<R1, R4>;
export function pipe<R1, R2, R3>(
  t1: Syncer<R1, R2>,
  t2: Syncer<R2, R3>
): Syncer<R1, R3>;
export function pipe(
  ...transformers: RA<Syncer<unknown, unknown>>
): Syncer<unknown, unknown> {
  return {
    serializer: (value) =>
      transformers.reduce((value, { serializer }) => serializer(value), value),
    deserializer: (value, element) =>
      transformers.reduceRight(
        (value, { deserializer }) => deserializer(value, element),
        value
      ),
  };
}

export type SpecToJson<SPEC extends IR<Syncer<Element, any>>> = {
  readonly [KEY in string & keyof SPEC]: SPEC[KEY] extends Syncer<
    any,
    infer PARSED
  >
    ? PARSED
    : never;
};

export const createSpec = <SPEC extends IR<Syncer<Element, any>>>(
  spec: SPEC
): SPEC => spec;

export const xmlParser =
  <SPEC extends IR<Syncer<Element, any>>>(spec: SPEC) =>
  (cell: Element): SpecToJson<SPEC> =>
    Object.fromEntries(
      Object.entries(spec).map(([key, value]) => [
        key,
        xmlPropertyParser(cell, value),
      ])
    );

const xmlPropertyParser = <RAW, PARSED>(
  cell: RAW,
  { serializer }: Syncer<RAW, PARSED>
): PARSED => serializer(cell);

export const xmlBuilder =
  <SPEC extends IR<Syncer<Element, any>>>(spec: SPEC) =>
  (element: Element, shape: SpecToJson<SPEC>): Element => {
    Object.entries(shape).forEach(([key, value]) => {
      const { deserializer } = spec[key as keyof SPEC];
      deserializer(value, element);
    });
    return element;
  };
