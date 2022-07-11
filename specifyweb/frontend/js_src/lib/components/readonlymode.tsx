import React from 'react';

import { formsText } from '../localization/forms';
import { Button } from './basic';
import { useCachedState } from './statecache';

export function ReadOnlyMode({
  isNew,
}: {
  readonly isNew: boolean;
}): JSX.Element {
  const [isReadOnly = false, setReadOnly] = useCachedState({
    category: 'forms',
    key: 'readOnlyMode',
    defaultValue: false,
    staleWhileRefresh: false,
  });
  return (
    <Button.Simple
      onClick={(): void => {
        setReadOnly(!isReadOnly);
        if (isNew) window.location.assign('/');
        else window.location.reload();
      }}
    >
      {isReadOnly ? formsText('disableReadOnly') : formsText('enableReadOnly')}
    </Button.Simple>
  );
}
