import React from 'react';

import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { Button } from './basic';
import { useBooleanState } from './hooks';
import { icons } from './icons';
import { Dialog } from './modaldialog';
import { CarryForwardButton } from './formcarryforward';

export function FormPreferences({
  resource,
}: {
  readonly resource: SpecifyResource<AnySchema> | undefined;
}): JSX.Element | null {
  const [isOpen, _, handleClose, handleToggle] = useBooleanState();
  return typeof resource === 'object' ? (
    <>
      <Button.Small
        title={commonText('preferences')}
        aria-label={commonText('preferences')}
        onClick={handleToggle}
      >
        {icons.cog}
      </Button.Small>
      {isOpen && typeof resource === 'object' ? (
        <PreferencesDialog resource={resource} onClose={handleClose} />
      ) : undefined}
    </>
  ) : null;
}

function PreferencesDialog({
  resource,
  onClose: handleClose,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <Dialog
      header={resource.specifyModel.label}
      onClose={handleClose}
      buttons={commonText('close')}
      modal={false}
    >
      <CarryForwardButton model={resource.specifyModel} />
    </Dialog>
  );
}
