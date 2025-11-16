import React from 'react';
import { useLocation } from 'react-router';
import { useNavigate } from 'react-router-dom';

import { listen } from '../../utils/events';
import type { GetSet, WritableArray } from '../../utils/types';
import { Link } from '../Atoms/Link';
import { pathIsOverlay } from '../Router/UnloadProtect';
import { scrollIntoView } from '../TreeView/helpers';
import type { PreferenceType } from './index';
import { usePrefDefinitions } from './index';

export function PreferencesAside({
  activeCategory,
  setActiveCategory,
  references,
  prefType = 'user',
}: {
  readonly activeCategory: number | undefined;
  readonly setActiveCategory: (activeCategory: number | undefined) => void;
  readonly references: React.RefObject<WritableArray<HTMLElement | undefined>>;
  readonly prefType?: PreferenceType;
}): JSX.Element {
  const preferenceRoutes: Record<PreferenceType, string> = {
    user: '/specify/user-preferences/',
    collection: '/specify/collection-preferences/',
    global: '/specify/global-preferences/',
  };
  const preferencesPath = preferenceRoutes[prefType];
  const definitions = usePrefDefinitions(prefType);
  const navigate = useNavigate();
  const location = useLocation();
  const isInOverlay = pathIsOverlay(location.pathname);
  // Don't call navigate while an overlay is open as that will close the overlay
  React.useEffect(
    () =>
      isInOverlay || activeCategory === undefined
        ? undefined
        : navigate(`${preferencesPath}#${definitions[activeCategory][0]}`, {
            replace: true,
          }),
    [isInOverlay, definitions, activeCategory, preferencesPath]
  );

  const [freezeCategory, setFreezeCategory] = useFrozenCategory();
  const currentIndex = freezeCategory ?? activeCategory;
  const visibleDefinitions = React.useMemo(
    () =>
      definitions
        .map((definition, index) => [index, definition] as const)
        .filter(
          ([, [category]]) =>
            !(
              prefType === 'collection' &&
              category === 'catalogNumberParentInheritance'
            )
        ),
    [definitions, prefType]
  );

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
      {visibleDefinitions.map(([definitionIndex, [category, { title }]]) => (
        <Link.Secondary
          aria-current={currentIndex === definitionIndex ? 'page' : undefined}
          href={`#${category}`}
          key={category}
          onClick={(): void => setFreezeCategory(definitionIndex)}
        >
          {typeof title === 'function' ? title() : title}
        </Link.Secondary>
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
