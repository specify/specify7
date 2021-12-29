/**
 * A React wrapper for jQuery's dialogs
 *
 * @module
 */

import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';

import commonText from '../localization/common';
import ErrorBoundary from './errorboundary';
import createBackboneView from './reactbackboneextend';
import type { IR, RA } from '../types';

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

/**
 * Wrapper for jQuery's dialog
 */
export function ModalDialog({
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
    <div style={{ position: 'absolute' }} ref={dialogRef}>
      <div />
    </div>
  );
}

export function ProgressBar({
  current = false,
  total = 1,
}: {
  readonly current?: number | false;
  readonly total?: number;
}): JSX.Element {
  const progressBarRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(
    () =>
      progressBarRef.current === null
        ? undefined
        : void $(progressBarRef.current).progressbar({
            value: current,
            max: total,
          }),
    [current, total, progressBarRef]
  );

  return (
    <div>
      <div ref={progressBarRef} aria-atomic="true" />
    </div>
  );
}

/**
 * Modal jQuery dialog with a loading bar
 * @module
 */
export function LoadingScreen(): JSX.Element {
  return (
    <ModalDialog
      properties={{
        dialogClass: 'ui-dialog-no-close',
        title: commonText('loading'),
        buttons: [],
      }}
    >
      <ProgressBar />
    </ModalDialog>
  );
}

export const BackboneLoadingScreen = createBackboneView(LoadingScreen);
