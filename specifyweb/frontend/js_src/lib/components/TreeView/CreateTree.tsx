/*
 *WIP File to separate out functions for adding trees.
 *Contains stuff for dialogs, etc.
 *
 *TODO:
 *- Finish CreateTree function
 *-
 */
import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { treeText } from '../../localization/tree';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Dialog } from '../Molecules/Dialog';

// This is a React component that can be exported.
export function CreateTree(): JSX.Element {
  /*
   *TODO:
   *- add parameter to get the resource that will be added to using serializedresource
   *- for this to work, you set the template like how you would in ViewSetTemplates.
   */
  const [isDialogOpen, handleOpen, handleClose] = useBooleanState();
  const [isSecondDialogOpen, handleSecondOpen, handleSecondClose] = useBooleanState();

  const handleButtonClick = handleOpen;
  const handleFirstDialogButtonClick = handleSecondOpen;

  return (
    <>
      <Button.Icon
        className={className.dataEntryAdd}
        icon="plus"
        title={treeText.addTree()}
        onClick={handleButtonClick}
      />
      {isDialogOpen && (
        <Dialog
          buttons={<>
            <Button.DialogClose component={Button.BorderedGray}>
              {commonText.close()}
            </Button.DialogClose>
            <Button.Info onClick={handleFirstDialogButtonClick}>
              {treeText.addTree()}
            </Button.Info>
          </>}
          header={treeText.addTree()}
          onClose={handleClose} children={undefined}        >
          <Ul className="flex flex-col gap-2">
            <li />
          </Ul>
          {isSecondDialogOpen && (
            <Dialog
              buttons={commonText.new()}
              header="Tree Rank Form"
              onClose={handleSecondClose} children={undefined}            >
              <Ul className="flex flex-col gap-2">
                <li />
              </Ul>
            </Dialog>
          )}
        </Dialog>
      )}
    </>
  );
}
