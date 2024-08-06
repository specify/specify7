/*
 *WIP File to separate out functions for adding trees.
 *Contains stuff for dialogs, etc.
 *
 *TODO:
 *- Finish CreateTree function
 *- Add in list of default options
 *- Figure out how to pass default options to second dialog.
 */
import React from 'react';

import { commonText } from '../../localization/common';
import { treeText } from '../../localization/tree';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import type { AnyTree , SerializedResource} from '../DataModel/helperTypes';
import { deserializeResource } from '../DataModel/serializers';
import { TaxonTreeDef } from '../DataModel/types';
import { ResourceView } from '../Forms/ResourceView';
import { userInformation } from '../InitialContext/userInformation';
import { Dialog } from '../Molecules/Dialog';

export function CreateTree<SCHEMA extends AnyTree>({
  tableName,
}: {
  readonly tableName: SCHEMA['tableName'];
}): JSX.Element {

  const [isActive, setIsActive] = React.useState(0);

  // TODO: Test resource, will need to be removed later on.
  const treeDefResource: Partial<SerializedResource<TaxonTreeDef>> = {
    _tableName: 'TaxonTreeDef',
    name: 'Test',
    remarks: 'This is a test',
    fullNameDirection: 1,
  }

  // May be a good idea to separate second dialog into own component/function, since hook needs to be used outside of the condition.
  const resource = React.useMemo(
    () =>
      deserializeResource(treeDefResource), []
  );

  //Non-serialized resource version. Does work.
  //const treeDefResource = React.useMemo(() => new tables.TaxonTreeDef.Resource(), []);

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
            resource={resource}
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
