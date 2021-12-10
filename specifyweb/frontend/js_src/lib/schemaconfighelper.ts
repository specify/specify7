import type { ItemType } from './components/schemaconfig';
import type {
  SpLocaleItem,
  SpLocaleItemStr as SpLocaleItemString,
} from './components/schemaconfig';
import type { WithFetchedStrings } from './components/schemaconfigwrapper';
import type { IR, RA } from './components/wbplanview';
import commonText from './localization/common';

export const sortObjectsByKey = <
  KEY extends string,
  T extends Record<KEY, unknown>
>(
  objects: RA<T>,
  key: KEY
): RA<T> =>
  Array.from(objects).sort(({ [key]: keyLeft }, { [key]: keyRight }) =>
    keyLeft > keyRight ? 1 : keyLeft === keyRight ? 0 : -1
  );

const fetchString = async (
  url: string,
  language: string,
  country?: string,
): Promise<SpLocaleItemString> =>
  fetch(
    `${url}&language=${language}&country${
      typeof country === 'undefined' ? `__isnull=true` : `=${country}&limit=1`
    }`
  )
    .then<{ readonly objects: Readonly<[SpLocaleItemString]> }>(
      async (response) => response.json()
    )
    .then(({ objects }) => {
      if (typeof objects[0] === 'undefined')
        /*
         * TODO: better handle cases when string for that language does not
         *  exist
         */
        throw new Error(
          `Unable to find a string for ${language}_${country ?? ''} in ${url}`
        );
      else return objects[0];
    });

export const fetchStrings = async <
  T extends { readonly names: string; readonly descs: string }
>(
  objects: RA<T>,
  language: string,
  country?: string
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

export function getItemType(item: SpLocaleItem): ItemType {
  if (item.weblinkname !== null) return 'webLink';
  else if (item.picklistname !== null) return 'pickList';
  else if (item.isuiformatter) return 'formatted';
  else return 'none';
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
