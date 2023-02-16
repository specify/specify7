import type { FloatingContext } from '@floating-ui/react';
import {
  arrow,
  autoPlacement,
  autoUpdate,
  FloatingPortal,
  offset,
  safePolygon,
  useFloating,
} from '@floating-ui/react';
import React from 'react';

import { useId } from '../../hooks/useId';
import { whitespaceSensitive } from '../../localization/utils';
import { listen } from '../../utils/events';
import { oneRem } from '../Atoms';
import { usePref } from '../UserPreferences/usePref';

/**
 * Add this attribute to element to remove delay before title becomes visible
 */
export const noTitleDelay = 'data-no-title-delay';

/**
 * Encapsulate the logic for tooltip
 */
export function TooltipManager(): JSX.Element {
  const [isOpen, setIsOpen] = React.useState(false);
  const arrowRef = React.useRef<HTMLDivElement | null>(null);
  const paddingRem = 0.5;
  const padding = paddingRem * oneRem;
  const { x, y, strategy, refs, context, middlewareData, placement } =
    useFloating({
      middleware: [
        offset(padding),
        autoPlacement(),
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

  const id = useId('tooltip')('');

  const setReference = refs.setReference;
  const [text, setText] = React.useState<string | undefined>(undefined);
  const setContent = React.useCallback(
    (forElement: HTMLElement | undefined, text: string | undefined) => {
      setReference(forElement ?? null);
      setText(text);
      setIsOpen(typeof text === 'string');
    },
    [setReference]
  );

  const [tooltip, setTooltip] = React.useState<HTMLDivElement | null>(null);
  const setFloating = refs.setFloating;
  const tooltipRef: React.RefCallback<HTMLDivElement | null> =
    React.useCallback(
      (element: HTMLDivElement | null) => {
        setTooltip(element);
        setFloating(element);
      },
      [setFloating]
    );
  useInteraction(tooltip ?? undefined, setContent, context, id);

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

  return (
    <FloatingPortal id="portal-root">
      {isOpen && typeof text === 'string' ? (
        <span
          className={`
            top-0 left-0 z-[10000] block w-max whitespace-pre-line rounded bg-gray-100
            text-gray-900 dark:bg-black dark:text-gray-200
          `}
          id={id}
          ref={tooltipRef}
          role="tooltip"
          style={{
            position: strategy,
            transform: `translate(${roundByDevice(x ?? 0)}px,${roundByDevice(
              y ?? 0
            )}px)`,
            padding: `${paddingRem}rem`,
            maxWidth: `calc(100vw - ${paddingRem * 2}rem)`,
          }}
        >
          <span
            aria-hidden
            className="pointer-events-none z-[-1] rotate-45 bg-gray-100 dark:bg-black"
            ref={arrowRef}
            style={{
              position: strategy,
              left: typeof arrowX === 'number' ? `${arrowX}px` : undefined,
              top: typeof arrowY === 'number' ? `${arrowY}px` : undefined,
              [staticSide]: `-${paddingRem / 2}rem`,
              width: `${paddingRem}rem`,
              height: `${paddingRem}rem`,
            }}
          />
          {text}
        </span>
      ) : null}
    </FloatingPortal>
  );
}

/**
 * Round the pixel value to display nicely on different DPIs
 * See https://floating-ui.com/docs/misc#subpixel-and-accelerated-positioning
 */
function roundByDevice(value: number): number {
  const dpr = window.devicePixelRatio || 1;
  return Math.round(value * dpr) / dpr;
}

let delayFocusIn = 400;
let delayMouseIn = 800;
let delayOut = 1000;
// Disable delays on touch screen devices
window?.addEventListener(
  'touchstart',
  () => {
    delayFocusIn = 0;
    delayMouseIn = 0;
    delayOut = 0;
  },
  { once: true }
);

/**
 * Handle displaying/hiding tooltip
 */
function useInteraction(
  container: HTMLElement | undefined,
  setContent: (
    forElement: HTMLElement | undefined,
    text: string | undefined
  ) => void,
  context: FloatingContext,
  floatingId: string | undefined
): void {
  const [isEnabled] = usePref('general', 'ui', 'useCustomTooltips');

  const timeOut = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const currentElement = React.useRef<HTMLElement | undefined>(undefined);
  const currentTitle = React.useRef<string | undefined>(undefined);
  const handleCloseRef = React.useRef<(() => void) | undefined>(undefined);

  const floatingIdRef = React.useRef(floatingId);
  floatingIdRef.current = floatingId;

  const clear = React.useCallback((): void => {
    if (timeOut.current === undefined) return;
    clearTimeout(timeOut.current);
    timeOut.current = undefined;
    handleCloseRef.current?.();
  }, []);

  const containerRef = React.useRef(container);
  containerRef.current = container;

  const contextRef = React.useRef(context);
  contextRef.current = context;

  // Revert old title attribute for the previous button
  const revertDomChanges = React.useCallback(() => {
    if (typeof currentTitle.current === 'string')
      currentElement.current?.setAttribute('title', currentTitle.current);
    currentElement.current?.removeAttribute('aria-describedby');
  }, []);

  // Handle blur/mouseleave
  const handleOut = React.useCallback(
    (event: FocusEvent | MouseEvent): void => {
      if (
        event.target !== containerRef.current &&
        event.target !== currentElement.current
      )
        return;
      clear();

      function handleClose(): void {
        setContent(undefined, undefined);
        revertDomChanges();
        currentElement.current = undefined;
        currentTitle.current = undefined;
        handleCloseRef.current?.();
      }

      if (event.type === 'focus') handleClose();
      else {
        // See https://floating-ui.com/docs/useHover#safepolygon
        const mouseEvent = event as MouseEvent;
        const handler = safePolygon()({
          ...contextRef.current,
          x: mouseEvent.clientX,
          y: mouseEvent.clientY,
          onClose: handleClose,
        });
        globalThis.addEventListener('mousemove', handler);
        handleCloseRef.current = (): void =>
          globalThis.removeEventListener('mousemove', handler);
      }
      timeOut.current = setTimeout(() => {}, delayOut);
    },
    [clear, setContent, revertDomChanges]
  );

  React.useEffect(
    () =>
      typeof container === 'object'
        ? listen(container, 'mouseleave', handleOut, {
            passive: true,
          })
        : undefined,
    [container, clear, handleOut]
  );

  React.useEffect(() => {
    if (!isEnabled) return undefined;

    // Handle focus/mouseenter
    function handleIn(event: FocusEvent | MouseEvent): void {
      if (event.target === containerRef.current) {
        clear();
        return;
      }
      const target = event.target as HTMLElement;
      if (target?.getAttribute === undefined) return;
      const title = target.getAttribute('title');
      if (typeof title !== 'string' || title.length === 0) return;
      display(event.type as 'focus' | 'mouseenter', target, title);

      // Set exit event listener
      target.addEventListener(
        event.type === 'focus' ? ('blur' as const) : ('mouseleave' as const),
        handleOut,
        {
          passive: true,
          once: true,
        }
      );
    }

    function display(
      type: 'focus' | 'mouseenter',
      element: HTMLElement,
      title: string
    ): void {
      clear();
      revertDomChanges();
      // Remove the title attribute to silence default browser titles
      element.removeAttribute('title');
      const isDisplayed = currentElement.current !== undefined;
      currentElement.current = element;
      currentTitle.current = title;

      const handleSet = (): void => {
        // FIXME: don't need to call whitespaceSensitive everywhere anymore
        setContent(element, whitespaceSensitive(title));
        if (typeof floatingIdRef.current === 'string')
          element.setAttribute('aria-describedby', floatingIdRef.current);
      };

      // If tooltip is already displayed, switch to displaying new tooltip right away
      if (isDisplayed && type === 'mouseenter') handleSet();
      else {
        // Otherwise, add a delay before displaying the tooltip. This prevents spamming the UI with tooltips if the user is quickly moving the mouse over the page
        const delay = element.hasAttribute(noTitleDelay)
          ? 0
          : type === 'focus'
          ? delayFocusIn
          : delayMouseIn;
        timeOut.current = setTimeout(handleSet, delay);
      }
    }

    const mouseEnter = listen(document, 'mouseenter', handleIn, {
      capture: true,
      passive: true,
    });
    const focus = listen(document, 'focus', handleIn, {
      capture: true,
      passive: true,
    });
    return (): void => {
      mouseEnter();
      focus();
    };
  }, [setContent, clear, revertDomChanges, handleOut, isEnabled]);
}
