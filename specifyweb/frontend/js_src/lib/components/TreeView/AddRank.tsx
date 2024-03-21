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
import { Label, Select } from '../Atoms/Form';
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

  const [state, setState] = React.useState<'initial' | 'parent' | 'add'>(
    'initial'
  );

  const [parentRank, setParentRank] = React.useState('');
  const treeId = strictIdFromUrl(treeDefinitionItems[0].treeDef);

  const treeResource = React.useMemo(
    () => new tables[treeDefinitionItems[0]._tableName].Resource(),
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
    setState('initial');
  }

  return (
    <>
      <Button.Icon
        icon="plus"
        title={treeText.addNewRank()}
        onClick={() => setState('parent')}
      />
      {state === 'parent' && (
        <Dialog
          buttons={
            <>
              <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
              <Button.Save
                onClick={() => {
                  setState('add');
                }}
              >
                {interactionsText.continue()}
              </Button.Save>
            </>
          }
          header={treeText.chooseParentRank()}
          onClose={() => setState('initial')}
        >
          <Label.Block className="gap-2">
            {treeText.chooseParentRank()}
            <Select
              className="w-full min-w-[theme(spacing.40)]"
              value={parentRank}
              onChange={({ target }): void => setParentRank(target.value || '')}
            >
              {treeDefinitionItems.map((rank, index) => (
                <option key={index} value={rank.name}>
                  {rank.name}
                </option>
              ))}
            </Select>
          </Label.Block>
        </Dialog>
      )}
      {state === 'add' && (
        <ResourceView
          dialog="modal"
          isDependent={false}
          isSubForm={false}
          resource={treeResource as SpecifyResource<GeographyTreeDefItem>}
          title={treeText.addNewRank()}
          onAdd={undefined}
          onClose={(): void => setState('initial')}
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
