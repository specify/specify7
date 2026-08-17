import React from 'react';
import { useParams } from 'react-router-dom';

import { commonText } from '../../localization/common';
import { schemaText } from '../../localization/schema';
import { H3 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Input } from '../Atoms/Form';
import { useSchemaConfig } from './Store';
import { TableList, tablesFilter } from './Tables';

export function SchemaConfigSidebar({
  tableName,
}: {
  readonly tableName: string;
}): JSX.Element {
  const { language = '' } = useParams();
  const { modifiedTables } = useSchemaConfig();
  const [search, setSearch] = React.useState('');
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return isCollapsed ? (
    <aside className="order-2 flex w-full flex-shrink-0 flex-col items-center gap-2 overflow-hidden lg:order-1 lg:w-9 lg:border-r">
      <Button.Icon
        icon="chevronDoubleRight"
        title={`${commonText.expand()} ${schemaText.tables()}`}
        onClick={(): void => setIsCollapsed(false)}
      />
    </aside>
  ) : (
    <aside className="order-2 lg:order-1 flex w-full flex-shrink-0 flex-col gap-2 overflow-hidden pr-2 lg:w-64 lg:border-r">
      <div className="flex items-center gap-2">
        <H3 className="flex-1">{schemaText.tables()}</H3>
        <Button.Icon
          icon="chevronDoubleLeft"
          title={`${commonText.collapse()} ${schemaText.tables()}`}
          onClick={(): void => setIsCollapsed(true)}
        />
      </div>
      <Input.Text
        aria-label={commonText.search()}
        placeholder={commonText.search()}
        value={search}
        onValueChange={setSearch}
      />
      <TableList
        badge={(table): React.ReactNode =>
          modifiedTables.includes(table.name) ? (
            <span
              aria-label={schemaText.unsavedChanges()}
              className="pl-1 font-bold text-orange-500"
              title={schemaText.unsavedChanges()}
            >
              *
            </span>
          ) : undefined
        }
        cacheKey="schemaConfig"
        currentTableName={tableName}
        filter={(showHiddenTables, table): boolean => {
          const searchText = search.toLowerCase();
          return (
            tablesFilter(showHiddenTables, false, true, table) &&
            (searchText === '' ||
              table.name.toLowerCase().includes(searchText) ||
              table.label.toLowerCase().includes(searchText))
          );
        }}
        getAction={(table): string =>
          `/specify/schema-config/${language}/${table.name}/`
        }
        localizeTableNames={false}
      />
    </aside>
  );
}
