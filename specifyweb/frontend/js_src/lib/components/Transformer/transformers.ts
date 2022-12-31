import { getParsedAttribute } from '../../utils/utils';
import { Tables } from '../DataModel/types';
import { parseJavaClassName } from '../DataModel/resource';
import { getModel, strictGetModel } from '../DataModel/schema';
import { transformer } from './index';

export const transformers = {
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
