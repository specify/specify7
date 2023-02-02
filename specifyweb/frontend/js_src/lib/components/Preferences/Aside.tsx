import React from 'react';
import { useLocation } from 'react-router';
import { useNavigate } from 'react-router-dom';

import { listen } from '../../utils/events';
import { f } from '../../utils/functools';
import type { GetSet, WritableArray } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { Link } from '../Atoms/Link';
import { locationToState } from '../Router/RouterState';
import { usePrefDefinitions } from './index';

/** Update the active category on the sidebar as user scrolls */
export function useActiveCategory(): {
  readonly activeCategory: number;
  readonly forwardRefs: (index: number, element: HTMLElement | null) => void;
  readonly containerRef: React.RefCallback<HTMLDivElement | null>;
} {
  const [activeCategory, setActiveCategory] = React.useState<number>(0);
  const observer = React.useRef<IntersectionObserver | undefined>(undefined);
  const references = React.useRef<WritableArray<HTMLElement | undefined>>([]);
  React.useEffect(() => () => observer.current?.disconnect(), []);

  // eslint-disable-next-line functional/prefer-readonly-type
  const intersecting = React.useRef<Set<number>>(new Set());

  function handleObserved({
    isIntersecting,
    target,
  }: IntersectionObserverEntry): void {
    const index = references.current.indexOf(target as HTMLElement);
    intersecting.current[isIntersecting ? 'add' : 'delete'](index);
    const intersection = f.min(...Array.from(intersecting.current)) ?? 0;
    setActiveCategory(intersection);
  }

  return {
    activeCategory,
    forwardRefs: React.useCallback((index, element) => {
      const oldElement = references.current[index];
      if (typeof oldElement === 'object')
        observer.current?.unobserve(oldElement);
      references.current[index] = element ?? undefined;
      if (element !== null) observer?.current?.observe(element);
    }, []),
    containerRef: React.useCallback((container): void => {
      observer.current?.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => entries.map(handleObserved),
        {
          root: container,
          rootMargin: '-200px 0px -100px 0px',
          threshold: 0,
        }
      );
      /*
       * Since React 18, apps running in strict mode in development are mounted
       * followed immediately by an unmount and then mount again. This causes
       * observer not to fire. Can be fixed by either
       * running React in non-strict mode (bad idea), or wrapping the following
       * in setTimeout(()=>..., 0);
       * More info:
       * https://reactjs.org/blog/2022/03/08/react-18-upgrade-guide.html#updates-to-strict-mode
       */
      setTimeout(
        () =>
          filterArray(references.current).forEach((value) =>
            observer.current?.observe(value)
          ),
        0
      );
    }, []),
  };
}

export function PreferencesAside({
  id,
  activeCategory,
}: {
  readonly id: (prefix: string) => string;
  readonly activeCategory: number;
}): JSX.Element {
  const definitions = usePrefDefinitions();
  const navigate = useNavigate();
  const location = useLocation();
  const state = locationToState(location, 'BackgroundLocation');
  const isInOverlay = typeof state === 'object';
  React.useEffect(
    () =>
      isInOverlay
        ? undefined
        : navigate(
            `/specify/user-preferences/#${id(definitions[activeCategory][0])}`,
            {
              replace: true,
            }
          ),
    [isInOverlay, definitions, activeCategory, id]
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
          href={`#${id(category)}`}
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
function useFrozenCategory(): GetSet<number | undefined> {
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
