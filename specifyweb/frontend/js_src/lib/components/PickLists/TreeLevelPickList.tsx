import React from 'react';

import { fetchCollection } from '../DataModel/collection';
import type { Geography } from '../DataModel/types';
import { f } from '../../utils/functools';
import { sortFunction } from '../../utils/utils';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { hasTreeAccess } from '../Permissions/helpers';
import { resourceOn } from '../DataModel/resource';
import {
  getTreeDefinitionItems,
  isTreeResource,
  treeRanksPromise,
} from '../InitialContext/treeRanks';
import type { RA } from '../../utils/types';
import { defined } from '../../utils/types';
import type {
  DefaultComboBoxProps,
  PickListItemSimple,
} from '../FormFields/ComboBox';
import { PickListComboBox } from './index';
import { AnyTree } from '../DataModel/helperTypes';
import { toTreeTable } from '../DataModel/helpers';

const fetchPossibleRanks = async (
  lowestChildRank: number,
  parentRankId: number,
  treeName: AnyTree['tableName']
): Promise<RA<PickListItemSimple>> =>
  treeRanksPromise
    .then(() =>
      defined(getTreeDefinitionItems(treeName as 'Geography', false))
        .filter(
          ({ rankId }) =>
            rankId > parentRankId &&
            (lowestChildRank <= 0 || rankId < lowestChildRank)
        )
        .sort(sortFunction(({ rankId }) => rankId))
    )
    .then((ranks) =>
      // Remove ranks after enforced rank
      f.var(
        ranks.findIndex(({ isEnforced }) => isEnforced) + 1,
        (enforcedIndex) =>
          (enforcedIndex === 0 ? ranks : ranks.slice(0, enforcedIndex)).map(
            (rank) => ({
              value: rank.resource_uri,
              title: rank.title || rank.name,
            })
          )
      )
    );

export const fetchLowestChildRank = async (
  resource: SpecifyResource<AnyTree>
): Promise<number> =>
  resource.isNew()
    ? Promise.resolve(-1)
    : fetchCollection(resource.specifyModel.name, {
        limit: 1,
        parent: resource.id,
        orderBy: 'rankId',
      }).then(({ records }) => records[0]?.rankId ?? -1);

/**
 * Pick list to choose a tree rank for a tree node
 */
export function TreeLevelComboBox(props: DefaultComboBoxProps): JSX.Element {
  const [items, setItems] = React.useState<RA<PickListItemSimple> | undefined>(
    undefined
  );
  React.useEffect(() => {
    const resource = toTreeTable(props.model);
    if (
      resource === undefined ||
      !hasTreeAccess(resource.specifyModel.name, 'read')
    )
      return undefined;
    const lowestChildRank = fetchLowestChildRank(resource);
    const destructor = resourceOn(
      props.model,
      'change:parent',
      (): void =>
        void resource
          .rgetPromise('parent')
          // Parent is undefined for root tree node
          .then(async (parent) =>
            (parent as SpecifyResource<Geography> | undefined)?.rgetPromise(
              'definitionItem'
            )
          )
          .then((treeDefinitionItem) =>
            typeof treeDefinitionItem === 'object'
              ? lowestChildRank.then(async (rankId) =>
                  fetchPossibleRanks(
                    rankId,
                    treeDefinitionItem.get('rankId'),
                    resource.specifyModel.name
                  )
                )
              : undefined
          )
          .then((items) => (destructorCalled ? undefined : setItems(items))),
      true
    );
    let destructorCalled = false;
    return (): void => {
      destructorCalled = true;
      destructor();
    };
  }, [props.model]);

  return (
    <PickListComboBox
      {...props}
      defaultValue={props.defaultValue ?? items?.slice(-1)[0]?.value}
      isDisabled={
        props.isDisabled ||
        !isTreeResource(props.model) ||
        props.model.get('parent') === null
      }
      isRequired={
        props.model.specifyModel.getRelationship('definitionItem')
          ?.isRequired ?? true
      }
      items={items}
      // Select next enforced rank by default
      pickList={undefined}
      onAdd={undefined}
    />
  );
}
