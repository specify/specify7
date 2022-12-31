import type { IR, RA } from '../../utils/types';

type Transformer<RAW, PARSED> = {
  readonly serializer: Serializer<RAW, PARSED>;
  readonly deserializer: Deserializer<PARSED>;
};

// FIXME: consider getting rid of notes and giving oldValue instead
type Serializer<RAW, PARSED> = (input: RAW) => PARSED;

type Deserializer<PARSED> = (value: PARSED, element: Element) => void;

export const transformer = <RAW, PARSED>(
  serializer: Serializer<RAW, PARSED>,
  deserializer: Deserializer<PARSED>
): Transformer<RAW, PARSED> => ({ serializer, deserializer });

/**
 * Merge multiple transformers. If need to merge more than 6 at once, then
 * just nest multiple pipe() functions
 */
export function pipe<R1, R2, R3, R4, R5, R6, R7>(
  t1: Transformer<R1, R2>,
  t2: Transformer<R2, R3>,
  t3: Transformer<R3, R4>,
  t4: Transformer<R4, R5>,
  t5: Transformer<R5, R6>,
  t6: Transformer<R6, R7>
): Transformer<R1, R7>;
export function pipe<R1, R2, R3, R4, R5, R6>(
  t1: Transformer<R1, R2>,
  t2: Transformer<R2, R3>,
  t3: Transformer<R3, R4>,
  t4: Transformer<R4, R5>,
  t5: Transformer<R5, R6>
): Transformer<R1, R6>;
export function pipe<R1, R2, R3, R4, R5>(
  t1: Transformer<R1, R2>,
  t2: Transformer<R2, R3>,
  t3: Transformer<R3, R4>,
  t4: Transformer<R4, R5>
): Transformer<R1, R5>;
export function pipe<R1, R2, R3, R4>(
  t1: Transformer<R1, R2>,
  t2: Transformer<R2, R3>,
  t3: Transformer<R3, R4>
): Transformer<R1, R4>;
export function pipe<R1, R2, R3>(
  t1: Transformer<R1, R2>,
  t2: Transformer<R2, R3>
): Transformer<R1, R3>;
export function pipe(
  ...transformers: RA<Transformer<unknown, unknown>>
): Transformer<unknown, unknown> {
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

type ObjectToJson<CONFORMATION extends IR<Transformer<Element, any>>> = {
  readonly [KEY in string &
    keyof CONFORMATION]: CONFORMATION[KEY] extends Transformer<
    any,
    infer PARSED
  >
    ? PARSED
    : never;
};

export const createSpec = <CONFORMATION extends IR<Transformer<Element, any>>>(
  properties: CONFORMATION
): CONFORMATION => properties;

export const xmlParser =
  <CONFORMATION extends IR<Transformer<Element, any>>>(spec: CONFORMATION) =>
  (cell: Element): ObjectToJson<CONFORMATION> =>
    Object.fromEntries(
      Object.entries(spec).map(([key, value]) => [
        key,
        xmlPropertyParser(cell, value),
      ])
    );

const xmlPropertyParser = <RAW, PARSED>(
  cell: RAW,
  { serializer }: Transformer<RAW, PARSED>
): PARSED => serializer(cell);

export const xmlBuilder =
  <CONFORMATION extends IR<Transformer<Element, any>>>(spec: CONFORMATION) =>
  (element: Element, shape: ObjectToJson<CONFORMATION>): void =>
    Object.entries(shape).forEach(([key, value]) => {
      const { deserializer } = spec[key as keyof CONFORMATION];
      deserializer(value, element);
    });
