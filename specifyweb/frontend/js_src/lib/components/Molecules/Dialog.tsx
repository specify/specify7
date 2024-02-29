/**
 * React Dialogs
 *
 * @module
 */
import React from 'react';
import type { DraggableData } from 'react-draggable';
import Draggable from 'react-draggable';
import type { Props } from 'react-modal';
import Modal from 'react-modal';
import type { LocalizedString } from 'typesafe-i18n';

import { useCachedState } from '../../hooks/useCachedState';
import { useId } from '../../hooks/useId';
import { listen } from '../../utils/events';
import { f } from '../../utils/functools';
import { KEY } from '../../utils/utils';
import { Button, DialogContext } from '../Atoms/Button';
import { className, dialogIconTriggers } from '../Atoms/className';
import { dialogIcons } from '../Atoms/Icons';
import { LoadingContext } from '../Core/Contexts';
import {
  useHighContrast,
  useReducedTransparency,
  useTransitionDuration,
} from '../Preferences/Hooks';
import { userPreferences } from '../Preferences/userPreferences';
import { useTitle } from './AppTitle';

/**
 * Modal dialog with a loading bar
 * @module
 */
export function LoadingScreen(): null {
  const loading = React.useContext(LoadingContext);
  const resolveRef = React.useRef<() => void>();
  React.useEffect(() => {
    loading(
      new Promise<void>((resolve) => {
        resolveRef.current = resolve;
      })
    );
    return (): void => resolveRef.current?.();
  }, [loading]);

  return null;
}

const commonContainer = 'rounded resize max-w-[90%] shadow-lg shadow-gray-500';
export const dialogClassNames = {
  fullScreen: '!transform-none !w-full !h-full',
  freeContainer: `${commonContainer} max-h-[90%]`,
  narrowContainer: `${commonContainer} max-h-[90%] sm:max-h-[50%] min-w-[min(20rem,90%)]
    lg:max-w-[50%]`,
  normalContainer: `${commonContainer} max-h-[90%] min-w-[min(30rem,90%)]`,
  wideContainer: `${commonContainer} max-h-screen min-w-[min(40rem,90%)]`,
  extraWideContainer: `${commonContainer} max-h-[90%] min-w-[min(20rem,90%)]
    w-[min(60rem,90%)] h-[60rem]`,
  flexContent: 'flex flex-col gap-2',
  solidBackground: 'bg-white dark:bg-neutral-900',
  transparentBackground: 'bg-white/40 backdrop-blur-lg dark:bg-transparent',
  legacyTransparentBackground: 'bg-white/70 dark:bg-black/70',
  gradientBackground: `
    bg-gradient-to-bl from-gray-200 via-white
    to-white dark:from-neutral-800 dark:via-neutral-900 dark:to-neutral-900
  `,
} as const;

/*
 * Starting at 180 puts dialogs over Handsontable column headers (which have
 * z-index of 180)
 */
const initialIndex = 180;
const topIndex = 10_000;
const dialogIndexes = new Set<number>();
const getNextIndex = (): number =>
  dialogIndexes.size === 0 ? initialIndex : Math.max(...dialogIndexes) + 1;

const supportsBackdropBlur =
  globalThis.CSS?.supports(
    '((-webkit-backdrop-filter: none) or (backdrop-filter: none))'
  ) ?? false;

// Used for 'inert' attribute addition
const root = globalThis.document?.getElementById('root');

/**
 * Modal or non-modal dialog. Highly customizable. Used all over the place
 *
 * @remarks
 * We are using a library "react-modal" to render dialogs. It worked great so
 * far. However, since then we started using HeadlessUI and FloatingUI, both
 * of which already provide dialogs. Might be worth at some point to migrate
 * to reduce number of dependencies
 *
 * @remarks
 * Note, if the same components renders a <Dialog>, and on the next render
 * instead renders a different <Dialog> with the same parent, React would
 * reuse the same <Dialog> instance. This means, if content was scrolled down,
 * new dialog, with a different content would already be scrolled down.
 * Possible solution would be to set container.scrollTop=0 on header change,
 * though, that may introduce issues in other places, as same dialogs change
 * header during lifecycle (ResourceView)
 */
export function Dialog({
  /*
   * Using isOpen prop instead of conditional rendering is optional, but it
   * allows for smooth dialog close animation
   */
  isOpen = true,
  header,
  headerButtons,
  specialMode,
  // Default icon type is determined based on dialog button types
  icon: defaultIcon,
  buttons,
  children,
  /*
   * Non-modal dialogs are discouraged due to accessibility concerns and
   * possible state conflicts arising from the user interacting with different
   * parts of the app at the same time
   */
  modal = true,
  onClose: handleClose,
  onResize: handleResize,
  dimensionsKey: rawDimensionsKey = header,
  // eslint-disable-next-line react/no-object-type-as-default-prop
  className: {
    // Dialog has optimal width
    container: containerClassName = dialogClassNames.normalContainer,
    // Dialog's content is a flexbox
    content: contentClassName = dialogClassNames.flexContent,
    // Buttons are right-aligned by default
    buttonContainer: buttonContainerClassName = 'justify-end',
    header: headerClassName = `${className.headerPrimary} text-xl`,
  } = {},
  /* Force dialog to stay on top of all others. Useful for exception messages */
  forceToTop = false,
  // eslint-disable-next-line react/no-object-type-as-default-prop
  forwardRef: { content: contentRef, container: externalContainerRef } = {},
}: {
  readonly isOpen?: boolean;
  readonly header: LocalizedString;
  readonly headerButtons?: React.ReactNode;
  // A semi-elegant way to specify one-of customizations
  readonly specialMode?: 'noGradient' | 'orangeBar';
  /*
   * TEST: review dialogs that don't need icons or dialogs whose autogenerated
   *   icon is incorrect (record view dialog has red icon because of delete
   *   button)
   */
  readonly icon?: JSX.Element | keyof typeof dialogIconTriggers;
  // Have to explicitly pass undefined if you don't want buttons
  readonly buttons: JSX.Element | LocalizedString | undefined;
  readonly children: React.ReactNode;
  // If set, will remember the dialog size under this name
  readonly dimensionsKey?: string | false;
  readonly modal?: boolean;
  /*
   * Have to explicitly pass undefined if dialog should not be closable
   *
   * This gets called only when dialog is closed by the user.
   * If dialog is removed from the element tree programmatically, callback is
   * not called
   */
  readonly onClose: (() => void) | undefined;
  readonly onResize?: (element: HTMLElement) => void;
  readonly className?: {
    readonly container?: string;
    readonly content?: string;
    readonly buttonContainer?: string;
    readonly header?: string;
  };
  readonly forceToTop?: boolean;
  readonly forwardRef?: {
    readonly content?: React.Ref<HTMLDivElement>;
    readonly container?: React.RefCallback<HTMLDivElement>;
  };
}): JSX.Element {
  const id = useId('modal');

  React.useEffect(() => {
    const shouldInert = modal && isOpen;
    root?.toggleAttribute('inert', shouldInert);
    return () => {
      root?.removeAttribute('inert');
    };
  }, [modal, isOpen]);

  const [modifyTitle] = userPreferences.use(
    'general',
    'dialog',
    'updatePageTitle'
  );

  useTitle(modal && isOpen && modifyTitle ? header : undefined);

  const reduceTransparency = useReducedTransparency();
  const [transparentDialog] = userPreferences.use(
    'general',
    'dialog',
    'transparentBackground'
  );
  const [blurContentBehindDialog] = userPreferences.use(
    'general',
    'dialog',
    'blurContentBehindDialog'
  );
  const [showIcon] = userPreferences.use('general', 'dialog', 'showIcon');

  const [closeOnEsc] = userPreferences.use('general', 'dialog', 'closeOnEsc');
  const [closeOnOutsideClick] = userPreferences.use(
    'general',
    'dialog',
    'closeOnOutsideClick'
  );

  /*
   * Don't set index on first render, because that may lead multiple dialogs
   * to have the same index, since render of all children is done before any
   * useEffect can update max z-index)
   */
  const [zIndex, setZindex] = React.useState<number | undefined>(undefined);

  React.useEffect(() => {
    if (!isOpen) return undefined;
    if (forceToTop) {
      setZindex(topIndex);
      return undefined;
    }
    const zIndex = getNextIndex();
    setZindex(zIndex);
    dialogIndexes.add(zIndex);
    return (): void => setZindex(undefined);
  }, [isOpen, forceToTop]);

  React.useEffect(() => {
    if (forceToTop || modal || !isOpen || zIndex === undefined)
      return undefined;

    dialogIndexes.add(zIndex);
    return (): void => void dialogIndexes.delete(zIndex);
  }, [forceToTop, modal, isOpen, zIndex]);

  // Facilitate moving non-modal dialog to top on click
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(
    () =>
      forceToTop ||
      modal ||
      !isOpen ||
      zIndex === undefined ||
      container === null
        ? undefined
        : listen(container, 'click', () =>
            // Check if dialog is already at the very top
            Math.max(...dialogIndexes) === zIndex
              ? undefined
              : setZindex(getNextIndex)
          ),
    [forceToTop, modal, isOpen, zIndex, container]
  );

  /*
   * Try to shorten the key if possible (i.e, turn Collection Object: 00123
   * into Collection Object). This is crude, but it doesn't have to be perfect
   */
  const dimensionsKey =
    typeof rawDimensionsKey === 'string'
      ? rawDimensionsKey.split(':')[0].split('(')[0]
      : undefined;
  if (process.env.NODE_ENV !== 'production')
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useTitleChangeNotice(dimensionsKey);
  const initialSize = useDialogSize(
    container,
    isOpen,
    dimensionsKey,
    handleResize
  );

  const [rememberPosition] = userPreferences.use(
    'general',
    'dialog',
    'rememberPosition'
  );
  const positionKey = rememberPosition ? dimensionsKey : undefined;
  const [dialogPositions = {}, setDialogPositions] = useCachedState(
    'dialogs',
    'positions'
  );
  const handleDrag = React.useCallback(
    (_: unknown, { x, y }: DraggableData) =>
      typeof positionKey === 'string'
        ? setDialogPositions((positions) => ({
            ...positions,
            [positionKey]: [x, y],
          }))
        : undefined,
    [positionKey, setDialogPositions]
  );
  const handleDragged =
    typeof positionKey === 'string' ? handleDrag : undefined;
  const initialPosition = React.useMemo(
    () => {
      const position = dialogPositions[positionKey ?? ''];
      return typeof position === 'object'
        ? {
            x: position[0],
            y: position[1],
          }
        : undefined;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [positionKey]
  );

  useFreezeDialogSize(container, dimensionsKey);

  const isFullScreen = containerClassName.includes(dialogClassNames.fullScreen);

  const draggableContainer: Props['contentElement'] = React.useCallback(
    (props: React.ComponentPropsWithRef<'div'>, children: React.ReactNode) => (
      <Draggable
        // Don't allow moving the dialog past the window bounds
        handle={`#${id('handle')}`}
        nodeRef={containerRef}
        onStop={handleDragged}
        bounds="parent"
        // Allow moving the dialog when hovering over the header line
        cancel={`#${id('full-screen')}`}
        defaultClassName=""
        // Don't allow moving when in full-screen
        defaultClassNameDragging=""
        defaultPosition={initialPosition}
        // Don't need any extra classNames
        defaultClassNameDragged=""
      >
        <div {...props}>{children}</div>
      </Draggable>
    ),
    [id, initialPosition, handleDragged]
  );

  const [buttonContainer, setButtonContainer] =
    React.useState<HTMLDivElement | null>(null);
  const iconType = React.useMemo(() => {
    if (!showIcon) return 'none';
    if (typeof defaultIcon === 'string') return defaultIcon;
    else if (buttonContainer === null) return 'none';
    /*
     * If icon was not specified explicitly, it is determined based on what
     * matching className dialog buttons have
     */
    return (
      Object.entries(dialogIconTriggers).find(
        ([_type, className]) =>
          className !== '' &&
          typeof buttonContainer.getElementsByClassName(className)[0] ===
            'object'
      )?.[KEY] ?? 'none'
    );
  }, [showIcon, defaultIcon, buttons, buttonContainer]);

  const overlayElement: Props['overlayElement'] = React.useCallback(
    (
      props: React.ComponentPropsWithRef<'div'>,
      contentElement: React.ReactElement
    ) => (
      <div
        {...props}
        onMouseDown={
          closeOnOutsideClick
            ? (event): void => {
                // Outside click detection
                if (
                  modal &&
                  typeof handleClose === 'function' &&
                  event.target === event.currentTarget
                ) {
                  event.preventDefault();
                  handleClose();
                } else props?.onMouseDown?.(event);
              }
            : undefined
        }
      >
        {contentElement}
      </div>
    ),
    [modal, handleClose, closeOnOutsideClick]
  );

  const transitionDuration = useTransitionDuration();
  const highContrast = useHighContrast();

  return (
    <Modal
      aria={{
        labelledby: id('header'),
        describedby: id('content'),
        modal,
      }}
      ariaHideApp={false}
      bodyOpenClassName={null}
      className={`
        flex flex-col gap-2 p-4 outline-none ${containerClassName}
        overflow-x-hidden text-neutral-900 duration-0
        dark:border dark:border-neutral-700 dark:text-neutral-200
        ${modal ? '' : 'pointer-events-auto border border-gray-500'}
        ${
          reduceTransparency || highContrast || specialMode === 'noGradient'
            ? dialogClassNames.solidBackground
            : transparentDialog && modal
            ? supportsBackdropBlur
              ? dialogClassNames.transparentBackground
              : dialogClassNames.legacyTransparentBackground
            : dialogClassNames.gradientBackground
        }
      `}
      closeTimeoutMS={transitionDuration === 0 ? undefined : transitionDuration}
      // "overflow-x-hidden" is necessary for the "resize" handle to appear
      contentElement={draggableContainer}
      contentRef={(ref: HTMLDivElement | undefined): void => {
        const container = ref ?? null;
        // Save to state so that React.useEffect hooks are reRun
        setContainer(container);
        // Save to React.useRef so that React Draggable can have immediate access
        containerRef.current = container;
        if (typeof externalContainerRef === 'function')
          externalContainerRef(container);
      }}
      /*
       * Can't use outside click detection that comes with this plugin
       * because of https://github.com/specify/specify7/issues/1248.
       * (it listens on click, not on mouse down)
       */
      htmlOpenClassName={null}
      // Instead, a custom onMouseDown handler is set up for this element
      id={isFullScreen ? id('full-screen') : undefined}
      isOpen={isOpen}
      overlayClassName={{
        base: `w-screen h-screen absolute inset-0 flex items-center
          justify-center opacity-0 ${
            modal
              ? 'bg-gray-500/70 dark:bg-neutral-900/70'
              : 'pointer-events-none'
          } ${blurContentBehindDialog ? 'backdrop-blur' : ''}`,
        afterOpen: 'opacity-100',
        beforeClose: '!opacity-0',
      }}
      overlayElement={overlayElement}
      portalClassName=""
      shouldCloseOnEsc={
        modal && typeof handleClose === 'function' && closeOnEsc
      }
      /*
       * Adding aria-hidden to #root is a legacy solution. Modern solution
       * involves displaying an element with [role="dialog"][aria-modal="true"],
       * which react-modal library already does. See more:
       * https://www.w3.org/WAI/ARIA/apg/example-index/dialog-modal/dialog.html#:~:text=Notes%20on%20aria%2Dmodal%20and%20aria%2Dhidden
       * Additionally, aria-hidden has a drawback of hiding the <h1> element,
       * which causes another accessibility problem.
       */
      shouldCloseOnOverlayClick={false}
      style={{
        overlay: { zIndex },
        content:
          typeof initialSize === 'object'
            ? {
                width: `${initialSize.width}px`,
                height: `${initialSize.height}px`,
              }
            : undefined,
      }}
      onRequestClose={handleClose}
    >
      {/* "p-4 -m-4" increases the handle size for easier dragging */}
      <div
        className={`
          flex items-center gap-2 md:gap-4
          ${isFullScreen ? '' : '-m-4 cursor-move p-4'}
          ${specialMode === 'orangeBar' ? '' : 'flex-wrap'}
        `}
        id={id('handle')}
      >
        <div className="flex items-center gap-2">
          {typeof defaultIcon === 'object' && showIcon
            ? defaultIcon
            : dialogIcons[iconType]}
          <h2 className={headerClassName} id={id('header')}>
            {header}
          </h2>
        </div>
        {headerButtons}
      </div>
      {specialMode === 'orangeBar' && (
        <div className="border-brand-300 w-full border-b-2" />
      )}
      <DialogContext.Provider value={handleClose}>
        {/*
         * "px-1 -mx-1" ensures that focus outline for checkboxes
         * and other inputs is not cut-off. You can also use "px-4 -mx-4" to
         * place container scroll bar at the very edge of the dialog, which
         * looks nice, but is bad UX, because mis-clicks can trigger dialog
         * close
         */}
        <div
          className={`
            dark:text-neutral-350 -mx-1 flex-1 overflow-y-auto px-1 py-4
            text-gray-700 ${contentClassName}
          `}
          id={id('content')}
          ref={contentRef}
        >
          {children}
        </div>
        {buttons !== undefined && (
          <div
            className={`flex gap-2 ${buttonContainerClassName}`}
            ref={setButtonContainer}
          >
            {typeof buttons === 'string' ? (
              // If button was passed directly as text, render it as Blue.Button
              <Button.DialogClose component={Button.Info}>
                {buttons}
              </Button.DialogClose>
            ) : (
              buttons
            )}
          </div>
        )}
      </DialogContext.Provider>
    </Modal>
  );
}

function useDialogSize(
  container: HTMLElement | null,
  isOpen: boolean,
  dimensionsKey: string | undefined,
  handleResize: ((container: HTMLElement) => void) | undefined
): { readonly width: number; readonly height: number } | undefined {
  const [rememberSize] = userPreferences.use(
    'general',
    'dialog',
    'rememberSize'
  );
  const sizeKey = rememberSize ? dimensionsKey : undefined;
  const [dialogSizes = {}, setDialogSizes] = useCachedState('dialogs', 'sizes');
  /*
   * If two dialogs with the same dimensionsKey are rendered, changing one dialog's
   * dimensions shouldn't affect the other
   */

  const initialSize = React.useMemo(() => {
    const sizes = dialogSizes[sizeKey ?? ''];
    return typeof sizes === 'object'
      ? {
          width: sizes[0],
          height: sizes[1],
        }
      : undefined;
  }, [sizeKey]);

  // Resize listener
  React.useEffect(() => {
    if (
      !isOpen ||
      container === null ||
      (handleResize === undefined && sizeKey === undefined) ||
      globalThis.ResizeObserver === undefined
    )
      return undefined;

    const observer = new globalThis.ResizeObserver(() => {
      handleResize?.(container);
      if (typeof sizeKey === 'string') {
        const width = f.parseInt(container.style.width);
        const height = f.parseInt(container.style.height);
        if (typeof width === 'number' && typeof height === 'number')
          setDialogSizes((sizes) => ({
            ...sizes,
            [sizeKey]: [width, height],
          }));
      }
    });
    observer.observe(container);

    return (): void => observer.disconnect();
  }, [isOpen, container, handleResize, sizeKey]);

  return initialSize;
}

function useTitleChangeNotice(dimensionKey: string | undefined): void {
  const changeCount = React.useRef(0);
  React.useEffect(() => {
    if (dimensionKey === undefined) return;
    changeCount.current += 1;
    if (changeCount.current > 3)
      console.warn(
        'Dialog title changes too much. Please add a dimensionsKey="..." prop to the dialog'
      );
  }, [dimensionKey]);
}

function useFreezeDialogSize(
  containerSizeRef: HTMLDivElement | null,
  dimensionKey: string | undefined
): void {
  React.useEffect(() => {
    if (dimensionKey === undefined) return;
    if (containerSizeRef === null) return undefined;
    let oldHeight = containerSizeRef.offsetHeight;
    let oldWidth = containerSizeRef.offsetWidth;
    const resizeObserver = new ResizeObserver(() => {
      const newHeight = containerSizeRef.offsetHeight;
      const newWidth = containerSizeRef.offsetWidth;

      const width = f.parseInt(containerSizeRef.style.width);
      const height = f.parseInt(containerSizeRef.style.height);
      const hasBeenChanged =
        typeof width === 'number' && typeof height === 'number';

      if (oldHeight !== undefined && newHeight < oldHeight && !hasBeenChanged) {
        containerSizeRef.style.minHeight = `${oldHeight}px`;
      } else oldHeight = newHeight;

      if (oldWidth !== undefined && newWidth < oldWidth && !hasBeenChanged) {
        containerSizeRef.style.minWidth = `${oldWidth}px`;
      } else oldWidth = newWidth;

      if (hasBeenChanged) {
        containerSizeRef.style.minHeight = '';
        containerSizeRef.style.minWidth = '';
      }
    });

    resizeObserver.observe(containerSizeRef);

    return () => {
      resizeObserver.disconnect();
      containerSizeRef.style.minHeight = '';
      containerSizeRef.style.minWidth = '';
    };
  }, [containerSizeRef, dimensionKey]);
}
