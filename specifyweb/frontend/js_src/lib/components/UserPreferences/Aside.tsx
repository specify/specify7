import React from 'react';
import { useLocation } from 'react-router';
import { useNavigate } from 'react-router-dom';
import _ from 'underscore';

import { listen } from '../../utils/events';
import type { GetSet, WritableArray } from '../../utils/types';
import { Link } from '../Atoms/Link';
import { locationToState } from '../Router/RouterState';
import { usePrefDefinitions } from './index';

/**
 * Update the active category on the sidebar as user scrolls
 *
 * Previous implementation used IntersectionObserver for this, but it was too
 * slow when you have 180 categories (on the Data Model page)
 */
export function useActiveCategory(): {
  readonly visibleChild: number | undefined;
  readonly forwardRefs: (index: number, element: HTMLElement | null) => void;
  readonly scrollContainerRef: React.RefCallback<HTMLDivElement | null>;
} {
  const [activeCategory, setActiveCategory] = React.useState<
    number | undefined
  >(0);
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
    forwardRefs: React.useCallback((index, element) => {
      references.current[index] = element ?? undefined;
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
export function PreferencesAside({
  activeCategory,
}: {
  readonly activeCategory: number | undefined;
}): JSX.Element {
  const definitions = usePrefDefinitions();
  const navigate = useNavigate();
  const location = useLocation();
  const state = locationToState(location, 'BackgroundLocation');
  const isInOverlay = typeof state === 'object';
  // Don't call navigate while an overlay is open as that will close the overlay
  React.useEffect(
    () =>
      isInOverlay || activeCategory === undefined
        ? undefined
        : navigate(
            `/specify/user-preferences/#${definitions[activeCategory][0]}`,
            {
              replace: true,
            }
          ),
    [isInOverlay, definitions, activeCategory]
  );

  const [freezeCategory, setFreezeCategory] = useFrozenCategory();
  const currentIndex = freezeCategory ?? activeCategory;

  return (
    <aside
      className={`
        top-0 flex min-w-fit flex-1 flex-col divide-y-4 divide-[color:var(--form-background)]
        overflow-y-auto md:sticky
      `}
    >
      {definitions.map(([category, { title }], index) => (
        <Link.Gray
          aria-current={currentIndex === index ? 'page' : undefined}
          href={`#${category}`}
          key={category}
          onClick={(): void => setFreezeCategory(index)}
        >
          {title}
        </Link.Gray>
      ))}
    </aside>
  );
}

/**
 * Clicking on a category scrolls that category to the top.
 * The active category is determined based on which category is in the middle.
 * Thus, clicking on a category might not make it active.
 * This hack temporary makes the clicked category active, until user starts to
 * scroll away
 */
export function useFrozenCategory(): GetSet<number | undefined> {
  const [freezeCategory, setFreezeCategory] = React.useState<
    number | undefined
  >(undefined);
  React.useEffect(
    () =>
      typeof freezeCategory === 'number'
        ? listen(
            document.body,
            'resize',
            () => setFreezeCategory(undefined),
            true
          )
        : undefined,
    [freezeCategory]
  );
  React.useEffect(
    () =>
      typeof freezeCategory === 'number'
        ? listen(
            document.body,
            'scroll',
            () => {
              if (ignoreScroll.current) ignoreScroll.current = false;
              else setFreezeCategory(undefined);
            },
            true
          )
        : undefined,
    [freezeCategory]
  );

  /*
   * Clicking on a category scrolls to it. Need to ignore that initial scroll
   * and only listen for subsequent scrolls
   */
  const ignoreScroll = React.useRef<boolean>(false);

  return [
    freezeCategory,
    React.useCallback((value) => {
      ignoreScroll.current = typeof value === 'number';
      setFreezeCategory(value);
    }, []),
  ];
}
