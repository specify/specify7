import type { IR, RA } from '../../utils/types';
import { strictParseXml } from '../AppResources/codeMirrorLinters';
import { silenceConsole } from '../Errors/interceptLogs';

/**
 * Transformer was the original name, but that clashes with Node.js
 */
export type Syncer<RAW, PARSED, OLD_RAW extends RAW | undefined = RAW> = {
  readonly serializer: Serializer<RAW, PARSED>;
  readonly deserializer: Deserializer<RAW, PARSED, OLD_RAW>;
};

type SafeSyncerError =
  'If you see this error, replace syncer() with safeSyncer()';

/**
 * This type of syncer can handle cases when old value is not available (i.e,
 * because a new entry was added to JSON which was not previously serialized)
 */
export type SafeSyncer<RAW, PARSED> = Syncer<RAW, PARSED, RAW | undefined> & {
  readonly error: SafeSyncerError;
};

type Serializer<RAW, PARSED> = (input: RAW) => PARSED;

type Deserializer<RAW, PARSED, OLD_RAW extends RAW | undefined = RAW> = (
  value: PARSED,
  oldInput: OLD_RAW
) => RAW;

export const syncer = <RAW, PARSED>(
  serializer: Serializer<RAW, PARSED>,
  deserializer: Deserializer<RAW, PARSED>
): Syncer<RAW, PARSED> => ({ serializer, deserializer });

export const safeSyncer = <RAW, PARSED>(
  serializer: Serializer<RAW, PARSED>,
  deserializer: Deserializer<RAW, PARSED, RAW | undefined>
): SafeSyncer<RAW, PARSED> => ({
  serializer,
  deserializer,
  ...({} as { readonly error: SafeSyncerError }),
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
export function pipe<R1, R2, R3>(
  t1: SafeSyncer<R1, R2>,
  t2: SafeSyncer<R2, R3>
): SafeSyncer<R1, R3>;
export function pipe(
  ...syncers: RA<Syncer<unknown, unknown>>
): Syncer<unknown, unknown> {
  return {
    serializer(value): unknown {
      const values = [value];
      syncers.forEach(({ serializer }, index) =>
        values.push(serializer(values[index]))
      );
      oldInput = values.slice(0, -1);
      return values.at(-1)!;
    },
    deserializer: (value, oldValues) =>
      syncers.reduceRight(
        (value, { deserializer }, index) =>
          deserializer(value, (oldValues as RA<unknown>)[index]),
        value
      ),
  };
}

let oldInput: unknown = undefined;

export type BaseSpec = IR<Syncer<Element, any>>;

export function createSpec<SPEC extends BaseSpec>(spec: SPEC): SPEC {
  /**
   * Make sure spec can handle empty XML elements without exceptions.
   * This is needed to simulate adding new nodes to the XML (i.e, when adding a
   * new formatter, it runs all serializers with an empty formatter tag)
   */
  if (process.env.NODE_ENV === 'development') {
    const parser = xmlParser(spec);
    try {
      silenceConsole(() => parser(strictParseXml(`<test />`)));
    } catch (error) {
      console.error(error);
      throw new Error(
        `Spec is unable to handle empty XML elements. Error: ${
          (error as Error).message
        }`
      );
    }
  }
  return spec;
}

export type SpecToJson<SPEC extends BaseSpec> = {
  readonly [KEY in string & keyof SPEC]: SPEC[KEY] extends Syncer<
    any,
    infer PARSED
  >
    ? PARSED
    : never;
};

export const symbolOldInputs: unique symbol = Symbol('Previous inputs');

/**
 * Don't call this directly. Call syncers.object(spec) instead
 */
export const xmlParser =
  <SPEC extends BaseSpec>(spec: SPEC) =>
  (cell: Element): SpecToJson<SPEC> => {
    const intermediates: Partial<Record<keyof SPEC, unknown>> = {};
    const object = Object.fromEntries(
      Object.entries(spec).map(([key, syncer]) => {
        oldInput = undefined;
        const newValue = xmlPropertyParser(cell, syncer);
        intermediates[key] = oldInput ?? cell;
        oldInput = undefined;
        return [key, newValue];
      })
    );
    Object.defineProperty(cell, symbolOldInputs, {
      value: intermediates,
      configurable: true,
    });
    return object;
  };

const xmlPropertyParser = <RAW, PARSED>(
  cell: RAW,
  { serializer }: Syncer<RAW, PARSED>
): PARSED => serializer(cell);

/**
 * Don't call this directly. Call syncers.object(spec) instead
 */
export const xmlBuilder =
  <SPEC extends BaseSpec>(spec: SPEC) =>
  (
    shape: SpecToJson<SPEC>,
    cell: Element,
    intermediates: Record<keyof SPEC, unknown>
  ): Element => {
    Object.entries(shape).forEach(([key, value]) => {
      if (!(key in intermediates)) {
        console.error(`Unexpected key ${key}. It's not in the spec`, {
          cell,
          shape,
          spec,
        });
        return;
      }
      const { deserializer } = spec[key as keyof SPEC];
      deserializer(value, intermediates[key] as Element);
    });
    return cell;
  };
