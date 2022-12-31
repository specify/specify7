import type { LocalizedString } from 'typesafe-i18n';

import { f } from '../../utils/functools';
import type { IR, RA } from '../../utils/types';
import { getAttribute, getParsedAttribute } from '../../utils/utils';
import { parseJavaClassName } from '../DataModel/resource';
import { getModel, strictGetModel } from '../DataModel/schema';
import type { Tables } from '../DataModel/types';
import type { SpecToJson, Syncer } from './index';
import { syncer, xmlBuilder, xmlParser } from './index';

function getChildren(cell: Element, tagName: string): RA<Element> {
  const lowerTagName = tagName.toLowerCase();
  return Array.from(cell.children).filter(
    ({ tagName }) => tagName.toLowerCase() === lowerTagName
  );
}

export const syncers = {
  xmlAttribute: (attribute: string, required: boolean, trim = true) =>
    syncer<Element, LocalizedString | undefined>(
      (cell) => {
        const value = trim
          ? getParsedAttribute(cell, attribute)
          : getAttribute(cell, attribute);
        if (required && value === undefined)
          console.error(`Required attribute "${attribute}" is missing`);
        return value;
      },
      (value, cell) =>
        typeof value === 'string'
          ? cell.setAttribute(attribute, trim ? value.trim() : value)
          : cell.removeAttribute(attribute)
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
    (value) =>
      value === undefined ? undefined : strictGetModel(value).longName
  ),
  toBoolean: syncer<string, boolean>(
    (value) => value.toLowerCase() === 'true',
    (value) => value.toString()
  ),
  toDecimal: syncer<string, number | undefined>(
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
      (value, cell) => {
        const children = getChildren(cell, tagName);
        if (value === undefined) children[0]?.remove();
        else if (children.length === 0) cell.append(value);
        else cell.replaceChild(children[0], value);
      }
    ),
  xmlChildren: (tagName: string) =>
    syncer<Element, RA<Element>>(
      (cell) => getChildren(cell, tagName),
      (newChildren, cell) => {
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
        Array.from(
          { length: newChildren.length - children.length },
          (_, index) => cell.append(newChildren[index])
        );
      }
    ),
  object: <SPEC extends IR<Syncer<Element, any>>>(spec: SPEC) => {
    const parser = xmlParser(spec);
    const builder = xmlBuilder(spec);
    return syncer<
      Element,
      { readonly value: SpecToJson<SPEC>; readonly raw: Element }
    >(
      (object) => ({ value: parser(object), raw: object }),
      ({ value, raw }) => builder(raw, value)
    );
  },
  // FIXME: make this more generic (make it accept a syncer rather than spec)
  array: <SPEC extends IR<Syncer<Element, any>>>(spec: SPEC) => {
    const parser = xmlParser(spec);
    const builder = xmlBuilder(spec);
    return syncer<
      RA<Element>,
      RA<{ readonly value: SpecToJson<SPEC>; readonly raw: Element }>
    >(
      (elements) =>
        elements.map((element) => ({
          value: parser(element),
          raw: element,
        })),
      (elements) => elements.map(({ value, raw }) => builder(raw, value))
    );
  },
} as const;
