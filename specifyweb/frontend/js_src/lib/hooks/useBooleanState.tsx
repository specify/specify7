import { useTriggerState } from './useTriggerState';
import React from 'react';

/**
 * Many react states are simple boolean switches
 * This hook gives a convenient way to defined such states
 *
 * @example Usage
 * Without this hook:
 * ```js
 * const [isOpen, setIsOpen] = React.useState(false);
 * ```
 * With this hook:
 * ```
 * const [isOpen, handleOpen, handleClose, handleToggle] = useBooleanState();
 * ```
 * "handleClose" is easier to reason about than "setIsOpen(false)"
 *
 * If handleClose or handleToggle actions are not needed, they simply
 * don't have to be destructured.
 *
 * Initial value can be given as a prop. State value is changed to match the
 * prop if prop changes.
 *
 * @example Performance optimization
 * This hook also reduces the render the need for reRenders
 * This calls reRender of Dialog on each parent component render since
 * lamda function is redefined at each render:
 * ```js
 * <Dialog onClose={():void => setIsOpen(false)} ... >...</Dialog>
 * ```
 * This doss not cause needless reRenders and looks cleaner:
 * ```js
 * <Dialog onClose={handleClose} ... >...</Dialog>
 * ```
 */
export function useBooleanState(
  value = false
): Readonly<
  readonly [
    state: boolean,
    enable: () => void,
    disable: () => void,
    toggle: () => void
  ]
> {
  const [state, setState] = useTriggerState(value);
  return [
    state,
    React.useCallback(
      function enable() {
        setState(true);
      },
      [setState]
    ),
    React.useCallback(
      function disable() {
        setState(false);
      },
      [setState]
    ),
    React.useCallback(
      function toggle() {
        setState((value) => !value);
      },
      [setState]
    ),
  ];
}
