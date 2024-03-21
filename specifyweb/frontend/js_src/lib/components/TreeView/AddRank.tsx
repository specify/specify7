import React from 'react';

import { commonText } from '../../localization/common';
import { interactionsText } from '../../localization/interactions';
import { treeText } from '../../localization/tree';
import { ping } from '../../utils/ajax/ping';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Label, Select } from '../Atoms/Form';
import { LoadingContext } from '../Core/Contexts';
import type {
  AnyTree,
  FilterTablesByEndsWith,
  SerializedResource,
} from '../DataModel/helperTypes';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { strictIdFromUrl } from '../DataModel/resource';
import { tables } from '../DataModel/tables';
import { GeographyTreeDefItem } from '../DataModel/types';
import { ResourceView } from '../Forms/ResourceView';
import { Dialog } from '../Molecules/Dialog';

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

  const [state, setState] = React.useState<'add' | 'initial' | 'parent'>(
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
          newRankName: treeResource.get('name'),
          parentRankName: parentRank,
          treeID: treeId,
          newRankTitle: treeResource.get('title'),
          remarks: treeResource.get('remarks'),
          textAfter: treeResource.get('textAfter'),
          textBefore: treeResource.get('textBefore'),
          isEnforced: treeResource.get('isEnforced'),
          isInFullName: treeResource.get('isInFullName'),
          fullNameSeparator: treeResource.get('fullNameSeparator'),
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
          resource={treeResource}
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
