import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { fetchCollection } from '../DataModel/collection';
import { toTreeTable } from '../DataModel/helpers';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import {
  strictGetTreeDefinitionItems,
  treeRanksPromise,
} from '../InitialContext/treeRanks';
import { hasTreeAccess } from '../Permissions/helpers';

export type QueryComboBoxTreeData = {
  readonly lowestChildRank: number | undefined;
  readonly treeRanks: RA<{
    readonly rankId: number;
    readonly isEnforced: boolean;
  }>;
};

export function useTreeData(
  resource: SpecifyResource<AnySchema> | undefined,
  field: LiteralField | Relationship
): QueryComboBoxTreeData | false | undefined {
  const [treeData] = useAsyncState<QueryComboBoxTreeData | false>(
    React.useCallback(async () => {
      if (resource === undefined) return;
      const treeResource = toTreeTable(resource);
      if (
        treeResource === undefined ||
        !hasTreeAccess(treeResource.specifyTable.name, 'read')
      )
        return false;
      if (field.name === 'parent') {
        return f.all({
          lowestChildRank: treeResource.isNew()
            ? Promise.resolve(undefined)
            : fetchCollection(
                treeResource.specifyTable.name,
                {
                  limit: 1,
                  orderBy: 'rankId',
                  domainFilter: false,
                },
                {
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  parent_id: treeResource.id,
                }
              ).then(({ records }) => records[0]?.rankId),
          treeRanks: treeRanksPromise.then(() =>
            strictGetTreeDefinitionItems(
              treeResource.specifyTable.name,
              false
            ).map((rank) => ({
              rankId: rank.rankId,
              isEnforced: rank.isEnforced ?? false,
            }))
          ),
        });
      } else if (field.name === 'acceptedParent') {
        // Don't need to do anything. Form system prevents lookups/edits
      } else if (
        field.name === 'hybridParent1' ||
        field.name === 'hybridParent2'
      ) {
        /*
         * No idea what restrictions there should be, the only obviously
         * required one — that a taxon is not a hybrid of itself, seems to
         * already be enforced
         */
      }
      return false;
    }, [resource, field]),
    false
  );
  return treeData;
}

/**
 * Context for passing down the tree definition of a CollectionObjectType.
 * Used for filtering Taxon values by tree.
 */
export const TreeDefinitionContext =
  React.createContext<string | undefined>(undefined);
TreeDefinitionContext.displayName = 'TreeDefinitionContext';