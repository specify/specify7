import React from 'react';

import type { RA } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { fetchCollection } from '../DataModel/collection';
import { toTreeTable } from '../DataModel/helpers';
import type { AnyTree, SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { idFromUrl, resourceOn } from '../DataModel/resource';
import type { TreeDefItem } from '../DataModel/treeBusinessRules';
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
  treeName: AnyTree['tableName'],
  treeDefinitionId: number
): Promise<SerializedResource<TreeDefItem<AnyTree>>> =>
  treeRanksPromise.then(
    () =>
      strictGetTreeDefinitionItems(treeName, true, treeDefinitionId).find(
        ({ rankId }) => rankId === 0
      )!
  );

export const fetchPossibleRanks = async (
  resource: SpecifyResource<AnyTree>,
  parentDefinitionRankId: number,
  treeDefinitionId: number
): Promise<RA<SerializedResource<TreeDefItem<AnyTree>>>> =>
  treeRanksPromise
    .then(async () =>
      fetchLowestChildRank(resource).then((lowestChildRank) =>
        strictGetTreeDefinitionItems(
          resource.specifyTable.name,
          false,
          treeDefinitionId
        )
          .filter(
            ({ rankId }) =>
              rankId > parentDefinitionRankId &&
              (lowestChildRank <= 0 || rankId < lowestChildRank)
          )
          .sort(sortFunction(({ rankId }) => rankId))
      )
    )
    .then((ranks) => {
      const enforcedIndex = ranks.findIndex(({ isEnforced }) => isEnforced) + 1;
      // Remove ranks after enforced rank
      return enforcedIndex === 0 ? ranks : ranks.slice(0, enforcedIndex);
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

const ranksToPicklistItems = (
  ranks: RA<SerializedResource<TreeDefItem<AnyTree>>> | undefined
): RA<PickListItemSimple> | undefined =>
  ranks?.map((rank) => ({
    value: rank.resource_uri,
    title: (rank.title?.length ?? 0) === 0 ? rank.name : rank.title!,
  }));

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
              ? fetchPossibleRanks(
                  resource,
                  treeDefinitionItem.get('rankId'),
                  idFromUrl(treeDefinitionItem.get('treeDef'))!
                )
              : typeof resource.get('definitionItem') === 'string' &&
                !resource.isNew()
              ? ([
                  await fetchTreeRoot(
                    resource.specifyTable.name,
                    idFromUrl(resource.get('definition'))!
                  ),
                ] as RA<SerializedResource<TreeDefItem<AnyTree>>>)
              : undefined
          )
          .then((items) => {
            if (destructorCalled) return undefined;
            return void setItems(ranksToPicklistItems(items));
          }),
      true
    );
    let destructorCalled = false;
    return (): void => {
      destructorCalled = true;
      destructor();
    };
  }, [props.resource, props.defaultValue]);

  React.useEffect(() => {
    if (props.resource === undefined) return undefined;
    const resource = toTreeTable(props.resource);
    const definitionItem = resource?.get('definitionItem');

    const newDefinitionItem =
      props.defaultValue ?? items?.slice(-1)[0]?.value ?? '';

    const isDifferentDefinitionItem =
      newDefinitionItem !== (definitionItem ?? '');

    const invalidDefinitionItem =
      typeof definitionItem !== 'string' ||
      (!(items?.map(({ value }) => value).includes(definitionItem) ?? true) &&
        !Object.keys(resource?.changed ?? {}).includes('definitionitem'));

    if (
      isDifferentDefinitionItem &&
      (items !== undefined || typeof resource?.get('parent') !== 'string') &&
      invalidDefinitionItem
    ) {
      resource?.set('definitionItem', newDefinitionItem);
      return void resource?.businessRuleManager?.checkField('parent');
    }
    return undefined;
  }, [items]);

  return (
    <PickListComboBox
      {...props}
      isDisabled={
        props.isDisabled ||
        props.resource === undefined ||
        items?.length === 0 ||
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
  ranksToPicklistItems,
};
