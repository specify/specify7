import type { IR, RA } from '../../utils/types';
import {
  getLogContext,
  pathKey,
  pushContext,
  setLogContext,
} from '../Errors/logContext';
import type { syncers } from './syncers';

/**
 * Transformer was the original name, but that clashes with Node.js
 */
export type Syncer<RAW, PARSED> = {
  /*
   * Using method signature style rather than property type style to allow
   * for bivariance
   * See https://stackoverflow.com/questions/52667959/what-is-the-purpose-of-bivariancehack-in-typescript-types
   */
  // eslint-disable-next-line @typescript-eslint/method-signature-style
  serializer(input: RAW): PARSED;
  // eslint-disable-next-line @typescript-eslint/method-signature-style
  deserializer(value: PARSED): RAW;
};

type Serializer<RAW, PARSED> = (input: RAW) => PARSED;

type Deserializer<RAW, PARSED> = (value: PARSED) => RAW;

export type SyncerIn<SYNCER extends Syncer<unknown, unknown>> =
  SYNCER extends Syncer<infer INPUT, unknown> ? INPUT : never;

export type SyncerOut<SYNCER extends Syncer<unknown, unknown>> =
  SYNCER extends Syncer<unknown, infer OUTPUT> ? OUTPUT : never;

export type ExtractSyncer<T extends (typeof syncers)[keyof typeof syncers]> =
  T extends (...args: RA<any>) => Syncer<unknown, unknown> ? ReturnType<T> : T;

/**
 * This function exists just to improve typing
 */
export const syncer = <RAW, PARSED>(
  serializer: Serializer<RAW, PARSED>,
  deserializer: Deserializer<RAW, PARSED>
): Syncer<RAW, PARSED> => ({
  serializer,
  deserializer,
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

/*
 * FEATURE: make values that could be undefined optional
 *  Currently it requires all values to be there, even if "undefined".
 *  I tried different implementations of a UndefinedOptional<>, utility type,
 *  but it caused type errors in other places. Might have to wait for
 *  https://github.com/microsoft/TypeScript/issues/32562
 */
export type SpecToJson<SPEC extends BaseSpec<any>> = {
  readonly [KEY in string & keyof SPEC]: SPEC[KEY] extends Syncer<
    any,
    infer PARSED
  >
    ? PARSED
    : never;
};

export const runParser = <RAW, SPEC extends BaseSpec<RAW>>(
  spec: SPEC,
  raw: RAW
): SpecToJson<SPEC> => {
  const logContext = getLogContext();
  const path = logContext[pathKey];
  // If runParser() is called inside of runParser(), don't push root again
  if (!Array.isArray(path))
    pushContext({ type: 'Root', node: [raw], extras: { spec } });
  const result = Object.fromEntries(
    Object.entries(spec).map(([key, { serializer }]) => {
      const context = getLogContext();
      const value = serializer(raw);
      setLogContext(context);
      return [key, value] as const;
    })
  );
  setLogContext(logContext);
  return result;
};

export const runBuilder = <RAW, SPEC extends BaseSpec<RAW>>(
  spec: SPEC,
  shape: SpecToJson<SPEC>
): RA<RAW> =>
  Object.entries(spec).map(([key, definition]) =>
    definition.deserializer(shape?.[key])
  );
