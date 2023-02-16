import {
  arrow,
  autoPlacement,
  autoUpdate,
  FloatingPortal,
  offset,
  useFloating,
  useFloatingParentNodeId,
  useFloatingTree,
  useRole,
} from '@floating-ui/react';
import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { whitespaceSensitive } from '../../localization/utils';
import { listen } from '../../utils/events';
import type { IR } from '../../utils/types';
import { oneRem } from '../Atoms';
import { Button } from '../Atoms/Button';
import { error } from '../Errors/assert';

// FIXME: move this file

/*
 * Warning: tooltip content must not contain interactive elements.
 * It creases a lot more accessibility challenges.
 * For that, a pop-over should be created
 * See https://floating-ui.com/docs/popover
 */
type TooltipCallback = (content: LocalizedString) => IR<unknown> & {
  /*
   * FIXME: also do forward ref
   * FIXME: add onHover, onFocus,...etc types here to that TS can detect bugs
   */
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
  const { /* Callback,*/ tooltip } = useTooltipCallback();
  return (
    // <TooltipContext.Provider value={callback}>
    <>
      {children}
      {tooltip}
    </>
    // </TooltipContext.Provider>
  );
}

/**
 * Encapsulate the logic for tooltip
 */
function useTooltipCallback(): {
  readonly tooltip: JSX.Element;
  // Readonly callback: TooltipCallback;
} {
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
  // const [tooltipContent, setTooltipContent] =
  //   React.useState<HTMLElement | null>(null);
  const setFloating = refs.setFloating;
  const tooltipRef: React.RefCallback<HTMLDivElement | null> =
    React.useCallback(
      (element: HTMLDivElement | null) => {
        setTooltip(element);
        setFloating(element);
      },
      [setFloating]
    );
  useInteraction(tooltip ?? undefined, setContent);
  const role = useRole(context, { role: 'tooltip' });

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

  return {
    tooltip: (
      <FloatingPortal id="portal-root">
        {isOpen && typeof text === 'string' ? (
          <div
            ref={tooltipRef}
            className={`
              top-0 left-0 z-[10000] w-max rounded bg-gray-100 text-gray-900
              dark:bg-black dark:text-gray-200
            `}
            style={{
              position: strategy,
              transform: `translate(${roundByDevice(x ?? 0)}px,${roundByDevice(
                y ?? 0
              )}px)`,
              padding: `${paddingRem}rem`,
              maxWidth: `calc(100vw - ${paddingRem * 2}rem)`,
            }}
            {...role.floating}
          >
            <div
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
            {/* FIXME: enable pre-formatted text for this */}
            {text}
          </div>
        ) : null}
      </FloatingPortal>
    ),
    /*
     *Callback: React.useCallback(
     *(text) => {
     *  function ref(element: HTMLElement | null): void {
     *    // Consider using a ref instead of state
     *    setText(text);
     *    setReference(element);
     *  }
     *
     *  return {
     *    ...role.reference,
     *    ref,
     *    forwardRef: ref,
     *  };
     *},
     *[setReference, role.reference]
     *),
     */
  };
}

/**
 * Round the pixel value to display nicely on different DPIs
 * See https://floating-ui.com/docs/misc#subpixel-and-accelerated-positioning
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
  /*
   * FIXME: this creates a new function on every render
   * FIXME: replace usages of disabled with aria-disabled.
   *     See https://floating-ui.com/docs/react#disabled-elements
   *     See https://floating-ui.com/docs/tooltip#disabled-buttons
   */
  return (
    <Button.Blue title="Lorem Ipsum\n \nBar" onClick={console.log}>
      Button
    </Button.Blue>
  );
}

const delayFocusIn = 200;
const delayMouseIn = 400;
const delayOut = 1000;

/**
 * Handle displaying/hiding tooltip
 */
function useInteraction(
  container: HTMLElement | undefined,
  setContent: (
    forElement: HTMLElement | undefined,
    text: string | undefined
  ) => void
): void {
  const timeOut = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const currentElement = React.useRef<HTMLElement | undefined>(undefined);
  const currentTitle = React.useRef<string | undefined>(undefined);

  const clear = React.useCallback((): void => {
    if (timeOut.current === undefined) return;
    clearTimeout(timeOut.current);
    timeOut.current = undefined;
  }, []);

  const containerRef = React.useRef(container);
  containerRef.current = container;

  // Revert old title attribute for the previous button
  const revertTitle = React.useCallback(
    () =>
      typeof currentTitle.current === 'string'
        ? currentElement.current?.setAttribute('title', currentTitle.current)
        : undefined,
    []
  );

  // Handle blur/mouseleave
  const handleOut = React.useCallback(
    (event: FocusEvent | MouseEvent): void => {
      if (
        event.target !== containerRef.current &&
        event.target !== currentElement.current
      )
        return;
      clear();
      timeOut.current = setTimeout(() => {
        setContent(undefined, undefined);
        revertTitle();
        currentElement.current = undefined;
        currentTitle.current = undefined;
      }, delayOut);
    },
    [clear, setContent]
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
      revertTitle();
      // Remove the title attribute to silence default browser titles
      element.removeAttribute('title');

      const handleSet = (): void =>
        // FIXME: don't need to call whitespaceSensitive everywhere anymore?
        setContent(element, whitespaceSensitive(title));
      // FIXME: also carry over useRole() props

      // If tooltip is not already displayed, add a delay before displaying the tooltip. This prevents spamming the UI with tooltips if the user is quickly moving the mouse over the page
      if (currentElement.current === undefined)
        timeOut.current = setTimeout(
          handleSet,
          type === 'focus' ? delayFocusIn : delayMouseIn
        );
      // Otherwise, switch to displaying new tooltip right away
      else handleSet();
      currentElement.current = element;
      currentTitle.current = title;
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
  }, [setContent, clear, revertTitle, handleOut]);
}

const hoverDelay = 400;

function useHover2(context, { handleClose = null } = {}) {
  const {
    open,
    onOpenChange,
    dataRef,
    events,
    elements: { domReference, floating },
    refs,
  } = context;
  const tree = useFloatingTree();
  const parentId = useFloatingParentNodeId();
  const handleCloseRef = useLatestRef(handleClose);
  const pointerTypeRef = React.useRef();
  const timeoutRef = React.useRef();
  const handlerRef = React.useRef();
  const performedPointerEventsMutationRef = React.useRef(false);
  const unbindMouseMoveRef = React.useRef(() => {});
  const isHoverOpen = React.useCallback(() => {
    let _dataRef$current$open;
    const type =
      (_dataRef$current$open = dataRef.current.openEvent) == null
        ? void 0
        : _dataRef$current$open.type;
    return (
      (type == null ? void 0 : type.includes('mouse')) && type !== 'mousedown'
    );
  }, [dataRef]);

  React.useEffect(() => {
    if (!handleCloseRef.current || !open) {
      return;
    }

    function onLeave() {
      if (isHoverOpen()) {
        onOpenChange(false);
      }
    }

    const html = getDocument(floating).documentElement;
    html.addEventListener('mouseleave', onLeave);
    return () => {
      html.removeEventListener('mouseleave', onLeave);
    };
  }, [floating, open, onOpenChange, handleCloseRef, dataRef, isHoverOpen]);
  const closeWithDelay = React.useCallback(
    (runElseBranch) => {
      if (runElseBranch === void 0) {
        runElseBranch = true;
      }
      const closeDelay = getDelay(hoverDelay, 'close', pointerTypeRef.current);
      if (closeDelay && !handlerRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => onOpenChange(false), closeDelay);
      } else if (runElseBranch) {
        clearTimeout(timeoutRef.current);
        onOpenChange(false);
      }
    },
    [onOpenChange]
  );
  const cleanupMouseMoveHandler = React.useCallback(() => {
    unbindMouseMoveRef.current();
    handlerRef.current = undefined;
  }, []);
  const clearPointerEvents = React.useCallback(() => {
    if (performedPointerEventsMutationRef.current) {
      const body = getDocument(refs.floating.current).body;
      body.style.pointerEvents = '';
      body.removeAttribute(safePolygonIdentifier);
      performedPointerEventsMutationRef.current = false;
    }
  }, [refs]);

  /*
   * Registering the mouse events on the reference directly to bypass React's
   * delegation system. If the cursor was on a disabled element and then entered
   * the reference (no gap), `mouseenter` doesn't fire in the delegation system.
   */
  React.useEffect(() => {
    function isClickLikeOpenEvent() {
      return dataRef.current.openEvent
        ? ['click', 'mousedown'].includes(dataRef.current.openEvent.type)
        : false;
    }

    function onMouseEnter(event) {
      clearTimeout(timeoutRef.current);
      if (getDelay(hoverDelay, 'open') === 0) {
        return;
      }
      dataRef.current.openEvent = event;
      const openDelay = getDelay(hoverDelay, 'open', pointerTypeRef.current);
      if (openDelay) {
        timeoutRef.current = setTimeout(() => {
          onOpenChange(true);
        }, openDelay);
      } else {
        onOpenChange(true);
      }
    }

    function onMouseLeave(event) {
      if (isClickLikeOpenEvent()) {
        return;
      }
      unbindMouseMoveRef.current();
      const document_ = getDocument(floating);
      if (handleCloseRef.current) {
        clearTimeout(timeoutRef.current);
        handlerRef.current = handleCloseRef.current({
          ...context,
          tree,
          x: event.clientX,
          y: event.clientY,
          onClose() {
            clearPointerEvents();
            cleanupMouseMoveHandler();
            closeWithDelay();
          },
        });
        const handler = handlerRef.current;
        document_.addEventListener('mousemove', handler);
        unbindMouseMoveRef.current = () => {
          document_.removeEventListener('mousemove', handler);
        };
        return;
      }
      closeWithDelay();
    }

    /*
     * Ensure the floating element closes after scrolling even if the pointer
     * did not move.
     * https://github.com/floating-ui/floating-ui/discussions/1692
     */
    function onScrollMouseLeave(event) {
      if (isClickLikeOpenEvent()) {
        return;
      }
      handleCloseRef.current == null
        ? void 0
        : handleCloseRef.current({
            ...context,
            tree,
            x: event.clientX,
            y: event.clientY,
            onClose() {
              cleanupMouseMoveHandler();
              closeWithDelay();
            },
          })(event);
    }

    if (isElement(domReference)) {
      const ref = domReference;
      open && ref.addEventListener('mouseleave', onScrollMouseLeave);
      floating == null
        ? void 0
        : floating.addEventListener('mouseleave', onScrollMouseLeave);
      ref.addEventListener('mousemove', onMouseEnter, {
        once: true,
      });
      ref.addEventListener('mouseenter', onMouseEnter);
      ref.addEventListener('mouseleave', onMouseLeave);
      return () => {
        open && ref.removeEventListener('mouseleave', onScrollMouseLeave);
        floating == null
          ? void 0
          : floating.removeEventListener('mouseleave', onScrollMouseLeave);
        ref.removeEventListener('mousemove', onMouseEnter);
        ref.removeEventListener('mouseenter', onMouseEnter);
        ref.removeEventListener('mouseleave', onMouseLeave);
      };
    }
  }, [
    domReference,
    floating,
    context,
    closeWithDelay,
    cleanupMouseMoveHandler,
    clearPointerEvents,
    onOpenChange,
    open,
    tree,
    handleCloseRef,
    dataRef,
  ]);

  /*
   * Block pointer-events of every element other than the reference and floating
   * while the floating element is open and has a `handleClose` handler. Also
   * handles nested floating elements.
   * https://github.com/floating-ui/floating-ui/issues/1722
   */
  React.useLayoutEffect(() => {
    let _handleCloseRef$curre;
    if (
      open &&
      (_handleCloseRef$curre = handleCloseRef.current) != null &&
      _handleCloseRef$curre.__options.blockPointerEvents &&
      isHoverOpen()
    ) {
      const body = getDocument(floating).body;
      body.setAttribute(safePolygonIdentifier, '');
      body.style.pointerEvents = 'none';
      performedPointerEventsMutationRef.current = true;
      if (isElement(domReference) && floating) {
        let _tree$nodesRef$curren;
        let _tree$nodesRef$curren2;
        const ref = domReference;
        const parentFloating =
          tree == null
            ? void 0
            : (_tree$nodesRef$curren = tree.nodesRef.current.find(
                (node) => node.id === parentId
              )) == null
            ? void 0
            : (_tree$nodesRef$curren2 = _tree$nodesRef$curren.context) == null
            ? void 0
            : _tree$nodesRef$curren2.elements.floating;
        if (parentFloating) {
          parentFloating.style.pointerEvents = '';
        }
        ref.style.pointerEvents = 'auto';
        floating.style.pointerEvents = 'auto';
        return () => {
          ref.style.pointerEvents = '';
          floating.style.pointerEvents = '';
        };
      }
    }
  }, [
    open,
    parentId,
    floating,
    domReference,
    tree,
    handleCloseRef,
    dataRef,
    isHoverOpen,
  ]);
  React.useLayoutEffect(() => {
    if (!open) {
      pointerTypeRef.current = undefined;
      cleanupMouseMoveHandler();
      clearPointerEvents();
    }
  }, [open, cleanupMouseMoveHandler, clearPointerEvents]);
  React.useEffect(
    () => () => {
      cleanupMouseMoveHandler();
      clearTimeout(timeoutRef.current);
      clearPointerEvents();
    },
    [cleanupMouseMoveHandler, clearPointerEvents]
  );
  return React.useMemo(() => {
    function setPointerRef(event) {
      pointerTypeRef.current = event.pointerType;
    }

    return {
      reference: {
        onPointerDown: setPointerRef,
        onPointerEnter: setPointerRef,
      },
      floating: {
        onMouseEnter() {
          clearTimeout(timeoutRef.current);
        },
        onMouseLeave() {
          events.emit('dismiss', {
            type: 'mouseLeave',
            data: {
              returnFocus: false,
            },
          });
          closeWithDelay(false);
        },
      },
    };
  }, [events, open, onOpenChange, closeWithDelay]);
}

function getDelay() {}

function getDocument() {}
