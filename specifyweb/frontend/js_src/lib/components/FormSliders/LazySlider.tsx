import React from 'react';
import { formsText } from '../../localization/forms';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';

type DisabledProps = {
  readonly first?: boolean;
  readonly next?: boolean;
  readonly previous?: boolean;
  readonly last?: boolean;
};

export function LazySlider({
  buttonsDisabled = {
    first: false,
    next: false,
    previous: false,
    last: false,
  },
  onChange: handleChange,
}: {
  readonly buttonsDisabled?: DisabledProps;
  readonly onChange:
    | ((direction: 'first' | 'last' | 'next' | 'previous') => void)
    | undefined;
}) {
  return (
    <nav className="flex justify-center gap-2 print:hidden">
      <Button.Small
        aria-label={formsText.firstRecord()}
        disabled={buttonsDisabled.first || handleChange === undefined}
        title={formsText.firstRecord()}
        onClick={(): void => handleChange?.('first')}
      >
        {icons.chevronDoubleLeft}
      </Button.Small>
      <Button.Small
        aria-label={formsText.previousRecord()}
        className="px-4 dark:bg-neutral-500"
        disabled={buttonsDisabled.next || handleChange === undefined}
        title={formsText.previousRecord()}
        onClick={(): void => handleChange?.('previous')}
      >
        {icons.chevronLeft}
      </Button.Small>
      <Button.Small
        aria-label={formsText.nextRecord()}
        className="px-4 dark:bg-neutral-500"
        disabled={buttonsDisabled.next || handleChange === undefined}
        title={formsText.nextRecord()}
        onClick={(): void => handleChange?.('next')}
      >
        {icons.chevronRight}
      </Button.Small>
      <Button.Small
        aria-label={formsText.lastRecord()}
        disabled={buttonsDisabled.last || handleChange === undefined}
        title={formsText.lastRecord()}
        onClick={(): void => handleChange?.('last')}
      >
        {icons.chevronDoubleRight}
      </Button.Small>
    </nav>
  );
}
