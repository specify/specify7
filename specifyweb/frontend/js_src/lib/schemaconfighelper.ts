import { ajax } from './ajax';
import type {
  DataObjectFormatter,
  ItemType,
  NewSpLocaleItemString,
  SpLocaleItem,
  SpLocaleItemString,
} from './components/schemaconfig';
import type {
  WithFetchedStrings,
  WithFieldInfo,
} from './components/toolbar/schemaconfig';
import type { Tables } from './datamodel';
import type { Aggregator, Formatter } from './dataobjformatters';
import { commonText } from './localization/common';
import type { JavaType } from './specifyfield';
import { SpecifyModel } from './specifymodel';
import type { IR, RA } from './types';
import { f } from './functools';
import { parseUrl } from './querystring';

let newStringId = 1;
const defaultLanguage = 'en';
const defaultCountry = null;

/**
 * Fetch localized strings for a given field and language
 */
const fetchString = async (
  url: string,
  language: string,
  country: string | null
): Promise<SpLocaleItemString | NewSpLocaleItemString> =>
  ajax<{ readonly objects: RA<SpLocaleItemString> }>(url, {
    headers: { Accept: 'application/json' },
  }).then(({ data: { objects } }) => {
    const targetString = objects.find(
      (object) =>
        (object.language === language && object.country) ?? '' === country ?? ''
    );
    if (typeof targetString === 'object') return targetString;

    const defaultString =
      objects.find(
        (object) =>
          object.language === defaultLanguage &&
          object.country === defaultCountry
      )?.text ?? '';
    newStringId += 1;

    return {
      id: -newStringId,
      text: defaultString,
      language,
      country,
      parent: url,
    };
  });

/**
 * Fetch all strings for a field
 */
export const fetchStrings = async <
  T extends { readonly names: string; readonly descs: string }
>(
  objects: RA<T>,
  language: string,
  country: string | null
): Promise<RA<T & WithFetchedStrings>> =>
  Promise.all(
    objects.map(async (item) =>
      f
        .all({
          name: fetchString(item.names, language, country),
          desc: fetchString(item.descs, language, country),
        })
        .then((strings) => ({
          ...item,
          strings,
        }))
    )
  );

/**
 * Need to set resource URL before a SpLocaleItemString can be sent to the back
 * end
 */
export function prepareNewString({
  parent,
  id: _id,
  ...object
}: NewSpLocaleItemString): NewSpLocaleItemString {
  if (typeof parent === 'undefined') throw new Error('String has no parent');
  const [parentName, parentId] = Object.entries(parseUrl(parent))[0];
  return {
    ...object,
    [parentName]: `/api/specify/splocalecontaineritem/${parentId}/`,
  };
}

/** Throws away unneeded fields */
export const formatAggregators = (
  aggregators: RA<Formatter | Aggregator>
): IR<DataObjectFormatter> =>
  Object.fromEntries(
    aggregators.map(({ name = '', title = '', className = '' }) => [
      name,
      {
        title,
        className,
      },
    ])
  );

/**
 * Filter down defined formatters
 */
export const filterFormatters = (
  formatters: IR<DataObjectFormatter>,
  tableName: keyof Tables
): IR<string> =>
  Object.fromEntries(
    Object.entries(formatters)
      .filter(
        ([_name, { className }]) =>
          SpecifyModel.parseClassName(className).toLowerCase() === tableName
      )
      .map(([name, { title }]) => [name, title] as const)
  );

/**
 * Determine what kind of item SpLocalItem is based on what fields it has
 *
 * Assuming it can't be multiple types at once
 *
 */
export function getItemType(item: SpLocaleItem): ItemType {
  if (item.weblinkname !== null) return 'webLink';
  else if (item.picklistname !== null) return 'pickList';
  else if (item.format !== null) return 'formatted';
  else return 'none';
}

const webLinkTypes = new Set<JavaType>(['text', 'java.lang.String']);

export function isFormatterAvailable(
  item: WithFieldInfo,
  formatter: ItemType
): boolean {
  if (formatter === 'none' || formatter === 'pickList') return true;
  else if (formatter === 'webLink')
    return (
      !item.dataModel.isRelationship &&
      webLinkTypes.has(item.dataModel.type as JavaType)
    );
  else if (formatter === 'formatted') return !item.dataModel.isRelationship;
  else return false;
}

export const localizedRelationshipTypes: IR<string> = {
  'one-to-one': commonText('oneToOne'),
  'one-to-many': commonText('oneToMany'),
  'many-to-one': commonText('manyToOne'),
  'many-to-many': commonText('manyToMany'),
};

/**
 * Localize Java type name for presenting in the UI
 */
export function javaTypeToHuman(
  type: string | null,
  relatedModelName: string | undefined
): string {
  if (type === null) return '';
  else if (type in localizedRelationshipTypes)
    return `${localizedRelationshipTypes[type]} (${relatedModelName ?? ''})`;
  else if (type.startsWith('java')) return type.split('.').slice(-1)[0];
  else return type;
}
