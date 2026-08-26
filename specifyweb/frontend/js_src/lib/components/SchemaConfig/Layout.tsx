import React from 'react';
import { Outlet, useOutletContext } from 'react-router';
import { useMatch, useParams } from 'react-router-dom';

import { useUnloadProtect } from '../../hooks/navigation';
import { commonText } from '../../localization/common';
import { schemaText } from '../../localization/schema';
import { ajax } from '../../utils/ajax';
import { Container } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import { LoadingContext, ReadOnlyContext } from '../Core/Contexts';
import { Dialog } from '../Molecules/Dialog';
import { fileToText } from '../Molecules/FilePicker';
import { hasToolPermission } from '../Permissions/helpers';
import { SetSingleResourceContext } from '../Router/Router';
import { formatUrl } from '../Router/queryString';
import { SchemaConfigHeader } from './Components';
import type { SchemaData } from './schemaData';
import { SchemaConfigSidebar } from './Sidebar';
import {
  handleSchemaSaved,
  SchemaConfigStoreProvider,
  useSchemaConfig,
} from './Store';
import { dialogIcons } from '../Atoms/Icons';

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
  const [importFile, setImportFile] = React.useState<File | undefined>();
  const [importError, setImportError] = React.useState(false);

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
    loading(
      saveAll().then(() => {
        unsetUnloadProtect();
        return handleSchemaSaved(rawLanguage, tableName);
      })
    );
  };
  const handleImport = (file: File): void => {
    setImportError(false);
    setImportFile(file);
  };
  const confirmImport = (): void => {
    if (importFile === undefined) return;
    const file = importFile;
    setImportFile(undefined);
    loading(
      fileToText(file)
        .then((text) => JSON.parse(text))
        .then((schema) =>
          ajax('/context/schema_localization_import.json', {
            method: 'POST',
            headers: { Accept: 'application/json' },
            body: { schema, language: rawLanguage },
            errorMode: 'silent',
          })
        )
        .then(() => handleSchemaSaved(rawLanguage, tableName))
        .catch(() => setImportError(true))
    );
  };

  return (
    <Container.Full>
      <SchemaConfigHeader
        languages={schemaData.languages}
        onSave={canSave ? handleSave : undefined}
        onImport={isReadOnly ? undefined : handleImport}
        importDisabled={anyModified}
        rawLanguage={rawLanguage}
      />
      <div className="flex flex-1 flex-col gap-4 overflow-auto lg:flex-row lg:overflow-hidden">
        <SchemaConfigSidebar tableName={tableName} />
        <div className="order-1 lg:order-2 flex min-w-0 flex-1 flex-col min-h-full lg:min-h-0 lg:overflow-hidden">
          <Outlet />
        </div>
      </div>
      {importFile !== undefined && (
        <Dialog
          buttons={
            <>
              <Link.Small
                download={`schema_localization_${rawLanguage}.json`}
                href={formatUrl('/context/schema_localization.json', {
                  lang: rawLanguage,
                })}
              >
                {schemaText.downloadSchemaBackup({
                  schemaConfig: schemaText.schemaConfig(),
                })}
              </Link.Small>
              <span className="-ml-2 flex-1" />
              <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
              <Button.Info onClick={confirmImport}>
                {schemaText.importSchemaContinue()}
              </Button.Info>
            </>
          }
          icon={dialogIcons.warning}
          header={schemaText.importSchema({
            schemaConfig: schemaText.schemaConfig(),
          })}
          onClose={(): void => setImportFile(undefined)}
        >
          <p>
            {schemaText.importSchemaWarning({
              schemaConfig: schemaText.schemaConfig(),
            })}
          </p>
          <p>
            {schemaText.importSchemaBackupPrompt({
              schemaConfig: schemaText.schemaConfig(),
            })}
          </p>
          <p>{schemaText.importSchemaLimitations()}</p>
        </Dialog>
      )}
      {importError && (
        <Dialog
          buttons={
            <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          }
          icon={dialogIcons.error}
          header={schemaText.importSchema({
            schemaConfig: schemaText.schemaConfig(),
          })}
          onClose={(): void => setImportError(false)}
        >
          <p>
            {schemaText.importSchemaError({
              schemaConfig: schemaText.schemaConfig(),
            })}
          </p>
        </Dialog>
      )}
    </Container.Full>
  );
}
