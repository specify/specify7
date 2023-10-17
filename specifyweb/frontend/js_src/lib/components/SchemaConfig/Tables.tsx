import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useCachedState } from '../../hooks/useCachedState';
import { commonText } from '../../localization/common';
import { schemaText } from '../../localization/schema';
import { wbPlanText } from '../../localization/wbPlan';
import type { CacheDefinitions } from '../../utils/cache/definitions';
import { localized } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { tables } from '../DataModel/tables';
import { Dialog } from '../Molecules/Dialog';
import { TableIcon } from '../Molecules/TableIcon';
import { formatUrl } from '../Router/queryString';

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

export function TableList({
  cacheKey,
  getAction,
  filter,
  children,
}: {
  readonly cacheKey: CacheKey;
  readonly getAction: (table: SpecifyTable) => string | (() => void);
  readonly filter?: (table: SpecifyTable) => boolean;
  readonly children?: (table: SpecifyTable) => React.ReactNode;
}): JSX.Element {
  const [showHiddenTables = false, setShowHiddenTables] = useCachedState(
    cacheKey,
    'showHiddenTables'
  );

  const sortedTables = React.useMemo(
    () =>
      Object.values(tables)
        .filter((table) => (filter ? filter(table) : !table.isSystem))
        .sort(sortFunction(({ name }) => name)),
    [filter]
  );

  const tablesToDisplay = React.useMemo(() => {
    const presentFilteredTables = Object.values(sortedTables).filter(
      (table) => {
        const childrenResult = children?.(table);
        return typeof childrenResult === 'string';
      }
    );

    return showHiddenTables ? sortedTables : presentFilteredTables;
  }, [showHiddenTables, sortedTables, children]);

  return (
    <div className="flex flex-col items-start gap-2">
      <Ul className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {tablesToDisplay.map((table) => {
          const action = getAction(table);
          const extraContent = children?.(table);
          const content = (
            <>
              <TableIcon label={false} name={table.name} />
              {
                // Using table name instead of table label intentionally
                localized(table.name)
              }
              {extraContent !== undefined && (
                <>
                  <span className="-ml-2 flex-1" />
                  {extraContent}
                </>
              )}
            </>
          );
          return (
            <li className="contents" key={table.tableId}>
              {typeof action === 'function' ? (
                <Button.LikeLink onClick={action}>{content}</Button.LikeLink>
              ) : (
                <Link.Default href={action}>{content}</Link.Default>
              )}
            </li>
          );
        })}
        <Label.Inline>
          <Input.Checkbox
            checked={showHiddenTables}
            onValueChange={setShowHiddenTables}
          />
          {wbPlanText.showAllTables()}
        </Label.Inline>
      </Ul>
    </div>
  );
}
