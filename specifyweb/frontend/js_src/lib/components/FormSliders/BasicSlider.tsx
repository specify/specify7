import React from 'react';
import { useSliderButtons } from './useSliderButtons';

type DisabledProps = {
  readonly first?: boolean;
  readonly next?: boolean;
  readonly previous?: boolean;
  readonly last?: boolean;
};

export function BasicSlider({
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
  const {
    navigateToFirst,
    navigateToPrevious,
    navigateToNext,
    navigateToLast,
  } = useSliderButtons({ buttonsDisabled, onChange: handleChange });

  return (
    <nav className="flex justify-center gap-2 print:hidden">
      {navigateToFirst}
      {navigateToPrevious}
      {navigateToNext}
      {navigateToLast}
    </nav>
  );
}
