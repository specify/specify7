import React from 'react';
import { useLocation } from 'react-router';
import { useNavigate } from 'react-router-dom';

import { listen } from '../../utils/events';
import type { GetSet, WritableArray } from '../../utils/types';
import { Link } from '../Atoms/Link';
import { locationToState } from '../Router/RouterState';
import { scrollIntoView } from '../TreeView/helpers';
import { usePrefDefinitions } from './index';

export function PreferencesAside({
  activeCategory,
  setActiveCategory,
  references,
}: {
  readonly activeCategory: number | undefined;
  readonly setActiveCategory: (activeCategory: number | undefined) => void;
  readonly references: React.RefObject<WritableArray<HTMLElement | undefined>>;
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

  React.useEffect(() => {
    const active = location.hash.replace('#', '').toLowerCase();
    const activeIndex = definitions.findIndex(
      ([name]) => name.toLowerCase() === active
    );
    if (activeIndex !== -1) {
      setActiveCategory(activeIndex);
      const currentRef = references.current?.[activeIndex];
      if (currentRef !== undefined) scrollIntoView(currentRef, 'start');
    }
  }, []);

  return (
    <aside
      className={`
        top-0 flex min-w-fit flex-shrink-0 flex-col divide-y-4 divide-[color:var(--form-background)]
        overflow-y-auto md:sticky md:flex-1
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
