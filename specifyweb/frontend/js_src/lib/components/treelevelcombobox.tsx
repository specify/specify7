import React from 'react';

import type { Taxon } from '../datamodel';
import type { FilterTablesByEndsWith } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import type { RA } from '../types';
import type { DefaultComboBoxProps, PickListItemSimple } from './combobox';
import { crash } from './errorboundary';
import { PickListComboBox } from './picklist';

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
  return children.fetch({ limit: 0 }).then(({ models }) =>
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
  const [items, setItems] = React.useState<RA<PickListItemSimple>>([]);
  React.useEffect(() => {
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
    Promise.resolve(model.rget('parent'))
      .then(async (parent) =>
        Promise.resolve(parent.rget('definitionItem', true))
      )
      .then((treeDefinitionItem) =>
        typeof treeDefinitionItem === 'object'
          ? Promise.resolve(treeDefinitionItem.rget('treeDef', true)).then(
              async ({ id }) =>
                lowestChildRank.then(async (rankId) =>
                  getPossibleRanks(rankId, treeDefinitionItem, id)
                )
            )
          : []
      )
      .then(setItems)
      .catch(crash);
  }, [props.model]);

  return (
    <PickListComboBox
      {...props}
      items={items}
      onAdd={undefined}
      pickList={undefined}
      // Select next enforced rank by default
      defaultValue={props.defaultValue ?? items.slice(-1)[0]?.value}
      disabled={props.disabled || props.model.get('parent') === null}
    />
  );
}
