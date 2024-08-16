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
import { defaultTreeDefs } from './TreeDefaults';

export function CreateTree<SCHEMA extends AnyTree>({
  tableName,
}: {
  readonly tableName: SCHEMA['tableName'];
}): JSX.Element {

  const [isActive, setIsActive] = React.useState(0);
  const [selectedResource, setSelectedResource] = React.useState<Partial<SerializedResource<TaxonTreeDef>> | null>(null);

  // May be a good idea to separate second dialog into own component/function, since hook needs to be used outside of the condition.
  // Turn into a function?

  const handleClick = (resource: Partial<SerializedResource<TaxonTreeDef>>) => {
    const dsResource = deserializeResource(resource);
    setSelectedResource(dsResource);
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
            </>
          }
          header={treeText.addTree()}
          onClose={() => setIsActive(0)}
        >
          <Ul className="flex flex-col gap-2">
            {defaultTreeDefs.map((resource, index) => (
              <li key={index}>
                <Button.LikeLink onClick={(): void => handleClick(resource)}>
                  {resource.name}
                </Button.LikeLink>
              </li>
            ))}
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
