import {
  arrow,
  autoPlacement,
  autoUpdate,
  FloatingPortal,
  offset,
  shift,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import React from 'react';

import type { IR } from '../../utils/types';
import { error } from '../Errors/assert';

// FIXME: move this file

/*
 * Warning: tooltip content must not contain interactive elements.
 * It creases a lot more accessibility challenges.
 * For that, a pop-over should be created
 * See https://floating-ui.com/docs/popover
 */
type TooltipCallback = (content: string) => IR<unknown> & {
  // FIXME: also do forward ref
  // FIXME: add onHover, onFocus,...etc types here to that TS can detect bugs
  readonly ref: (element: HTMLElement | null) => void;
  readonly forwardRef: (element: HTMLElement | null) => void;
};

const TooltipContext =
  /*
   * FIXME: Expose back the refs: https://floating-ui.com/docs/react#refs
   * FIXME: Provide a way to change position? or is automatic always good enough (side menu)
   */
  React.createContext<TooltipCallback>(() =>
    error('Tooltip context is not defined')
  );
TooltipContext.displayName = 'TooltipContext';

/**
 * Tooltip Context Provider
 */
export function TooltipProvider({
  children,
}: {
  readonly children: React.ReactNode;
}): JSX.Element {
  // FIXME: test if this causes re-renders
  const { callback, tooltip } = useTooltipCallback();
  return (
    <TooltipContext.Provider value={callback}>
      {children}
      {tooltip}
    </TooltipContext.Provider>
  );
}

/**
 * Encapsulate the logic for tooltip
 */
function useTooltipCallback(): {
  readonly tooltip: JSX.Element;
  readonly callback: TooltipCallback;
} {
  const [isOpen, setIsOpen] = React.useState(false);
  const arrowRef = React.useRef<HTMLDivElement | null>(null);
  const paddingRem = 0.5;
  // FIXME: calculate px value based on rem dynamically
  const padding = paddingRem * 16;
  const { x, y, strategy, refs, context, middlewareData, placement } =
    useFloating({
      middleware: [
        offset(8),
        autoPlacement(),
        // FIXME: Maybe this is not needed? https://floating-ui.com/docs/flip#combining-with-shift-1
        shift({ padding }),
        arrow({ element: arrowRef }),
      ],
      // Reposition tooltip on scroll
      whileElementsMounted: (...args) =>
        /*
         * Since tooltip is only visible on focus/hover, don't have to worry
         * about resize as much
         */
        autoUpdate(...args, { ancestorResize: false, elementResize: false }),
      open: isOpen,
      onOpenChange: setIsOpen,
    });
  const hover = useHover(context, { delay: 400 });
  const focus = useFocus(context);
  const role = useRole(context, { role: 'tooltip' });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    role,
  ]);

  const staticSide =
    (
      {
        top: 'bottom',
        right: 'left',
        bottom: 'top',
        left: 'right',
      } as const
    )[placement.split('-')[0]] ?? 'bottom';
  const { x: arrowX, y: arrowY } = middlewareData.arrow ?? {};

  const [text, setText] = React.useState<string | undefined>(undefined);
  return {
    tooltip: (
      <FloatingPortal>
        <div
          // FIXME: test tooltips with very long lines and long content
          // FIXME: if tooltips are not shraed, don't render it if not open
          className={`
            w-max rounded
            ${isOpen && typeof text === 'string' ? undefined : 'hidden'}
          `}
          ref={refs.setFloating}
          style={{
            // FIXME: specify very high z-index
            position: strategy,
            top: 0,
            left: 0,
            transform: `translate(${roundByDevice(x ?? 0)}px,${roundByDevice(
              y ?? 0
            )}px)`,
            // FIXME: convert to tailwind
            backgroundColor: '#444',
            color: 'white',
            padding: `${paddingRem / 2}rem ${paddingRem / 4}`,
            maxWidth: `calc(100vw - ${paddingRem * 2}rem)`,
          }}
          {...getFloatingProps()}
        >
          {text}
          <div
            className="pointer-events-none"
            style={{
              position: strategy,
              left: typeof arrowX === 'number' ? `${arrowX}px` : undefined,
              top: typeof arrowY === 'number' ? `${arrowY}px` : undefined,
              [staticSide]: `-${paddingRem / 2}rem`,
              background: '#222',
              width: `${paddingRem}rem`,
              height: `${paddingRem}rem`,
              transform: 'rotate(45deg)',
            }}
            ref={arrowRef}
          />
        </div>
      </FloatingPortal>
    ),
    callback: React.useCallback(
      (text) => {
        function ref(element: HTMLElement | null): void {
          // Consider using a ref instead of state
          setText(text);
          refs.setReference(element);
        }

        return {
          ...getReferenceProps(),
          ref,
          forwardRef: ref,
        };
      },
      [refs.setReference, getReferenceProps]
    ),
  };
}

/**
 * Round the pixel value to display nicely on different DPIs
 */
function roundByDevice(value: number): number {
  const dpr = window.devicePixelRatio || 1;
  return Math.round(value * dpr) / dpr;
}

export function TooltipTesting(): JSX.Element {
  return (
    <TooltipProvider>
      <ElementA />
    </TooltipProvider>
  );
}

function ElementA(): JSX.Element {
  const tooltip = React.useContext(TooltipContext);
  /*
   * FIXME: this creates a new function on every render
   * FIXME: replace usages of disabled with aria-disabled.
   *     See https://floating-ui.com/docs/react#disabled-elements
   *     See https://floating-ui.com/docs/tooltip#disabled-buttons
   */
  return <button {...tooltip('Text')}>Button</button>;
}
