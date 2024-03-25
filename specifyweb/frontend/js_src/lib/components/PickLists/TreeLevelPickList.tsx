import React from 'react';

import type { RA } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { fetchCollection } from '../DataModel/collection';
import { toTreeTable } from '../DataModel/helpers';
import type { AnyTree } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceOn } from '../DataModel/resource';
import type { Geography } from '../DataModel/types';
import type {
  DefaultComboBoxProps,
  PickListItemSimple,
} from '../FormFields/ComboBox';
import {
  isTreeResource,
  strictGetTreeDefinitionItems,
  treeRanksPromise,
} from '../InitialContext/treeRanks';
import { hasTreeAccess } from '../Permissions/helpers';
import { PickListComboBox } from './index';

const fetchTreeRoot = async (
  treeName: AnyTree['tableName']
): Promise<RA<PickListItemSimple>> =>
  treeRanksPromise
    .then(
      () =>
        strictGetTreeDefinitionItems(treeName as 'Geography', true).find(
          ({ rankId }) => rankId === 0
        )!
    )
    .then((rank) => [
      {
        value: rank.resource_uri,
        title: (rank.title?.length ?? 0) === 0 ? rank.name : rank.title!,
      },
    ]);

const fetchPossibleRanks = async (
  lowestChildRank: number,
  parentRankId: number,
  treeName: AnyTree['tableName']
): Promise<RA<PickListItemSimple>> =>
  treeRanksPromise
    .then(() =>
      strictGetTreeDefinitionItems(treeName as 'Geography', false)
        .filter(
          ({ rankId }) =>
            rankId > parentRankId &&
            (lowestChildRank <= 0 || rankId < lowestChildRank)
        )
        .sort(sortFunction(({ rankId }) => rankId))
    )
    .then((ranks) => {
      const enforcedIndex = ranks.findIndex(({ isEnforced }) => isEnforced) + 1;
      // Remove ranks after enforced rank
      return (enforcedIndex === 0 ? ranks : ranks.slice(0, enforcedIndex)).map(
        (rank) => ({
          value: rank.resource_uri,
          title: (rank.title?.length ?? 0) === 0 ? rank.name : rank.title!,
        })
      );
    });

const fetchLowestChildRank = async (
  resource: SpecifyResource<AnyTree>
): Promise<number> =>
  resource.isNew()
    ? Promise.resolve(-1)
    : fetchCollection(resource.specifyTable.name, {
        limit: 1,
        parent: resource.id,
        orderBy: 'rankId',
        domainFilter: false,
      }).then(({ records }) => records[0]?.rankId ?? -1);

/**
 * Pick list to choose a tree rank for a tree node
 */
export function TreeLevelComboBox(props: DefaultComboBoxProps): JSX.Element {
  const [items, setItems] = React.useState<RA<PickListItemSimple> | undefined>(
    undefined
  );
  React.useEffect(() => {
    if (props.resource === undefined) return undefined;
    const resource = toTreeTable(props.resource);
    if (
      resource === undefined ||
      !hasTreeAccess(resource.specifyTable.name, 'read')
    )
      return undefined;
    const lowestChildRank = fetchLowestChildRank(resource);
    const destructor = resourceOn(
      props.resource,
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
          .then(async (treeDefinitionItem) =>
            typeof treeDefinitionItem === 'object'
              ? lowestChildRank.then(async (rankId) =>
                  fetchPossibleRanks(
                    rankId,
                    treeDefinitionItem.get('rankId'),
                    resource.specifyTable.name
                  )
                )
              : typeof resource.get('definitionItem') === 'string' &&
                !resource.isNew()
              ? fetchTreeRoot(resource.specifyTable.name)
              : undefined
          )
          .then((items) => {
            if (destructorCalled) return undefined;
            if (typeof resource.get('definitionItem') !== 'string')
              resource.set(
                'definitionItem',
                props.defaultValue ?? items?.slice(-1)[0]?.value ?? ''
              );
            return void setItems(items);
          }),
      true
    );
    let destructorCalled = false;
    return (): void => {
      destructorCalled = true;
      destructor();
    };
  }, [props.resource, props.defaultValue]);

  return (
    <PickListComboBox
      {...props}
      isDisabled={
        props.isDisabled ||
        props.resource === undefined ||
        !isTreeResource(props.resource) ||
        typeof props.resource.get('parent') !== 'string'
      }
      isRequired={
        props.resource?.specifyTable.getRelationship('definitionItem')
          ?.isRequired ?? true
      }
      items={items ?? []}
      pickList={undefined}
    />
  );
}

export const exportsForTests = {
  fetchPossibleRanks,
  fetchLowestChildRank,
};
