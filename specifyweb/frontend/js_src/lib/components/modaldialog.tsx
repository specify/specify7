/**
 * A React wrapper for jQuery's dialogs
 *
 * @module
 */
import React from 'react';
import Draggable from 'react-draggable';
import type { Props } from 'react-modal';
import Modal from 'react-modal';

import { error } from '../assert';
import commonText from '../localization/common';
import type { RA } from '../types';
import { Button, transitionDuration } from './basic';
import { useId } from './hooks';

/*
 * A dummy function
 *
 * Set this as a 'click' handler for jQuery's dialog button.
 * Before initializing the dialog, the click handler would be replaced with
 * the proper dialog close callback
 */
export const closeDialog = (...args: RA<unknown>): void =>
  console.error(...args);

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
    >
      {loadingBar}
    </Dialog>
  );
}

const commonContainer = `rounded resize overflow-y-hidden max-w-[90%]
  shadow-lg shadow-gray-500`;
export const dialogClassNames = {
  fullScreen: 'w-full h-full',
  freeContainer: `${commonContainer} max-h-[90%]`,
  narrowContainer: `${commonContainer} max-h-[50%] min-w-[min(20rem,90%)]`,
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

export const DialogContext = React.createContext<(() => void) | undefined>(() =>
  error('DialogContext can only be used by <Dialog> buttons')
);
DialogContext.displayName = 'DialogContext';

export function Dialog({
  /*
   * Using isOpen prop instead of conditional rendering is optional, but it
   * allows for smooth dialog close animation
   */
  isOpen = true,
  title,
  header,
  buttons,
  children,
  /*
   * Non-modal dialogs are discouraged due to accessibility concerns and
   * possible state conflicts arising from the user interacting with different
   * parts of the app at the same time
   */
  modal = true,
  onClose: handleClose,
  className: {
    // Dialog's content is a flexbox
    content = dialogClassNames.flexContent,
    // Dialog has optimal width
    container = dialogClassNames.normalContainer,
    // Buttons are right-aligned by default
    buttonContainer = 'justify-end',
    header: headerClassName = 'text-2xl font-semibold',
  } = {},
  /* Force dialog to stay on top of all other. Useful for exception messages */
  forceToTop = false,
}: {
  readonly isOpen?: boolean;
  readonly title?: string;
  readonly header: React.ReactNode;
  // Have to explicitly pass undefined if you don't want buttons
  readonly buttons: undefined | string | JSX.Element;
  readonly children: React.ReactNode;
  readonly modal?: boolean;
  readonly onClose?: () => void;
  readonly className?: {
    readonly content?: string;
    readonly container?: string;
    readonly buttonContainer?: string;
    readonly header?: string;
  };
  readonly forceToTop?: boolean;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  React.useEffect(() => {
    if (forceToTop || modal || !isOpen || typeof zIndex === 'undefined')
      return undefined;

    dialogIndexes.add(zIndex);
    return (): void => void dialogIndexes.delete(zIndex);
  }, [forceToTop, modal, isOpen, zIndex]);

  // Facilitate moving non-modal dialog to top on click
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (
      forceToTop ||
      modal ||
      !isOpen ||
      typeof zIndex === 'undefined' ||
      contentRef.current === null
    )
      return undefined;
    const handleClick = (): void =>
      // Check if dialog is already at the very top
      Math.max(...dialogIndexes) === zIndex
        ? undefined
        : setZindex(getNextIndex);

    const content = contentRef.current;
    content.addEventListener('click', handleClick);
    return (): void => content?.removeEventListener('click', handleClick);
  }, [forceToTop, modal, isOpen, zIndex]);

  const draggableContainer: Props['contentElement'] = React.useCallback(
    (props, children) => (
      <Draggable
        // Don't allow moving the dialog past the window bounds
        bounds="parent"
        handle=".handle"
        defaultClassName=""
        defaultClassNameDragging=""
        defaultClassNameDragged=""
        nodeRef={contentRef}
      >
        <div {...props}>{children}</div>
      </Draggable>
    ),
    []
  );

  return (
    <Modal
      isOpen={isOpen}
      closeTimeoutMS={transitionDuration === 0 ? undefined : transitionDuration}
      overlayClassName={{
        base: `w-screen h-screen absolute inset-0 flex items-center
            justify-center ${modal ? 'bg-gray-500/70' : 'pointer-events-none'}`,
        afterOpen: `opacity-1`,
        beforeClose: 'opacity-0',
      }}
      style={{
        overlay: {
          zIndex,
        },
      }}
      portalClassName=""
      className={`bg-gradient-to-bl from-gray-200 via-white to-white
          outline-none flex flex-col p-4 gap-y-2 ${container}
          ${modal ? '' : 'pointer-events-auto border border-gray-500'}`}
      shouldCloseOnEsc={modal && typeof handleClose === 'function'}
      shouldCloseOnOverlayClick={modal && typeof handleClose === 'function'}
      contentLabel={title}
      aria={{
        [typeof title === 'undefined' ? 'labelledby' : 'describedby']:
          id('header'),
      }}
      onRequestClose={handleClose}
      bodyOpenClassName={null}
      htmlOpenClassName={null}
      ariaHideApp={modal}
      contentRef={(content): void => {
        contentRef.current = content ?? null;
      }}
      contentElement={draggableContainer}
    >
      <span className="handle p-4 -m-4 cursor-move">
        {/* Title would be provided to screen readers via aria-label */}
        {typeof title !== 'undefined' && (
          <p aria-hidden={true} className="text-gray-600">
            {title}
          </p>
        )}
        <h2 className={headerClassName} id={id('header')}>
          {header}
        </h2>
      </span>
      {/*
       * "px-1 -mx-1" ensures that focus outline for checkboxes
       * and other inputs is not cut-off
       */}
      <div
        className={`px-1 py-4 -mx-1 overflow-y-auto flex-1 text-gray-700 ${content}`}
      >
        {children}
      </div>
      {typeof buttons !== 'undefined' && (
        <div className={`gap-x-2 flex ${buttonContainer}`}>
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
