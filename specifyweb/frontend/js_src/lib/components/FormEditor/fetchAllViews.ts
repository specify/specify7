import type { LocalizedString } from 'typesafe-i18n';

import { ajax } from '../../utils/ajax';
import type { RA } from '../../utils/types';
import { localized } from '../../utils/types';
import { defined } from '../../utils/types';
import { camelToHuman, split } from '../../utils/utils';
import { strictParseResourceUrl } from '../DataModel/resource';
import type { Tables } from '../DataModel/types';
import type { ViewDefinition } from '../FormParse';
import { userInformation } from '../InitialContext/userInformation';
import { formatUrl } from '../Router/queryString';

type PresentableViewDefinition = ViewDefinition & {
  readonly category: string;
  readonly editUrl: string | undefined;
  readonly disciplineId: number | undefined;
};

export type AllTableViews = {
  readonly database: RA<
    PresentableViewDefinition & { readonly collectionId: number }
  >;
  readonly disk: RA<PresentableViewDefinition>;
};

/**
 * Fetch all views for a given table accessible to current user in each collection
 * Note: this may result in duplicates
 */
export const fetchAllViews = async (
  tableName: keyof Tables,
  cache = false
): Promise<AllTableViews> =>
  Promise.all(
    userInformation.availableCollections.map(async ({ id }) =>
      ajax<RA<ViewDefinition>>(
        formatUrl('/context/views.json', {
          table: tableName,
          collectionId: id,
        }),
        {
          headers: {
            Accept: 'application/json',
          },
          cache: cache ? undefined : 'no-cache',
        }
      ).then(({ data }) => data.map((view) => ({ ...view, collectionId: id })))
    )
  ).then((data) => {
    const [disk, database] = split(
      data.flat(),
      (view) => view.viewsetFile === null
    );
    /*
     * Note, several requests may return the same view definition
     */
    return {
      // Deduplicate views from database
      database: Object.values(
        Object.fromEntries(
          database.map((view) => [`${view.viewsetId ?? ''}_${view.name}`, view])
        )
      ).map((view) => augmentDatabaseView(tableName, view)),
      // Deduplicate views from disk
      disk: Object.values(
        Object.fromEntries(
          disk.map((view) => [`${view.viewsetFile ?? ''}_${view.name}`, view])
        )
      ).map(augmentDiskView),
    };
  });

const augmentDatabaseView = (
  tableName: keyof Tables,
  view: ViewDefinition & { readonly collectionId: number }
): PresentableViewDefinition & { readonly collectionId: number } => ({
  ...view,
  category:
    (view.viewsetLevel === 'Collection'
      ? userInformation.availableCollections.find(
          ({ id }) => id === view.collectionId
        )?.collectionName
      : undefined) ?? camelToHuman(view.viewsetName),
  disciplineId: strictParseResourceUrl(
    defined(
      userInformation.availableCollections.find(
        ({ id }) => id === view.collectionId
      )?.discipline
    )
  )[1],
  editUrl:
    view.viewsetId === null
      ? undefined
      : `/specify/resources/view-set/${view.viewsetId}/${tableName}/${view.name}/`,
});

const augmentDiskView = (view: ViewDefinition): PresentableViewDefinition => ({
  ...view,
  category:
    typeof view.viewsetFile === 'string'
      ? filePathToHuman(view.viewsetFile)
      : camelToHuman(view.viewsetLevel),
  disciplineId: undefined,
  editUrl: undefined,
});

export function filePathToHuman(path: string): LocalizedString {
  const parts = path
    .split('/')
    .filter((part) => part !== '.' && part.length > 0);
  const baseParts = parts.slice(0, -1);
  const fileName = parts.at(-1)!.split('.')[0];
  const result = (
    baseParts.at(-1) === fileName ? baseParts : [...baseParts, fileName]
  )
    .map(camelToHuman)
    .join(' > ');
  return localized(result);
}
