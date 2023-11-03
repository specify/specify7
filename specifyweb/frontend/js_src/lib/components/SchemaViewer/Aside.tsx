import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Link } from '../Atoms/Link';
import { locationToState } from '../Router/RouterState';
import { useFrozenCategory } from '../Preferences/Aside';
import { getSchemaViewerTables } from './Table';

export function SchemaViewerAside({
  activeCategory,
}: {
  readonly activeCategory: number | undefined;
}): JSX.Element {
  const tables = React.useMemo(getSchemaViewerTables, []);
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
    [isInOverlay, tables, activeCategory, navigate]
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
