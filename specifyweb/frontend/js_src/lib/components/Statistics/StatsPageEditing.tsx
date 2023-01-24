import { useId } from '../../hooks/useId';
import React from 'react';
import { Dialog } from '../Molecules/Dialog';
import { Submit } from '../Atoms/Submit';
import { commonText } from '../../localization/common';
import { Button } from '../Atoms/Button';
import { Form, Input, Label } from '../Atoms/Form';
import { statsText } from '../../localization/stats';

export function StatsPageEditing({
  label = '',
  onRemove: handleRemove,
  onRename: handleRename,
  onClose: handleClose,
  onAdd: handleAdd,
}: {
  readonly label: string;
  readonly onRemove: (() => void) | undefined;
  readonly onRename: ((value: string) => void) | undefined;
  readonly onClose: () => void;
  readonly onAdd: ((label: string) => void) | undefined;
}): JSX.Element {
  const id = useId('stats');
  const [pageName, setPageName] = React.useState<string>(label);
  return (
    <Dialog
      buttons={
        <>
          {typeof handleRemove === 'function' && (
            <Button.Red onClick={handleRemove}>
              {commonText.remove()}
            </Button.Red>
          )}
          <span className="-ml-2 flex-1" />
          <Button.Blue onClick={handleClose}>{commonText.close()}</Button.Blue>
          <Submit.Green form={id('form')}>
            {typeof handleRename === 'function'
              ? commonText.save()
              : commonText.add()}
          </Submit.Green>
        </>
      }
      header={statsText.pageName()}
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
