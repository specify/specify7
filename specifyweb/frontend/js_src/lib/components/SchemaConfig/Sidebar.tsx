import React from 'react';
import { useParams } from 'react-router-dom';

import { commonText } from '../../localization/common';
import { schemaText } from '../../localization/schema';
import { localized } from '../../utils/types';
import { H3 } from '../Atoms';
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

  return (
    <aside className="order-2 lg:order-1 flex w-full flex-shrink-0 flex-col gap-2 overflow-hidden border-gray-300 p-2 dark:border-neutral-600 lg:w-64 lg:border-r">
      <H3>{schemaText.tables()}</H3>
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
              aria-label={localized(schemaText.unsavedSchemaUnloadProtect())}
              className="pl-1 font-bold text-orange-500"
              title={localized(schemaText.unsavedSchemaUnloadProtect())}
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
