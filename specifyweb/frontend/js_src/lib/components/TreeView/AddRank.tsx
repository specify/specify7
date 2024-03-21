import React from 'react';

import { commonText } from '../../localization/common';
import { interactionsText } from '../../localization/interactions';
import { treeText } from '../../localization/tree';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Label, Select } from '../Atoms/Form';
import type {
  AnyTree,
  FilterTablesByEndsWith,
  SerializedResource,
} from '../DataModel/helperTypes';
import { tables } from '../DataModel/tables';
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
  const [state, setState] = React.useState<'add' | 'initial' | 'parent'>(
    'initial'
  );

  const [parentRank, setParentRank] = React.useState('');

  const treeResource = React.useMemo(
    () => new tables[treeDefinitionItems[0]._tableName].Resource(),
    [tableName]
  );

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
            setState('initial');
            globalThis.location.reload();
          }}
        />
      )}
    </>
  );
}
