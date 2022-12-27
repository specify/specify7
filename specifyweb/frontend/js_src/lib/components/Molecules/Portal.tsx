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
}: {
  readonly children: JSX.Element;
}): JSX.Element {
  const element = React.useMemo(() => document.createElement('div'), []);

  React.useEffect(() => {
    const portalRoot = document.getElementById('portal-root');
    if (portalRoot === null) throw new Error('Portal root was not found');
    portalRoot.append(element);
    return (): void => element.remove();
  }, [element]);

  return ReactDOM.createPortal(children, element);
}
