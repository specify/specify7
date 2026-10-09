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

export type SlideDirection = 'first' | 'last' | 'next' | 'previous';

export function useSliderButtons({
  buttonsDisabled = {
    first: false,
    next: false,
    previous: false,
    last: false,
  },
  onChange: handleChange,
}: {
  readonly buttonsDisabled?: DisabledProps;
  readonly onChange: ((direction: SlideDirection) => void) | undefined;
}): {
  readonly navigateToFirst: JSX.Element;
  readonly navigateToPrevious: JSX.Element;
  readonly navigateToNext: JSX.Element;
  readonly navigateToLast: JSX.Element;
} {
  const navigateToFirst = (
    <Button.Small
      aria-label={formsText.firstRecord()}
      disabled={buttonsDisabled.first || handleChange === undefined}
      title={formsText.firstRecord()}
      onClick={(): void => handleChange?.('first')}
    >
      {icons.chevronDoubleLeft}
    </Button.Small>
  );

  const navigateToPrevious = (
    <Button.Small
      aria-label={formsText.previousRecord()}
      className="px-4 dark:bg-neutral-500"
      disabled={buttonsDisabled.previous || handleChange === undefined}
      title={formsText.previousRecord()}
      onClick={(): void => handleChange?.('previous')}
    >
      {icons.chevronLeft}
    </Button.Small>
  );

  const navigateToNext = (
    <Button.Small
      aria-label={formsText.nextRecord()}
      className="px-4 dark:bg-neutral-500"
      disabled={buttonsDisabled.next || handleChange === undefined}
      title={formsText.nextRecord()}
      onClick={(): void => handleChange?.('next')}
    >
      {icons.chevronRight}
    </Button.Small>
  );

  const navigateToLast = (
    <Button.Small
      aria-label={formsText.lastRecord()}
      disabled={buttonsDisabled.last || handleChange === undefined}
      title={formsText.lastRecord()}
      onClick={(): void => handleChange?.('last')}
    >
      {icons.chevronDoubleRight}
    </Button.Small>
  );

  return {
    navigateToFirst,
    navigateToPrevious,
    navigateToNext,
    navigateToLast,
  };
}
