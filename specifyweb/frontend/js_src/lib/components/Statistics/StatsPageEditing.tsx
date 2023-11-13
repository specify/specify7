import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { statsText } from '../../localization/stats';
import { localized } from '../../utils/types';
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
  readonly label: LocalizedString | undefined;
  readonly onRemove: (() => void) | undefined;
  readonly onRename: ((label: LocalizedString) => void) | undefined;
  readonly onClose: () => void;
  readonly onAdd: ((label: LocalizedString) => void) | undefined;
}): JSX.Element {
  const id = useId('stats');
  const [pageName, setPageName] = React.useState<LocalizedString>(
    label ?? localized('')
  );
  return (
    <Dialog
      buttons={
        <>
          {typeof handleRemove === 'function' && (
            <Button.Secondary onClick={handleRemove}>
              {commonText.remove()}
            </Button.Secondary>
          )}
          <span className="-ml-2 flex-1" />
          <Button.Secondary onClick={handleClose}>
            {commonText.close()}
          </Button.Secondary>
          <Submit.Save form={id('form')}>
            {typeof handleRename === 'function'
              ? commonText.save()
              : commonText.add()}
          </Submit.Save>
        </>
      }
      header={label === undefined ? statsText.addPage() : statsText.editPage()}
      icon={icons.pencil}
      onClose={handleClose}
    >
      <Form
        id={id('form')}
        onSubmit={(): void => (handleRename ?? handleAdd)?.(pageName)}
      >
        <Label.Block>
          {statsText.name()}
          <Input.Text required value={pageName} onValueChange={setPageName} />
        </Label.Block>
      </Form>
    </Dialog>
  );
}
