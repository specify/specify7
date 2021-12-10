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

export const isRelationship = (item: SpLocaleItem): boolean =>
  item.type === null ? false : item.type! in relationshipTypes;

const fetchString = async (
  url: string,
  language: string,
  country?: string
): Promise<SpLocaleItemString> =>
  // TODO: add country parameter here
  fetch(`${url}&language=${language}`)
    .then<{ readonly objects: RA<SpLocaleItemString> }>(async (response) =>
      response.json()
    )
    .then(({ objects }) => {
      const targetString = objects.find(
        (object) => object.language === language && object.country == country
      );
      if (typeof targetString === 'undefined')
        throw new Error(
          `Unable to find a string for ${language}_${country ?? ''} in ${url}`
        );
      else return targetString;
      /*
       * TODO: better handle cases when string for that language does not
       *  exist
       */
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

const relationshipTypes: IR<string> = {
  OneToOne: commonText('oneToOne'),
  OneToMany: commonText('oneToMany'),
  ManyToOne: commonText('manyToOne'),
  ManyToMany: commonText('manyToMany'),
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
