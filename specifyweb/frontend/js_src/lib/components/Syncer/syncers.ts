import type { LocalizedString } from 'typesafe-i18n';

import { f } from '../../utils/functools';
import { parseBoolean } from '../../utils/parser/parse';
import type { RA } from '../../utils/types';
import { parseJavaClassName } from '../DataModel/resource';
import { getModel, schema } from '../DataModel/schema';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { Tables } from '../DataModel/types';
import type { BaseSpec, SpecToJson, Syncer } from './index';
import { createBuilder, createParser, syncer } from './index';
import { mergeSimpleXmlNodes } from './mergeSimpleXmlNodes';
import { pushContext } from './pathContext';
import type { SimpleXmlNode } from './xmlToJson';
import { getAttribute } from './xmlUtils';

export const syncers = {
  xmlAttribute: <MODE extends 'empty' | 'required' | 'skip'>(
    attribute: string,
    mode: MODE,
    trim = true
  ) =>
    syncer<SimpleXmlNode, LocalizedString | undefined>(
      (cell) => {
        pushContext({ type: 'Attribute', attribute, extras: { cell } });
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
          content: { type: 'Children', children: {} },
        };
      }
    ),
  xmlContent: syncer<SimpleXmlNode, string | undefined>(
    (cell) => (cell.content.type === 'Text' ? cell.content.string : undefined),
    (value) => ({
      type: 'SimpleXmlNode',
      tagName: '',
      attributes: {},
      content: { type: 'Text', string: value?.trim() ?? '' },
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
  javaClassName: syncer<string, SpecifyModel | undefined>(
    (className: string) => {
      const tableName = parseJavaClassName(className);
      const model = getModel(tableName ?? className);
      if (model === undefined)
        console.error(`Unknown model: ${className ?? '(null)'}`);
      return model;
    },
    (model) => model?.longName ?? ''
  ),
  toBoolean: syncer<string, boolean>(parseBoolean, (value) => value.toString()),
  toDecimal: syncer<string, number | undefined>(
    f.parseInt,
    (value) => value?.toString() ?? ''
  ),
  xmlChild: (tagName: string, mode: 'optional' | 'required' = 'required') =>
    syncer<SimpleXmlNode, SimpleXmlNode | undefined>(
      ({ content }) => {
        pushContext({ type: 'Child', tagName, extras: { content } });

        if (content.type !== 'Children') {
          if (mode === 'required')
            console.error(`Unable to find a <${tagName} /> child`);
          return undefined;
        }
        const children =
          content.children[tagName] ??
          content.children[tagName.toLowerCase()] ??
          [];
        const child = children[0];
        if (child === undefined && mode === 'required')
          console.error(`Unable to find a <${tagName} /> child`);
        if (children.length > 1)
          console.warn(`Expected to find at most one <${tagName} /> child`);
        return child;
      },
      (child) => ({
        type: 'SimpleXmlNode',
        tagName: '',
        attributes: {},
        content: {
          type: 'Children',
          children: { [tagName]: child === undefined ? [] : [child] },
        },
      })
    ),
  xmlChildren: (tagName: string) =>
    syncer<SimpleXmlNode, RA<SimpleXmlNode>>(
      ({ content }) => {
        pushContext({ type: 'Children', tagName, extras: { content } });
        return content.type === 'Text'
          ? []
          : content.children[tagName] ??
              content.children[tagName.toLowerCase()] ??
              [];
      },
      (newChildren) => ({
        type: 'SimpleXmlNode',
        tagName: '',
        attributes: {},
        content: {
          type: 'Children',
          children: { [tagName]: newChildren },
        },
      })
    ),
  object<SPEC extends BaseSpec<SimpleXmlNode>>(spec: SPEC) {
    const builder = createBuilder<SimpleXmlNode, SPEC>(spec);
    return syncer<SimpleXmlNode, SpecToJson<SPEC>>(createParser(spec), (spec) =>
      mergeSimpleXmlNodes(builder(spec))
    );
  },
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
          pushContext({ type: 'Index', index, extras: { element } });
          return serializer(element);
        }),
      (elements) => elements.map(deserializer)
    ),
  maybe: <SYNCER extends Syncer<any, any>>(syncerDefinition: SYNCER) =>
    syncer<
      Parameters<SYNCER['serializer']>[0] | undefined,
      ReturnType<SYNCER['serializer']> | undefined
    >(
      (element) => f.maybe(element, syncerDefinition.serializer),
      (element) => f.maybe(element, syncerDefinition.deserializer)
    ),
  dependent: <
    KEY extends string,
    OBJECT extends { readonly [key in KEY]: SimpleXmlNode },
    SUB_SPEC extends BaseSpec<SimpleXmlNode>,
    NEW_OBJECT extends Omit<OBJECT, KEY> & {
      readonly [key in KEY]: SpecToJson<SUB_SPEC>;
    }
  >(
    key: KEY,
    spec: (dependent: OBJECT) => SUB_SPEC
  ) =>
    syncer<OBJECT, NEW_OBJECT>(
      (object) =>
        ({
          ...object,
          [key]: syncers.object(spec(object)).serializer(object[key]),
        } as unknown as NEW_OBJECT),
      (object) =>
        ({
          ...object,
          [key]: syncers
            /*
             * "object" is actually NEW_SPEC, but the difference shouldn't matter
             * (they only differ by object[key])
             */
            .object(spec(object as unknown as OBJECT))
            .deserializer(object[key]),
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
        const field = schema.models[tableName].getFields(fieldName);
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
          [key]: deserializer(object),
        } as unknown as OBJECT)
    ),
} as const;
