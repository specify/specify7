import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';
import type { State } from 'typesafe-reducer';

import { commonText } from '../../localization/common';
import { mainText } from '../../localization/main';
import type { GetOrSet, RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { dialogIcons, icons } from '../Atoms/Icons';
import { error } from './assert';

export const NOTIFICATION_TOAST_DURATION = 10_000;

type ErrorToast = State<
  'Error',
  {
    /*
     * Can not have JSX inside the toast message to disallow links and buttons
     * in it. This is because the toast itself is a button, so putting buttons
     * inside of it would be invalid.
     */
    readonly message: LocalizedString;
    readonly onClick: () => void;
    readonly onDismiss: () => void;
  }
>;

type NotificationToast = State<
  'Notification',
  {
    readonly messageId: string;
    readonly message: LocalizedString;
    readonly onClick: () => void;
    readonly onDismiss: () => void;
  }
>;

export type ToastMessage = ErrorToast | NotificationToast;

export function Toasts({
  children,
}: {
  readonly children: JSX.Element;
}): JSX.Element {
  const [toasts, setToasts] = React.useState<RA<ToastMessage>>([]);
  return (
    <SetToastsContext.Provider value={setToasts}>
      {children}
      {toasts.length > 0 && (
        <div
          className={`
            absolute right-0 top-0 z-[10000] flex max-h-full w-full max-w-[30rem]
            flex-col gap-2 overflow-auto p-4
          `}
        >
          {toasts.map((toast, index) => (
            <Toast
              key={
                toast.type === 'Notification'
                  ? `notification-${toast.messageId}`
                  : index
              }
              toast={toast}
              onClose={(): void =>
                setToasts((toasts) =>
                  toasts.filter((currentToast) => currentToast !== toast)
                )
              }
            />
          ))}
        </div>
      )}
    </SetToastsContext.Provider>
  );
}

export const SetToastsContext = React.createContext<
  GetOrSet<RA<ToastMessage>>[1]
>(() => error('SetToastsContext is not defined'));
SetToastsContext.displayName = 'SetToasts';

// REFACTOR: use native popover api https://developer.chrome.com/blog/introducing-popover-api
function Toast({
  toast,
  onClose: handleClose,
}: {
  readonly toast: ToastMessage;
  readonly onClose: () => void;
}): JSX.Element {
  const previousFocused = React.useRef(document.activeElement);
  const isError = toast.type === 'Error';
  const handleCloseRef = React.useRef(handleClose);
  handleCloseRef.current = handleClose;
  const remainingTime = React.useRef(NOTIFICATION_TOAST_DURATION);
  const [isTimerPaused, setIsTimerPaused] = React.useState(false);

  React.useEffect(() => {
    if (isError || isTimerPaused) return undefined;
    const startedAt = Date.now();
    const timeout = globalThis.setTimeout(() => {
      toast.onDismiss();
      handleCloseRef.current();
    }, remainingTime.current);
    return (): void => {
      globalThis.clearTimeout(timeout);
      remainingTime.current -= Date.now() - startedAt;
    };
  }, [isError, isTimerPaused, toast]);

  return (
    <div
      className={`
        relative flex gap-2 overflow-hidden rounded border shadow
        ${
          isError
            ? 'border-red-500 bg-red-200 hover:bg-red-300 dark:bg-red-900 dark:hover:bg-red-800'
            : `border-gray-400 bg-gray-200 hover:bg-gray-300
              dark:border-gray-600 dark:bg-neutral-800 dark:hover:bg-neutral-700`
        }
      `}
      onBlur={(event): void => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setIsTimerPaused(false);
      }}
      onFocus={(): void => setIsTimerPaused(true)}
    >
      <Button.LikeLink
        aria-live={isError ? 'assertive' : 'polite'}
        className={`
          flex-1 p-4 !text-black hover:!text-black
          dark:!text-gray-100 dark:hover:!text-gray-100
        `}
        forwardRef={(element): void => {
          if (element === null || !isError) return;
          previousFocused.current = document.activeElement;
          element.focus();
        }}
        onClick={(): void => {
          toast.onClick();
          handleClose();
        }}
      >
        {isError ? (
          dialogIcons.error
        ) : (
          <span className="text-brand-300 dark:text-brand-400">
            {icons.bell}
          </span>
        )}
        <div className="flex flex-col gap-2">
          {toast.message}
          <br />
          {mainText.clickToSeeDetails()}
        </div>
      </Button.LikeLink>
      <Button.Icon
        className="p-4"
        icon="x"
        title={commonText.dismiss()}
        onClick={(): void => {
          if (isError) (previousFocused.current as HTMLElement | null)?.focus();
          toast.onDismiss();
          handleClose();
        }}
      />
      {!isError && (
        <span
          aria-hidden
          className={`
            notification-toast-progress absolute inset-x-0 bottom-0 h-1
            origin-left bg-brand-300 dark:bg-brand-400
          `}
          style={{
            animationDuration: `${NOTIFICATION_TOAST_DURATION}ms`,
            animationPlayState: isTimerPaused ? 'paused' : 'running',
          }}
        />
      )}
    </div>
  );
}
