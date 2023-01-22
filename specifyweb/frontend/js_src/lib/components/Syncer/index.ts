import type { IR, RA } from '../../utils/types';
import { getLogContext, setLogContext } from '../Errors/interceptLogs';

/**
 * Transformer was the original name, but that clashes with Node.js
 */
export type Syncer<RAW, PARSED> = {
  readonly serializer: Serializer<RAW, PARSED>;
  readonly deserializer: Deserializer<RAW, PARSED>;
};

type Serializer<RAW, PARSED> = (input: RAW) => PARSED;

type Deserializer<RAW, PARSED> = (value: PARSED) => RAW;

export const syncer = <RAW, PARSED>(
  serializer: Serializer<RAW, PARSED>,
  deserializer: Deserializer<RAW, PARSED>
): Syncer<RAW, PARSED> => ({
  serializer: (raw: RAW): PARSED => {
    const context = getLogContext();
    const result = serializer(raw);
    setLogContext(context, false);
    return result;
  },
  deserializer: (raw: PARSED): RAW => {
    const context = getLogContext();
    const result = deserializer(raw);
    setLogContext(context, false);
    return result;
  },
});

/**
 * Not sure yet whether this would be useful, but the fact that each syncer
 * can be reversed is such a cool property!
 */
export const flipSyncer = <RAW, PARSED>(
  syncer: Syncer<RAW, PARSED>
): Syncer<PARSED, RAW> => ({
  serializer: syncer.deserializer,
  deserializer: syncer.serializer,
});

/**
 * Merge multiple syncers. If need to merge more than 6 at once, then
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
  ...syncers: RA<Syncer<unknown, unknown>>
): Syncer<unknown, unknown> {
  return {
    serializer: (value) =>
      syncers.reduce((value, { serializer }) => serializer(value), value),
    deserializer: (value) =>
      syncers.reduceRight(
        (value, { deserializer }) => deserializer(value),
        value
      ),
  };
}

export type BaseSpec<RAW = unknown> = IR<Syncer<RAW, any>>;

export const createSpec = <SPEC extends BaseSpec>(spec: SPEC): SPEC => spec;

export type SpecToJson<SPEC extends BaseSpec<any>> = {
  readonly [KEY in string & keyof SPEC]: SPEC[KEY] extends Syncer<
    any,
    infer PARSED
  >
    ? PARSED
    : never;
};

export const createParser =
  <RAW, SPEC extends BaseSpec<RAW>>(spec: SPEC) =>
  (raw: RAW): SpecToJson<SPEC> =>
    Object.fromEntries(
      Object.entries(spec).map(([key, { serializer }]) => [
        key,
        serializer(raw),
      ])
    );

export const createBuilder =
  <RAW, SPEC extends BaseSpec<RAW>>(spec: SPEC) =>
  (shape: SpecToJson<SPEC>): RA<RAW> =>
    Object.entries(spec).map(([key, definition]) =>
      definition.deserializer(shape[key])
    );
