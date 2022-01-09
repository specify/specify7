/**
 * A React wrapper for jQuery's dialogs
 *
 * @module
 */
import React from 'react';
import Modal from 'react-modal';

import { error } from '../assert';
import commonText from '../localization/common';
import type { RA } from '../types';
import { transitionDuration, Button } from './basic';
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
 * TODO: make jquery dialogs look similar to <ModalDialog> until we fully transition
 * TODO: make modal draggable
 */

/*
 * Starting at 100 puts dialogs over Handsontable column headers (which have
 * z-index of 99)
 */
const initialIndex = 100;
const topIndex = 10_000;
const dialogIndexes: Set<number> = new Set();
const getNextIndex = (): number =>
  dialogIndexes.size === 0 ? initialIndex : Math.max(...dialogIndexes) + 1;

const buttonTypes = {
  apply: commonText('apply'),
  close: commonText('close'),
  cancel: commonText('cancel'),
} as const;

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
  readonly buttons?:
    | JSX.Element
    | RA<JSX.Element | keyof typeof buttonTypes | undefined>;
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
  const [contentRef, setContentRef] = React.useState<HTMLDivElement | null>(
    null
  );
  React.useEffect(() => {
    if (
      forceToTop ||
      modal ||
      !isOpen ||
      typeof zIndex === 'undefined' ||
      contentRef === null
    )
      return undefined;
    const handleClick = (): void =>
      // Check if dialog is already at the very top
      Math.max(...dialogIndexes) === zIndex
        ? undefined
        : setZindex(getNextIndex);

    contentRef.addEventListener('click', handleClick);
    return (): void => contentRef.removeEventListener('click', handleClick);
  }, [forceToTop, modal, isOpen, zIndex, contentRef]);

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
          outline-none p-4 flex flex-col gap-y-2 ${container}
          ${modal ? '' : 'pointer-events-auto'}`}
      shouldCloseOnEsc={modal && typeof handleClose === 'function'}
      shouldCloseOnOverlayClick={modal && typeof handleClose === 'function'}
      contentLabel={title}
      aria={{
        [typeof title === 'undefined' ? 'describedby' : 'labelledby']:
          id('header'),
      }}
      onRequestClose={handleClose}
      bodyOpenClassName={null}
      htmlOpenClassName={null}
      ariaHideApp={modal}
      contentRef={setContentRef}
    >
      {/* Title would be proved to screen readers via aria-label */}
      {typeof title !== 'undefined' && (
        <p aria-hidden={true} className="text-gray-600">
          {title}
        </p>
      )}
      <h2 className={headerClassName} id={id('header')}>
        {header}
      </h2>
      {/*
       * "px-1 -mx-1" ensures that focus outline for checkboxes
       * and other inputs is not cut-off
       */}
      <div className={`px-1 py-4 -mx-1 overflow-y-auto flex-1 ${content}`}>
        {children}
      </div>
      {typeof buttons !== 'undefined' && (
        <div className={`gap-x-2 flex ${buttonContainer}`}>
          {Array.isArray(buttons)
            ? typeof handleClose === 'undefined'
              ? error("handleClose wasn't provided")
              : buttons.map((button) =>
                  typeof button === 'string' && button in buttonTypes ? (
                    <Button.Transparent onClick={handleClose}>
                      {buttonTypes[button]}
                    </Button.Transparent>
                  ) : (
                    button
                  )
                )
            : buttons}
        </div>
      )}
    </Modal>
  );
}
