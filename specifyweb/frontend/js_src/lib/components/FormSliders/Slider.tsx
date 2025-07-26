import React from 'react';

import { formsText } from '../../localization/forms';
import { clamp } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { Input } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { userPreferences } from '../Preferences/userPreferences';

export function Slider({
  value,
  count,
  onChange: handleChange,
  enableKeyboardShortcuts,
}: {
  readonly value: number;
  readonly count: number;
  readonly onChange: ((newValue: number) => void) | undefined;
  /**
   * If true, keyboard shortcuts will be enabled for this slider
   */
  readonly enableKeyboardShortcuts: boolean;
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

  const goToFirstRecord =
    value === 0 || handleChange === undefined
      ? undefined
      : (): void => handleChange?.(0);
  const goToPreviousRecord =
    value === 0 || handleChange === undefined
      ? undefined
      : (): void => handleChange(value - 1);
  const goToNextRecord =
    value + 1 === count || handleChange === undefined
      ? undefined
      : (): void => handleChange?.(value + 1);
  const goToLastRecord =
    value + 1 === count || handleChange === undefined
      ? undefined
      : (): void => handleChange?.(count - 1);

  const goToFirstRecordShortcut = userPreferences.useKeyboardShortcut(
    'form',
    'recordSet',
    'goToFirstRecord',
    enableKeyboardShortcuts ? goToFirstRecord : undefined
  );
  const goToPreviousRecordShortcut = userPreferences.useKeyboardShortcut(
    'form',
    'recordSet',
    'goToPreviousRecord',
    enableKeyboardShortcuts ? goToPreviousRecord : undefined
  );
  const goToNextRecordShortcut = userPreferences.useKeyboardShortcut(
    'form',
    'recordSet',
    'goToNextRecord',
    enableKeyboardShortcuts ? goToNextRecord : undefined
  );
  const goToLastRecordShortcut = userPreferences.useKeyboardShortcut(
    'form',
    'recordSet',
    'goToLastRecord',
    enableKeyboardShortcuts ? goToLastRecord : undefined
  );

  return count > 0 ? (
    <nav className="flex justify-center gap-2 print:hidden">
      <Button.Small
        aria-label={formsText.goToFirstRecord()}
        title={`${formsText.goToFirstRecord()}${goToFirstRecordShortcut}`}
        onClick={goToFirstRecord}
      >
        {icons.chevronDoubleLeft}
      </Button.Small>
      <Button.Small
        aria-label={formsText.goToPreviousRecord()}
        className="px-4 dark:bg-neutral-500"
        title={`${formsText.goToPreviousRecord()}${goToPreviousRecordShortcut}`}
        onClick={goToPreviousRecord}
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
        aria-label={formsText.goToNextRecord()}
        className="px-4 dark:bg-neutral-500"
        title={`${formsText.goToNextRecord()}${goToNextRecordShortcut}`}
        onClick={goToNextRecord}
      >
        {icons.chevronRight}
      </Button.Small>
      <Button.Small
        aria-label={formsText.goToLastRecord()}
        title={`${formsText.goToLastRecord()}${goToLastRecordShortcut}`}
        onClick={goToLastRecord}
      >
        {icons.chevronDoubleRight}
      </Button.Small>
    </nav>
  ) : null;
}
