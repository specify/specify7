import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useCachedState } from '../../hooks/useCachedState';
import { commonText } from '../../localization/common';
import { schemaText } from '../../localization/schema';
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
import { Dialog } from '../Molecules/Dialog';
import { TableIcon } from '../Molecules/TableIcon';
import { hasTablePermission } from '../Permissions/helpers';
import { formatUrl } from '../Router/queryString';
import { HIDDEN_GEO_TABLES } from '../Toolbar/QueryTablesEdit';

export function SchemaConfigTables(): JSX.Element {
  const { language = '' } = useParams();
  const navigate = useNavigate();

  return (
    <Dialog
      buttons={
        <>
          <Link.Success
            download={`schema_localization_${language}.json`}
            href={formatUrl('/context/schema_localization.json', {
              lang: language,
            })}
          >
            {commonText.export()}
          </Link.Success>
          <span className="-ml-2 flex-1" />
          <Button.Secondary
            onClick={(): void => navigate('/specify/schema-config/')}
          >
            {commonText.back()}
          </Button.Secondary>
        </>
      }
      header={schemaText.tables()}
      onClose={(): void => navigate('/specify')}
    >
      <TableList
        cacheKey="schemaConfig"
        getAction={(table): string =>
          `/specify/schema-config/${language}/${table.name}/`
        }
        localizeTableNames={false}
      />
    </Dialog>
  );
}

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

const tablesToIncludeInQueryList = new Set<string>([
  'Collection',
  'Discipline',
  'Division',
]);
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
  if (tablesToIncludeInQueryList.has(name)) return true;

  const isRestricted = overrides.isHidden || overrides.isSystem;
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
}: {
  readonly cacheKey: CacheKey;
  readonly getAction: (table: SpecifyTable) => string | (() => void);
  readonly filter?: (showHiddenTables: boolean, table: SpecifyTable) => boolean;
  readonly children?: (table: SpecifyTable) => React.ReactNode;
  readonly localizeTableNames?: boolean;
}): JSX.Element {
  const [showHiddenTables = false, setShowHiddenTables] = useCachedState(
    cacheKey,
    'showHiddenTables'
  );

  const sortedTables = React.useMemo(
    () =>
      Object.values(genericTables)
        .filter((table) => filter(showHiddenTables, table))
        // TODO: temp fix, remove this, use to hide geo tables for COG until 9.8 release
        .filter((table) => !HIDDEN_GEO_TABLES.has(table.name))
        .sort(sortFunction(({ name }) => name)),
    [filter, showHiddenTables]
  );

  return (
    <div className="flex flex-col items-start gap-2 overflow-auto">
      <Ul className="flex w-full flex-1 flex-col gap-1 overflow-y-auto">
        {sortedTables.map((table) => {
          const action = getAction(table);
          const extraContent = children?.(table);
          const isVisible =
            showHiddenTables ||
            children === undefined ||
            extraContent !== undefined;
          const content = (
            <>
              <TableIcon label={false} name={table.name} />
              {localizeTableNames ? table.label : localized(table.name)}{' '}
              {extraContent !== undefined && extraContent}
            </>
          );
          return isVisible ? (
            <li className="contents" key={table.tableId}>
              {typeof action === 'function' ? (
                <Button.LikeLink onClick={action}>{content}</Button.LikeLink>
              ) : (
                <Link.Default href={action}>{content}</Link.Default>
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
