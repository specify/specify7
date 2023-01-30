import React from 'react';
import ReactDOM from 'react-dom';

/**
 * A React Portal wrapper
 *
 * @remarks
 * Based on https://blog.logrocket.com/learn-react-portals-by-example/
 *
 * Used when an elements needs to be renreded outside of the bounds of
 * the container that has overflow:hidden
 */
export function Portal({
  children,
  element: defaultElement,
}: {
  readonly children: JSX.Element;
  readonly element?: HTMLElement;
}): JSX.Element {
  const element = React.useMemo(
    () => defaultElement ?? document.createElement('div'),
    [defaultElement]
  );

  React.useEffect(() => {
    if (typeof defaultElement === 'object') return undefined;
    const portalRoot = document.getElementById('portal-root');
    if (portalRoot === null) throw new Error('Portal root was not found');
    portalRoot.append(element);
    return (): void => element.remove();
  }, [element, defaultElement]);

  return ReactDOM.createPortal(children, element);
}
