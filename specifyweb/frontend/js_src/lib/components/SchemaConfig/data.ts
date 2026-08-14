import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { group } from '../../utils/utils';
import { fetchCollection } from '../DataModel/collection';
import { backendFilter, formatRelationshipPath } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import { getTable } from '../DataModel/tables';
import type {
  SpLocaleContainer,
  SpLocaleContainerItem,
} from '../DataModel/types';
import type { WithFetchedStrings } from '../Toolbar/SchemaConfig';
import { findString } from './helpers';
import type { NewSpLocaleItemString, SpLocaleItemString } from './index';

export const fetchContainerString = async (
  itemType: 'containerDesc' | 'containerName',
  container: SerializedResource<SpLocaleContainer>,
  language: string,
  country: string | null
): Promise<NewSpLocaleItemString | SpLocaleItemString> =>
  fetchCollection('SpLocaleItemStr', {
    limit: 0,
    [itemType]: container.id,
    domainFilter: false,
  }).then(({ records }) =>
    findString(records, language, country, itemType, container.resource_uri)
  );

export const fetchContainerItems = async (
  container: SerializedResource<SpLocaleContainer>,
  language: string,
  country: string | null
): Promise<
  RA<SerializedResource<SpLocaleContainerItem> & WithFetchedStrings>
> =>
  f
    .all({
      items: fetchCollection('SpLocaleContainerItem', {
        limit: 0,
        container: container.id,
        domainFilter: false,
      }),
      names: fetchCollection(
        'SpLocaleItemStr',
        {
          limit: 0,
          domainFilter: false,
        },
        backendFilter(formatRelationshipPath('itemName', 'container')).equals(
          container.id
        )
      ).then(({ records }) =>
        Object.fromEntries(group(records.map((name) => [name.itemName, name])))
      ),
      descriptions: fetchCollection(
        'SpLocaleItemStr',
        {
          limit: 0,
          domainFilter: false,
        },
        backendFilter(formatRelationshipPath('itemDesc', 'container')).equals(
          container.id
        )
      ).then(({ records }) =>
        Object.fromEntries(
          group(
            records.map((description) => [description.itemDesc, description])
          )
        )
      ),
    })
    .then(({ items, names, descriptions }) =>
      items.records
        .filter(
          (item) =>
            // Ignore removed fields (i.e, Accession->deaccessions)
            getTable(container.name)?.getField(item.name) !== undefined
        )
        .map((item) => ({
          ...item,
          strings: {
            name: findString(
              names[item.resource_uri],
              language,
              country,
              'itemName',
              item.resource_uri
            ),
            desc: findString(
              descriptions[item.resource_uri],
              language,
              country,
              'itemDesc',
              item.resource_uri
            ),
          },
        }))
    );
