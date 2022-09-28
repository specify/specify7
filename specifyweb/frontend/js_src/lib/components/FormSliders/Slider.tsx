import React from 'react';

import { formsText } from '../../localization/forms';
import { clamp } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { Input } from '../Atoms/Form';

export function Slider({
  value,
  count,
  onChange: handleChange,
}: {
  readonly value: number;
  readonly count: number;
  readonly onChange: (newValue: number) => void;
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
  return count > 0 ? (
    <div className="flex justify-center gap-2 print:hidden">
      <Button.Small
        aria-label={formsText('firstRecord')}
        disabled={value === 0}
        title={formsText('firstRecord')}
        onClick={(): void => handleChange(0)}
      >
        ≪
      </Button.Small>
      <Button.Small
        aria-label={formsText('previousRecord')}
        className="px-4 dark:bg-neutral-500"
        disabled={value === 0}
        title={formsText('previousRecord')}
        onClick={(): void => handleChange(value - 1)}
      >
        {'<'}
      </Button.Small>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 font-bold">
        <label
          className={`
            relative h-full after:invisible after:p-2
            after:content-[attr(data-value)]
          `}
          data-value={value}
        >
          <span className="sr-only">{formsText('currentRecord', count)}</span>
          <Input.Number
            className={`
              no-arrows absolute top-0 left-0 h-full bg-white
              text-center font-bold ring-0 dark:bg-neutral-600
            `}
            forwardRef={inputRef}
            /*
             * Count is 0 when input is invisible, which causes the field to be
             * invalid (as min is 1) which inhibits form submission
             */
            max={Math.max(1, count)}
            min={1}
            // Convert 0-based indexing to 1-based
            step={1}
            value={Number.isNaN(pendingValue) ? '' : pendingValue + 1}
            onBlur={(): void => setPendingValue(value)}
            onValueChange={(value): void => {
              const newValue = clamp(0, value - 1, count - 1);
              setPendingValue(newValue);
              if (!Number.isNaN(value)) handleChange(newValue);
            }}
          />
        </label>
        <span>/</span>
        <span>{count}</span>
      </div>
      <Button.Small
        aria-label={formsText('nextRecord')}
        className="px-4 dark:bg-neutral-500"
        disabled={value + 1 === count}
        title={formsText('nextRecord')}
        onClick={(): void => handleChange(value + 1)}
      >
        {'>'}
      </Button.Small>
      <Button.Small
        aria-label={formsText('lastRecord')}
        disabled={value + 1 === count}
        title={formsText('lastRecord')}
        onClick={(): void => handleChange(count - 1)}
      >
        ≫
      </Button.Small>
    </div>
  ) : null;
}
