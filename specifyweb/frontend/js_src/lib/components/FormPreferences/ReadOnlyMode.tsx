import React from 'react';

import { formsText } from '../../localization/forms';
import { Button } from '../Atoms/Basic';
import { useCachedState } from '../../hooks/statecache';

export function ReadOnlyMode({
  isNew,
}: {
  readonly isNew: boolean;
}): JSX.Element {
  const [isReadOnly = false, setReadOnly] = useCachedState(
    'forms',
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
