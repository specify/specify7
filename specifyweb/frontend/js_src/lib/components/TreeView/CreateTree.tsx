/*
 *WIP File to separate out functions for adding trees.
 *Contains stuff for dialogs, etc.
 *
 *TODO:
 *- Finish CreateTree function
 *- Add in list of default options
 *- Add default form for TreeDef in here?
 */
import React from 'react';

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
  const [isActive, setIsActive] = React.useState(0);

  return (
    <>
      <Button.Icon
        className={className.dataEntryAdd}
        icon="plus"
        title={treeText.addTree()}
        onClick={() => {
          setIsActive(1);
        }}
      />
      {(isActive === 1) ? (
          <Dialog
          buttons={<>
            <Button.DialogClose
              component={Button.BorderedGray}>
                {commonText.cancel()}
            </Button.DialogClose>
            <Button.Info 
              onClick={() => setIsActive(2)}
              >
                {treeText.addTree()}
            </Button.Info>
          </>}
          header={treeText.addTree()}
          onClose={() => setIsActive(0)}>
          <Ul className="flex flex-col gap-2">
            <li />
          </Ul>
        </Dialog>
        ) : (isActive === 2) ? (
          <Dialog
              buttons={commonText.save()}
              header={treeText.newTree()}
              onClose={() => setIsActive(0)}
              specialMode="orangeBar">

            </Dialog>
        ) : null
      }
    </>
  );
}
