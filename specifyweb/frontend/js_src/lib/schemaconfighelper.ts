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
import commonText from './localization/common';
import * as querystring from './querystring';
import type { JavaType } from './specifyfield';
import type { IR, RA } from './types';
import { sortFunction } from './wbplanviewhelper';
import { Aggregator, Formatter } from './dataobjformatters';
import { SpecifyModel } from './specifymodel';

export const sortObjectsByKey = <
  KEY extends string,
  T extends Record<KEY, unknown>
>(
  objects: RA<T>,
  key: KEY
): RA<T> => Array.from(objects).sort(sortFunction(({ [key]: value }) => value));

let newStringId = 1;
const defaultLanguage = 'en';
const defaultCountry = null;

const fetchString = async (
  url: string,
  language: string,
  country: string | null
): Promise<SpLocaleItemString | NewSpLocaleItemString> =>
  ajax<{ readonly objects: RA<SpLocaleItemString> }>(url, {
    headers: { Accept: 'application/json' },
  }).then(({ data: { objects } }) => {
    const targetString = objects.find(
      (object) => object.language === language && object.country === country
    );
    if (typeof targetString === 'undefined') {
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
    } else return targetString;
  });

export const fetchStrings = async <
  T extends { readonly names: string; readonly descs: string }
>(
  objects: RA<T>,
  language: string,
  country: string | null
): Promise<RA<T & WithFetchedStrings>> =>
  Promise.all(
    objects.map(async (item) =>
      Promise.all([
        fetchString(item.names, language, country),
        fetchString(item.descs, language, country),
      ]).then(([name, desc]) => ({
        ...item,
        strings: {
          name,
          desc,
        },
      }))
    )
  );

export function prepareNewString({
  parent,
  id: _id,
  ...object
}: NewSpLocaleItemString): NewSpLocaleItemString {
  if (typeof parent === 'undefined') throw new Error('String has no parent');
  const [parentName, parentId] = Object.entries(querystring.parse(parent))[0];
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

export const filterFormatters = (
  formatters: IR<DataObjectFormatter>,
  tableName: string
): IR<string> =>
  Object.fromEntries(
    Object.entries(formatters)
      .filter(
        ([_name, { className }]) =>
          SpecifyModel.parseClassName(className).toLowerCase() === tableName
      )
      .map(([name, { title }]) => [name, title] as const)
  );

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

const relationshipTypes: IR<string> = {
  'one-to-one': commonText('oneToOne'),
  'one-to-many': commonText('oneToMany'),
  'many-to-one': commonText('manyToOne'),
  'many-to-many': commonText('manyToMany'),
};

export function javaTypeToHuman(
  type: string | null,
  relatedModelName: string | undefined
): string {
  if (type === null) return '';
  else if (type in relationshipTypes)
    return `${relationshipTypes[type]} (${relatedModelName ?? ''})`;
  else if (type.startsWith('java')) return type.split('.').slice(-1)[0];
  else return type;
}
