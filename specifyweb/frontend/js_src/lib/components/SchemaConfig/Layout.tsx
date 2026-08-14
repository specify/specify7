import React from 'react';
import { Outlet, useOutletContext } from 'react-router';
import { useMatch, useParams } from 'react-router-dom';

import { useUnloadProtect } from '../../hooks/navigation';
import { schemaText } from '../../localization/schema';
import { Container } from '../Atoms';
import { LoadingContext, ReadOnlyContext } from '../Core/Contexts';
import { hasToolPermission } from '../Permissions/helpers';
import { SetSingleResourceContext } from '../Router/Router';
import { SchemaConfigHeader } from './Components';
import type { SchemaData } from './schemaData';
import { SchemaConfigSidebar } from './Sidebar';
import {
  handleSchemaSaved,
  SchemaConfigStoreProvider,
  useSchemaConfig,
} from './Store';

export function SchemaConfigLayout(): JSX.Element {
  const schemaData = useOutletContext<SchemaData>();
  const { language: rawLanguage = '' } = useParams();
  const isReadOnly =
    React.useContext(ReadOnlyContext) ||
    !hasToolPermission('schemaConfig', 'update') ||
    !hasToolPermission('schemaConfig', 'create');

  return (
    <SchemaConfigStoreProvider
      key={rawLanguage}
      isReadOnly={isReadOnly}
      rawLanguage={rawLanguage}
      schemaData={schemaData}
    >
      <ReadOnlyContext.Provider value={isReadOnly}>
        <SchemaConfigLayoutContent />
      </ReadOnlyContext.Provider>
    </SchemaConfigStoreProvider>
  );
}

function SchemaConfigLayoutContent(): JSX.Element {
  const { schemaData, isReadOnly, anyModified, saveAll } = useSchemaConfig();
  const { language: rawLanguage = '' } = useParams();
  const match = useMatch('/specify/schema-config/:language/:tableName');
  const tableName = match?.params.tableName ?? '';
  const setSingleResource = React.useContext(SetSingleResourceContext);
  const loading = React.useContext(LoadingContext);

  React.useEffect(() => {
    setSingleResource(`/specify/schema-config/${rawLanguage}/`);
    return () => setSingleResource(undefined);
  }, [setSingleResource, rawLanguage]);

  const unsetUnloadProtect = useUnloadProtect(
    anyModified,
    schemaText.unsavedSchemaUnloadProtect()
  );

  const canSave = !isReadOnly && anyModified;
  const handleSave = (): void => {
    if (!canSave) return;
    unsetUnloadProtect();
    loading(saveAll().then(() => handleSchemaSaved(rawLanguage, tableName)));
  };

  return (
    <Container.Full>
      <SchemaConfigHeader
        languages={schemaData.languages}
        onSave={canSave ? handleSave : undefined}
        rawLanguage={rawLanguage}
      />
      <div className="flex flex-1 flex-col gap-4 overflow-y-scroll lg:flex-row lg:overflow-hidden">
        <SchemaConfigSidebar tableName={tableName} />
        <div className="order-1 lg:order-2 flex min-w-0 flex-1 flex-col min-h-full lg:min-h-0 lg:overflow-hidden">
          <Outlet />
        </div>
      </div>
    </Container.Full>
  );
}
