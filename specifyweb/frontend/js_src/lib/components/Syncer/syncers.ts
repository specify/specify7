import type { LocalizedString } from 'typesafe-i18n';

import { f } from '../../utils/functools';
import { parseBoolean } from '../../utils/parser/parse';
import type { RA, RR } from '../../utils/types';
import { IR } from '../../utils/types';
import { formatDisjunction } from '../Atoms/Internationalization';
import { parseJavaClassName } from '../DataModel/resource';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { getTable, getTableById, tables } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import {
  getLogContext,
  pushContext,
  setLogContext,
} from '../Errors/logContext';
import type { BaseSpec, SpecToJson, Syncer } from './index';
import { runBuilder, runParser, syncer } from './index';
import { mergeSimpleXmlNodes } from './mergeSimpleXmlNodes';
import type { SimpleXmlNode } from './xmlToJson';
import { createSimpleXmlNode } from './xmlToJson';
import {
  getAttribute,
  getOriginalSyncerInput,
  setOriginalSyncerInput,
} from './xmlUtils';

type NodeWithContext<T> = {
  readonly node: T;
  readonly logContext: IR<unknown>;
};

const switchDefault: unique symbol = Symbol('SwitchDefault');

export const syncers = {
  xmlAttribute: <MODE extends 'empty' | 'required' | 'skip'>(
    attribute: string,
    mode: MODE,
    trim = true
  ) =>
    syncer<SimpleXmlNode, LocalizedString | undefined>(
      (cell) => {
        pushContext({
          type: 'Attribute',
          attribute,
        });
        const rawValue = getAttribute(cell, attribute);
        const trimmed = trim ? rawValue?.trim() : rawValue;
        if (mode === 'required' && trimmed === '')
          console.error(`Required attribute "${attribute}" is empty`);
        else if (mode === 'required' && trimmed === undefined)
          console.error(`Required attribute "${attribute}" is missing`);
        return trimmed;
      },
      (rawValue = '') => {
        const value = trim ? rawValue.trim() : rawValue;
        return {
          type: 'SimpleXmlNode',
          tagName: '',
          attributes: {
            [attribute.toLowerCase()]:
              mode === 'skip' && value === '' ? undefined : value,
          },
          text: undefined,
          children: {},
        };
      }
    ),
  xmlContent: syncer<SimpleXmlNode, string | undefined>(
    ({ text }) => {
      pushContext({ type: 'Content' });
      return text;
    },
    (text) => ({
      type: 'SimpleXmlNode',
      tagName: '',
      attributes: {},
      text: text?.trim(),
      children: {},
    })
  ),
  default: <T>(
    defaultValue: T extends (...args: RA<unknown>) => unknown
      ? never
      : T | (() => T)
  ) =>
    syncer<T | undefined, T>(
      (value) =>
        value ??
        (typeof defaultValue === 'function' ? defaultValue() : defaultValue),
      (value) => value
    ),
  javaClassName: (strict: boolean = true) =>
    syncer<string, SpecifyTable | undefined>(
      (className) => {
        const tableName = parseJavaClassName(className);
        const table = getTable(tableName ?? className);
        if (strict && table === undefined)
          console.error(`Unknown table: ${className ?? '(null)'}`);
        return table;
      },
      (table) => table?.longName ?? ''
    ),
  tableName: syncer<string, SpecifyTable | undefined>(
    (tableName) => {
      const table = getTable(tableName);
      if (table === undefined)
        console.error(`Unknown table: ${tableName ?? '(null)'}`);
      return table;
    },
    (model) => model?.name ?? ''
  ),
  tableId: syncer<number, SpecifyTable | undefined>(
    (tableId) => {
      try {
        return getTableById(tableId);
      } catch (error) {
        console.error(error);
        return undefined;
      }
    },
    (table) => table?.tableId ?? 0
  ),
  toBoolean: syncer<string, boolean>(
    parseBoolean,
    (value) => value?.toString() ?? false
  ),
  toDecimal: syncer<string, number | undefined>(
    f.parseInt,
    (value) => value?.toString() ?? ''
  ),
  xmlChild: (tagName: string, mode: 'optional' | 'required' = 'required') =>
    syncer<SimpleXmlNode, SimpleXmlNode | undefined>(
      ({ children }) => {
        const currentChildren =
          children[tagName] ?? children[tagName.toLowerCase()] ?? [];
        const child = currentChildren[0];
        if (child === undefined && mode === 'required')
          console.error(`Unable to find <${tagName} /> child`);

        pushContext({ type: 'Child', tagName });

        if (currentChildren.length > 1)
          console.warn(`Expected to find at most one <${tagName} /> child`);
        return child;
      },
      (child) => ({
        type: 'SimpleXmlNode',
        tagName: '',
        attributes: {},
        text: undefined,
        children: {
          [tagName]:
            child === undefined
              ? []
              : [
                  {
                    ...child,
                    tagName,
                  },
                ],
        },
      })
    ),
  xmlChildren: (tagName: string) =>
    syncer<SimpleXmlNode, RA<SimpleXmlNode>>(
      ({ children }) => {
        pushContext({
          type: 'Children',
          tagName,
        });
        return children[tagName] ?? children[tagName.toLowerCase()] ?? [];
      },
      (newChildren = []) => ({
        type: 'SimpleXmlNode',
        tagName: '',
        attributes: {},
        text: undefined,
        children: {
          [tagName]: newChildren.map((child) => ({ ...child, tagName })),
        },
      })
    ),
  object: <SPEC extends BaseSpec<SimpleXmlNode>>(spec: SPEC) =>
    syncer<SimpleXmlNode, SpecToJson<SPEC>>(
      (raw) => {
        const result = runParser(spec, raw);
        setOriginalSyncerInput(result, getOriginalSyncerInput(raw));
        return result;
      },
      (shape) => {
        const merged = mergeSimpleXmlNodes(runBuilder(spec, shape));
        setOriginalSyncerInput(merged, getOriginalSyncerInput(shape));
        return merged;
      }
    ),
  map: <SYNCER extends Syncer<any, any>>({
    serializer,
    deserializer,
  }: SYNCER) =>
    syncer<
      RA<Parameters<SYNCER['serializer']>[0]>,
      RA<ReturnType<SYNCER['serializer']>>
    >(
      (elements) =>
        elements.map((element, index) => {
          const context = getLogContext();
          pushContext({ type: 'Index', index });
          const result = serializer(element);
          setLogContext(context);
          return result;
        }),
      // This might be undefined if JSON editor was used, and a typo was made
      (elements) => elements?.map(deserializer) ?? []
    ),
  maybe: <SYNCER extends Syncer<any, any>>(syncerDefinition: SYNCER) =>
    syncer<
      Parameters<SYNCER['serializer']>[0] | undefined,
      ReturnType<SYNCER['serializer']> | undefined
    >(
      (element) => f.maybe(element, syncerDefinition.serializer),
      (element) => f.maybe(element, syncerDefinition.deserializer)
    ),
  captureLogContext: <T>() =>
    syncer<T, NodeWithContext<T>>(
      (node) => ({
        node,
        logContext: getLogContext(),
      }),
      ({ node }) => node
    ),
  dependent: <
    KEY extends string,
    OBJECT extends { readonly [key in KEY]: NodeWithContext<SimpleXmlNode> },
    SUB_SPEC extends BaseSpec<SimpleXmlNode>,
    NEW_OBJECT extends Omit<OBJECT, KEY> & {
      readonly [key in KEY]: SpecToJson<SUB_SPEC>;
    }
  >(
    key: KEY,
    spec: (dependent: OBJECT) => SUB_SPEC
  ) =>
    syncer<OBJECT, NEW_OBJECT>(
      (object) => {
        const item = object?.[key] as NodeWithContext<SimpleXmlNode>;
        if (typeof item === 'object') setLogContext(item.logContext);
        return {
          ...object,
          [key]: syncers.object(spec(object ?? {})).serializer(item?.node),
        } as unknown as NEW_OBJECT;
      },
      (object) =>
        ({
          ...object,
          [key]: {
            node: syncers
              /*
               * "object" is actually NEW_SPEC, but the difference shouldn't matter
               * (they only differ by object[key])
               */
              .object(spec(object as unknown as OBJECT))
              .deserializer(object?.[key]),
            context: getLogContext(),
          },
        } as unknown as OBJECT)
    ),
  field: (tableName: keyof Tables | undefined) =>
    syncer<string | undefined, RA<LiteralField | Relationship> | undefined>(
      (fieldName) => {
        if (
          fieldName === undefined ||
          fieldName === '' ||
          tableName === undefined
        )
          return undefined;
        const field = tables[tableName].getFields(fieldName);
        if (field === undefined) console.error(`Unknown field: ${fieldName}`);
        return field;
      },
      (fieldName) => fieldName?.map(({ name }) => name).join('.')
    ),
  change: <
    KEY extends string,
    RAW,
    PARSED,
    OBJECT extends { readonly [key in KEY]: RAW },
    NEW_OBJECT extends OBJECT & { readonly [key in KEY]: PARSED }
  >(
    key: KEY,
    serializer: (object: OBJECT) => PARSED,
    deserializer: (object: NEW_OBJECT) => RAW
  ) =>
    syncer<OBJECT, NEW_OBJECT>(
      (object) =>
        ({
          ...object,
          [key]: serializer(object),
        } as unknown as NEW_OBJECT),
      (object) =>
        ({
          ...object,
          [key]: deserializer(object ?? {}),
        } as unknown as OBJECT)
    ),
  enum: <ITEM extends string>(items: RA<ITEM>, caseSensitive = false) =>
    syncer<string, ITEM | undefined>(
      (value) => {
        const lowerValue = value.toLowerCase();
        const item = caseSensitive
          ? f.includes(items, value)
            ? value
            : undefined
          : items.find((item) => item.toLowerCase() === lowerValue);
        if (item === undefined)
          console.error(
            `Unknown value "${value}". Expected one of ${formatDisjunction(
              items
            )}`
          );
        return item;
      },
      (value) => value ?? ''
    ),
  split: (separator: string) =>
    syncer<string, RA<string>>(
      (value) => value.split(separator),
      (value) => value.join(separator)
    ),
  /**
   * I.e, if table name referred to unknown table, preserve the unknown name
   * while using the new one
   */
  preserveInvalid: <IN, OUT>({
    serializer,
    deserializer,
  }: Syncer<IN, OUT | undefined>) =>
    syncer<
      IN | undefined,
      {
        readonly parsed: OUT | undefined;
        readonly bad: IN | undefined;
      }
    >(
      (raw) => {
        const parsed = f.maybe(raw, serializer);
        return {
          bad: raw !== undefined && parsed === undefined ? raw : undefined,
          parsed,
        };
      },
      /*
       * If new value is undefined because failed parsing, but old value
       *  wasn't, then use the old value
       */
      ({ bad, parsed }) => (parsed === undefined ? bad : deserializer(parsed))
    ),
  static: <T>(value: T) =>
    syncer<SimpleXmlNode, T>(
      () => value,
      () => createSimpleXmlNode('')
    ),
  switchDefault,
  switch: <
    IN,
    KEY extends PropertyKey,
    SYNCER_IN,
    TYPE extends string,
    MAPPER extends {
      readonly [KEY in TYPE]: (
        input: IN
      ) => Syncer<SYNCER_IN, { readonly type: string }>;
    },
    DEFAULT extends Syncer<SYNCER_IN, IR<unknown>>
  >(
    condition: (value: IN) => TYPE,
    key: KEY,
    node: Syncer<IN, SYNCER_IN>,
    mapper: MAPPER,
    defaultCase: (input: IN) => DEFAULT
  ) =>
    syncer<
      IN,
      IN &
        RR<
          KEY,
          {
            readonly rawType: TYPE;
          } & (
            | ReturnType<ReturnType<MAPPER[TYPE]>['serializer']>
            | ({
                readonly type: typeof switchDefault;
              } & ReturnType<DEFAULT['serializer']>)
          )
        >
    >(
      (input) => {
        const type = condition(input);
        // FIXME: remove redundancy?
        if (type in mapper) {
          const { serializer } = mapper[type](input);
          return {
            ...input,
            rawType: type,
            [key]: serializer(node.serializer(input)),
          };
        } else {
          const { serializer } = defaultCase(input);
          return {
            ...input,
            [key]: {
              type: switchDefault,
              rawType: type,
              ...serializer(node.serializer(input)),
            },
          };
        }
      },
      (cell) => {
        const {
          [key]: { rawType, ...switched },
          ...object
        } = cell;
        const result =
          switched.type === switchDefault
            ? mapper[rawType](object as IN).deserializer(switched)
            : defaultCase(object as IN).deserializer(switched);
        return node.deserializer(result);
      }
    ),
  /*switch: <
    IN,
    TYPE extends string,
    MAPPER extends {
      readonly [KEY in TYPE]: (input: IN) => BaseSpec<SimpleXmlNode> & {
        readonly type: Syncer<SimpleXmlNode, string>;
      };
    },
    DEFAULT extends (input: IN) => BaseSpec<SimpleXmlNode>
  >(
    condition: (value: IN) => TYPE,
    node: (value: IN) => SimpleXmlNode,
    mapper: MAPPER,
    defaultCase: DEFAULT
  ) =>
    syncer<
      IN,
      | SpecToJson<ReturnType<MAPPER[TYPE]>>
      | ({
          readonly type: typeof switchDefault;
        } & SpecToJson<ReturnType<DEFAULT>>)
    >(
      (input) => {
        const type = condition(input);
        if (type in mapper) {
          const spec = mapper[type];
          return syncers.object(spec(input)).serializer(node(input));
        } else {
          const serialized = syncers
            .object(defaultCase(input))
            .serializer(node(input));
          return {
            type: switchDefault,
            ...serialized,
          };
        }
      },
      ({ type, ...rest }) => {
        const spec = type === switchDefault ? defaultCase : mapper[type];
        // FIXME: figure out what should this be called with here
        return syncers.object(spec(rest)).deserializer(rest);
      }
    ),*/
  /*switch: <
    IN,
    TYPE extends string,
    MAPPER extends {
      readonly [KEY in TYPE]: (input: IN) => BaseSpec<SimpleXmlNode>;
    },
    DEFAULT extends (input: IN) => BaseSpec<SimpleXmlNode>
  >(
    condition: (value: IN) => TYPE,
    node: (value: IN) => SimpleXmlNode,
    mapper: MAPPER,
    defaultCase: DEFAULT
  ) =>
    syncer<
      IN,
      | ({ readonly type: TYPE } & SpecToJson<ReturnType<MAPPER[TYPE]>>)
      | ({
          readonly type: typeof switchDefault;
        } & SpecToJson<ReturnType<DEFAULT>>)
      // {
      //     readonly [KEY in TYPE]: {
      //       readonly type: KEY;
      //     } & SpecToJson<MAPPER[KEY]>;
      //   }[TYPE]
    >(
      (input) => {
        const type = condition(input);
        const spec = mapper[type] ?? defaultCase;
        const serialized = syncers.object(spec(input)).serializer(node(input));
        return {
          type: type in mapper ? type : switchDefault,
          ...serialized,
        };
      },
      ({ type, ...rest }) => {
        const spec = type === switchDefault ? defaultCase : mapper[type];
        // FIXME: figure out what should this be called with here
        return syncers.object(spec(rest)).deserializer(rest);
      }
    ),*/
} as const;
