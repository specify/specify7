import React from 'react';

import { fetchCollection } from '../collection';
import type { Geography } from '../datamodel';
import type { AnyTree, FilterTablesByEndsWith } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import { hasTreeAccess } from '../permissions';
import { toTreeTable } from '../specifymodel';
import { isTreeResource } from '../treedefinitions';
import type { RA } from '../types';
import type { DefaultComboBoxProps, PickListItemSimple } from './combobox';
import { PickListComboBox } from './picklist';
import { resourceOn } from '../resource';
import { f } from '../functools';

const fetchPossibleRanks = async (
  lowestChildRank: number,
  parentTreeDefItem: SpecifyResource<FilterTablesByEndsWith<'TreeDefItem'>>,
  treeDefinitionId: number
): Promise<RA<PickListItemSimple>> =>
  fetchCollection(
    parentTreeDefItem.specifyModel.name,
    {
      limit: 0,
      treeDef: treeDefinitionId,
      orderBy: 'rankId',
    },
    {
      rankid__gt: parentTreeDefItem.get('rankId'),
      ...(lowestChildRank > 0 ? { rankid__lt: lowestChildRank } : {}),
    }
  ).then(({ records }) =>
    // Remove ranks after enforced rank
    f.var(
      records.findIndex((resource) => resource.isEnforced) + 1,
      (enforcedIndex) =>
        (enforcedIndex === 0 ? records : records.slice(0, enforcedIndex)).map(
          (resource) => ({
            value: resource.resource_uri,
            title: resource.title ?? resource.name,
          })
        )
    )
  );

export const fetchLowestChildRank = async (
  resource: SpecifyResource<AnyTree>
): Promise<number> =>
  resource.isNew()
    ? Promise.resolve(-1)
    : resource
        .rgetCollection('children')
        .then(({ models }) =>
          models.length === 0
            ? -1
            : Math.min(...models.map((resource) => resource.get('rankId')))
        );

/**
 * Pick list to chose a tree rank for a tree node
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
              ? treeDefinitionItem
                  .rgetPromise('treeDef')
                  .then(async ({ id }) =>
                    lowestChildRank.then(async (rankId) =>
                      fetchPossibleRanks(
                        rankId,
                        treeDefinitionItem as SpecifyResource<
                          FilterTablesByEndsWith<'TreeDefItem'>
                        >,
                        id
                      )
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
        props.model.get('parent') === null ||
        typeof items === 'undefined'
      }
    />
  );
}
