import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';
import type { State } from 'typesafe-reducer';

import { commonText } from '../../localization/common';
import { mainText } from '../../localization/main';
import type { GetOrSet, RA } from '../../utils/types';
import { removeItem } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { dialogIcons } from '../Atoms/Icons';
import { error } from './assert';

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

/**
 * Toasts are only used for errors at the moment. The biggest reason is this
 * simplifies focus management: we just auto-focus the toast when it appears
 * and revert the focus back once dismissed.
 *
 * If extending toasts in the future, need to consider:
 * - a keyboard shortcut to focus the toast
 * - auto-dismissal of toasts after 6s and a way to disable auto dismissal
 */
export type ToastMessage = ErrorToast;

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
              key={index}
              toast={toast}
              onClose={(): void => setToasts(removeItem(toasts, index))}
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
  return (
    <div className="hover:brightness-80 flex gap-2 rounded border border-red-500 bg-red-200 shadow dark:bg-red-900">
      <Button.LikeLink
        aria-live={toast.type === 'Error' ? 'assertive' : 'polite'}
        className="flex-1 p-4 hover:text-black dark:hover:text-gray-200"
        forwardRef={(element): void => {
          if (element === null) return;
          previousFocused.current = document.activeElement;
          element.focus();
        }}
        onClick={toast.onClick}
      >
        {dialogIcons.error}
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
          (previousFocused.current as HTMLElement | null)?.focus();
          toast.onDismiss();
          handleClose();
        }}
      />
    </div>
  );
}
