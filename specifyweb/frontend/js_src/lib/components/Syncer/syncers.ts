import type { LocalizedString } from 'typesafe-i18n';

import { f } from '../../utils/functools';
import { parseBoolean } from '../../utils/parser/parse';
import type { IR, RA } from '../../utils/types';
import { defined } from '../../utils/types';
import { getAttribute } from '../../utils/utils';
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
  xmlAttribute: <MODE extends 'empty' | 'required'>(
    attribute: string,
    mode: MODE,
    trim = true
  ) =>
    syncer<
      Element,
      LocalizedString | (MODE extends 'empty' ? never : undefined)
    >(
      (cell) => {
        const rawValue = getAttribute(cell, attribute);
        const trimmed = trim ? rawValue?.trim() : rawValue;
        if (mode === 'required' && trimmed === '')
          console.error(`Required attribute "${attribute}" is empty`);
        else if (trimmed === undefined)
          console[mode === 'required' ? 'error' : 'warn'](
            `Required attribute "${attribute}" is missing`
          );
        return mode === 'empty' ? trimmed ?? '' : (trimmed as LocalizedString);
      },
      (value, cell) => {
        if (typeof value === 'string')
          cell.setAttribute(attribute, trim ? value.trim() : value);
        else cell.removeAttribute(attribute);
        return cell;
      }
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
      strictGetModel(defined(value, 'Model name was not provided')).longName
  ),
  toBoolean: syncer<string, boolean>(parseBoolean, (value) => value.toString()),
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
        return cell;
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
        return cell;
      }
    ),
  object: <SPEC extends IR<Syncer<Element, any>>>(spec: SPEC) =>
    syncer<Element, SpecToJson<SPEC>>(xmlParser(spec), xmlBuilder(spec)),
  map: <SYNCER extends Syncer<any, any>>(syncerDefinition: SYNCER) =>
    syncer<
      RA<Parameters<SYNCER['serializer']>[0]>,
      RA<ReturnType<SYNCER['serializer']>>
    >(
      (elements) => elements.map(syncerDefinition.serializer),
      (elements, cells) =>
        // FIXME: handle new elements being added
        elements.map((element, index) =>
          syncerDefinition.deserializer(element, cells[index])
        )
    ),
} as const;
