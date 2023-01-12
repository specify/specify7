import type { LocalizedString } from 'typesafe-i18n';

import { f } from '../../utils/functools';
import { parseBoolean } from '../../utils/parser/parse';
import type { RA } from '../../utils/types';
import { getAttribute } from '../../utils/utils';
import { parseJavaClassName } from '../DataModel/resource';
import { getModel } from '../DataModel/schema';
import type { Tables } from '../DataModel/types';
import type { BaseSpec, SafeSyncer, SpecToJson } from './index';
import {
  safeSyncer,
  symbolOldInputs,
  syncer,
  xmlBuilder,
  xmlParser,
} from './index';
import { silenceConsole } from '../Errors/interceptLogs';
import { createXmlNode, renameXmlNode } from './xmlUtils';

function getChildren(cell: Element, tagName: string): RA<Element> {
  const lowerTagName = tagName.toLowerCase();
  return Array.from(cell.children).filter(
    ({ tagName }) => tagName.toLowerCase() === lowerTagName
  );
}

export const syncers = {
  xmlAttribute: <MODE extends 'empty' | 'required' | 'skip'>(
    attribute: string,
    mode: MODE,
    trim = true
  ) =>
    syncer<
      Element,
      LocalizedString | (MODE extends 'empty' | 'skip' ? never : undefined)
    >(
      (cell) => {
        const rawValue = getAttribute(cell, attribute);
        const trimmed = trim ? rawValue?.trim() : rawValue;
        if (mode === 'required' && trimmed === '')
          console.error(`Required attribute "${attribute}" is empty`);
        else if (mode === 'required' && trimmed === undefined)
          console.error(`Required attribute "${attribute}" is missing`);
        return mode === 'empty' || mode === 'skip'
          ? trimmed ?? ''
          : (trimmed as LocalizedString);
      },
      (rawValue = '', cell) => {
        const value = trim ? rawValue.trim() : rawValue;
        if (mode === 'skip' && value === '') cell.removeAttribute(attribute);
        else cell.setAttribute(attribute, value);
        return cell;
      }
    ),
  xmlContent: syncer<Element, string>(
    (cell) => cell.textContent ?? '',
    (value, cell) => {
      cell.textContent = value;
      return cell;
    }
  ),
  default: <T>(
    defaultValue: T extends (...args: RA<unknown>) => unknown
      ? never
      : T | (() => T)
  ) =>
    safeSyncer<T | undefined, T>(
      (value) =>
        value ??
        (typeof defaultValue === 'function' ? defaultValue() : defaultValue),
      (value) => value
    ),
  javaClassName: safeSyncer<string, keyof Tables | undefined>(
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
  toBoolean: safeSyncer<string, boolean>(parseBoolean, (value) =>
    value.toString()
  ),
  toDecimal: safeSyncer<string, number | undefined>(
    f.parseInt,
    (value) => value?.toString() ?? ''
  ),
  xmlChild: (tagName: string) =>
    syncer<Element, Element | undefined>(
      (cell: Element) => {
        const children = getChildren(cell, tagName);
        if (children.length > 1)
          console.error(`Expected to find at most one <${tagName} /> child`);
        if (children[0] === undefined)
          console.error(`Unable to find a <${tagName} /> child`);
        return children[0];
      },
      (rawChild, cell) => {
        const child = f.maybe(rawChild, ensureTagName(tagName));
        const children = getChildren(cell, tagName);
        if (child === undefined) children[0]?.remove();
        else if (children.length === 0) cell.append(child);
        else cell.replaceChild(children[0], child);
        return cell;
      }
    ),
  xmlChildren: (tagName: string) =>
    syncer<Element, RA<Element | undefined>>(
      (cell) => getChildren(cell, tagName),
      (rawNewChildren, cell) => {
        const ensure = ensureTagName(tagName);
        const newChildren = rawNewChildren.map((child) =>
          f.maybe(child, ensure)
        );

        const children = getChildren(cell, tagName);
        /*
         * Try to replace as many as possible rather than removing and adding
         * so as to preserve the comments adjacent to the elements.
         */
        Array.from(
          { length: Math.min(newChildren.length, children.length) },
          (_, index) => {
            const child = newChildren[index];
            if (typeof child === 'object')
              cell.replaceChild(children[index], child);
          }
        );
        Array.from(
          { length: children.length - newChildren.length },
          (_, index) => children[index].remove()
        );
        const addedCount = newChildren.length - children.length;
        Array.from({ length: addedCount }, (_, index) => {
          const child = newChildren[addedCount + index];
          if (typeof child === 'object') cell.append(child);
        });
        return cell;
      }
    ),
  object<SPEC extends BaseSpec>(spec: SPEC) {
    const parser = xmlParser(spec);
    const builder = xmlBuilder(spec);
    return safeSyncer<Element, SpecToJson<SPEC>>(
      parser,
      (shape, originalCell): Element => {
        const cell = originalCell ?? createXmlNode(temporaryNodeName);
        if (originalCell === undefined) silenceConsole(() => parser(cell));

        const intermediates = (
          cell as unknown as {
            readonly [symbolOldInputs]: Record<keyof SPEC, unknown>;
          }
        )[symbolOldInputs];
        if (intermediates === undefined)
          throw new Error('Bad object structure');

        return builder(shape, cell, intermediates);
      }
    );
  },
  map: <SYNCER extends SafeSyncer<any, any>>(syncerDefinition: SYNCER) =>
    safeSyncer<
      RA<Parameters<SYNCER['serializer']>[0]>,
      RA<ReturnType<SYNCER['serializer']>>
    >(
      (elements) => elements.map(syncerDefinition.serializer),
      (elements, cells) =>
        elements.map((element, index) =>
          syncerDefinition.deserializer(element, cells?.[index])
        )
    ),
  maybe: <SYNCER extends SafeSyncer<any, any>>(syncerDefinition: SYNCER) =>
    safeSyncer<
      Parameters<SYNCER['serializer']>[0] | undefined,
      ReturnType<SYNCER['serializer']> | undefined
    >(
      (element) => f.maybe(element, syncerDefinition.serializer),
      (element, cell) =>
        element === undefined
          ? undefined
          : syncerDefinition.deserializer(element, cell)
    ),
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
