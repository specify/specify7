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
import type { AnyTree } from '../DataModel/helperTypes';
import { Dialog } from '../Molecules/Dialog';
import { userInformation } from '../InitialContext/userInformation';

export function CreateTree<SCHEMA extends AnyTree>({
  tableName,
}: {
  readonly tableName: SCHEMA['tableName'];
}): JSX.Element {
  /*
   *TODO:
   *- add parameter to get the resource that will be added to using serializedresource
   *- for this to work, you set the template like how you would in ViewSetTemplates.
   */

  const [isActive, setIsActive] = React.useState(0);

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
        <Dialog
          buttons={commonText.save()}
          header={treeText.newTree()}
          specialMode="orangeBar"
          onClose={() => setIsActive(0)}
        >
          Taxon Definition form goes here.
        </Dialog>
      ) : null}
    </>
  );
}
