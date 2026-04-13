import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { interactionsText } from '../../localization/interactions';
import { pickListsText } from '../../localization/pickLists';
import { ajax } from '../../utils/ajax';
import type { RA } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { H2 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { LoadingContext } from '../Core/Contexts';
import { fetchRows } from '../DataModel/collection';
import { getSystemInfo } from '../InitialContext/systemInfo';
import { loadingGif } from '../Molecules';
import { Dialog } from '../Molecules/Dialog';
import { downloadFile, FilePicker, fileToText } from '../Molecules/FilePicker';
import { hasToolPermission } from '../Permissions/helpers';
import { ToolPermissionDenied } from '../Permissions/PermissionDenied';
import { OverlayContext } from '../Router/Router';
import { fetchPickLists } from './definitions';
import { clearPickListCaches } from './fetch';

const prepTypePickListName = 'PrepType';
const prepTypeTableName = 'preptype';

type ImportResponse = {
  readonly importedCount: number;
  readonly importedNames: RA<string>;
  readonly skippedNames: RA<string>;
  readonly unchangedNames: RA<string>;
};

type AvailablePickList = {
  readonly name: string;
  readonly issystem: boolean | null;
  readonly tablename: string | null;
};

const fetchAvailablePickLists = async (): Promise<RA<AvailablePickList>> =>
  fetchRows('PickList', {
    fields: {
      name: ['string'],
      issystem: ['boolean', 'null'],
      tablename: ['string', 'null'],
    },
    domainFilter: true,
    limit: 0,
    orderBy: 'name',
  }).then((rows) =>
    rows
      .filter(
        ({ name, tablename }) =>
          name !== prepTypePickListName && tablename !== prepTypeTableName
      )
      .sort(sortFunction(({ name }) => name))
  );

export function PickListsExportOverlay(): JSX.Element {
  return hasToolPermission('pickLists', 'read') ? (
    <PickListsExportDialog />
  ) : (
    <ToolPermissionDenied action="read" tool="pickLists" />
  );
}

export function PickListsImportOverlay(): JSX.Element {
  return hasToolPermission('pickLists', 'create') &&
    hasToolPermission('pickLists', 'update') ? (
    <PickListsImportDialog />
  ) : (
    <ToolPermissionDenied
      action={hasToolPermission('pickLists', 'create') ? 'update' : 'create'}
      tool="pickLists"
    />
  );
}

function PickListsExportDialog(): JSX.Element {
  const handleClose = React.useContext(OverlayContext);
  const loading = React.useContext(LoadingContext);
  const [pickLists] = useAsyncState(
    React.useCallback(fetchAvailablePickLists, []),
    false
  );
  const [selectedNames, setSelectedNames] = React.useState<RA<string>>([]);
  const [exportedCount, setExportedCount] = React.useState<number | undefined>(
    undefined
  );

  const toggleName = React.useCallback((name: string) => {
    setSelectedNames((selectedNames) =>
      selectedNames.includes(name)
        ? selectedNames.filter((selectedName) => selectedName !== name)
        : [...selectedNames, name]
    );
  }, []);

  const handleExport = React.useCallback((): void => {
    loading(
      ajax('/picklist_tool/export/', {
        method: 'POST',
        headers: { Accept: 'text/plain' },
        body: {
          names: selectedNames,
        },
      })
        .then(async ({ data }) =>
          downloadFile(
            buildPickListFileName(),
            new Blob([data], {
              type: 'text/xml;charset=utf-8',
            })
          )
        )
        .then(() => setExportedCount(selectedNames.length))
    );
  }, [loading, selectedNames]);

  const availableNames = pickLists?.map(({ name }) => name) ?? [];

  return (
    <Dialog
      buttons={
        exportedCount === undefined ? (
          <>
            <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
            <Button.Small
              disabled={selectedNames.length === 0}
              onClick={handleExport}
            >
              {commonText.export()}
            </Button.Small>
          </>
        ) : (
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
        )
      }
      header={pickListsText.picklistsExportTool()}
      icon={icons.download}
      onClose={handleClose}
    >
      {typeof exportedCount === 'number' ? (
        <p>{`${exportedCount} ${pickListsText.pickListsExportedSuffix()}`}</p>
      ) : pickLists === undefined ? (
        loadingGif
      ) : pickLists.length === 0 ? (
        <p>{pickListsText.noPickListsAvailable()}</p>
      ) : (
        <div className="flex flex-col gap-3">
          <p>{pickListsText.picklistsExportDescription()}</p>
          <p>
            {commonText.colonLine({
              label: commonText.selected(),
              value: selectedNames.length.toString(),
            })}
          </p>
          <div className="flex gap-2">
            <Button.Small
              onClick={(): void => setSelectedNames(availableNames)}
            >
              {interactionsText.selectAll()}
            </Button.Small>
            <Button.Small onClick={(): void => setSelectedNames([])}>
              {interactionsText.deselectAll()}
            </Button.Small>
          </div>
          <div className="max-h-80 overflow-auto rounded border border-gray-300 p-3">
            <div className="flex flex-col gap-2">
              {pickLists.map(({ name, issystem }) => (
                <Label.Inline key={name}>
                  <Input.Checkbox
                    checked={selectedNames.includes(name)}
                    onValueChange={(): void => toggleName(name)}
                  />
                  <span>
                    {name}
                    {issystem === true && (
                      <span className="text-neutral-500">
                        {` (${pickListsText.systemLabel()})`}
                      </span>
                    )}
                  </span>
                </Label.Inline>
              ))}
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}

function PickListsImportDialog(): JSX.Element {
  const handleClose = React.useContext(OverlayContext);
  const loading = React.useContext(LoadingContext);
  const [file, setFile] = React.useState<File | undefined>(undefined);
  const [result, setResult] = React.useState<ImportResponse | undefined>(
    undefined
  );

  const handleImport = React.useCallback((): void => {
    if (file === undefined) return;
    loading(
      fileToText(file)
        .then(async (contents) =>
          ajax<ImportResponse>('/picklist_tool/import/', {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'text/plain',
            },
            body: contents,
          })
        )
        .then(async ({ data }) => {
          if (data.importedNames.length > 0) {
            clearPickListCaches(data.importedNames);
            await fetchPickLists();
          }
          setResult(data);
        })
    );
  }, [file, loading]);

  return (
    <Dialog
      buttons={
        result === undefined ? (
          <>
            <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
            <Button.Small disabled={file === undefined} onClick={handleImport}>
              {commonText.import()}
            </Button.Small>
          </>
        ) : (
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
        )
      }
      header={pickListsText.picklistsImportTool()}
      icon={icons.upload}
      onClose={handleClose}
    >
      {result === undefined ? (
        <div className="flex flex-col gap-3">
          <p>{pickListsText.picklistsImportDescription()}</p>
          <FilePicker
            acceptedFormats={['.xml', '.json']}
            onFileSelected={(file): void => setFile(file)}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <H2>
            {result.importedCount > 0
              ? `${result.importedCount} ${pickListsText.pickListsImportedSuffix()}`
              : pickListsText.pickListsImportNoChanges()}
          </H2>
          {result.skippedNames.length > 0 && (
            <p>
              {commonText.colonLine({
                label: pickListsText.skippedPickLists(),
                value: result.skippedNames.join(', '),
              })}
            </p>
          )}
        </div>
      )}
    </Dialog>
  );
}

function buildPickListFileName(): string {
  const collectionName = getSystemInfo().collection.replaceAll(
    /[^\w\-.]+/gu,
    '_'
  );
  const date = new Date().toISOString().slice(0, 10);
  return `PickLists - ${collectionName} - ${date}.xml`;
}
