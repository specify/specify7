/**
 * A React wrapper for jQuery's dialogs
 *
 * @module
 */
import type jQuery from 'jquery';
import React from 'react';
import Draggable from 'react-draggable';
import type { Props } from 'react-modal';
import Modal from 'react-modal';

import commonText from '../localization/common';
import type { RA } from '../types';
import type { RawTagProps } from './basic';
import {
  Button,
  className,
  DialogContext,
  Submit,
  transitionDuration,
} from './basic';
import { useId } from './hooks';
import createBackboneView from './reactbackboneextend';

// This must be accompanied by a label since loading bar is hidden from screen readers
export const loadingBar = (
  <div
    aria-hidden="true"
    className={`animate-bounce h-7 bg-gradient-to-r from-orange-400
      to-amber-200 mt-5 rounded`}
  />
);

/**
 * Modal dialog with a loading bar
 * @module
 */
export function LoadingScreen(): JSX.Element {
  return (
    <Dialog
      header={commonText('loading')}
      className={{ container: dialogClassNames.narrowContainer }}
      buttons={undefined}
      onClose={undefined}
    >
      {loadingBar}
    </Dialog>
  );
}

export const LoadingView = createBackboneView(LoadingScreen);

const commonContainer = `rounded resize overflow-y-hidden max-w-[90%]
  shadow-lg shadow-gray-500`;
export const dialogClassNames = {
  fullScreen: '!transform-none !w-full !h-full',
  freeContainer: `${commonContainer} max-h-[90%]`,
  narrowContainer: `${commonContainer} max-h-[50%] min-w-[min(20rem,90%)]
    md:max-w-[50%]`,
  normalContainer: `${commonContainer} max-h-[90%] min-w-[min(30rem,90%)]`,
  wideContainer: `${commonContainer} max-h-[90%] min-w-[min(40rem,90%)]`,
  flexContent: 'flex flex-col gap-y-2',
} as const;

/*
 * Starting at 180 puts dialogs over Handsontable column headers (which have
 * z-index of 180)
 */
const initialIndex = 180;
const topIndex = 10_000;
const dialogIndexes: Set<number> = new Set();
const getNextIndex = (): number =>
  dialogIndexes.size === 0 ? initialIndex : Math.max(...dialogIndexes) + 1;

/*
 * TODO: disable outside click detection while resizing the dialog
 * TODO: reset scrollTop if title and header changed
 */
export function Dialog({
  /*
   * Using isOpen prop instead of conditional rendering is optional, but it
   * allows for smooth dialog close animation
   */
  isOpen = true,
  title: initialTitle,
  header,
  headerButtons,
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
  className: {
    // Dialog's content is a flexbox
    content: contentClassName = dialogClassNames.flexContent,
    // Dialog has optimal width
    container: containerClassName = dialogClassNames.normalContainer,
    // Buttons are right-aligned by default
    buttonContainer: buttonContainerClassName = 'justify-end',
    header: headerClassName = className.h2,
  } = {},
  /* Force dialog to stay on top of all other. Useful for exception messages */
  forceToTop = false,
  contentRef,
}: {
  readonly isOpen?: boolean;
  readonly title?: string;
  readonly header: React.ReactNode;
  readonly headerButtons?: React.ReactNode;
  // Have to explicitly pass undefined if you don't want buttons
  readonly buttons: undefined | string | JSX.Element;
  readonly children: React.ReactNode;
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
    readonly content?: string;
    readonly container?: string;
    readonly buttonContainer?: string;
    readonly header?: string;
  };
  readonly forceToTop?: boolean;
  readonly contentRef?: RawTagProps<'div'>['ref'];
}): JSX.Element {
  const id = useId('modal');

  /*
   * Don't set index on first render, because that may lead dialogs
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
    if (forceToTop || modal || !isOpen || typeof zIndex === 'undefined')
      return undefined;

    dialogIndexes.add(zIndex);
    return (): void => void dialogIndexes.delete(zIndex);
  }, [forceToTop, modal, isOpen, zIndex]);

  // Facilitate moving non-modal dialog to top on click
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (
      forceToTop ||
      modal ||
      !isOpen ||
      typeof zIndex === 'undefined' ||
      container === null
    )
      return undefined;
    const handleClick = (): void =>
      // Check if dialog is already at the very top
      Math.max(...dialogIndexes) === zIndex
        ? undefined
        : setZindex(getNextIndex);

    container.addEventListener('click', handleClick);
    return (): void => container?.removeEventListener('click', handleClick);
  }, [forceToTop, modal, isOpen, zIndex, container]);

  // Resize listener
  React.useEffect(() => {
    if (!isOpen || container === null || typeof handleResize === 'undefined')
      return undefined;

    const observer = new ResizeObserver(() => handleResize?.(container));
    observer.observe(container);

    return (): void => observer.disconnect();
  }, [isOpen, container, handleResize]);

  const isFullScreen = containerClassName.includes(dialogClassNames.fullScreen);

  const draggableContainer: Props['contentElement'] = React.useCallback(
    (props, children) => (
      <Draggable
        // Don't allow moving the dialog past the window bounds
        bounds="parent"
        handle=".handle"
        // Don't allow moving when in full-screen
        cancel=".full-screen"
        defaultClassName=""
        defaultClassNameDragging=""
        defaultClassNameDragged=""
        nodeRef={containerRef}
      >
        <div {...props}>{children}</div>
      </Draggable>
    ),
    []
  );

  // Don't show dialog title if it is identical to dialog header
  const title = initialTitle === header ? undefined : initialTitle;

  return (
    <Modal
      isOpen={isOpen}
      closeTimeoutMS={transitionDuration === 0 ? undefined : transitionDuration}
      overlayClassName={{
        base: `w-screen h-screen absolute inset-0 flex items-center
          justify-center ${
            modal
              ? 'bg-gray-500/70 dark:bg-neutral-900/70'
              : 'pointer-events-none'
          }`,
        afterOpen: `opacity-1`,
        beforeClose: 'opacity-0',
      }}
      style={{
        overlay: {
          zIndex,
        },
      }}
      portalClassName=""
      className={`bg-gradient-to-bl from-gray-200 dark:from-neutral-800
        via-white dark:via-neutral-900 to-white dark:to-neutral-900
        outline-none flex flex-col p-4 gap-y-2 ${containerClassName}
        dark:text-neutral-200 dark:border dark:border-neutral-700
        text-neutral-900 ${isFullScreen ? 'full-screen' : ''}
        ${modal ? '' : 'pointer-events-auto border border-gray-500'}`}
      shouldCloseOnEsc={modal && typeof handleClose === 'function'}
      shouldCloseOnOverlayClick={modal && typeof handleClose === 'function'}
      contentLabel={title}
      aria={
        typeof title === 'string'
          ? {
              labelledby: id('title'),
              describedby: id('header'),
            }
          : { labelledby: id('header') }
      }
      onRequestClose={handleClose}
      bodyOpenClassName={null}
      htmlOpenClassName={null}
      ariaHideApp={modal}
      contentRef={(container): void => {
        // Save to state so that React.useEffect hooks are reRun
        setContainer(container ?? null);
        // Save to React.useRef so that React Draggable can have immediate access
        containerRef.current = container ?? null;
      }}
      contentElement={draggableContainer}
    >
      {/* "p-4 -m-4" increases the handle size for easier dragging */}
      <span
        className={`handle flex flex-wrap gap-4' ${
          isFullScreen ? '' : 'p-4 -m-4 cursor-move'
        }`}
      >
        <div>
          {typeof title !== 'undefined' && (
            <p id={id('title')} className="dark:text-neutral-400 text-gray-600">
              {title}
            </p>
          )}
          <h2 className={headerClassName} id={id('header')}>
            {header}
          </h2>
        </div>
        {headerButtons}
      </span>
      {/*
       * "px-1 -mx-1" ensures that focus outline for checkboxes
       * and other inputs is not cut-off
       */}
      <div
        className={`px-1 py-4 -mx-1 overflow-y-auto flex-1 text-gray-700
          dark:text-neutral-350 ${contentClassName}`}
        ref={contentRef}
      >
        {children}
      </div>
      {typeof buttons !== 'undefined' && (
        <div className={`gap-x-2 flex ${buttonContainerClassName}`}>
          <DialogContext.Provider value={handleClose}>
            {typeof buttons === 'string' ? (
              <Button.DialogClose component={Button.Blue}>
                {buttons}
              </Button.DialogClose>
            ) : (
              buttons
            )}
          </DialogContext.Provider>
        </div>
      )}
    </Modal>
  );
}

type ButtonDefinition = {
  readonly style: Exclude<keyof typeof Submit, 'Fancy'>;
  readonly type?: 'button' | 'submit';
  readonly className?: string;
  readonly form?: string;
  readonly text: string;
  readonly onClick: 'dialogClose' | (() => void);
};

/** Wrapper for using React dialog in Backbone views */
function LegacyDialogWrapper({
  content,
  buttons,
  ...props
}: Omit<Parameters<typeof Dialog>[0], 'isOpen' | 'children' | 'buttons'> & {
  readonly content: HTMLElement | typeof jQuery | string;
  readonly buttons: string | undefined | RA<string | ButtonDefinition>;
}): JSX.Element {
  const dialogButtons =
    typeof buttons === 'object' ? (
      <>
        {buttons
          .map<ButtonDefinition>((button) =>
            typeof button === 'string'
              ? {
                  style: 'Transparent',
                  text: button,
                  onClick: 'dialogClose',
                }
              : button
          )
          .map(
            ({ type = 'button', style, className, onClick, text }, index) => {
              const Component =
                type === 'button' ? Button[style] : Submit[style];
              return (
                <Component
                  key={index}
                  className={className}
                  onClick={onClick === 'dialogClose' ? props.onClose : onClick}
                >
                  {text}
                </Component>
              );
            }
          )}
      </>
    ) : (
      buttons
    );

  const [contentElement, setContentElement] =
    React.useState<HTMLElement | null>(null);
  React.useEffect(() => {
    contentElement?.replaceChildren(
      typeof content === 'object' && 'jquery' in content
        ? (content[0] as HTMLElement)
        : (content as HTMLElement)
    );
  }, [content, contentElement]);

  return (
    <Dialog
      {...props}
      isOpen={true}
      contentRef={setContentElement}
      buttons={dialogButtons}
      className={{
        ...props.className,
        container: `${
          props.className?.container ?? dialogClassNames.normalContainer
        } legacy-dialog`,
      }}
    >
      {undefined}
    </Dialog>
  );
}

const dialogClass = createBackboneView(LegacyDialogWrapper);

export const openDialogs: Set<() => void> = new Set();
export const showDialog = (
  props: ConstructorParameters<typeof dialogClass>[0]
) => {
  const view = new dialogClass(props).render();

  /*
   * Removed Backbone components may leave dangling dialogs
   * This helps SpecifyApp.js clean them up
   */
  if (props?.forceToTop !== true) {
    const originalDestructor = view.remove.bind(view);
    view.remove = (): typeof view => {
      originalDestructor();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      openDialogs.delete(view.remove);
      return view;
    };
    // eslint-disable-next-line @typescript-eslint/unbound-method
    openDialogs.add(view.remove);
  }

  return view;
};
