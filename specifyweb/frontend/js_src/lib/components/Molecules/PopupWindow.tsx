/**
 * Detached Popup window.
 * A wrapper for react-new-window.
 * 
 * Limited Compatibility across browsers.
 */

import React from 'react';
import NewWindow from 'react-new-window';

export function PopupWindow({
  title = '',
  onOpen = () => {},
  onBlock = () => {},
  onUnload = () => {},
  children,
}: {
  readonly title?: string;
  readonly onOpen?: (window: Window) => void;
  readonly onBlock?: () => void;
  readonly onUnload?: () => void;
  readonly children: React.ReactNode;
}): JSX.Element {
  const windowRef = React.useRef<Window | null>(null);
  React.useEffect(() => {
    // Copy body attributes to the window so css styles are used.
    if (windowRef.current) {
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
      copyStyles
      title={title}
      onBlock={onBlock}
      onOpen={(window): void => {
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
    if (attribute.name !== 'id') toElement.removeAttribute(attribute.name);
  });
  Array.from(fromElement.attributes).forEach((attribute) => {
    if (attribute.name !== 'id')
      toElement.setAttribute(attribute.name, attribute.value);
  });
}
