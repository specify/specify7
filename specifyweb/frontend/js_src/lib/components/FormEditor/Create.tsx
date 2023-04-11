import { SpecifyTable } from '../DataModel/specifyTable';
import { Dialog } from '../Molecules/Dialog';
import { commonText } from '../../localization/common';
import { Button } from '../Atoms/Button';
import React from 'react';

export function CreateFormDefinition({
  table,
  onClose: handleClose,
}: {
  readonly table: SpecifyTable;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <Dialog
      onClose={handleClose}
      buttons={
        <>
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
          <Button.Blue>{commonText.new()}</Button.Blue>
        </>
      }
    ></Dialog>
  );
}
