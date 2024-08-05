import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useBooleanState } from '../../hooks/useBooleanState';
import { StringToJsx } from '../../localization/utils';
import { wbText } from '../../localization/workbench';
import { localized } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { icons } from '../Atoms/Icons';
import { ReadOnlyContext } from '../Core/Contexts';
import type { WbCellCounts } from '../WorkBench/CellMeta';
import type { WbUtils } from './Utils';

export function Navigation({
  name,
  label,
  totalCount,
  utils,
  isPressed = false,
  onToggle: handleToggle,
}: {
  readonly name: keyof WbCellCounts;
  readonly label: LocalizedString;
  readonly totalCount: number;
  readonly utils: WbUtils;
  readonly isPressed?: boolean;
  readonly onToggle?: () => void;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);
  const [currentPosition, setCurrentPosition] = React.useState<number>(0);
  const [buttonIsPressed, _press, _unpress, togglePress] =
    useBooleanState(isPressed);

  const handleTypeToggle = () => {
    if (typeof handleToggle === 'function') handleToggle();
    else togglePress();
    utils.toggleCellTypes(name, 'toggle');
  };

  const handlePrevious = () => {
    const [_, position] = utils.navigateCells({
      type: name,
      direction: 'previous',
      currentCellPosition: currentPosition,
      totalCount,
    });
    setCurrentPosition(position);
  };
  const handleNext = () => {
    const [_, position] = utils.navigateCells({
      type: name,
      direction: 'next',
      currentCellPosition: currentPosition,
      totalCount,
    });
    setCurrentPosition(position);
  };

  // Reset current position when total count resets
  React.useEffect(() => {
    if (totalCount === 0) setCurrentPosition(0);
  }, [totalCount]);

  return (
    <span
      aria-atomic
      className="wb-navigation-section flex rounded"
      data-navigation-type={name}
    >
      <Button.Small
        className="brightness-80 hover:brightness-70 p-2 ring-0"
        data-navigation-direction="previous"
        disabled={!['newCells', 'searchResults'].includes(name) && isReadOnly}
        variant="bg-inherit text-gray-800 dark:text-gray-100"
        onClick={handlePrevious}
      >
        {icons.chevronLeft}
      </Button.Small>
      <Button.Small
        aria-pressed={buttonIsPressed}
        className={`
          hover:brightness-70 grid grid-cols-[auto_1fr_auto_1fr_auto]
          items-center ring-0
          ${className.ariaHandled}
          ${buttonIsPressed ? 'brightness-50' : ''}
        `}
        title={wbText.clickToToggle()}
        variant="bg-inherit text-gray-800 dark:text-gray-100"
        onClick={handleTypeToggle}
      >
        <StringToJsx
          components={{
            currentPosition: (
              <span className="text-center">{currentPosition}</span>
            ),
            totalCount: <span>{totalCount}</span>,
          }}
          string={localized(`${label} (<currentPosition/>/<totalCount/>)`)}
        />
      </Button.Small>
      <Button.Small
        className="brightness-80 hover:brightness-70 p-2 ring-0"
        data-navigation-direction="next"
        disabled={!['newCells', 'searchResults'].includes(name) && isReadOnly}
        type="button"
        variant="bg-inherit text-gray-800 dark:text-gray-100"
        onClick={handleNext}
      >
        {icons.chevronRight}
      </Button.Small>
    </span>
  );
}
