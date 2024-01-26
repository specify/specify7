import React from 'react';

import { treeText } from '../../localization/tree';
import { ajax } from '../../utils/ajax';
import type { IR, RA } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { DEFAULT_FETCH_LIMIT, fetchCollection } from '../DataModel/collection';
import type {
  AnyTree,
  FilterTablesByEndsWith,
  SerializedResource,
} from '../DataModel/helperTypes';
import { AutoComplete } from '../Molecules/AutoComplete';
import { userPreferences } from '../Preferences/userPreferences';

const getSearchField = (
  searchCaseSensitive: boolean,
  searchField: 'fullName' | 'name',
  searchAlgorithm: 'contains' | 'startsWith'
): string =>
  `${searchField}__${searchCaseSensitive ? '' : 'i'}${searchAlgorithm}`;

export function TreeViewSearch<SCHEMA extends AnyTree>({
  tableName,
  treeDefinitionItems,
  forwardRef,
  onFocusPath: handleFocusPath,
}: {
  readonly tableName: SCHEMA['tableName'];
  readonly treeDefinitionItems: RA<
    SerializedResource<FilterTablesByEndsWith<'TreeDefItem'>>
  >;
  readonly forwardRef: React.RefObject<HTMLInputElement | null>;
  readonly onFocusPath: (focusPath: RA<number>) => void;
}): JSX.Element {
  const [searchValue, setSearchValue] = React.useState<string>('');

  const [searchCaseSensitive] = userPreferences.use(
    'treeEditor',
    'behavior',
    'searchCaseSensitive'
  );
  const [searchField] = userPreferences.use(
    'treeEditor',
    'behavior',
    'searchField'
  );
  const [searchAlgorithm] = userPreferences.use(
    'treeEditor',
    'behavior',
    'searchAlgorithm'
  );
  const resolvedSearchField = getSearchField(
    searchCaseSensitive,
    searchField,
    searchAlgorithm
  );

  return (
    <div>
      {/* A React component that is also a TypeScript generic */}
      <AutoComplete<SerializedResource<SCHEMA>>
        filterItems={false}
        forwardRef={forwardRef}
        inputProps={{
          'aria-label': treeText.searchTreePlaceholder(),
          placeholder: treeText.searchTreePlaceholder(),
          title: treeText.searchTreePlaceholder(),
        }}
        source={async (value) =>
          fetchCollection(
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
            tableName as AnyTree['tableName'],
            {
              limit: DEFAULT_FETCH_LIMIT,
              orderBy: 'name',
              domainFilter: true,
            },
            {
              [resolvedSearchField]: searchCaseSensitive
                ? value
                : value.toLowerCase(),
            }
          ).then(({ records }) =>
            records.map((node) => {
              const rankDefinition = treeDefinitionItems.find(
                ({ rankId }) => rankId === node.rankId
              );
              const rankName = rankDefinition?.title || rankDefinition?.name;
              return {
                label: node.fullName ?? node.name,
                subLabel: rankName,
                data: node as SerializedResource<SCHEMA>,
              };
            })
          )
        }
        value={searchValue}
        onChange={({ label, data }): void => {
          setSearchValue(label as string);
          ajax<IR<string | { readonly rankid: number; readonly id: number }>>(
            `/api/specify_tree/${tableName.toLowerCase()}/${data.id}/path/`,
            {
              headers: { Accept: 'application/json' },
            }
          )
            .then(({ data }) =>
              handleFocusPath(
                Object.values(data)
                  .filter(
                    (
                      node
                    ): node is {
                      readonly rankid: number;
                      readonly id: number;
                    } => typeof node === 'object'
                  )
                  .sort(sortFunction(({ rankid }) => rankid))
                  .map(({ id }) => id)
              )
            )
            .catch(console.error);
        }}
        onCleared={(): void => setSearchValue('')}
      />
    </div>
  );
}
