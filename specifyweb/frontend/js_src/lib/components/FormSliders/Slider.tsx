import React from 'react';

import { formsText } from '../../localization/forms';
import { clamp } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { Input } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';

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
  return count > 0 ? (
    <nav className="flex justify-center gap-2 print:hidden">
      <Button.Small
        aria-label={formsText.firstRecord()}
        disabled={value === 0 || handleChange === undefined}
        title={formsText.firstRecord()}
        onClick={(): void => handleChange?.(0)}
      >
        {icons.chevronDoubleLeft}
      </Button.Small>
      <Button.Small
        aria-label={formsText.previousRecord()}
        className="px-4 dark:bg-neutral-500"
        disabled={value === 0 || handleChange === undefined}
        title={formsText.previousRecord()}
        onClick={(): void => handleChange?.(value - 1)}
      >
        {icons.chevronLeft}
      </Button.Small>
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
      <Button.Small
        aria-label={formsText.nextRecord()}
        className="px-4 dark:bg-neutral-500"
        disabled={value + 1 === count || handleChange === undefined}
        title={formsText.nextRecord()}
        onClick={(): void => handleChange?.(value + 1)}
      >
        {icons.chevronRight}
      </Button.Small>
      <Button.Small
        aria-label={formsText.lastRecord()}
        disabled={value + 1 === count || handleChange === undefined}
        title={formsText.lastRecord()}
        onClick={(): void => handleChange?.(count - 1)}
      >
        {icons.chevronDoubleRight}
      </Button.Small>
    </nav>
  ) : null;
}
