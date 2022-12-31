import type { IR, RA } from '../../utils/types';
import { getParsedAttribute } from '../../utils/utils';
import { parseJavaClassName } from '../DataModel/resource';
import { getModel, strictGetModel } from '../DataModel/schema';
import type { Tables } from '../DataModel/types';

type Transformer<RAW, PARSED, NOTES = any> = {
  readonly serializer: Serializer<RAW, PARSED, NOTES>;
  readonly deserializer: Deserializer<PARSED, NOTES>;
};

// FIXME: consider getting rid of notes and giving oldValue instead
type Serializer<RAW, PARSED, NOTES> = (
  input: RAW
) => NOTES extends undefined
  ? readonly [value: PARSED, notes?: NOTES]
  : readonly [value: PARSED, notes: NOTES];

type Deserializer<PARSED, NOTES> = (notes: NOTES, value: PARSED) => void;

const transformer = <RAW, PARSED, NOTES>(
  serializer: Serializer<RAW, PARSED, NOTES>,
  deserializer: Deserializer<PARSED, NOTES>
): Transformer<RAW, PARSED, NOTES> => ({ serializer, deserializer });

const transformers = {
  xmlAttribute: (attribute: string, required: boolean) =>
    transformer<Element, string | undefined, Element>(
      (cell) => {
        const value = getParsedAttribute(cell, attribute);
        if (required && value === undefined)
          console.error(`Required attribute "${attribute} is missing`);
        return [value, cell];
      },
      // FIXME: remove default attributes?
      (cell, value) =>
        typeof value === 'string' && required
          ? cell.setAttribute(attribute, value)
          : cell.removeAttribute(attribute)
    ),
  default: <T>(defaultValue: T) =>
    transformer<T | undefined, T, undefined>(
      (value) => [value ?? defaultValue],
      (value) => value
    ),
  javaClassName: transformer<string, keyof Tables | undefined, undefined>(
    (className: string) => {
      const tableName = parseJavaClassName(className);
      const parsedName = getModel(tableName ?? '')?.name;
      if (parsedName === undefined)
        // FIXME: add context to error messages
        console.error(`Unknown model: ${className ?? '(null)'}`);
      return [parsedName];
    },
    (_oldValue, value) =>
      value === undefined ? undefined : strictGetModel(value).longName
  ),
  toBoolean: transformer<string, boolean, undefined>(
    (value) => [value.toLowerCase() === 'true'],
    (_oldValue, value) => value.toString()
  ),
  xmlChild: (tagName: string) =>
    transformer<Element, Element | undefined, Element>(
      (cell: Element) => {
        const lowerTagName = tagName.toLowerCase();
        const children = Array.from(cell.children).filter(
          (name) => name.tagName.toLowerCase() === lowerTagName
        );
        if (children.length > 1) console.error('Expected at most one child');
        if (cell.children[0] === undefined)
          console.error(`Unable to find a <${tagName} /> child`);
        return [cell.children[0], cell];
      },
      (cell, value) =>
        value === undefined
          ? cell.children[1]?.remove()
          : cell.children.length === 0
          ? cell.append(value)
          : cell.replaceChild(cell.children[0], value)
    ),
} as const;

/**
 * Merge multiple transformers. If need to merge more than 6 at once, then
 * just nest multiple pipe() functions
 */
function pipe<R1, R2, R3, R4, R5, R6, R7>(
  t1: Transformer<R1, R2>,
  t2: Transformer<R2, R3>,
  t3: Transformer<R3, R4>,
  t4: Transformer<R4, R5>,
  t5: Transformer<R5, R6>,
  t6: Transformer<R6, R7>
): Transformer<R1, R7>;
function pipe<R1, R2, R3, R4, R5, R6>(
  t1: Transformer<R1, R2>,
  t2: Transformer<R2, R3>,
  t3: Transformer<R3, R4>,
  t4: Transformer<R4, R5>,
  t5: Transformer<R5, R6>
): Transformer<R1, R6>;
function pipe<R1, R2, R3, R4, R5>(
  t1: Transformer<R1, R2>,
  t2: Transformer<R2, R3>,
  t3: Transformer<R3, R4>,
  t4: Transformer<R4, R5>
): Transformer<R1, R5>;
function pipe<R1, R2, R3, R4>(
  t1: Transformer<R1, R2>,
  t2: Transformer<R2, R3>,
  t3: Transformer<R3, R4>
): Transformer<R1, R4>;
function pipe<R1, R2, R3>(
  t1: Transformer<R1, R2>,
  t2: Transformer<R2, R3>
): Transformer<R1, R3>;
function pipe(
  ...transformers: RA<Transformer<unknown, unknown>>
): Transformer<unknown, unknown, RA<unknown>> {
  return {
    serializer: (value: unknown) =>
      transformers.reduce<readonly [unknown, RA<unknown>]>(
        ([value, notes], { serializer }) => {
          const [newValue, newNotes] = serializer(value);
          return [newValue, [newNotes, ...notes]] as const;
        },
        [value, []]
      ),
    deserializer: (notes, value: unknown) =>
      transformers.reduce(
        (value, { deserializer }, index) => deserializer(notes[index], value),
        value
      ),
  };
}

type ObjectToJson<CONFORMATION extends IR<Transformer<Element, any>>> = {
  readonly [KEY in string &
    keyof CONFORMATION]: CONFORMATION[KEY] extends Transformer<
    unknown,
    infer PARSED,
    infer NOTES
  >
    ? { readonly value: PARSED; readonly notes: NOTES }
    : never;
};

const createObject = <CONFORMATION extends IR<Transformer<Element, any>>>(
  properties: CONFORMATION
): CONFORMATION => properties;

const dataObjectFormatterSpec = createObject({
  name: pipe(transformers.xmlAttribute('name', true), transformers.default('')),
  title: pipe(
    transformers.xmlAttribute('title', false),
    transformers.default('')
  ),
  tableName: pipe(
    transformers.xmlAttribute('class', true),
    transformers.default('edu.ku.brc.specify.datamodel.CollectionObject'),
    transformers.javaClassName
  ),
  isDefault: pipe(
    transformers.xmlAttribute('default', false),
    transformers.default('false'),
    transformers.toBoolean
  ),
  definition: transformers.xmlChild('switch'),
});

const xmlParser =
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
): PARSED => serializer(cell)[0];

export const dataObjectFormatterParser = xmlParser(dataObjectFormatterSpec);

const xmlBuilder =
  <CONFORMATION extends IR<Transformer<Element, any>>>(spec: CONFORMATION) =>
  (out: ObjectToJson<CONFORMATION>): void =>
    Object.entries(out).forEach(([key, { value, notes }]) => {
      const { deserializer } = spec[key as keyof CONFORMATION];
      deserializer(notes, value);
    });

export const dataObjectFormatterBuilder = xmlBuilder(dataObjectFormatterSpec);
