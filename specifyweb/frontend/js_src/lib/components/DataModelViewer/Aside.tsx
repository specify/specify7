import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { locationToState } from '../Router/RouterState';
import { getTables } from './helpers';
import { useFrozenCategory } from '../UserPreferences/Aside';
import { Link } from '../Atoms/Link';

export function DataModelAside({
  activeCategory,
}: {
  readonly activeCategory: number | undefined;
}): JSX.Element {
  const tables = React.useMemo(getTables, []);
  const [freezeCategory, setFreezeCategory] = useFrozenCategory();
  const currentIndex = freezeCategory ?? activeCategory;
  const navigate = useNavigate();
  const location = useLocation();
  const state = locationToState(location, 'BackgroundLocation');
  const isInOverlay = typeof state === 'object';

  React.useEffect(
    () =>
      isInOverlay || activeCategory === undefined
        ? undefined
        : navigate(`/specify/data-model/#${tables[activeCategory].name[0]}`, {
            replace: true,
          }),
    [isInOverlay, tables, activeCategory]
  );

  return (
    <aside
      className={`
        left-0 hidden min-w-fit flex-1 flex-col divide-y-4
        divide-[color:var(--form-background)] overflow-y-auto md:flex
      `}
    >
      {tables.map(({ name: [tableName, jsxName] }, index) => (
        <Link.Gray
          aria-current={currentIndex === index ? 'page' : undefined}
          className="!justify-start"
          href={`#${tableName}`}
          key={index}
          onClick={(): void => setFreezeCategory(index)}
        >
          {jsxName}
        </Link.Gray>
      ))}
    </aside>
  );
}
