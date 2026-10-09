import React from 'react';

import { formsText } from '../../localization/forms';
import { clamp } from '../../utils/utils';
import { Input } from '../Atoms/Form';
import { SlideDirection, useSliderButtons } from './useSliderButtons';

export function Slider({
  value,
  count,
  onChange: handleChange,
}: {
  readonly value: number;
  readonly count: number;
  readonly onChange: ((newValue: number) => void) | undefined;
}): JSX.Element | null {
  const [pendingValue, setPendingValue] = React.useState<number>(value);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  React.useEffect(
    () =>
      document.activeElement === inputRef.current
        ? undefined
        : setPendingValue(value),
    [value]
  );
  const max = Math.max(1, count);
  const resolvedValue = Number.isNaN(pendingValue) ? '' : pendingValue + 1;

  const handleSlide = React.useCallback(
    (direction: SlideDirection) => {
      if (direction === 'first') handleChange?.(0);
      if (direction === 'previous') handleChange?.(value - 1);
      if (direction === 'next') handleChange?.(value + 1);
      if (direction === 'last') handleChange?.(count - 1);
    },
    [value, handleChange]
  );

  const {
    navigateToFirst,
    navigateToPrevious,
    navigateToNext,
    navigateToLast,
  } = useSliderButtons({
    buttonsDisabled: {
      first: value === 0,
      previous: value === 0,
      next: value + 1 === count,
      last: value + 1 == count,
    },
    onChange: handleSlide,
  });

  return count > 0 ? (
    <nav className="flex justify-center gap-2 print:hidden">
      {navigateToFirst}
      {navigateToPrevious}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 font-bold">
        <label
          className={`
            relative h-full after:invisible after:p-2
            after:content-[attr(data-count)]
          `}
          data-count={count}
        >
          <span className="sr-only">
            {formsText.currentRecord({ total: count })}
          </span>
          <Input.Integer
            className={`
              no-arrows absolute left-0 top-0 h-full bg-white
              text-center font-bold ring-1 dark:bg-neutral-600
            `}
            disabled={
              handleChange === undefined || (max === 1 && resolvedValue === 1)
            }
            min={1}
            value={resolvedValue}
            onBlur={(): void => setPendingValue(value)}
            onValueChange={(value): void => {
              const newValue = clamp(0, value - 1, count - 1);
              setPendingValue(newValue);
              if (!Number.isNaN(value)) handleChange?.(newValue);
            }}
            forwardRef={inputRef}
            /*
             * Count is 0 when input is invisible, which causes the field to be
             * invalid (as min is 1) which inhibits form submission
             */
            max={max}
          />
        </label>
        <span>/</span>
        <span>{count}</span>
      </div>
      {navigateToNext}
      {navigateToLast}
    </nav>
  ) : null;
}
