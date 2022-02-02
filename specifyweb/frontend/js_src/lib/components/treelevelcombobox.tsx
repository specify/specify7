import React from 'react';

import type { Taxon } from '../datamodel';
import type { FilterTablesByEndsWith } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import type { RA } from '../types';
import type { DefaultComboBoxProps, PickListItemSimple } from './combobox';
import { PickListComboBox } from './picklist';
import { useAsyncState } from './hooks';

async function getPossibleRanks(
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

export function TreeLevelComboBox(props: DefaultComboBoxProps): JSX.Element {
  const [items] = useAsyncState<RA<PickListItemSimple>>(
    React.useCallback(async () => {
      props.model.on('change:parent', () => {});
      const model = props.model as SpecifyResource<Taxon>;
      const lowestChildRank = model.isNew()
        ? Promise.resolve(-1)
        : model
            .rgetCollection('children')
            .then(({ models }) =>
              models.length === 0
                ? -1
                : Math.min(...models.map((model) => model.get('rankId')))
            );
      return model
        .rgetPromise('parent')
        .then(async (parent) => parent.rgetPromise('definitionItem', true))
        .then((treeDefinitionItem) =>
          typeof treeDefinitionItem === 'object'
            ? treeDefinitionItem
                .rgetPromise('treeDef', true)
                .then(async ({ id }) =>
                  lowestChildRank.then(async (rankId) =>
                    getPossibleRanks(rankId, treeDefinitionItem, id)
                  )
                )
            : []
        );
    }, [props.model])
  );

  return (
    <PickListComboBox
      {...props}
      items={items ?? []}
      onAdd={undefined}
      pickList={undefined}
      // Select next enforced rank by default
      defaultValue={props.defaultValue ?? items?.slice(-1)[0]?.value}
      disabled={props.disabled || props.model.get('parent') === null}
    />
  );
}
