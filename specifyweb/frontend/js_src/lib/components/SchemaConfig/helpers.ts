import { schemaText } from '../../localization/schema';
import type { IR, RA } from '../../utils/types';
import { localized } from '../../utils/types';
import { replaceItem } from '../../utils/utils';
import { addMissingFields } from '../DataModel/addMissingFields';
import type { SerializedResource } from '../DataModel/helperTypes';
import { createResource, saveResource } from '../DataModel/resource';
import type { SpLocaleContainerItem } from '../DataModel/types';
import type { Aggregator, Formatter } from '../Formatters/spec';
import type {
  ItemType,
  NewSpLocaleItemString,
  SpLocaleItemString,
} from './index';
import type { SchemaFormatter } from './schemaData';
import type { SaveRequest, SchemaConfigEditorState } from './types';

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
  else if (type === 'java.lang.String' || type === 'text')
    return schemaText.text();
  else if (
    type === 'java.lang.Byte' ||
    type === 'java.lang.Short' ||
    type === 'java.lang.Integer' ||
    type === 'java.lang.Long'
  )
    return schemaText.integer();
  else if (type === 'java.lang.Float' || type === 'java.lang.Double')
    return `${schemaText.number()} (${type.split('.').at(-1)!})`;
  else if (type === 'java.math.BigDecimal') return schemaText.decimal();
  else if (type === 'java.util.Calendar' || type === 'java.util.Date')
    return schemaText.date();
  else if (type.startsWith('java')) return type.split('.').at(-1)!;
  else return type;
}

const getEditorChanges = (
  editor: SchemaConfigEditorState
): {
  readonly nameChanged: boolean;
  readonly descChanged: boolean;
  readonly containerChanged: boolean;
} => ({
  nameChanged:
    JSON.stringify(editor.initialName) !== JSON.stringify(editor.name),
  descChanged:
    JSON.stringify(editor.initialDesc) !== JSON.stringify(editor.desc),
  containerChanged:
    JSON.stringify(editor.initialContainer) !==
    JSON.stringify(editor.container),
});

export const isEditorModified = (editor: SchemaConfigEditorState): boolean => {
  const changes = getEditorChanges(editor);
  return (
    changes.nameChanged ||
    changes.descChanged ||
    changes.containerChanged ||
    editor.changedItems.length > 0
  );
};

export const updateEditor = (
  editors: IR<SchemaConfigEditorState>,
  tableName: string,
  update: (editor: SchemaConfigEditorState) => SchemaConfigEditorState
): IR<SchemaConfigEditorState> => {
  const editor = editors[tableName];
  return editor === undefined
    ? editors
    : { ...editors, [tableName]: update(editor) };
};

const applySavedId = <T extends { readonly id?: number }>(
  resource: T,
  result: unknown
): T =>
  typeof (result as { readonly id?: number } | undefined)?.id === 'number'
    ? { ...resource, ...(result as Partial<T>) }
    : resource;

const applyItemStringId = (
  editor: SchemaConfigEditorState,
  index: number,
  key: 'name' | 'desc',
  sent: NewSpLocaleItemString | SpLocaleItemString,
  result: unknown
): SchemaConfigEditorState => {
  const item = editor.items[index];
  const current = key === 'name' ? item.strings.name : item.strings.desc;
  const saved = applySavedId(sent, result);
  const string = current === sent ? saved : current;
  const strings =
    key === 'name'
      ? { ...item.strings, name: string }
      : { ...item.strings, desc: string };
  return {
    ...editor,
    items: replaceItem(editor.items, index, { ...item, strings }),
  };
};

export const buildSaveRequests = (
  editor: SchemaConfigEditorState
): RA<SaveRequest> => {
  const { nameChanged, descChanged, containerChanged } =
    getEditorChanges(editor);
  // Capture the values sent with each request so reconciliation can compare
  // the current state against what was actually saved
  const sentName = editor.name;
  const sentDesc = editor.desc;
  const sentContainer = editor.container;
  return [
    ...(nameChanged
      ? [
          {
            promise: saveString(sentName),
            reconcile: (
              current: SchemaConfigEditorState,
              result: unknown
            ): SchemaConfigEditorState => {
              const saved = applySavedId(sentName, result);
              return {
                ...current,
                name: current.name === sentName ? saved : current.name,
                initialName: saved,
              };
            },
          },
        ]
      : []),
    ...(descChanged
      ? [
          {
            promise: saveString(sentDesc),
            reconcile: (
              current: SchemaConfigEditorState,
              result: unknown
            ): SchemaConfigEditorState => {
              const saved = applySavedId(sentDesc, result);
              return {
                ...current,
                desc: current.desc === sentDesc ? saved : current.desc,
                initialDesc: saved,
              };
            },
          },
        ]
      : []),
    ...(containerChanged
      ? [
          {
            promise: saveResource(
              'SpLocaleContainer',
              sentContainer.id,
              sentContainer
            ),
            reconcile: (
              current: SchemaConfigEditorState
            ): SchemaConfigEditorState => ({
              ...current,
              initialContainer: sentContainer,
            }),
          },
        ]
      : []),
    ...editor.items.flatMap(({ strings, ...item }, index) =>
      editor.changedItems.includes(index)
        ? [
            {
              itemIndex: index,
              promise: saveResource('SpLocaleContainerItem', item.id, item),
              reconcile: (
                current: SchemaConfigEditorState
              ): SchemaConfigEditorState => current,
            },
            {
              itemIndex: index,
              promise: saveString(strings.name),
              reconcile: (
                current: SchemaConfigEditorState,
                result: unknown
              ): SchemaConfigEditorState =>
                applyItemStringId(current, index, 'name', strings.name, result),
            },
            {
              itemIndex: index,
              promise: saveString(strings.desc),
              reconcile: (
                current: SchemaConfigEditorState,
                result: unknown
              ): SchemaConfigEditorState =>
                applyItemStringId(current, index, 'desc', strings.desc, result),
            },
          ]
        : []
    ),
  ];
};

const saveString = async (
  resource: NewSpLocaleItemString | SpLocaleItemString
): Promise<unknown> =>
  'resource_uri' in resource &&
  typeof resource.id === 'number' &&
  resource.id >= 0
    ? saveResource('SpLocaleItemStr', resource.id, resource)
    : createResource('SpLocaleItemStr', resource);
