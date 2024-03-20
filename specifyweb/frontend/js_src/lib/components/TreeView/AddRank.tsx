import React from 'react';
import { Button } from '../Atoms/Button';
import { treeText } from '../../localization/tree';
import { LoadingContext } from '../Core/Contexts';
import { tables } from '../DataModel/tables';
import {
  AnyTree,
  FilterTablesByEndsWith,
  SerializedResource,
} from '../DataModel/helperTypes';
import { ping } from '../../utils/ajax/ping';
import { Dialog } from '../Molecules/Dialog';
import { commonText } from '../../localization/common';
import { interactionsText } from '../../localization/interactions';
import { Select } from '../Atoms/Form';
import { RA } from '../../utils/types';
import { ResourceView } from '../Forms/ResourceView';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { GeographyTreeDefItem } from '../DataModel/types';
import { strictIdFromUrl } from '../DataModel/resource';

export function AddRank<SCHEMA extends AnyTree>({
  tableName,
  treeDefinitionItems,
}: {
  readonly tableName: SCHEMA['tableName'];
  readonly treeDefinitionItems: RA<
    SerializedResource<FilterTablesByEndsWith<'TreeDefItem'>>
  >;
}): JSX.Element {
  const loading = React.useContext(LoadingContext);

  const [isAddingRank, setIsAddingRank] = React.useState(false);
  const [isAddingParentRank, setIsAddingParentRank] = React.useState(false);

  const [parentRank, setParentRank] = React.useState('');
  const treeId = strictIdFromUrl(treeDefinitionItems[0].treeDef);

  const treeResource = React.useMemo(
    () =>
      tableName === 'Geography'
        ? new tables.GeographyTreeDefItem.Resource({
            _tableName: 'GeographyTreeDefItem',
          })
        : tableName === 'Taxon'
        ? new tables.TaxonTreeDefItem.Resource({
            _tableName: 'TaxonTreeDefItem',
          })
        : tableName === 'LithoStrat'
        ? new tables.LithoStratTreeDefItem.Resource({
            _tableName: 'LithoStratTreeDefItem',
          })
        : new tables.StorageTreeDefItem.Resource({
            _tableName: 'StorageTreeDefItem',
          }),
    [tableName]
  );

  function addRank(): void {
    const url = `/api/specify_tree/${tableName.toLowerCase()}/add_tree_rank/`;
    loading(
      ping(url, {
        method: 'POST',
        body: {
          newRankName: (
            treeResource as SpecifyResource<GeographyTreeDefItem>
          ).get('name'),
          parentRankName: parentRank,
          treeID: treeId,
          newRankTitle: (
            treeResource as SpecifyResource<GeographyTreeDefItem>
          ).get('title'),
          remarks: (treeResource as SpecifyResource<GeographyTreeDefItem>).get(
            'remarks'
          ),
          textAfter: (
            treeResource as SpecifyResource<GeographyTreeDefItem>
          ).get('textAfter'),
          textBefore: (
            treeResource as SpecifyResource<GeographyTreeDefItem>
          ).get('textBefore'),
          isEnforced: (
            treeResource as SpecifyResource<GeographyTreeDefItem>
          ).get('isEnforced'),
          isInFullName: (
            treeResource as SpecifyResource<GeographyTreeDefItem>
          ).get('isInFullName'),
          fullNameSeparator: (
            treeResource as SpecifyResource<GeographyTreeDefItem>
          ).get('fullNameSeparator'),
        },
      }).then(() => globalThis.location.reload())
    );
    setIsAddingRank(false);
  }

  return (
    <>
      <Button.Icon
        icon="plus"
        title={treeText.addNewRank()}
        onClick={() => setIsAddingParentRank(true)}
      />
      {isAddingParentRank && (
        <Dialog
          buttons={
            <>
              <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
              <Button.Save
                onClick={() => {
                  setIsAddingRank(true);
                  setIsAddingParentRank(false);
                }}
              >
                {interactionsText.continue()}
              </Button.Save>
            </>
          }
          header={treeText.chooseParentRank()}
          onClose={() => setIsAddingParentRank(false)}
        >
          <Select
            aria-label={treeText.chooseParentRank()}
            className="w-full min-w-[theme(spacing.40)]"
            value={parentRank}
            onChange={({ target }): void => setParentRank(target.value || '')}
          >
            <option disabled value="">
              {treeText.chooseParentRank()}
            </option>
            {treeDefinitionItems.map((rank, index) => (
              <option key={index} value={rank.name}>
                {rank.name}
              </option>
            ))}
          </Select>
        </Dialog>
      )}
      {isAddingRank && (
        <ResourceView
          dialog="modal"
          isDependent={false}
          isSubForm={false}
          resource={treeResource as SpecifyResource<GeographyTreeDefItem>}
          title={treeText.addNewRank()}
          onAdd={undefined}
          onClose={(): void => setIsAddingRank(false)}
          onDeleted={undefined}
          onSaved={undefined}
          onSaving={() => {
            addRank();
            return false;
          }}
        />
      )}
    </>
  );
}
