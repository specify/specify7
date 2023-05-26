import { schemaText } from '../../localization/schema';
import type { IR, RA } from '../../utils/types';
import { localized } from '../../utils/types';
import { addMissingFields } from '../DataModel/addMissingFields';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpLocaleContainerItem } from '../DataModel/types';
import type { Aggregator, Formatter } from '../Formatters/spec';
import type {
  ItemType,
  NewSpLocaleItemString,
  SpLocaleItemString,
} from './index';
import type { SchemaFormatter } from './schemaData';

let newStringId = 1;
const defaultLanguage = 'en';
const defaultCountry = null;

export function findString(
  strings: RA<SpLocaleItemString> | undefined,
  language: string,
  country: string | null,
  itemType: 'containerDesc' | 'containerName' | 'itemDesc' | 'itemName',
  parentUrl: string
): NewSpLocaleItemString | SpLocaleItemString {
  /*
   * Start searching for matching string from the end. This would align
   * schema config behavior with the way back-end handles cases when there
   * are duplicate SpLocaleItemStr records for the same field and same language
   */
  const targetString = Array.from(strings ?? [])
    .reverse()
    .find(
      (object) =>
        object.language === language &&
        (object.country ?? '') === (country ?? '')
    );
  if (typeof targetString === 'object') return targetString;

  const defaultItem = strings?.find(
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
): RA<SchemaFormatter> =>
  aggregators.map(({ name = '', title = '', table }, index) => ({
    name,
    title: localized(title === '' ? name : title),
    tableName: table?.name,
    index,
  }));

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
  else if (item.format === null) {
    return 'none';
  } else {
    return 'formatted';
  }
}

export const localizedRelationshipTypes: IR<string> = {
  'one-to-one': schemaText.oneToOne(),
  'one-to-many': schemaText.oneToMany(),
  'many-to-one': schemaText.manyToOne(),
  'many-to-many': schemaText.manyToMany(),
};

/**
 * Localize Java type name for presenting in the UI
 */
export function javaTypeToHuman(
  type: string | null,
  relatedTableName: string | undefined = ''
): string {
  if (type === null) return '';
  else if (type in localizedRelationshipTypes)
    return `${localizedRelationshipTypes[type]} (${relatedTableName})`;
  else if (type.startsWith('java')) return type.split('.').at(-1)!;
  else return type;
}
