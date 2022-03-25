import React from 'react';

import type { AnyTree, FilterTablesByEndsWith } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import { isTreeResource } from '../treedefinitions';
import type { RA } from '../types';
import type { DefaultComboBoxProps, PickListItemSimple } from './combobox';
import { PickListComboBox } from './picklist';
import { toTreeTable } from '../specifymodel';
import { Geography } from '../datamodel';
import { hasToolPermission } from '../permissions';

async function fetchPossibleRanks(
  lowestChildRank: number,
  parentTreeDefItem: SpecifyResource<FilterTablesByEndsWith<'TreeDefItem'>>,
  treeDefinitionId: number
): Promise<RA<PickListItemSimple>> {
  const children = new parentTreeDefItem.specifyModel.LazyCollection({
    filters: {
      rankid__gt: parentTreeDefItem.get('rankId'),
      treedef: treeDefinitionId,
      orderby: 'rankid',
      ...(lowestChildRank > 0 ? { rankid__lt: lowestChildRank } : {}),
    },
  });
  return children.fetchPromise({ limit: 0 }).then(({ models }) =>
    // Remove ranks after enforced rank
    models
      .slice(0, models.findIndex((model) => model.get('isEnforced')) + 1)
      .map((model) => ({
        value: model.url(),
        title: model.get('title') ?? model.get('name'),
      }))
  );
}

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
            : Math.min(...models.map((model) => model.get('rankId')))
        );

export function TreeLevelComboBox(props: DefaultComboBoxProps): JSX.Element {
  const [items, setItems] = React.useState<RA<PickListItemSimple> | undefined>(
    undefined
  );
  React.useEffect(() => {
    const resource = toTreeTable(props.model);
    if (
      typeof resource === 'undefined' ||
      hasToolPermission(resource.specifyModel.name, 'read')
    )
      return undefined;
    const lowestChildRank = fetchLowestChildRank(resource);
    const handleFetch = (): void =>
      void resource
        .rgetPromise('parent')
        // Parent is undefined for root tree node
        .then(async (parent) =>
          (parent as SpecifyResource<Geography> | undefined)?.rgetPromise(
            'definitionItem',
            true
          )
        )
        .then((treeDefinitionItem) =>
          typeof treeDefinitionItem === 'object'
            ? treeDefinitionItem
                .rgetPromise('treeDef', true)
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
            : []
        )
        .then((items) => (destructorCalled ? undefined : setItems(items)));
    props.model.on('change:parent', handleFetch);
    handleFetch();
    let destructorCalled = false;
    return (): void => {
      destructorCalled = true;
      props.model.off('change:parent', handleFetch);
    };
  }, [props.model]);

  return (
    <PickListComboBox
      {...props}
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
