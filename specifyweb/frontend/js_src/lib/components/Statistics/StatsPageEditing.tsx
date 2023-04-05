import React from 'react';

import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { statsText } from '../../localization/stats';
import { Button } from '../Atoms/Button';
import { Form, Input, Label } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { Submit } from '../Atoms/Submit';
import { Dialog } from '../Molecules/Dialog';

export function StatsPageEditing({
  label,
  onRemove: handleRemove,
  onRename: handleRename,
  onClose: handleClose,
  onAdd: handleAdd,
}: {
  readonly label: string | undefined;
  readonly onRemove: (() => void) | undefined;
  readonly onRename: ((value: string) => void) | undefined;
  readonly onClose: () => void;
  readonly onAdd: ((label: string) => void) | undefined;
}): JSX.Element {
  const id = useId('stats');
  const [pageName, setPageName] = React.useState<string>(label ?? '');
  return (
    <Dialog
      buttons={
        <>
          {typeof handleRemove === 'function' && (
            <Button.Gray onClick={handleRemove}>
              {commonText.remove()}
            </Button.Gray>
          )}
          <span className="-ml-2 flex-1" />
          <Button.Gray onClick={handleClose}>{commonText.close()}</Button.Gray>
          <Submit.Blue form={id('form')}>
            {typeof handleRename === 'function'
              ? commonText.save()
              : commonText.add()}
          </Submit.Blue>
        </>
      }
      header={label === undefined ? statsText.addPage() : statsText.editPage()}
      icon={icons.pencil}
      onClose={handleClose}
    >
      <Form
        id={id('form')}
        onSubmit={(): void =>
          typeof handleRename === 'function'
            ? handleRename(pageName)
            : typeof handleAdd === 'function'
            ? handleAdd(pageName)
            : undefined
        }
      >
        <Label.Block>
          {statsText.name()}
          <Input.Text required value={pageName} onValueChange={setPageName} />
        </Label.Block>
      </Form>
    </Dialog>
  );
}
