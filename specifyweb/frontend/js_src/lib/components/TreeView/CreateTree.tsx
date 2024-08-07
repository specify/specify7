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
  const [selectedResource, setSelectedResource] = React.useState<Partial<SerializedResource<TaxonTreeDef>> | null>(null);

  // TODO: Test resource, will need to be removed later on.
  const treeDefResource: Partial<SerializedResource<TaxonTreeDef>> = {
    _tableName: 'TaxonTreeDef',
    name: 'Test',
    remarks: 'This is a test',
    fullNameDirection: 1,
  }

  const treeDefResource2: Partial<SerializedResource<TaxonTreeDef>> = {
    _tableName: 'TaxonTreeDef',
    name: 'second test',
    remarks: 'Testing another',
    fullNameDirection: 1,
  }

  // May be a good idea to separate second dialog into own component/function, since hook needs to be used outside of the condition.
  const resource = React.useMemo(
    () =>
      deserializeResource(treeDefResource), []
  );

  const resource2 = React.useMemo(
    () =>
      deserializeResource(treeDefResource2), []
  );
  //Non-serialized resource version. Does work.
  //const treeDefResource = React.useMemo(() => new tables.TaxonTreeDef.Resource(), []);

  const handleTextClick = () => {
    setSelectedResource(resource);
    setIsActive(2);
  };

  const handleTextClick2 = () => {
    setSelectedResource(resource2);
    setIsActive(2);
  };

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
            <li>
              <span onClick={handleTextClick} className="cursor-pointer text-blue-500">
                Test first resource view
              </span>
            </li>
            <li>
              <span onClick={handleTextClick2} className="cursor-pointer text-blue-500">
                Test second resource view
              </span>
            </li>
          </Ul>
        </Dialog>
      ) : null}
      {isActive === 2 && selectedResource ? (
          <ResourceView 
          dialog = "modal"
          onClose={() => setIsActive(0)}
          resource={selectedResource} />
      ) : null}
    </>
  );
}
