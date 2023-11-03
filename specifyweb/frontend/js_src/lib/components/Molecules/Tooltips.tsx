/**
 * # An integration with the Floating UI library to provide tooltips.
 *
 * ## Documentation of our solution
 *
 * - Use "title" attribute on elements to provide a tooltip.
 * - Can use a "data-title-delay" to customize the delay before the tooltip is
 *   shown (in milliseconds). I.e, set to 0 to disable delay.
 *   - To reduce bugs and simplify refactoring, use the titleDelay
 *     variable rather than hard coding the attribute name.
 * - Can use a "data-title-position" to customize the preferred position of the
 *   tooltip (if there is not enough space, it will pick a second best position
 *   automatically). Allowed values: "top", "bottom", "left", "right".
 *   - To reduce bugs and simplify refactoring, use the titlePosition
 *     variable rather than hard coding the attribute name.
 *
 * ## Reasoning behind the current solution
 *
 * Default browser tooltips were unsatisfactory because:
 *  - They are displayed after a long delay
 *  - They are displayed with very small font
 *
 * While Floating UI's documentation shows examples of creating React components
 * that can be used in place of "title" attributes were tooltips are necessary,
 * that solution was not acceptable for the following reasons:
 *
 *  - It requires a lot of boilerplate code. Way more than just having a "title"
 *    attribute.
 *  - It would require migrating all the usages in the code
 *  - It would be easy to forget to use the tooltip and use "title". What is
 *    even more likely, new people joining the project won't know about the
 *    existence of a custom tooltip element, and so would be using "title"
 *  - Floating UI's tooltips don't work for disabled elements because events
 *    are not triggered for disabled elements. Their workaround it to use
 *    aria-disabled attribute which is not a good solution:
 *
 *     - Using aria-disabled event listeners are fired. Specify 7 relies in
 *       many places on the fact that event listeners are not fired for
 *       disabled elements
 *     - "aria-disabled" would still leave the element focusable, unlike
 *       disabled
 *     - Would still have to rewrite all the places in the code that use
 *       disabled to use aria-disabled
 *     - Same problem that it's easy to forget to use aria-disabled or for new
 *       developers to not know that they have to use aria-disabled
 *
 * Instead, I retrofitted the Floating UI library to work with "title"
 * attribute. This required reimplementing their useHover() and useFocus()
 * hooks. Their source code was used as an inspiration for useInteraction()
 * hook which aimed to be a replacement (although small differences are likely
 * present). useInteraction() looks at the "title" attribute, but also
 * "data-title-delay" and "data-title-placement".
 *
 * For disabled elements, since events are not fired, browser's default
 * tooltip is displayed.
 *
 */

import type { FloatingContext, Placement } from '@floating-ui/react';
import {
  arrow,
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useFloating,
} from '@floating-ui/react';
import React from 'react';

import { useId } from '../../hooks/useId';
import { whitespaceSensitive } from '../../localization/utils';
import { listen } from '../../utils/events';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { oneRem } from '../Atoms';
import { userPreferences } from '../Preferences/userPreferences';

/**
 * Add this attribute to element to remove delay before title becomes visible
 */
export const titleDelay = 'data-title-delay';
export const titlePosition = 'data-title-position';
const defaultPlacement = 'bottom';

/**
 * Encapsulate the logic for tooltip
 */
export function TooltipManager(): JSX.Element {
  const [isOpen, setIsOpen] = React.useState(false);
  const arrowRef = React.useRef<HTMLDivElement | null>(null);
  const paddingRem = 0.5;
  const padding = paddingRem * oneRem;
  const [rawPlacement, setRawPlacement] =
    React.useState<Placement>(defaultPlacement);
  const { x, y, strategy, refs, context, middlewareData, placement } =
    useFloating({
      placement: rawPlacement,
      middleware: [
        // Caution: the order matters
        offset(padding),
        flip({
          fallbackAxisSideDirection: 'end',
          crossAxis: false,
        }),
        shift(),
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
    (
      forElement: HTMLElement | undefined,
      text: string | undefined,
      placement: Placement
    ) => {
      setReference(forElement ?? null);
      setText(text);
      setIsOpen(typeof text === 'string');
      setRawPlacement(placement);
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
            top-0 left-0 z-[10000] block w-max whitespace-pre-line rounded
            bg-gray-100 text-gray-900 shadow-md duration-0 dark:bg-black
            dark:text-gray-200
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

/** Delay before showing tooltip if using keyboard */
let delayFocusIn = 400;
/** Delay before showing tooltip if using mouse */
let delayMouseIn = 1000;
// Disable delays on touch screen devices
window?.addEventListener(
  'touchstart',
  () => {
    delayFocusIn = 0;
    delayMouseIn = 0;
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
    text: string | undefined,
    placement: Placement
  ) => void,
  context: FloatingContext,
  floatingId: string | undefined
): void {
  const [isEnabled] = userPreferences.use('general', 'ui', 'useCustomTooltips');

  const [currentElement, setCurrentElement] = React.useState<
    HTMLElement | undefined
  >(undefined);
  const currentElementRef = React.useRef<HTMLElement | undefined>(undefined);
  const currentTitle = React.useRef<string | undefined>(undefined);

  const floatingIdRef = React.useRef(floatingId);
  floatingIdRef.current = floatingId;

  // Hold a list of clean up functions for side effects
  const flushQueue = React.useRef<RA<() => void>>([]);
  const flush = React.useCallback(() => {
    flushQueue.current.forEach(f.call);
    flushQueue.current = [];
  }, []);
  const toFlush = React.useCallback((callback: () => void) => {
    flushQueue.current = [...flushQueue.current, callback];
  }, []);

  const containerRef = React.useRef(container);
  containerRef.current = container;

  const contextRef = React.useRef(context);
  contextRef.current = context;

  const handleClose = React.useCallback((): void => {
    setContent(undefined, undefined, defaultPlacement);

    // Revert old title attribute for the previous button
    if (typeof currentTitle.current === 'string')
      currentElementRef.current?.setAttribute('title', currentTitle.current);
    currentElementRef.current?.removeAttribute('aria-describedby');

    flush();
    currentTitle.current = undefined;
    currentElementRef.current = undefined;
    setCurrentElement(undefined);
  }, [setContent, flush]);

  // Handle blur/mouseleave
  const handleOut = React.useCallback(
    (event: FocusEvent | MouseEvent): void => {
      if (
        event.target !== containerRef.current &&
        event.target !== currentElementRef.current
      )
        return;
      flush();

      if (event.type === 'focus') handleClose();
      else {
        const timeOut = setTimeout(handleClose, 400);
        toFlush(() => clearTimeout(timeOut));
      }
    },
    [flush, handleClose]
  );

  React.useEffect(
    () =>
      typeof container === 'object'
        ? listen(container, 'mouseleave', handleOut, {
            passive: true,
          })
        : undefined,
    [container, handleOut]
  );

  React.useEffect(() => {
    if (!isEnabled) return undefined;

    // Handle focus/mouseenter
    function handleIn(event: FocusEvent | MouseEvent): void {
      const target = event.target as HTMLElement;
      if (target?.getAttribute === undefined) return;
      if (target === containerRef.current) {
        flush();
        return;
      }
      const title = target.getAttribute('title');
      if (typeof title !== 'string' || title.length === 0) return;
      display(event.type as 'focus' | 'mouseenter', target, title);
    }

    function display(
      type: 'focus' | 'mouseenter',
      element: HTMLElement,
      title: string
    ): void {
      const isDisplayed =
        currentElementRef.current !== undefined && contextRef.current.open;

      handleClose();
      // Remove the title attribute to silence default browser titles
      element.removeAttribute('title');
      currentElementRef.current = element;
      setCurrentElement(element);
      currentTitle.current = title;

      // Set exit event listener
      toFlush(
        listen(
          element,
          type === 'focus' ? ('blur' as const) : ('mouseleave' as const),
          handleOut,
          {
            passive: true,
            once: true,
          }
        )
      );

      function handleSet(): void {
        setContent(
          element,
          whitespaceSensitive(title),
          f.maybe(
            element.getAttribute(titlePosition) ?? undefined,
            normalizePlacement
          ) ?? defaultPlacement
        );
        if (typeof floatingIdRef.current === 'string')
          element.setAttribute('aria-describedby', floatingIdRef.current);
      }

      const customDelay = f.maybe(
        element.getAttribute(titleDelay) ?? undefined,
        f.parseInt
      );
      if (
        // If tooltip is already displayed, switch to displaying new tooltip right away
        isDisplayed &&
        type === 'mouseenter' &&
        (customDelay === undefined || customDelay === 0)
      )
        handleSet();
      else {
        /*
         * Otherwise, add a delay before displaying the tooltip. This prevents
         * spamming the UI with tooltips if the user is quickly moving the mouse
         * over the page
         */
        const delay =
          customDelay ?? (type === 'focus' ? delayFocusIn : delayMouseIn);
        const timeOut = setTimeout(handleSet, delay);
        toFlush(() => clearTimeout(timeOut));
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
  }, [setContent, flush, handleOut, handleClose, isEnabled, toFlush]);

  /*
   * Close the tooltip if the element that triggered it was removed
   * See https://github.com/specify/specify7/pull/3002#issuecomment-1433047175
   */
  React.useEffect(() => {
    const referenceParent = currentElement?.parentNode ?? undefined;
    if (referenceParent === undefined) return undefined;
    const observer = new MutationObserver(() => {
      if (
        typeof currentElement === 'object' &&
        !document.body.contains(currentElement)
      )
        handleClose();
    });
    observer.observe(referenceParent, { childList: true });
    return (): void => observer.disconnect();
  }, [handleClose, currentElement]);

  /*
   * Close the tooltip on click
   * See https://github.com/specify/specify7/pull/3002#issuecomment-1433047175
   */
  React.useEffect(
    () =>
      typeof currentElement === 'object'
        ? listen(currentElement, 'click', handleClose)
        : undefined,
    [handleClose, currentElement]
  );
}

const allowedPlacements: ReadonlySet<Placement> = new Set([
  'top',
  'right',
  'bottom',
  'left',
]);

/**
 * Normalize placement
 */
function normalizePlacement(raw: string): Placement {
  if (process.env.NODE_ENV !== 'production' && !f.has(allowedPlacements, raw))
    console.error(
      `Unexpected tooltip position: ${raw}. Allowed values: top, right, bottom, left.`
    );

  const normalized = raw.toLowerCase().trim();
  return normalized === 'up' ? 'top' : (normalized as Placement);
}
