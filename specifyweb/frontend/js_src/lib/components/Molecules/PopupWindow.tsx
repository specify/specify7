/**
 * Detached Popup window.
 * A wrapper for react-new-window.
 *
 * Limited Compatibility across browsers.
 */

import React from 'react';

const NewWindow = require('react-new-window') as React.ComponentType<{
  readonly copyStyles?: boolean;
  readonly title?: string;
  readonly url?: string;
  readonly onBlock?: () => void;
  readonly onOpen?: (window: Window) => void;
  readonly onUnload?: () => void;
  readonly children?: React.ReactNode;
}>;

export function PopupWindow({
  title = '',
  url,
  copyStyles = false,
  onOpen = () => {},
  onBlock = () => {},
  onUnload = () => {},
  children,
}: {
  readonly title?: string;
  readonly url?: string;
  readonly copyStyles?: boolean;
  readonly onOpen?: (window: Window) => void;
  readonly onBlock?: () => void;
  readonly onUnload?: () => void;
  readonly children: React.ReactNode;
}): JSX.Element {
  const windowRef = React.useRef<Window | null>(null);
  React.useEffect(() => {
    // Copy body attributes to the window so css styles are used.
    if (copyStyles && windowRef.current) {
      copyElementAttributes(document.body, windowRef.current.document.body);
      const mainRoot = document.getElementById('root');
      const popupRoot = windowRef.current.document.getElementById(
        'new-window-container'
      );
      if (mainRoot && popupRoot) {
        copyElementAttributes(mainRoot, popupRoot);
      }
    }
  }, []);

  return (
    <NewWindow
      copyStyles={copyStyles}
      title={title}
      url={url}
      onBlock={onBlock}
      onOpen={(window: Window): void => {
        windowRef.current = window;
        onOpen(window);
      }}
      onUnload={onUnload}
    >
      {children}
    </NewWindow>
  );
}

function copyElementAttributes(
  fromElement: HTMLElement,
  toElement: HTMLElement
): void {
  Array.from(toElement.attributes).forEach((attribute) => {
    toElement.removeAttribute(attribute.name);
  });
  Array.from(fromElement.attributes).forEach((attribute) => {
    toElement.setAttribute(attribute.name, attribute.value);
  });
}
