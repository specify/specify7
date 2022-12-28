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
  resource: SpecifyResource<AnySchema>,
  field: LiteralField | Relationship
): QueryComboBoxTreeData | false | undefined {
  const [treeData] = useAsyncState<QueryComboBoxTreeData | false>(
    React.useCallback(() => {
      const treeResource = toTreeTable(resource);
      if (
        treeResource === undefined ||
        !hasTreeAccess(treeResource.specifyModel.name, 'read')
      )
        return false;
      if (field.name === 'parent') {
        return f.all({
          lowestChildRank: treeResource.isNew()
            ? Promise.resolve(undefined)
            : fetchCollection(
                treeResource.specifyModel.name,
                {
                  limit: 1,
                  orderBy: 'rankId',
                },
                {
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  parent_id: treeResource.id,
                }
              ).then(({ records }) => records[0]?.rankId),
          treeRanks: treeRanksPromise.then(() =>
            strictGetTreeDefinitionItems(
              treeResource.specifyModel.name,
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
