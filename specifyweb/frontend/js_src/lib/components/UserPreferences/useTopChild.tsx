import React from 'react';
import _ from 'underscore';

import { listen } from '../../utils/events';
import type { WritableArray } from '../../utils/types';
import { scrollIntoView } from '../TreeView/helpers';

/**
 * In a container with several children and a scroll bar, detect which
 * child is currently at the top of the view port (200 pixels from the top)
 *
 * Previous implementation used IntersectionObserver for this, but it was too
 * slow when you have 180 categories (on the Data Model page)
 */
export function useTopChild(): {
  readonly visibleChild: number | undefined;
  readonly setVisibleChild: (visibleChild: number | undefined) => void;
  readonly references: React.RefObject<WritableArray<HTMLElement | undefined>>;
  readonly forwardRefs: (index: number, element: HTMLElement | null) => void;
  readonly scrollContainerRef: React.RefCallback<HTMLDivElement | null>;
} {
  const [activeCategory, setActiveCategory] = React.useState<
    number | undefined
  >(undefined);

  const activeCategoryRef = React.useRef<number | undefined>(activeCategory);

  const handleChange = React.useCallback((index: number | undefined) => {
    setActiveCategory(index);
    activeCategoryRef.current = index;
  }, []);

  const references = React.useRef<WritableArray<HTMLElement | undefined>>([]);

  const [container, setContainer] = React.useState<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (container === null) return undefined;

    function rawHandleChange(): void {
      if (container === null) return;
      const { x, y } = container.getBoundingClientRect();
      const visibleElement = document.elementFromPoint(
        x,
        y + marginTop
      ) as HTMLElement;
      if (visibleElement === null) return;
      const section = findSection(container, visibleElement);
      if (section === undefined) return;
      const index = references.current.indexOf(section);
      setActiveCategory(index === -1 ? undefined : index);
    }

    const handleChange = _.throttle(rawHandleChange, scrollThrottle);

    const observer = new ResizeObserver(handleChange);
    observer.observe(container);
    const scroll = listen(container, 'scroll', handleChange);
    return (): void => {
      observer.disconnect();
      scroll();
    };
  }, [container]);

  return {
    visibleChild: activeCategory,
    setVisibleChild: handleChange,
    references,
    forwardRefs: React.useCallback((index, element) => {
      references.current[index] = element ?? undefined;
      if (element !== null && activeCategoryRef.current === index)
        scrollIntoView(element, 'start');
    }, []),
    scrollContainerRef: setContainer,
  };
}

/**
 * Look for an element this many pixels below the top of the scroll container
 */
const marginTop = 200;
const scrollThrottle = 50;

function findSection(
  container: HTMLElement,
  child: HTMLElement
): HTMLElement | undefined {
  const parent = child.parentElement;
  if (parent === container) return child;
  else if (parent === null) return undefined;
  else return findSection(container, parent);
}
