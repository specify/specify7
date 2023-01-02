import type { LocalizedString } from 'typesafe-i18n';

import { f } from '../../utils/functools';
import { parseBoolean } from '../../utils/parser/parse';
import type { RA } from '../../utils/types';
import { getAttribute } from '../../utils/utils';
import { parseJavaClassName } from '../DataModel/resource';
import { getModel, schema } from '../DataModel/schema';
import type { Tables } from '../DataModel/types';
import type { BaseSpec, SpecToJson, Syncer } from './index';
import { symbolOldInputs, syncer, xmlBuilder, xmlParser } from './index';
import { silenceConsole } from '../Errors/interceptLogs';
import { createXmlNode, renameXmlNode } from './xmlUtils';
import { LiteralField, Relationship } from '../DataModel/specifyField';

function getChildren(cell: Element, tagName: string): RA<Element> {
  const lowerTagName = tagName.toLowerCase();
  return Array.from(cell.children).filter(
    ({ tagName }) => tagName.toLowerCase() === lowerTagName
  );
}

const ensureCell =
  <T>(
    callback: (value: T, cell: Element) => Element
  ): ((value: T, cell: Element | undefined) => Element) =>
  (value, cell) =>
    callback(value, cell ?? createXmlNode(temporaryNodeName));

export const syncers = {
  xmlAttribute: <MODE extends 'empty' | 'required' | 'skip'>(
    attribute: string,
    mode: MODE,
    trim = true
  ) =>
    syncer<Element, LocalizedString | undefined>(
      (cell) => {
        const rawValue = getAttribute(cell, attribute);
        const trimmed = trim ? rawValue?.trim() : rawValue;
        if (mode === 'required' && trimmed === '')
          console.error(`Required attribute "${attribute}" is empty`);
        else if (mode === 'required' && trimmed === undefined)
          console.error(`Required attribute "${attribute}" is missing`);
        return trimmed;
      },
      ensureCell((rawValue = '', cell) => {
        const value = trim ? rawValue.trim() : rawValue;
        if (mode === 'skip' && value === '') cell.removeAttribute(attribute);
        else cell.setAttribute(attribute, value);
        return cell;
      })
    ),
  xmlContent: syncer<Element, string | undefined>(
    (cell) => cell.textContent?.trim() ?? undefined,
    ensureCell((value, cell) => {
      cell.textContent = value?.trim() ?? '';
      return cell;
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
  javaClassName: syncer<string, keyof Tables | undefined>(
    (className: string) => {
      const tableName = parseJavaClassName(className);
      const parsedName = getModel(tableName ?? className)?.name;
      if (parsedName === undefined)
        // FIXME: add context to error messages
        console.error(`Unknown model: ${className ?? '(null)'}`);
      return parsedName;
    },
    (value, originalValue) =>
      f.maybe(value, getModel)?.longName ?? originalValue ?? ''
  ),
  toBoolean: syncer<string, boolean>(parseBoolean, (value) => value.toString()),
  toDecimal: syncer<string, number | undefined>(
    f.parseInt,
    (value) => value?.toString() ?? ''
  ),
  xmlChild: (tagName: string, mode: 'optional' | 'required' = 'required') =>
    syncer<Element, Element | undefined>(
      (cell: Element) => {
        const children = getChildren(cell, tagName);
        if (children.length > 1)
          console.error(`Expected to find at most one <${tagName} /> child`);
        if (children[0] === undefined && mode === 'required')
          console.error(`Unable to find a <${tagName} /> child`);
        return children[0];
      },
      ensureCell((rawChild, cell) => {
        const child = f.maybe(rawChild, ensureTagName(tagName));
        const children = getChildren(cell, tagName);
        if (child === undefined) children[0]?.remove();
        else if (children.length === 0) cell.append(child);
        else cell.replaceChild(children[0], child);
        return cell;
      })
    ),
  xmlChildren: (tagName: string) =>
    syncer<Element, RA<Element>>(
      (cell) => getChildren(cell, tagName),
      ensureCell((rawNewChildren, cell) => {
        const newChildren = rawNewChildren.map(ensureTagName(tagName));

        const children = getChildren(cell, tagName);
        /*
         * Try to replace as many as possible rather than removing and adding
         * so as to preserve the comments adjacent to the elements.
         */
        Array.from(
          { length: Math.min(newChildren.length, children.length) },
          (_, index) => cell.replaceChild(children[index], newChildren[index])
        );
        Array.from(
          { length: children.length - newChildren.length },
          (_, index) => children[index].remove()
        );
        const addedCount = newChildren.length - children.length;
        Array.from({ length: addedCount }, (_, index) =>
          cell.append(newChildren[addedCount + index])
        );
        return cell;
      })
    ),
  object<SPEC extends BaseSpec>(spec: SPEC) {
    const parser = xmlParser(spec);
    const builder = xmlBuilder(spec);
    return syncer<Element, SpecToJson<SPEC>>(
      parser,
      ensureCell((shape, cell): Element => {
        if (cell === undefined) silenceConsole(() => parser(cell));
        const intermediates = (
          cell as unknown as {
            readonly [symbolOldInputs]: Record<keyof SPEC, unknown>;
          }
        )[symbolOldInputs];
        if (intermediates === undefined)
          throw new Error('Bad object structure');

        return builder(shape, cell, intermediates);
      })
    );
  },
  map: <SYNCER extends Syncer<any, any>>(syncerDefinition: SYNCER) =>
    syncer<
      RA<Parameters<SYNCER['serializer']>[0]>,
      RA<ReturnType<SYNCER['serializer']>>
    >(
      (elements) => elements.map(syncerDefinition.serializer),
      (elements, cells) =>
        elements.map((element, index) =>
          syncerDefinition.deserializer(element, cells?.[index])
        )
    ),
  maybe: <SYNCER extends Syncer<any, any>>(syncerDefinition: SYNCER) =>
    syncer<
      Parameters<SYNCER['serializer']>[0] | undefined,
      ReturnType<SYNCER['serializer']> | undefined
    >(
      (element) => f.maybe(element, syncerDefinition.serializer),
      (element, cell) =>
        element === undefined
          ? undefined
          : syncerDefinition.deserializer(element, cell)
    ),
  dependent: <
    KEY extends string,
    OBJECT extends { readonly [key in KEY]: Element },
    SUB_SPEC extends BaseSpec,
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
      (object, oldInput) =>
        ({
          ...object,
          [key]: syncers
            /*
             * "object" is actually NEW_SPEC, but the difference shouldn't matter
             * (they only differ by object[key])
             */
            .object(spec(object as unknown as OBJECT))
            .deserializer(object[key], oldInput?.[key]),
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
    deserializer: (object: NEW_OBJECT, oldValue: OBJECT | undefined) => RAW
  ) =>
    syncer<OBJECT, NEW_OBJECT>(
      (object) =>
        ({
          ...object,
          [key]: serializer(object),
        } as unknown as NEW_OBJECT),
      (object, oldValue) =>
        ({
          ...object,
          [key]: deserializer(object, oldValue),
        } as unknown as OBJECT)
    ),
  /*change: <
    KEY extends string,
    RAW,
    PARSED,
    OBJECT extends { readonly [key in KEY]: RAW },
    NEW_OBJECT extends {
      readonly [key in keyof OBJECT]: key extends KEY ? PARSED : OBJECT[KEY];
    }
  >(
    key: KEY,
    serializer: (object: OBJECT) => PARSED,
    deserializer: (object: NEW_OBJECT, oldValue: OBJECT | undefined) => RAW
  ) =>
    syncer<OBJECT,NEW_OBJECT>(
      (object) =>
        ({
          ...object,
          [key]: serializer(object),
        } as unknown as NEW_OBJECT),
      (object, oldValue) =>
        ({
          ...object,
          [key]: deserializer(object, oldValue),
        } as unknown as OBJECT)
    ),*/
  /*change: <
    KEY extends string,
    OBJECT extends SpecToJson<BaseSpec>,
    NEW_OBJECT extends SpecToJson<BaseSpec>
  >(
    key: KEY,
    serializer: (object: OBJECT) => NEW_OBJECT[KEY],
    deserializer: (object: NEW_OBJECT, oldValue: OBJECT | undefined) => OBJECT[KEY]
  ) =>
    syncer<OBJECT,NEW_OBJECT>(
      (object) =>
        ({
          ...object,
          [key]: serializer(object),
        } as unknown as NEW_OBJECT),
      (object, oldValue) =>
        ({
          ...object,
          [key]: deserializer(object, oldValue),
        } as unknown as OBJECT)
    ),*/
} as const;

/**
 * If a new node was created by a downstream deserializer, rename it to the
 * desired tag name
 */
const ensureTagName =
  (tagName: string) =>
  (child: Element): Element =>
    child.tagName === temporaryNodeName ? renameXmlNode(child, tagName) : child;

const temporaryNodeName = 'temporary'.toUpperCase();
