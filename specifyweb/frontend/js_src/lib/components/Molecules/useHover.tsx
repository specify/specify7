import { ElementProps, FloatingContext, safePolygon } from '@floating-ui/react';
import React, { useLayoutEffect } from 'react';
import { listen } from '../../utils/events';

const handleClose = safePolygon<Element>();
const safePolygonIdentifier = 'data-floating-ui-safe-polygon';

/**
 * Adds hover event listeners that change the open state, like CSS :hover.
 * @see https://floating-ui.com/docs/useHover
 */
function useHover(context: FloatingContext<Element>): ElementProps {
  const {
    open,
    onOpenChange: handleOpenChange,
    dataRef,
    events,
    elements: { domReference, floating },
  } = context;

  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const handlerRef = React.useRef<(event: MouseEvent) => void>();
  const restTimeoutRef = React.useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined);
  const blockMouseMoveRef = React.useRef(true);
  const performedPointerEventsMutationRef = React.useRef(false);
  const unbindMouseMoveRef = React.useRef(() => {});

  /*
   * When dismissing before opening, clear the delay timeouts to cancel it
   * from showing.
   */
  React.useEffect(() => {
    function handleDismiss(): void {
      clearTimeout(timeoutRef.current);
      clearTimeout(restTimeoutRef.current);
      blockMouseMoveRef.current = true;
    }

    events.on('dismiss', handleDismiss);
    return () => events.off('dismiss', handleDismiss);
  }, [events]);

  const isHoverOpen = React.useCallback(() => {
    const type = dataRef.current.openEvent?.type;
    return (type?.includes('mouse') ?? false) && type !== 'mousedown';
  }, [dataRef]);

  React.useEffect(
    () =>
      open
        ? listen(document, 'mouseleave', () =>
            isHoverOpen() ? handleOpenChange(false) : undefined
          )
        : undefined,
    [floating, open, handleOpenChange, isHoverOpen]
  );

  const closeWithDelay = React.useCallback(
    (runElseBranch = true) => {
      if (!runElseBranch) return;
      clearTimeout(timeoutRef.current);
      handleOpenChange(false);
    },
    [handleOpenChange]
  );

  const cleanupMouseMoveHandler = React.useCallback(() => {
    unbindMouseMoveRef.current();
    handlerRef.current = undefined;
  }, []);

  const clearPointerEvents = React.useCallback(() => {
    if (!performedPointerEventsMutationRef.current) return;
    document.body.style.pointerEvents = '';
    document.body.removeAttribute(safePolygonIdentifier);
    performedPointerEventsMutationRef.current = false;
  }, []);

  /*
   * Registering the mouse events on the reference directly to bypass React's
   * delegation system. If the cursor was on a disabled element and then entered
   * the reference (no gap), `mouseenter` doesn't fire in the delegation system.
   */
  React.useEffect(() => {
    const isClickLikeOpenEvent = (): boolean =>
      dataRef.current.openEvent
        ? ['click', 'mousedown'].includes(dataRef.current.openEvent.type)
        : false;

    function handleMouseEnter(event: MouseEvent): void {
      clearTimeout(timeoutRef.current);
      blockMouseMoveRef.current = false;

      dataRef.current.openEvent = event;

      if (delayMouseIn > 0)
        timeoutRef.current = setTimeout(() => {
          handleOpenChange(true);
        }, delayMouseIn);
      else handleOpenChange(true);
    }

    function handleMouseLeave(event: MouseEvent): void {
      if (isClickLikeOpenEvent()) return;

      unbindMouseMoveRef.current();

      clearTimeout(restTimeoutRef.current);

      // Prevent clearing `handleScrollMouseLeave` timeout.
      if (!open) clearTimeout(timeoutRef.current);

      handlerRef.current = handleClose({
        ...context,
        x: event.clientX,
        y: event.clientY,
        onClose() {
          clearPointerEvents();
          cleanupMouseMoveHandler();
          closeWithDelay();
        },
      });

      const handler = handlerRef.current;

      document.addEventListener('mousemove', handler);
      unbindMouseMoveRef.current = (): void =>
        document.removeEventListener('mousemove', handler);
    }

    /*
     * Ensure the floating element closes after scrolling even if the pointer
     * did not move.
     * https://github.com/floating-ui/floating-ui/discussions/1692
     */
    function handleScrollMouseLeave(event: MouseEvent): void {
      if (isClickLikeOpenEvent()) return;

      handleClose({
        ...context,
        x: event.clientX,
        y: event.clientY,
        onClose() {
          clearPointerEvents();
          cleanupMouseMoveHandler();
          closeWithDelay();
        },
      })(event);
    }

    function handleReferenceLeave(event: MouseEvent): void {
      if (open) handleScrollMouseLeave(event);
      handleMouseLeave(event);
    }

    let firedMouseMove = false;

    function handleReferenceMouseMove(event: MouseEvent): void {
      if (!firedMouseMove) {
        clearTimeout(restTimeoutRef.current);
        restTimeoutRef.current = setTimeout(() => {
          if (!blockMouseMoveRef.current) handleOpenChange(true);
        }, restMs);
        firedMouseMove = true;
      }
      handleMouseEnter(event);
    }

    // FIXME: refactor all usages of this
    if (!(domReference instanceof HTMLElement)) return undefined;
    // FIXME: set this on element once open
    domReference.addEventListener('mouseleave', handleReferenceLeave);
    floating?.addEventListener('mouseleave', handleScrollMouseLeave);
    // FIXME: set this on element once open
    domReference.addEventListener('mousemove', handleReferenceMouseMove);
    // FIXME: set this globally
    domReference.addEventListener('mouseenter', handleMouseEnter);
    // FIXME: set this on element once open
    domReference.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      domReference.removeEventListener('mouseleave', handleReferenceLeave);
      floating?.removeEventListener('mouseleave', handleScrollMouseLeave);
      // FIXME: set this on element once open
      domReference.removeEventListener('mousemove', handleReferenceMouseMove);
      // FIXME: set this globally
      domReference.removeEventListener('mouseenter', handleMouseEnter);
      // FIXME: set this on element once open
    };
  }, [
    domReference,
    floating,
    context,
    closeWithDelay,
    cleanupMouseMoveHandler,
    clearPointerEvents,
    handleOpenChange,
    open,
    dataRef,
  ]);

  useLayoutEffect(() => {
    if (!open) return;
    cleanupMouseMoveHandler();
    clearPointerEvents();
  }, [open, cleanupMouseMoveHandler, clearPointerEvents]);

  React.useEffect(
    () => () => {
      cleanupMouseMoveHandler();
      clearTimeout(timeoutRef.current);
      clearTimeout(restTimeoutRef.current);
      clearPointerEvents();
    },
    [cleanupMouseMoveHandler, clearPointerEvents]
  );

  return React.useMemo(
    () => ({
      floating: {
        onMouseEnter: () => clearTimeout(timeoutRef.current),
        onMouseLeave(): void {
          events.emit('dismiss', {
            type: 'mouseLeave',
            data: {
              returnFocus: false,
            },
          });
          closeWithDelay(false);
        },
      },
    }),
    [events, handleOpenChange, closeWithDelay]
  );
}
