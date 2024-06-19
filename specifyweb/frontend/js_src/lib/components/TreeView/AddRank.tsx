import React from 'react';

import { commonText } from '../../localization/common';
import { interactionsText } from '../../localization/interactions';
import { treeText } from '../../localization/tree';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Form, Label, Select } from '../Atoms/Form';
import type {
  FilterTablesByEndsWith,
  SerializedResource,
} from '../DataModel/helperTypes';
import { tables } from '../DataModel/tables';
import { ResourceView } from '../Forms/ResourceView';
import { Dialog } from '../Molecules/Dialog';
import { Submit } from '../Atoms/Submit';
import { useId } from '../../hooks/useId';

export function AddRank({
  treeDefinitionItems,
}: {
  readonly treeDefinitionItems: RA<
    SerializedResource<FilterTablesByEndsWith<'TreeDefItem'>>
  >;
}): JSX.Element {
  const [state, setState] = React.useState<'add' | 'initial' | 'parent'>(
    'initial'
  );

  const [parentRank, setParentRank] = React.useState(
    treeDefinitionItems[0].resource_uri
  );

  const treeDef = treeDefinitionItems[0].treeDef;

  const treeResource = React.useMemo(() => {
    const resource = new tables[treeDefinitionItems[0]._tableName].Resource();
    resource.set('treeDef', treeDef);
    return resource;
  }, [treeDef]);
  const id = useId('add-rank');

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
              <Submit.Save
                onClick={() => {
                  treeResource.set('parent', parentRank);
                  setState('add');
                }}
                form={id('form')}
              >
                {interactionsText.continue()}
              </Submit.Save>
            </>
          }
          header={treeText.chooseParentRank()}
          onClose={() => setState('initial')}
        >
          <Form id={id('form')}>
            <Label.Block className="gap-2">
              {treeText.chooseParentRank()}
              <Select
                className="w-full min-w-[theme(spacing.40)]"
                value={parentRank}
                onChange={({ target }): void => {
                  setParentRank(target.value);
                }}
              >
                {treeDefinitionItems.map((rank, index) => (
                  <option key={index} value={rank.resource_uri}>
                    {rank.name}
                  </option>
                ))}
              </Select>
            </Label.Block>
          </Form>
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
          onSaved={() => {
            globalThis.location.reload();
          }}
        />
      )}
    </>
  );
}
