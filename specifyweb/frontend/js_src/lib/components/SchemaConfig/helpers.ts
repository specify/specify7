import type {
  ItemType,
  NewSpLocaleItemString,
  SpLocaleItemString,
} from './index';
import type { DataObjectFormatter } from './SetupHooks';
import type { SpLocaleContainerItem, Tables } from '../DataModel/types';
import type { Aggregator, Formatter } from '../Forms/dataObjFormatters';
import { commonText } from '../../localization/common';
import { parseJavaClassName } from '../DataModel/resource';
import type {
  JavaType,
  LiteralField,
  Relationship,
} from '../DataModel/specifyField';
import type { IR, RA } from '../../utils/types';
import { SerializedResource } from '../DataModel/helperTypes';
import { addMissingFields } from '../DataModel/addMissingFields';

let newStringId = 1;
const defaultLanguage = 'en';
const defaultCountry = null;

export function findString(
  allStrings: RA<SpLocaleItemString> | undefined,
  language: string,
  country: string | null,
  itemType: 'containerDesc' | 'containerName' | 'itemDesc' | 'itemName',
  parentUrl: string
): NewSpLocaleItemString | SpLocaleItemString {
  const targetStrings = allStrings?.filter(
    (string) => string[itemType] === parentUrl
  );

  /*
   * Start searching for matching string from the end. This would align
   * schema config behavior with the way back-end handles cases when there
   * are duplicate SpLocalteItemStr records for the same field and same language
   */
  const targetString = Array.from(targetStrings ?? [])
    .reverse()
    .find(
      (object) =>
        object.language === language &&
        (object.country ?? '') === (country ?? '')
    );
  if (typeof targetString === 'object') return targetString;

  const defaultItem = targetStrings?.find(
    (object) =>
      object.language === defaultLanguage && object.country === defaultCountry
  );
  newStringId += 1;

  return addMissingFields('SpLocaleItemStr', {
    id: -newStringId,
    text: defaultItem?.text ?? '',
    language,
    country,
    [itemType]: parentUrl,
  });
}

/** Throws away unneeded fields */
export const formatAggregators = (
  aggregators: RA<Aggregator | Formatter>
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
          parseJavaClassName(className).toLowerCase() === tableName
      )
      .map(([name, { title }]) => [name, title] as const)
  );

/**
 * Determine what kind of item SpLocalItem is based on what fields it has
 *
 * Assuming it can't be multiple types at once
 *
 */
export function getItemType(
  item: SerializedResource<SpLocaleContainerItem>
): ItemType {
  if (item.webLinkName !== null) return 'webLink';
  else if (item.pickListName !== null) return 'pickList';
  // eslint-disable-next-line no-negated-condition
  else if (item.format !== null) return 'formatted';
  else return 'none';
}

const webLinkTypes = new Set<JavaType>(['text', 'java.lang.String']);

export function isFormatterAvailable(
  field: LiteralField | Relationship,
  formatter: ItemType
): boolean {
  if (formatter === 'none' || formatter === 'pickList') return true;
  else if (formatter === 'webLink')
    return !field.isRelationship && webLinkTypes.has(field.type);
  else if (formatter === 'formatted') return !field.isRelationship;
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
  relatedModelName: string | undefined = ''
): string {
  if (type === null) return '';
  else if (type in localizedRelationshipTypes)
    return `${localizedRelationshipTypes[type]} (${relatedModelName})`;
  else if (type.startsWith('java')) return type.split('.').at(-1)!;
  else return type;
}
