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
import {
  Button,
  className,
  RawTagProps,
  Submit,
  transitionDuration,
} from './basic';
import { useId } from './hooks';
import createBackboneView from './reactbackboneextend';
import { default as Backbone } from 'backbone';

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
      onClose={undefined}
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
    header: headerClassName = className.h2,
  } = {},
  /* Force dialog to stay on top of all other. Useful for exception messages */
  forceToTop = false,
  containerRef,
}: {
  readonly isOpen?: boolean;
  readonly title?: string;
  readonly header: React.ReactNode;
  // Have to explicitly pass undefined if you don't want buttons
  readonly buttons: undefined | string | JSX.Element;
  readonly children: React.ReactNode;
  readonly modal?: boolean;
  // Have to explicitly pass undefined if dialog should not be closable
  readonly onClose: (() => void) | undefined;
  readonly className?: {
    readonly content?: string;
    readonly container?: string;
    readonly buttonContainer?: string;
    readonly header?: string;
  };
  readonly forceToTop?: boolean;
  readonly containerRef?: RawTagProps<'div'>['ref'];
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
        outline-none flex flex-col p-4 gap-y-2 ${container} text-neutral-900
        dark:text-neutral-200 dark:border dark:border-neutral-700
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
      contentRef={(content): void => {
        contentRef.current = content ?? null;
      }}
      contentElement={draggableContainer}
    >
      {/* "p-4 -m-4" increases the handle size for easier dragging */}
      <span className="handle p-4 -m-4 cursor-move">
        {typeof title !== 'undefined' && (
          <p id={id('title')} className="dark:text-neutral-400 text-gray-600">
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
        className={`px-1 py-4 -mx-1 overflow-y-auto flex-1 text-gray-700
          dark:text-neutral-350 ${content}`}
        ref={containerRef}
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
}: Omit<
  Parameters<typeof Dialog>[0],
  'isOpen' | 'children' | 'containerRef' | 'buttons'
> & {
  readonly content: HTMLElement | string;
  readonly buttons: string | undefined | RA<string | ButtonDefinition>;
}): JSX.Element {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
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
  return (
    <Dialog
      {...props}
      isOpen={true}
      containerRef={containerRef}
      buttons={dialogButtons}
    >
      {content}
    </Dialog>
  );
}

const dialogClass = createBackboneView(LegacyDialogWrapper);

export const dialogView = (
  props: ConstructorParameters<typeof dialogClass>[0]
): Backbone.View => new dialogClass(props).render();
