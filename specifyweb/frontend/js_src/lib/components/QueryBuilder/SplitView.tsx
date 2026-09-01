import React from 'react';
import Splitter from 'm-react-splitters';

import { Button } from '../Atoms/Button';
import { treeText } from '../../localization/tree';

export function useSplitViewOrientation(): {
  readonly isHorizontal: boolean;
  readonly toggleOrientation: () => void;
} {
  const [isHorizontal, setIsHorizontal] = React.useState(true);
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

export function SplitView({
  primaryPane,
  secondaryPane,
  primaryPaneKey,
  secondaryPaneKey,
  isHorizontal,
}: {
  readonly primaryPane: JSX.Element;
  readonly secondaryPane: JSX.Element;
  readonly primaryPaneKey: string;
  readonly secondaryPaneKey: string;
  readonly isHorizontal: boolean;
}): JSX.Element {
  return (
    <Splitter
      className="h-full max-h-full min-h-0 min-w-0 w-full flex-1 overflow-hidden"
      position={isHorizontal ? 'vertical' : 'horizontal'}
      primaryPaneHeight="50%"
      primaryPaneMaxHeight="80%"
      primaryPaneMaxWidth="80%"
      primaryPaneMinHeight={1}
      primaryPaneMinWidth={1}
      primaryPaneWidth="50%"
    >
      <div
        className="flex h-full min-h-0 min-w-0 overflow-auto"
        key={primaryPaneKey}
      >
        {primaryPane}
      </div>
      <div
        className={`flex h-full min-h-0 min-w-0 overflow-auto ${
          isHorizontal ? 'border-l' : 'border-t'
        } border-gray-400`}
        key={secondaryPaneKey}
      >
        {secondaryPane}
      </div>
    </Splitter>
  );
}
