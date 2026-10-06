import Splitter from 'm-react-splitters';
import React from 'react';

import { useTriggerState } from '../../hooks/useTriggerState';
import { treeText } from '../../localization/tree';
import { Button } from '../Atoms/Button';

export function useSplitViewOrientation(defaultHorizontal = true): {
  readonly isHorizontal: boolean;
  readonly toggleOrientation: () => void;
} {
  const [isHorizontal, setIsHorizontal] = useTriggerState(defaultHorizontal);
  return {
    isHorizontal,
    toggleOrientation: (): void => setIsHorizontal((horizontal) => !horizontal),
  };
}

export function SplitViewOrientationButton({
  isHorizontal,
  disabled = false,
  onToggle: handleToggle,
}: {
  readonly isHorizontal: boolean;
  readonly disabled?: boolean;
  readonly onToggle: () => void;
}): JSX.Element {
  return (
    <Button.Icon
      aria-pressed={!isHorizontal}
      disabled={disabled}
      icon={isHorizontal ? 'switchVertical' : 'switchHorizontal'}
      title={isHorizontal ? treeText.vertical() : treeText.horizontal()}
      onClick={handleToggle}
    />
  );
}

export function SplitViewToggleButton({
  isSplit,
  disabled = false,
  onToggle: handleToggle,
}: {
  readonly isSplit: boolean;
  readonly disabled?: boolean;
  readonly onToggle: () => void;
}): JSX.Element {
  return (
    <Button.Icon
      aria-pressed={isSplit}
      disabled={disabled}
      icon="template"
      title={treeText.splitView()}
      onClick={handleToggle}
    />
  );
}

export function SplitView({
  primaryPane,
  secondaryPane,
  primaryPaneKey,
  primaryPaneMaxWidth,
  secondaryPaneKey,
  isHorizontal,
  isSplit = true,
}: {
  readonly primaryPane: JSX.Element;
  readonly secondaryPane: JSX.Element;
  readonly primaryPaneKey: string;
  readonly primaryPaneMaxWidth?: string;
  readonly secondaryPaneKey: string;
  readonly isHorizontal: boolean;
  readonly isSplit?: boolean;
}): JSX.Element {
  const splitterRef = React.useRef<React.ElementRef<typeof Splitter> | null>(
    null
  );
  const previousIsHorizontal = React.useRef(isHorizontal);
  const previousIsSplit = React.useRef(isSplit);
  React.useLayoutEffect(() => {
    if (
      previousIsHorizontal.current !== isHorizontal ||
      (previousIsSplit.current && !isSplit)
    )
      splitterRef.current?.setState({ primaryPane: undefined });
    previousIsHorizontal.current = isHorizontal;
    previousIsSplit.current = isSplit;
  }, [isHorizontal, isSplit]);

  return (
    <Splitter
      className={`h-full max-h-full min-h-0 min-w-0 w-full flex-1 overflow-hidden ${
        isSplit ? '' : '[&_.handle-bar]:hidden'
      }`}
      position={isHorizontal ? 'vertical' : 'horizontal'}
      primaryPaneHeight={isSplit && !isHorizontal ? '50%' : '100%'}
      primaryPaneMaxHeight={isSplit ? '80%' : '100%'}
      primaryPaneMaxWidth={
        isSplit && isHorizontal ? (primaryPaneMaxWidth ?? '80%') : '100%'
      }
      primaryPaneMinHeight={1}
      primaryPaneMinWidth={1}
      primaryPaneWidth={isSplit && isHorizontal ? '50%' : '100%'}
      ref={splitterRef}
    >
      <div
        className="flex h-full min-h-0 min-w-0 overflow-auto"
        key={primaryPaneKey}
      >
        {primaryPane}
      </div>
      <div
        className={`${isSplit ? 'flex' : 'hidden'} h-full min-h-0 min-w-0 overflow-auto ${
          isHorizontal ? 'border-l' : 'border-t'
        } border-gray-400`}
        key={secondaryPaneKey}
      >
        {secondaryPane}
      </div>
    </Splitter>
  );
}
