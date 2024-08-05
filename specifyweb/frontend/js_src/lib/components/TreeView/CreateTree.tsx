/*
 *WIP File to separate out functions for adding trees.
 *Contains stuff for dialogs, etc.
 *
 *TODO:
 *- Finish CreateTree function
 *- Add in list of default options
 */
import React from 'react';

import { commonText } from '../../localization/common';
import { treeText } from '../../localization/tree';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import type { AnyTree, FilterTablesByEndsWith } from '../DataModel/helperTypes';
import { tables } from '../DataModel/tables';
import { ResourceView } from '../Forms/ResourceView';
import { userInformation } from '../InitialContext/userInformation';
import { Dialog } from '../Molecules/Dialog';

export function CreateTree<SCHEMA extends AnyTree>({
  tableName,
}: {
  readonly tableName: SCHEMA['tableName'];
}): JSX.Element {

  const [isActive, setIsActive] = React.useState(0);

  // TODO: Go serialized resource route instead, so we can easily read the default tree.
  /*const treeDefResource: SerializedResource<TaxonTreeDef> = {
    name: 'test',
    remarks: 'this is a test tree',
    fullnamedirection: 'forward',
  }*/

  // Currently, ResourceView is reloading each time you try to add a TreeDefItem. Needs to be solved
  // May be solved by serialization and useMemo
  const treeDefResource = React.useMemo(() => new tables.TaxonTreeDef.Resource(), []);

  return (
    <>
      {tableName === 'Taxon' && userInformation.isadmin ? (
        <Button.Icon
          className={className.dataEntryAdd}
          icon="plus"
          title={treeText.addTree()}
          onClick={() => {
            setIsActive(1);
          }}
        />
      ) : null}
      {isActive === 1 ? (
        <Dialog
          buttons={
            <>
              <Button.DialogClose component={Button.BorderedGray}>
                {commonText.cancel()}
              </Button.DialogClose>
              <Button.Info onClick={() => setIsActive(2)}>
                {treeText.addTree()}
              </Button.Info>
            </>
          }
          header={treeText.addTree()}
          onClose={() => setIsActive(0)}
        >
          <Ul className="flex flex-col gap-2">
            <li />
          </Ul>
        </Dialog>
      ) : isActive === 2 ? (
          <ResourceView
            dialog="modal"
            isDependent={false}
            isSubForm={false}
            resource={treeDefResource}
            title={treeText.newTree()}
            onAdd={undefined}
            onClose={() => setIsActive(0)}
            onDeleted={undefined}
            onSaved={(): void => globalThis.location.reload()}
          />
      ) : null}
    </>
  );
}
