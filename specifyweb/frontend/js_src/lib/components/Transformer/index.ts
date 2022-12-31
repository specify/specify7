import type { IR, RA } from '../../utils/types';
import { getParsedAttribute } from '../../utils/utils';
import { parseJavaClassName } from '../DataModel/resource';
import { getModel, strictGetModel } from '../DataModel/schema';
import type { Tables } from '../DataModel/types';

type Transformer<RAW, PARSED> = {
  readonly serializer: Serializer<RAW, PARSED>;
  readonly deserializer: Deserializer<PARSED>;
};

// FIXME: consider getting rid of notes and giving oldValue instead
type Serializer<RAW, PARSED> = (input: RAW) => PARSED;

type Deserializer<PARSED> = (value: PARSED, element: Element) => void;

const transformer = <RAW, PARSED>(
  serializer: Serializer<RAW, PARSED>,
  deserializer: Deserializer<PARSED>
): Transformer<RAW, PARSED> => ({ serializer, deserializer });

const transformers = {
  xmlAttribute: (attribute: string, required: boolean) =>
    transformer<Element, string | undefined>(
      (cell) => {
        const value = getParsedAttribute(cell, attribute);
        if (required && value === undefined)
          console.error(`Required attribute "${attribute} is missing`);
        return value;
      },
      // FIXME: remove default attributes?
      (value, cell) =>
        typeof value === 'string'
          ? cell.setAttribute(attribute, value)
          : cell.removeAttribute(attribute)
    ),
  default: <T>(defaultValue: T) =>
    transformer<T | undefined, T>(
      (value) => value ?? defaultValue,
      (value) => value
    ),
  javaClassName: transformer<string, keyof Tables | undefined>(
    (className: string) => {
      const tableName = parseJavaClassName(className);
      const parsedName = getModel(tableName ?? '')?.name;
      if (parsedName === undefined)
        // FIXME: add context to error messages
        console.error(`Unknown model: ${className ?? '(null)'}`);
      return parsedName;
    },
    (value) =>
      value === undefined ? undefined : strictGetModel(value).longName
  ),
  toBoolean: transformer<string, boolean>(
    (value) => value.toLowerCase() === 'true',
    (value) => value.toString()
  ),
  xmlChild: (tagName: string) =>
    transformer<Element, Element | undefined>(
      (cell: Element) => {
        const lowerTagName = tagName.toLowerCase();
        const children = Array.from(cell.children).filter(
          (name) => name.tagName.toLowerCase() === lowerTagName
        );
        if (children.length > 1) console.error('Expected at most one child');
        if (cell.children[0] === undefined)
          console.error(`Unable to find a <${tagName} /> child`);
        return cell.children[0];
      },
      (value, cell) =>
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
): PARSED => serializer(cell);

export const dataObjectFormatterParser = xmlParser(dataObjectFormatterSpec);

const xmlBuilder =
  <CONFORMATION extends IR<Transformer<Element, any>>>(spec: CONFORMATION) =>
  (element: Element, shape: ObjectToJson<CONFORMATION>): void =>
    Object.entries(shape).forEach(([key, value]) => {
      const { deserializer } = spec[key as keyof CONFORMATION];
      deserializer(value, element);
    });

export const dataObjectFormatterBuilder = xmlBuilder(dataObjectFormatterSpec);
