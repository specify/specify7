import React from 'react';
import { listen } from '../utils/events';

/**
 * A React hook to track the size of an HTML element, most commonly a container
 * of some sort.
 * This returns sizes in pixels.
 *
 * Example usage:
 * ```ts
 *  const {elementWidth, elementHeight, elementRef} = useElementSize();
 *  return (
 *  <div ref={elementRef}>
 *    <p>My parent's width is {elementWidth}</p>
 *    <p>My parent's hieght is {elementHeight}</p>
 *  </div>
 * );
 * ```
 */
export function useElementSize<T extends HTMLDivElement>() {
  const [element, setElement] = React.useState<T | null>(null);
  const elementRef = React.useCallback(setElement, [setElement]);
  const [elementWidth, setElementWidth] = React.useState(0);
  const [elementHeight, setElementHieght] = React.useState(0);

  React.useEffect(() => {
    if (element === null) return undefined;

    const updateSize = (): void => {
      setElementWidth(element.clientWidth);
      setElementHieght(element.clientHeight);
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    const removeResizeListener = listen(window, 'resize', updateSize);
    return (): void => {
      observer.disconnect();
      removeResizeListener();
    };
  }, [element]);

  return {
    elementWidth,
    elementHeight,
    elementRef,
  };
}
