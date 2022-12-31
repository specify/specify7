import type { State } from 'typesafe-reducer';

import { f } from '../../utils/functools';
import type { IR } from '../../utils/types';
import { getBooleanAttribute, getParsedAttribute } from '../../utils/utils';
import { parseJavaClassName } from '../DataModel/resource';
import { getModel, strictGetModel } from '../DataModel/schema';
import type { Tables } from '../DataModel/types';

type Serializer<PARSED> = (cell: Element, required: boolean) => PARSED;

type Deserializer<PARSED> = (
  cell: Element,
  value: PARSED,
  required: boolean
) => void;

type Transformer<PARSED> = {
  readonly serializer: Serializer<PARSED>;
  readonly deserializer: Deserializer<PARSED>;
};

const transformer = <PARSED>(
  serializer: Serializer<PARSED>,
  deserializer: Deserializer<PARSED>
): Transformer<PARSED> => ({ serializer, deserializer });

const stringTransformer = <DEFAULT extends string | undefined>(
  attribute: string,
  defaultValue: DEFAULT
) =>
  transformer<DEFAULT | string>(
    (cell, _required) => getParsedAttribute(cell, attribute) ?? defaultValue,
    (cell: Element, value, required) =>
      typeof value === 'string' && (required || value !== defaultValue)
        ? cell.setAttribute(attribute, value)
        : cell.removeAttribute(attribute)
  );

const transformers = {
  string: stringTransformer,
  // FIXME: convert to chained parser
  class: <DEFAULT extends keyof Tables | undefined>(
    attribute: string,
    defaultValue: DEFAULT
  ) =>
    transformer<DEFAULT | keyof Tables>(
      (cell: Element, required) => {
        const className = stringTransformer(attribute, defaultValue).serializer(
          cell,
          required
        );
        const tableName = f.maybe(className, parseJavaClassName);
        const parsedName = getModel(tableName ?? '')?.name;
        if (parsedName === undefined) {
          // FIXME: add context to error messages
          console.error(`Unknown model: ${className ?? '(null)'}`);
          return defaultValue;
        }
        return parsedName;
      },
      (cell, value, required) =>
        stringTransformer(
          attribute,
          defaultValue === undefined
            ? undefined
            : strictGetModel(defaultValue).longName
        ).deserializer(
          cell,
          value === undefined ? undefined : strictGetModel(value).longName,
          required
        )
    ),
  // FIXME: convert to chained parser
  boolean: <DEFAULT extends boolean>(
    attribute: string,
    defaultValue: DEFAULT
  ) =>
    transformer<DEFAULT | boolean>(
      (cell, _required) => getBooleanAttribute(cell, attribute) ?? defaultValue,
      (cell, value, required) =>
        stringTransformer(attribute, defaultValue.toString()).deserializer(
          cell,
          value.toString(),
          required
        )
    ),
  child: <DEFAULT extends Element | undefined>(
    tagName: string,
    defaultValue: DEFAULT
  ) =>
    transformer<DEFAULT | Element>(
      (cell: Element) => {
        const lowerTagName = tagName.toLowerCase();
        const children = Array.from(cell.children).filter(
          (name) => name.tagName.toLowerCase() === lowerTagName
        );
        if (children.length === 0) return defaultValue;
        else if (children.length > 1)
          console.error('Expected at most one child');
        return cell.children[0];
      },
      (cell, value) =>
        value === undefined
          ? cell.children[1]?.remove()
          : cell.children.length === 0
          ? cell.append(value)
          : cell.replaceChild(cell.children[0], value)
    ),
} as const;

type Property<PARSED> = {
  readonly required: boolean;
  readonly transform: Transformer<PARSED>;
};

type ParsedObject<CONFORMATION extends IR<Property<any>>> = State<
  'Object',
  {
    readonly properties: CONFORMATION;
  }
>;

type ObjectToJson<CONFORMATION extends IR<Property<any>>> = {
  readonly [KEY in string &
    keyof CONFORMATION]: CONFORMATION[KEY] extends Property<infer PARSED>
    ? PARSED
    : undefined;
};

const createObject = <CONFORMATION extends IR<Property<any>>>(
  properties: CONFORMATION
): ParsedObject<CONFORMATION> => ({ type: 'Object', properties });

const dataObjectFormatterSpec = createObject({
  name: {
    required: true,
    // FIXME: emit warning if required and value missing
    transform: transformers.string('name', ''),
  },
  title: {
    required: false,
    defaultValue: '',
    transform: transformers.string('title', ''),
  },
  tableName: {
    required: false,
    transform: transformers.class('class', 'CollectionObject'),
  },
  isDefault: {
    required: true,
    transform: transformers.boolean('default', false),
  },
  definition: {
    required: true,
    transform: transformers.child('switch', undefined),
  },
});

const xmlParser =
  <CONFORMATION extends IR<Property<any>>>(spec: ParsedObject<CONFORMATION>) =>
  (cell: Element): ObjectToJson<CONFORMATION> =>
    Object.fromEntries(
      Object.entries(spec.properties).map(([key, value]) => [
        key,
        xmlPropertyParser(cell, value),
      ])
    );

const xmlPropertyParser = <PARSED>(
  cell: Element,
  { required, transform }: Property<PARSED>
): PARSED => transform.serializer(cell, required);

export const dataObjectFormatterParser = xmlParser(dataObjectFormatterSpec);
