import React from 'react';

import { fetchCollection } from '../collection';
import type { Geography } from '../datamodel';
import type { AnyTree } from '../datamodelutils';
import { f } from '../functools';
import { sortFunction } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import { hasTreeAccess } from '../permissions';
import { resourceOn } from '../resource';
import { toTreeTable } from '../specifymodel';
import {
  getTreeDefinitionItems,
  isTreeResource,
  treeRanksPromise,
} from '../treedefinitions';
import type { RA } from '../types';
import { defined } from '../types';
import type { DefaultComboBoxProps, PickListItemSimple } from './combobox';
import { PickListComboBox } from './picklist';

const fetchPossibleRanks = async (
  lowestChildRank: number,
  parentRankId: number,
  treeName: AnyTree['tableName']
): Promise<RA<PickListItemSimple>> =>
  treeRanksPromise
    .then(() =>
      defined(getTreeDefinitionItems(treeName, false))
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
      typeof resource === 'undefined' ||
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
      isRequired={
        props.model.specifyModel.getRelationship('definitionItem')
          ?.isRequired ?? true
      }
      items={items}
      onAdd={undefined}
      pickList={undefined}
      // Select next enforced rank by default
      defaultValue={props.defaultValue ?? items?.slice(-1)[0]?.value}
      isDisabled={
        props.isDisabled ||
        !isTreeResource(props.model) ||
        props.model.get('parent') === null
      }
    />
  );
}
