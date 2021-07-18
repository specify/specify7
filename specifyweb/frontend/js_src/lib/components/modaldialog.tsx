/*
 *
 * A React wrapper for jQuery's dialog. Also has a jQuery's dialog with
 * a loading bar inside it
 *
 *
 */

import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';

import commonText from '../localization/common';
import type { IR, RA } from './wbplanview';

interface ModalDialogBaseProps {
  readonly children: React.ReactNode;
}

function ModalDialogContent({
  children,
  onLoadCallback,
}: ModalDialogBaseProps & {
  readonly onLoadCallback?: () => undefined | (() => void);
}): JSX.Element {
  React.useEffect(onLoadCallback ?? ((): void => {}), []);

  return <>{children}</>;
}

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
  JQueryUI.DialogOptions & {
    readonly close?: (
      event: JQueryUI.DialogEvent | Event | undefined,
      ui: JQueryUI.DialogUIParams | undefined
    ) => void;
  };

export const ModalDialog = React.memo(function ModalDialog({
  properties,
  onLoadCallback,
  children,
}: ModalDialogBaseProps & {
  readonly onLoadCallback?: (dialog: JQuery) => void | (() => void);
  readonly properties: DialogProperties;
}) {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const [$dialog, setDialog] = React.useState<JQuery | undefined>();

  React.useEffect(() => {
    if (dialogRef.current === null) return undefined;

    const dialogElement = $(dialogRef.current.children[0] as HTMLElement);
    const resize = (): void =>
      void dialogElement.dialog('option', 'position', 'center');

    const closeDialogBind = (
      event: JQueryUI.DialogEvent | Event | undefined = undefined,
      ui: JQueryUI.DialogUIParams | undefined = undefined
    ): void =>
      closeDialogCallback(
        dialogElement,
        resize,
        properties.close?.bind(undefined, event, ui)
      );

    const buttons =
      typeof properties.buttons === 'object' &&
      !Array.isArray(properties.buttons)
        ? properties.buttons
        : (
            properties.buttons ?? [
              { text: commonText('close'), click: closeDialog },
            ]
          ).map((button) =>
            button.click === closeDialog
              ? {
                  ...button,
                  click: closeDialogBind,
                }
              : button
          );

    dialogElement.dialog({
      modal: true,
      width: 300,
      ...properties,
      close: closeDialogBind,
      buttons,
      dialogClass: [
        'ui-dialog-react',
        hasHeader(children) ? 'ui-dialog-with-header' : '',
        properties.dialogClass,
      ]
        .filter((className) => className)
        .join(' '),
    });
    window.addEventListener('resize', resize);

    setDialog(dialogElement);

    return closeDialogBind;
  }, [dialogRef]);

  React.useEffect(() => {
    if (typeof $dialog === 'undefined') return;

    ReactDOM.render(
      <ModalDialogContent
        onLoadCallback={onLoadCallback?.bind(undefined, $dialog)}
      >
        {children}
      </ModalDialogContent>,
      $dialog[0]
    );
  }, [$dialog, children]);

  // Update dialog on changes to the "properties" object
  const previousProperties = React.useRef<DialogProperties | undefined>(
    undefined
  );
  React.useEffect(() => {
    if (typeof $dialog === 'undefined') return;
    if (typeof previousProperties.current !== 'undefined') {
      Object.entries(properties)
        .filter(
          ([key, value]) =>
            JSON.stringify(previousProperties.current?.[key]) !==
            JSON.stringify(value)
        )
        .forEach(([key, value]) => $dialog.dialog('option', key, value));
    }
    previousProperties.current = properties;
  }, [$dialog, JSON.stringify(properties)]);

  return (
    <div style={{ position: 'absolute' }} ref={dialogRef}>
      <div />
    </div>
  );
});

// Loading Screen
const handleOnLoad = (dialog: JQuery) =>
  void $('.progress-bar', dialog).progressbar({ value: false });

export function LoadingScreen(): JSX.Element {
  return (
    <ModalDialog
      onLoadCallback={handleOnLoad}
      properties={{
        modal: false,
        dialogClass: 'ui-dialog-no-close',
        title: commonText('loading'),
        buttons: [],
      }}
    >
      <div className="progress-bar" />
    </ModalDialog>
  );
}
