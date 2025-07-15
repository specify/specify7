import React from 'react';

import { useCachedState } from '../../hooks/useCachedState';
import { formsText } from '../../localization/forms';
import { Button } from '../Atoms/Button';

export function ReadOnlyMode(): JSX.Element {
  const [isReadOnly = false, setReadOnly] = useCachedState(
    'forms',
    'readOnlyMode'
  );

  return (
    <Button.Small
      onClick={(): void => {
        setReadOnly(!isReadOnly);
        globalThis.location.reload();
      }}
    >
      {isReadOnly ? formsText.disableReadOnly() : formsText.enableReadOnly()}
    </Button.Small>
  );
}
