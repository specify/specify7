/**
 * A React wrapper for jQuery's dialogs
 *
 * @module
 */
import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';
import Modal from 'react-modal';

import { error } from '../assert';
import commonText from '../localization/common';
import type { IR, RA } from '../types';
import { transitionDuration } from './basic';
import ErrorBoundary from './errorboundary';
import { useId } from './hooks';

function closeDialogCallback(
  $dialog: JQuery,
  resize: () => void,
  onCloseCallback?: () => void
): void {
  if (!$dialog.is(':ui-dialog')) return;
  ReactDOM.unmountComponentAtNode($dialog[0]);
  window.removeEventListener('resize', resize);
  onCloseCallback?.();
  // Unset event listeners
  $dialog.remove();
}

/*
 * A dummy function
 *
 * Set this as a 'click' handler for jQuery's dialog button.
 * Before initializing the dialog, the click handler would be replaced with
 * the proper dialog close callback
 */
export const closeDialog = (...args: RA<unknown>): void =>
  console.error(...args);

const hasHeader = (children: React.ReactNode): boolean =>
  typeof children === 'object' &&
  children !== null &&
  'type' in children &&
  (children?.type === 'h2' ||
    (typeof children?.props?.children?.some === 'function' &&
      children.props.children.some(hasHeader)));

type DialogProperties = IR<unknown> &
  Exclude<JQueryUI.DialogOptions, 'buttons'> & {
    readonly close?: (
      event: JQueryUI.DialogEvent | Event | undefined,
      ui: JQueryUI.DialogUIParams | undefined
    ) => void;
    // Don't allow supplying buttons as a dictionary to simplify code
    readonly buttons?: RA<JQueryUI.DialogButtonOptions>;
  };

/**
 * Add 'close' button by default if no buttons are defined
 * Replace "closeDialog" dummy function with a real close callback
 */
const formalizeProperties = (
  properties: DialogProperties,
  closeDialogBind: (event: JQueryUI.DialogEvent | Event | undefined) => void
): DialogProperties => ({
  ...properties,
  buttons: (
    properties.buttons ?? [{ text: commonText('close'), click: closeDialog }]
  ).map((button) =>
    button.click === closeDialog
      ? {
          ...button,
          click: closeDialogBind,
        }
      : button
  ),
});

const serialize = (object: unknown): string =>
  JSON.stringify(object, (_key, value) =>
    // Fix circular dependency issue
    value instanceof HTMLElement ? value.toString() : value
  );

// TODO: make this look similar to <ModalDialog> until we fully transition
/**
 * Wrapper for jQuery's dialog
 */
export function JqueryDialog({
  properties,
  children,
  className = '',
}: {
  readonly children: React.ReactNode;
  readonly properties: DialogProperties;
  readonly className?: string;
}): JSX.Element {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const [$dialog, setDialog] = React.useState<JQuery | undefined>();
  const resize = React.useRef<() => void>(() => {
    throw new Error('Function not defined');
  });

  React.useEffect(() => {
    if (dialogRef.current === null) return undefined;

    const dialogElement = $(dialogRef.current.children[0] as HTMLElement);

    dialogElement[0].setAttribute('class', className);

    // Reposition dialog on screen resize
    resize.current = (): void =>
      dialogElement.is(':ui-dialog')
        ? void dialogElement.dialog(
            'option',
            'position',
            formalProperties.position ?? 'center'
          )
        : undefined;
    window.addEventListener('resize', resize.current);

    const closeDialogBind = (
      event: JQueryUI.DialogEvent | Event | undefined = undefined
    ): void =>
      closeDialogCallback(
        dialogElement,
        resize.current,
        // Don't call callback if dialog was closed by destructor
        typeof event === 'undefined' || !('originalEvent' in event)
          ? undefined
          : (properties.close as () => void)
      );

    const formalProperties = formalizeProperties(properties, closeDialogBind);

    dialogElement.dialog({
      modal: true,
      width: 300,
      ...formalProperties,
      close: closeDialogBind,
      dialogClass: [
        'ui-dialog-react',
        // Dialogs without a header have bold titles
        hasHeader(children) ? 'ui-dialog-with-header' : '',
        properties.dialogClass,
      ]
        .filter((className) => className)
        .join(' '),
    });

    setDialog(dialogElement);

    return closeDialogBind;
  }, [dialogRef]);

  // Re-render dialog content on change
  React.useEffect(() => {
    if (typeof $dialog === 'undefined') return;

    ReactDOM.render(
      <React.StrictMode>
        <ErrorBoundary silentErrors={false}>
          <>{children}</>
        </ErrorBoundary>
      </React.StrictMode>,
      $dialog[0],
      resize.current
    );
  }, [$dialog, children]);

  // Update dialog settings on changes to the dialog "properties" object
  const previousProperties = React.useRef<DialogProperties | undefined>(
    undefined
  );
  const serializedProperties = serialize(properties);
  React.useEffect(() => {
    if (typeof $dialog === 'undefined') return;

    const formalizedProperties = formalizeProperties(
      properties,
      $dialog.dialog('option', 'close')
    );

    if (typeof previousProperties.current !== 'undefined')
      Array.from(
        new Set([
          ...Object.keys(formalizedProperties),
          ...Object.keys(previousProperties.current ?? {}),
        ])
      )
        .filter(
          (key) =>
            serialize(previousProperties.current?.[key]) !==
            serialize(formalizedProperties?.[key])
        )
        .forEach((key) =>
          $dialog.dialog('option', key, formalizedProperties?.[key])
        );
    previousProperties.current = formalizedProperties;
  }, [$dialog, serializedProperties]);

  return (
    <div className="absolute" ref={dialogRef}>
      <div />
    </div>
  );
}

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
  return <Dialog header={commonText('loading')}>{loadingBar}</Dialog>;
}

const commonContainer = `rounded resize overflow-y-hidden max-w-[90%]
  max-h-[90%] shadow-lg shadow-gray-500`;
export const dialogClassNames = {
  fullScreen: 'w-full h-full',
  freeContainer: commonContainer,
  narrowContainer: `${commonContainer} min-w-[min(20rem,90%)]`,
  normalContainer: `${commonContainer} min-w-[min(30rem,90%)]`,
  wideContainer: `${commonContainer} min-w-[min(40rem,90%)]`,
} as const;

/*
 * TODO: make modal draggable
 * TODO: replace all JqueryDialog with ModalDialog
 * TODO: use forceToTop for exception dialogs
 * TODO: test navigation.go (and setCurrentView) when modal is open
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
    content = 'flex flex-col gap-y-2',
    // Dialog has optimal width
    container = dialogClassNames.normalContainer,
    // Buttons are right-aligned by default
    buttonContainer = 'justify-end',
  } = {},
  /* Force dialog to stay on top of all other. Useful for exception messages */
  forceToTop = false,
}: {
  readonly isOpen?: boolean;
  readonly title?: string;
  readonly header: React.ReactNode;
  readonly buttons?:
    | React.ReactNode
    /*
     * "handleClose" is the "onClose" prop passed to <Dialog>
     * This allows deduplicating declaration of the onClose handler
     */
    | ((props: { readonly handleClose: () => void }) => React.ReactNode);
  readonly children: React.ReactNode;
  readonly modal?: boolean;
  readonly onClose?: () => void;
  readonly className?: {
    readonly content?: string;
    readonly container?: string;
    readonly buttonContainer?: string;
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
      <h2 className="text-2xl font-semibold" id={id('header')}>
        {header}
      </h2>
      {/*
       * "px-1 -mx-1" ensures that focus outline for checkboxes
       * and other inputs is not cut-off
       */}
      <div className={`px-1 py-4 -mx-1 overflow-y-auto flex-1 ${content}`}>
        {children}
      </div>
      {/* TODO: provide styled button components */}
      {typeof buttons !== 'undefined' && (
        <div className={`gap-x-2 flex ${buttonContainer}`}>
          {typeof buttons === 'function'
            ? typeof handleClose === 'undefined'
              ? error("handleClose wasn't provided")
              : buttons({ handleClose })
            : buttons}
        </div>
      )}
    </Modal>
  );
}
