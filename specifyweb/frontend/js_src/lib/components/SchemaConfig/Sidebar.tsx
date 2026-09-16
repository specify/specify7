import React from 'react';
import { useParams } from 'react-router-dom';

import { schemaText } from '../../localization/schema';
import { useSchemaConfig } from './Store';
import { CollapsibleTableList } from './Tables';

export function SchemaConfigSidebar({
  tableName,
}: {
  readonly tableName: string;
}): JSX.Element {
  const { language = '' } = useParams();
  const { modifiedTables } = useSchemaConfig();

  return (
    <CollapsibleTableList
      asAside
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
      getAction={(table): string =>
        `/specify/schema-config/${language}/${table.name}/`
      }
      localizeTableNames={false}
    />
  );
}
