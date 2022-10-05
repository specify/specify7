import React from 'react';

import { formsText } from '../../localization/forms';
import { Button } from '../Atoms/Button';
import { usePref } from '../UserPreferences/usePref';

export function ReadOnlyMode({
  isNew,
}: {
  readonly isNew: boolean;
}): JSX.Element {
  const [isReadOnly, setReadOnly] = usePref(
    'form',
    'preferences',
    'readOnlyMode'
  );
  return (
    <Button.Small
      onClick={(): void => {
        setReadOnly(!isReadOnly);
        if (isNew) globalThis.location.assign('/specify/');
        else globalThis.location.reload();
      }}
    >
      {isReadOnly ? formsText('disableReadOnly') : formsText('enableReadOnly')}
    </Button.Small>
  );
}
