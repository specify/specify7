import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { icons } from '../Atoms/Icons';
import { LocalizedString } from 'typesafe-i18n';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { WbCellCounts } from './CellMeta';
import { WbUtils } from './WbUtils';
import { ReadOnlyContext } from '../Core/Contexts';
import { wbText } from '../../localization/workbench';

export function Navigation({
  name,
  label,
  totalCount,
  utils,
}: {
  readonly name: keyof WbCellCounts;
  readonly label: LocalizedString;
  readonly totalCount: number;
  readonly utils: WbUtils;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);
  const [currentPosition, setCurrentPosition] = React.useState<number>(0);
  const [buttonIsPressed, _press, _unpress, togglePress] = useBooleanState();
  const handleTypeToggle = () => {
    togglePress();
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
  return (
    <span
      aria-atomic
      className="wb-navigation-section flex rounded"
      data-navigation-type={name}
    >
      <Button.Small
        className="brightness-80 hover:brightness-70 p-2 ring-0"
        data-navigation-direction="previous"
        variant="bg-inherit text-gray-800 dark:text-gray-100"
        onClick={handlePrevious}
        disabled={name !== 'newCells' && isReadOnly}
      >
        {icons.chevronLeft}
      </Button.Small>
      <Button.Small
        className={`
            hover:brightness-70 grid grid-cols-[auto_1fr_auto_1fr_auto]
            items-center ring-0
            ${className.ariaHandled}
            ${buttonIsPressed ? 'brightness-50' : ''}
          `}
        aria-pressed={buttonIsPressed}
        title={wbText.clickToToggle()}
        variant="bg-inherit text-gray-800 dark:text-gray-100"
        onClick={handleTypeToggle}
      >
        {label} (<span className="text-center">{currentPosition}</span>/
        <span>{totalCount}</span>)
      </Button.Small>
      <Button.Small
        className="brightness-80 hover:brightness-70 p-2 ring-0"
        data-navigation-direction="next"
        type="button"
        variant="bg-inherit text-gray-800 dark:text-gray-100"
        onClick={handleNext}
        disabled={name !== 'newCells' && isReadOnly}
      >
        {icons.chevronRight}
      </Button.Small>
    </span>
  );
}
