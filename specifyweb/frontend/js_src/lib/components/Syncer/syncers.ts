import type { LocalizedString } from 'typesafe-i18n';

import { f } from '../../utils/functools';
import { parseBoolean } from '../../utils/parser/parse';
import type { IR, RA } from '../../utils/types';
import { localized } from '../../utils/types';
import { formatDisjunction } from '../Atoms/Internationalization';
import { parseJavaClassName } from '../DataModel/resource';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { genericTables, getTable, getTableById } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import { error } from '../Errors/assert';
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

export const syncers = {
  /**
   * Getting an XML attribute, but with a lot of bells and whistles
   */
  xmlAttribute: (
    attribute: string,
    /**
     * Modes:
     *   empty - if there is no value, the attribute should still be present, but
     *           assigned to ""
     *   required - if there is no value, trigger an error
     *   skip - optional attribute, if there is no value, skip it
     */
    mode: 'empty' | 'required' | 'skip',
    /** If true, trims the value. Also, converts "" to undefined */
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
        if (mode === 'required')
          if (trimmed === '')
            console.error(`Required attribute "${attribute}" is empty`);
          else if (trimmed === undefined)
            console.error(`Required attribute "${attribute}" is missing`);
        return localized(trim && trimmed === '' ? undefined : trimmed);
      },
      (rawValue = localized('')) => {
        const value = trim ? rawValue.trim() : rawValue;
        return {
          type: 'SimpleXmlNode',
          tagName: '',
          attributes: {
            [attribute.toLowerCase()]:
              value === '' && mode !== 'empty' ? undefined : value,
          },
          text: undefined,
          children: {},
        };
      }
    ),

  /**
   * Get content of an XML node and trim it
   */
  xmlContent: syncer<SimpleXmlNode, string | undefined>(
    ({ text }) => {
      pushContext({ type: 'Content' });
      return text?.trim();
    },
    (text) => ({
      type: 'SimpleXmlNode',
      tagName: '',
      attributes: {},
      text: text?.trim(),
      children: {},
    })
  ),

  /**
   * Use a default value if not present.
   * If current value is already equal to default, unset it
   * If you don't want the value to be unset, use syncers.fallback instead
   *
   * As a rule of thumb, if attribute is required and default value is not
   * empty string, use syncers.fallback. If it is optional, or default value is
   * not useful (i.e, empty string for a "name" attribute), use syncers.default
   */
  default: <T>(
    defaultValue: T extends (...args: RA<unknown>) => unknown
      ? never
      : T | (() => T)
  ) =>
    syncer<T | undefined, T>(
      (value) =>
        value ??
        (typeof defaultValue === 'function' ? defaultValue() : defaultValue),
      (value) =>
        value === undefined ||
        value ===
          (typeof defaultValue === 'function' ? defaultValue() : defaultValue)
          ? undefined
          : value
    ),

  /**
   * Like syncers.default, but don't unset the value if it matches the default
   */
  fallback: <T>(
    defaultValue: T extends (...args: RA<unknown>) => unknown
      ? never
      : T | (() => T)
  ) =>
    syncer<T | undefined, T>(
      (value) =>
        value ??
        (typeof defaultValue === 'function' ? defaultValue() : defaultValue),
      (value) =>
        value ??
        (typeof defaultValue === 'function' ? defaultValue() : defaultValue)
    ),

  /**
   * Parse a string like "edu.ku.brc.specify.datamodel.Accession" into
   * an Accession table object
   */
  javaClassName: (strict: boolean = true) =>
    syncer<string | undefined, SpecifyTable | undefined>(
      (className) => {
        const tableName = f.maybe(className, parseJavaClassName);
        const table = getTable(tableName ?? className ?? '');
        if (table === undefined && tableName !== 'ObjectAttachmentIFace')
          console[strict ? 'error' : 'warn'](
            `Unknown table${
              (className ?? '').length === 0
                ? ''
                : `: ${tableName ?? className ?? ''}`
            }`
          );
        return table;
      },
      (table) => table?.longName
    ),

  /**
   * Parse a string like "Accession" into an Accession table object
   */
  tableName: syncer<string | undefined, SpecifyTable | undefined>(
    (tableName) => {
      const table = f.maybe(tableName, getTable);
      if (table === undefined)
        console.error(
          `Unknown table${
            (tableName ?? '').length === 0 ? '' : `: ${tableName ?? ''}`
          }`
        );
      return table;
    },
    (model) => model?.name
  ),

  /**
   * Parse a number like 1 into a Collection Object table object
   */
  tableId: syncer<number | undefined, SpecifyTable | undefined>(
    (tableId) => {
      try {
        return f.maybe(tableId, getTableById);
      } catch (error) {
        console.error((error as Error).message);
        return undefined;
      }
    },
    (table) => table?.tableId
  ),

  /** Flip a boolean value */
  flip: syncer<boolean, boolean>(
    (value) => !value,
    (value) => !value
  ),

  /** Convert any string to boolean */
  toBoolean: syncer<string, boolean>(parseBoolean, (value) => value.toString()),

  /** Convert string value to number */
  toDecimal: syncer<string | undefined, number | undefined>(
    (raw) => {
      const parsed = f.parseInt(raw);
      if (parsed === undefined) console.error('Invalid decimal number');
      return parsed;
    },
    (value) => value?.toString()
  ),

  /** Convert string value to number */
  toFloat: syncer<string | undefined, number | undefined>(
    (raw) => {
      const parsed = f.parseFloat(raw);
      if (parsed === undefined) console.error('Invalid floating point number');
      return parsed;
    },
    (value) => value?.toString()
  ),

  /**
   * Get an XML child node (case insensitively)
   *
   * By default, emits an error if child is not found
   *
   * @remarks
   * When using this, syncers.xmlChild is commonly accompanied by
   * syncers.fallback(createXmlNode) to create an XML node if one does not
   * exist already
   */
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

  /**
   * Get all children of a given tag name (case-insensitively)
   */
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

  /**
   * Run a nested spec (another syncer)
   */
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

  /**
   * Map array of values of a syncer
   */
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

  /**
   * Call a syncer only if value is not undefined
   */
  maybe: <SYNCER extends Syncer<any, any>>({
    serializer,
    deserializer,
  }: SYNCER) =>
    syncer<
      Parameters<SYNCER['serializer']>[0] | undefined,
      ReturnType<SYNCER['serializer']> | undefined
    >(
      (element) => f.maybe(element, serializer),
      (element) => f.maybe(element, deserializer)
    ),

  /**
   * As a reminder log context is powering the system that figures out where to
   * put the error message in the xml editor
   *
   * Return back the passed in value, but also with current log context captured.
   *
   * Later, can call setLogContext with logContext to restore the log context.
   *
   * This is useful when i.e, you begun validating an object in one spec, but
   * want to finish validating it in another spec, while still preserving the
   * log context.
   */
  captureLogContext: <T>() =>
    syncer<T, NodeWithContext<T>>(
      (node) => ({
        node,
        logContext: getLogContext(),
      }),
      ({ node }) => node
    ),

  /**
   * In the current object, replace one key with a result of syncers.object,
   *
   * Where syncers.object is called with a spec which was returned from a
   * function that accepts the whole current object as a parameter
   *
   * Useful when you begun validating in one place and want to finish validating
   * in another place (i.e, got the field name attribute in one place, but need
   * the table name before can finish parsing the field name)
   */
  dependent: <
    KEY extends string,
    OBJECT extends { readonly [key in KEY]: NodeWithContext<SimpleXmlNode> },
    SUB_SPEC extends BaseSpec<SimpleXmlNode>,
    NEW_OBJECT extends Omit<OBJECT, KEY> & {
      readonly [key in KEY]: SpecToJson<SUB_SPEC>;
    },
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
            logContext: getLogContext(),
          },
        }) as unknown as OBJECT
    ),

  /**
   * Parse a field from a given table.
   *
   * Handles multiple fields concatenated with a dot (i.e, "accession.text1")
   */
  field: (
    tableName: keyof Tables | undefined,
    mode: 'silent' | 'strict' | 'warn' = 'strict'
  ) =>
    syncer<string | undefined, RA<LiteralField | Relationship> | undefined>(
      (fieldName) => {
        if (fieldName === undefined || tableName === undefined)
          return undefined;
        const field = genericTables[tableName].getFields(fieldName);
        if (field === undefined && mode !== 'silent')
          console[mode === 'strict' ? 'error' : 'warn'](
            `Unknown field: ${fieldName}`
          );
        return field;
      },
      (fieldName) => fieldName?.map(({ name }) => name).join('.')
    ),

  /**
   * Modify one key on an object
   */
  change: <
    KEY extends string,
    RAW,
    PARSED,
    OBJECT extends { readonly [key in KEY]: RAW },
    NEW_OBJECT extends Omit<OBJECT, KEY> & { readonly [key in KEY]: PARSED },
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
        }) as unknown as NEW_OBJECT,
      (object) =>
        ({
          ...object,
          [key]: deserializer(object ?? {}),
        }) as unknown as OBJECT
    ),

  /**
   * Ensure that value is one of the accepted variants
   */
  enum: <ITEM extends string>(items: RA<ITEM>, caseSensitive = false) =>
    syncer<string | undefined, ITEM | undefined>(
      (value) => {
        const lowerValue = value?.toLowerCase();
        const item = caseSensitive
          ? f.includes(items, value)
            ? value
            : undefined
          : items.find((item) => item.toLowerCase() === lowerValue);
        if (item === undefined)
          console.error(
            `Unknown value "${
              value ?? ''
            }". Expected one of ${formatDisjunction(
              (items as RA<string>).map(localized)
            )}`
          );
        return item;
      },
      (value) => value
    ),

  /**
   * Like syncers.enum, but for numbers
   */
  numericEnum: <ITEM extends number>(items: RA<ITEM>) =>
    syncer<number | undefined, ITEM | undefined>(
      (value) => {
        if (value === undefined) return undefined;
        const hasItem = f.includes(items, value);
        if (!hasItem)
          console.error(
            `Unknown value "${value}". Expected one of ${formatDisjunction(
              items.map((item) => localized(item.toString()))
            )}`
          );
        return hasItem ? value : undefined;
      },
      (value) => value
    ),

  /**
   * Simply split/join string with a given separator
   */
  split: (separator: string) =>
    syncer<string, RA<string>>(
      (value) => (value === '' ? [] : value.split(separator)),
      (value) => value.join(separator)
    ),

  /**
   * Like, syncers.split, but:
   * - Handled escaping separator using backslash (i.e, "a\\,b" -> ["a,b"])
   * - Trims whitespace around separator (i.e, "a, b" -> ["a", "b"])
   * - Inserts whitespace back when deserializing (i.e, ["a", "b"] -> "a, b")
   */
  fancySplit: (separator: string) =>
    separator.length === 1
      ? syncer<string, RA<string>>(
          (values) => {
            const parts = [];
            let isEscaped = false;
            let currentPart = '';
            Array.from(values.split(''), (character, index) => {
              if (character === separator && !isEscaped) {
                parts.push(currentPart.trim());
                currentPart = '';
              } else {
                if (character !== '\\' || values[index + 1] !== separator)
                  currentPart += character;
                isEscaped = character === '\\' && !isEscaped;
              }
            });
            const trimmed = currentPart.trim();
            if (trimmed.length > 0) parts.push(trimmed);
            return parts;
          },
          (values) =>
            values
              .map((value) => value.replaceAll(separator, `\\${separator}`))
              .join(`${separator} `)
        )
      : error('Only single character separators are supported'),

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

  /**
   * Static value
   */
  static: <T>(value: T) =>
    syncer<SimpleXmlNode, T>(
      () => value,
      () => createSimpleXmlNode()
    ),

  /**
   * A very comprehensive syncer for dynamically calling correct spec based on
   * a value of a given attribute
   */
  switch: <
    TYPE_MAPPER extends IR<string>,
    NODE_KEY extends string,
    IN extends { readonly [KEY in NODE_KEY]: NodeWithContext<SimpleXmlNode> },
    KEY extends string,
    EXTRA,
    MAPPER extends {
      readonly [KEY in TYPE_MAPPER[keyof TYPE_MAPPER] | 'Unknown']: (
        input: IN,
        extra: EXTRA,
        rawType: keyof TYPE_MAPPER
      ) => BaseSpec<SimpleXmlNode>;
    },
    MAPPED extends {
      readonly [KEY in keyof TYPE_MAPPER]: SpecToJson<
        ReturnType<MAPPER[TYPE_MAPPER[KEY]]>
      > & {
        readonly type: TYPE_MAPPER[KEY];
        readonly rawType: string & keyof TYPE_MAPPER;
      };
    }[keyof TYPE_MAPPER],
  >(
    /**
     * They key in the original object at which the
     * NodeWithContext<SimpleXmlNode> is located
     */
    nodeKey: NODE_KEY,
    /**
     * They key at which the output from the syncer would be located
     */
    key: KEY,
    /**
     * A syncer for getting/setting the attribute value that determines which
     * spec to use
     */
    attributeSyncer: Syncer<SimpleXmlNode, string | undefined>,
    /**
     * A map between original attribute types and internal attribute types
     *
     * Useful for synonymization multiple types to a single one
     * Useful for renaming poorly named types to better ones while still
     * maintaining backwards compatibility
     */
    typeMapper: TYPE_MAPPER,
    /**
     * The mapper between a mapped type and a spec
     */
    mapper: MAPPER,
    /**
     * Optional extra payload to pass to the function that returns the spec
     */
    extraPayload: EXTRA
  ) =>
    syncer<IN, IN & { readonly [_KEY in KEY]: MAPPED }>(
      (cell) => {
        const { node, logContext } = cell[nodeKey];

        setLogContext(logContext);
        const rawType = attributeSyncer.serializer(node) ?? 'Unknown';
        syncers.enum(Object.keys(typeMapper)).serializer(rawType);
        setLogContext(logContext);

        const type =
          ((typeMapper[rawType] ??
            typeMapper[
              rawType.toLowerCase()
            ]) as TYPE_MAPPER[keyof TYPE_MAPPER]) ?? ('Unknown' as const);
        const spec = mapper[type] ?? mapper.Unknown;
        const { serializer } = syncers.object(
          spec(cell, extraPayload, rawType)
        );

        return {
          ...cell,
          [key]: {
            type,
            rawType,
            ...serializer(node),
          },
        } as IN & { readonly [_KEY in KEY]: MAPPED };
      },
      ({ [key]: definition, ...cell }) => {
        const rawType = definition.rawType;
        const typeFromRawType =
          ((typeMapper[rawType] ??
            typeMapper[
              rawType.toString().toLowerCase()
            ]) as TYPE_MAPPER[keyof TYPE_MAPPER]) ?? ('Unknown' as const);
        /**
         * Let's say a->A, aa->A, b->B
         * If original type was `aa` and new mapped type is `A`, then keep `a`
         * as original type (rather than `a`)
         * However, if new mapped type is `B`, then use the first rawType that
         * matches `B` (which is `b`)
         */
        const resolvedRawType =
          typeFromRawType === definition.type
            ? rawType
            : (Object.entries(typeMapper).find(
                ([_raw, mapped]) => mapped === definition.type
              )?.[0] ?? rawType);
        const spec = mapper[definition.type] ?? mapper.Unknown;
        const { deserializer } = syncers.object(
          spec(cell as unknown as IN, extraPayload, rawType)
        );
        const node = deserializer(definition);
        const rawNode: NodeWithContext<SimpleXmlNode> = {
          node: mergeSimpleXmlNodes([
            node,
            attributeSyncer.deserializer(resolvedRawType),
          ]),
          logContext: {},
        };
        return {
          ...cell,
          [nodeKey]: rawNode,
        } as unknown as IN;
      }
    ),
} as const;
