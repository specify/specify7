/* 
WIP File to separate out functions for adding trees.
Contains stuff for dialogs, etc.

TODO:
- Finish CreateTree function
- Finish 
*/
import React from 'react';
import { commonText } from '../../localization/common';
import { treeText } from '../../localization/tree';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Dialog } from '../Molecules/Dialog';

//This is a React component that can be exported.
export function CreateTree(): JSX.Element {
    /*
        TODO:
        - add parameter to get the resource that will be added to using serializedresource
        - for this to work, you set the template like how you would in ViewSetTemplates.
    */
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);

    const handleButtonClick = () => {
        setIsDialogOpen(true);
    };

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
                buttons={commonText.new()}
                header={treeText.addTree()}
                onClose={() => setIsDialogOpen(false)}>
                    <Ul className="flex flex-col gap-2">
                        <li></li>
                    </Ul>
                </Dialog>
            )}
        </>
    );
}