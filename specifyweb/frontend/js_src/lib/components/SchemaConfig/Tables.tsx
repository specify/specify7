import React from 'react';

import { useCachedState } from '../../hooks/useCachedState';
import { wbPlanText } from '../../localization/wbPlan';
import type { CacheDefinitions } from '../../utils/cache/definitions';
import type { RA } from '../../utils/types';
import { localized } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { genericTables } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import { userInformation } from '../InitialContext/userInformation';
import { TableIcon } from '../Molecules/TableIcon';
import { hasTablePermission } from '../Permissions/helpers';

/**
 * Get the names of all cache categories in cache definitions that have
 * a "showHiddenTables" key
 */
type CacheKey = {
  readonly [KEY in keyof CacheDefinitions]: CacheDefinitions[KEY] extends {
    readonly showHiddenTables: boolean;
  }
    ? KEY
    : never;
}[keyof CacheDefinitions];

/**
 * Get a function for trimming down all tables to list of tables
 * user is expected to commonly access
 */
export function tablesFilter(
  showHiddenTables: boolean,
  showNoAccessTables: boolean,
  showAdvancedTables: boolean,
  { name, overrides }: SpecifyTable,
  // Don't exclude a table if user already has it selected
  selectedTables: RA<keyof Tables> | undefined = undefined
): boolean {
  if (selectedTables?.includes(name) === true) return true;

  const isRestricted = userInformation.isadmin
    ? overrides.isHidden
    : overrides.isHidden || overrides.isSystem;
  if (!showHiddenTables && isRestricted) return false;
  const hasAccess = hasTablePermission(name, 'read');
  if (!showNoAccessTables && !hasAccess) return false;
  const isAdvanced = !overrides.isCommon;
  // eslint-disable-next-line sonarjs/prefer-single-boolean-return
  if (!showAdvancedTables && isAdvanced) return false;

  return true;
}

const defaultFilter = (
  showHiddenTables: boolean,
  table: SpecifyTable
): boolean => tablesFilter(showHiddenTables, false, true, table);

export function TableList({
  cacheKey,
  getAction,
  filter = defaultFilter,
  children,
  localizeTableNames = true,
  currentTableName,
  badge,
}: {
  readonly cacheKey: CacheKey;
  readonly getAction: (table: SpecifyTable) => string | (() => void);
  readonly filter?: (showHiddenTables: boolean, table: SpecifyTable) => boolean;
  readonly children?: (table: SpecifyTable) => React.ReactNode;
  readonly localizeTableNames?: boolean;
  readonly currentTableName?: string;
  readonly badge?: (table: SpecifyTable) => React.ReactNode;
}): JSX.Element {
  const [showHiddenTables = false, setShowHiddenTables] = useCachedState(
    cacheKey,
    'showHiddenTables'
  );

  const sortedTables = React.useMemo(
    () =>
      Object.values(genericTables)
        .filter((table) => filter(showHiddenTables, table))
        .sort(sortFunction(({ name }) => name)),
    [filter, showHiddenTables]
  );

  const listRef = React.useRef<HTMLUListElement | null>(null);
  const activeRef = React.useRef<HTMLAnchorElement | null>(null);
  const hasScrolledRef = React.useRef(false);

  React.useEffect(() => {
    if (hasScrolledRef.current || currentTableName === '') return;
    const list = listRef.current;
    const active = activeRef.current;
    if (list === null || active === null) return;
    hasScrolledRef.current = true;
    const listRect = list.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    list.scrollTop +=
      activeRect.top - listRect.top - (listRect.height - activeRect.height) / 2;
  }, [currentTableName]);

  return (
    <div className="flex flex-col items-start gap-2 overflow-auto">
      <Ul
        className="relative flex w-full flex-1 flex-col gap-1 overflow-y-auto"
        forwardRef={listRef}
      >
        {sortedTables.map((table) => {
          const action = getAction(table);
          const extraContent = children?.(table);
          const badgeContent = badge?.(table);
          const isCurrent =
            currentTableName !== undefined &&
            table.name.toLowerCase() === currentTableName.toLowerCase();
          const isVisible =
            showHiddenTables ||
            children === undefined ||
            extraContent !== undefined;
          const content = (
            <>
              <TableIcon label={false} name={table.name} />
              {localizeTableNames ? table.label : localized(table.name)}{' '}
              {extraContent !== undefined && extraContent}
              {badgeContent}
            </>
          );
          return isVisible ? (
            <li className="contents" key={table.tableId}>
              {typeof action === 'function' ? (
                <Button.LikeLink onClick={action}>{content}</Button.LikeLink>
              ) : (
                <Link.Default
                  aria-current={isCurrent ? 'page' : undefined}
                  className={isCurrent ? 'font-bold' : undefined}
                  forwardRef={isCurrent ? activeRef : undefined}
                  href={action}
                >
                  {content}
                </Link.Default>
              )}
            </li>
          ) : undefined;
        })}
      </Ul>
      <Label.Inline>
        <Input.Checkbox
          checked={showHiddenTables}
          onValueChange={setShowHiddenTables}
        />
        {wbPlanText.showAllTables()}
      </Label.Inline>
    </div>
  );
}
