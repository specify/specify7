import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { usePromise } from '../../hooks/useAsyncState';
import { useId } from '../../hooks/useId';
import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { statsText } from '../../localization/stats';
import { wbText } from '../../localization/workbench';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { syncFieldFormat } from '../../utils/fieldFormat';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { removeKey } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Form, Input, Label, Select } from '../Atoms/Form';
import { dialogIcons, icons } from '../Atoms/Icons';
import { Submit } from '../Atoms/Submit';
import { raise } from '../Errors/Crash';
import type { UiFormatter } from '../Forms/uiFormatters';
import { contextUnlockedPromise } from '../InitialContext';
import { Dialog, LoadingScreen } from '../Molecules/Dialog';
import { FilePicker } from '../Molecules/FilePicker';
import {
  createDataResource,
  fetchResourceId,
} from '../Preferences/BasePreferences';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import { NotFoundView } from '../Router/NotFoundView';
import {
  matchSelectedFiles,
  reconstructDeletingAttachment,
  reconstructUploadingAttachmentSpec,
  resolveFileNames,
} from './utils';
import { SafeRollbackAttachmentsNew } from './AttachmentsRollback';
import { staticAttachmentImportPaths } from './importPaths';
import type {
  BoundFile,
  CanValidate,
  PartialUploadableFileSpec,
  AttachmentDataSetResource,
  FetchedDataSet,
  UnBoundFile,
} from './types';
import { SafeUploadAttachmentsNew } from './AttachmentsUpload';
import { ViewAttachmentFiles } from './ViewAttachmentFiles';
import { AttachmentsValidationDialog } from './AttachmentsValidationDialog';

const attachmentDatasetName = 'Bulk Attachment Imports';

export type AttachmentUploadSpec = {
  readonly staticPathKey: keyof typeof staticAttachmentImportPaths;
  readonly formatQueryResults: (
    value: number | string | null | undefined
  ) => string | undefined;
};
export type PartialAttachmentUploadSpec = {
  readonly fieldFormatter?: UiFormatter;
} & (AttachmentUploadSpec | { readonly staticPathKey: undefined });

export type EagerDataSet = AttachmentDataSetResource<boolean> & {
  readonly needsSaved: boolean;
  readonly save: boolean;
};

let syncingResourcePromise:
  | Promise<AttachmentDataSetResource<true> | undefined>
  | undefined = undefined;

export const fetchAttachmentResourceId: Promise<number | undefined> =
  new Promise(async (resolve) => {
    const entryPoint = await contextUnlockedPromise;
    if (entryPoint === 'main') {
      const resourceId = await fetchResourceId(
        '/context/user_resource/',
        attachmentDatasetName
      ).then((resourceId) =>
        resourceId === undefined
          ? createDataResource(
              '/context/user_resource/',
              attachmentDatasetName,
              '[]'
            ).then(({ id }) => id)
          : Promise.resolve(resourceId)
      );
      resolve(resourceId);
    }
  });

export function canValidateAttachmentDataSet(
  dataSet: EagerDataSet
): dataSet is CanValidate {
  return (
    'staticPathKey' in dataSet.uploadSpec &&
    dataSet.uploadSpec.staticPathKey !== undefined
  );
}

export function NewAttachmentImport(): JSX.Element | null {
  const newAttachmentDataSetResource: AttachmentDataSetResource<false> = {
    name: attachmentsText.newAttachmentDataset(),
    uploadableFiles: [],
    uploadSpec: { staticPathKey: undefined },
  };
  return (
    <AttachmentsImport
      attachmentDataSetResource={newAttachmentDataSetResource}
    />
  );
}

export function AttachmentImportById(): JSX.Element | null {
  const { id } = useParams();
  const attachmentId = f.parseInt(id);
  return typeof attachmentId === 'number' ? (
    <AttachmentImportByIdSafe attachmentDataSetId={attachmentId} />
  ) : (
    <NotFoundView />
  );
}

function AttachmentImportByIdSafe({
  attachmentDataSetId,
}: {
  readonly attachmentDataSetId: number;
}): JSX.Element | null {
  const [attachmentDataSet] = usePromise<
    AttachmentDataSetResource<true> | undefined
  >(
    React.useMemo(
      async () =>
        fetchAttachmentResourceId.then(async (resourceId) =>
          resourceId === undefined
            ? undefined
            : ajax<FetchedDataSet>(
                `/attachment_gw/dataset/${resourceId}/${attachmentDataSetId}/`,
                {
                  headers: { Accept: 'application/json' },
                  method: 'GET',
                }
              ).then(async ({ data }) => {
                if (data.status === undefined || data.status === null)
                  return { ...data, status: undefined };
                const reconstructFunction =
                  data.status === 'uploading'
                    ? reconstructUploadingAttachmentSpec(
                        data.uploadSpec.staticPathKey,
                        data.uploadableFiles
                      )
                    : reconstructDeletingAttachment(
                        data.uploadSpec.staticPathKey,
                        data.uploadableFiles
                      );
                return reconstructFunction.then((returnFiles) => ({
                  ...data,
                  uploadableFiles: returnFiles,
                }));
              })
        ),
      [attachmentDataSetId]
    ),
    true
  );
  return attachmentDataSet === undefined ? null : (
    <AttachmentsImport attachmentDataSetResource={attachmentDataSet} />
  );
}

function AttachmentsImport<SAVED extends boolean>({
  attachmentDataSetResource,
}: {
  readonly attachmentDataSetResource: AttachmentDataSetResource<SAVED>;
}): JSX.Element | null {
  const [eagerDataSet, isSaving, triggerSave, commitChange] = useEagerDataSet(
    attachmentDataSetResource
  );

  const commitFileChange = (
    newUploadables: (
      oldUploadables: RA<PartialUploadableFileSpec>
    ) => RA<PartialUploadableFileSpec>
  ): void =>
    commitChange((oldState) => ({
      ...oldState,
      uploadableFiles: newUploadables(oldState.uploadableFiles),
    }));

  const commitStatusChange = (
    newState: AttachmentDataSetResource<boolean>['status']
  ) => commitChange((oldState) => ({ ...oldState, status: newState }));

  const applyFileNames = React.useCallback(
    (file: UnBoundFile): PartialUploadableFileSpec =>
      eagerDataSet.uploadSpec.staticPathKey === undefined
        ? { file }
        : resolveFileNames(
            file,
            eagerDataSet.uploadSpec.formatQueryResults,
            eagerDataSet.uploadSpec.fieldFormatter
          ),
    [eagerDataSet.uploadSpec.staticPathKey]
  );

  const previousKeyRef = React.useRef(
    attachmentDataSetResource.uploadSpec.staticPathKey
  );
  React.useEffect(() => {
    // Reset all parsed names if matching path is changeds
    if (previousKeyRef.current !== eagerDataSet.uploadSpec.staticPathKey) {
      previousKeyRef.current = eagerDataSet.uploadSpec.staticPathKey;
      commitFileChange((files) =>
        files.map((file) => applyFileNames(file.file))
      );
    }
  }, [applyFileNames, commitFileChange]);

  const currentBaseTable =
    eagerDataSet.uploadSpec.staticPathKey === undefined
      ? undefined
      : staticAttachmentImportPaths[eagerDataSet.uploadSpec.staticPathKey]
          .baseTable;

  const anyUploaded = eagerDataSet.uploadableFiles.some(
    (uploadable) => uploadable.attachmentId !== undefined
  );
  return (
    <div className={`${className.containerFullGray} flex-cols h-fit`}>
      <div className="align-center flex-col-2 flex h-[1.5em] gap-2">
        {eagerDataSet.name}
        <Button.Icon
          icon="pencil"
          title={commonText.edit()}
          onClick={() => commitStatusChange('renaming')}
        />
      </div>
      <div className="flex h-fit">
        <div className="flex flex-1 gap-2">
          <div className="max-w-2 flex">
            <FilePicker
              acceptedFormats={undefined}
              disabled={!('id' in eagerDataSet)}
              onFilesSelected={(files) => {
                const filesList = Array.from(files).map(applyFileNames);
                commitChange((oldState) => ({
                  ...oldState,
                  status: undefined,
                  uploadableFiles: matchSelectedFiles(
                    oldState.uploadableFiles,
                    filesList
                  ),
                }));
              }}
            />
          </div>
          <SelectUploadPath
            currentKey={eagerDataSet?.uploadSpec.staticPathKey}
            onCommit={
              anyUploaded
                ? undefined
                : (uploadSpec) => {
                    commitChange((oldState) => ({
                      ...oldState,
                      uploadSpec,
                    }));
                  }
            }
          />
          <span className="-ml-2 flex flex-1" />
          <div className="grid grid-rows-[repeat(3,auto)]">
            <Button.BorderedGray
              disabled={
                !eagerDataSet.uploadableFiles.some(
                  ({ file }) => file?.parsedName !== undefined
                ) || !canValidateAttachmentDataSet(eagerDataSet)
              }
              onClick={() => {
                commitStatusChange('validating');
              }}
            >
              {wbText.validate()}
            </Button.BorderedGray>
            <Button.BorderedGray
              disabled={!eagerDataSet.needsSaved}
              onClick={() => {
                triggerSave();
              }}
            >
              {commonText.save()}
            </Button.BorderedGray>

            <SafeUploadAttachmentsNew
              baseTableName={currentBaseTable}
              dataSet={eagerDataSet}
              onSync={(generatedState, isSyncing) => {
                commitChange((oldState) => ({
                  ...oldState,
                  status: isSyncing ? 'uploading' : undefined,
                  uploadableFiles: generatedState ?? oldState.uploadableFiles,
                }));
                triggerSave();
              }}
            />
            <SafeRollbackAttachmentsNew
              baseTableName={currentBaseTable}
              dataSet={eagerDataSet}
              onSync={(generatedState, isSyncing) => {
                commitChange((oldState) => ({
                  ...oldState,
                  status: isSyncing ? 'deleting' : undefined,
                  uploadableFiles: generatedState ?? oldState.uploadableFiles,
                }));
                triggerSave();
              }}
            />
          </div>
        </div>
      </div>
      <div className="overflow-auto">
        <ViewAttachmentFiles
          baseTableName={currentBaseTable}
          uploadableFiles={eagerDataSet.uploadableFiles}
          onDisambiguation={(
            disambiguatedId,
            indexToDisambiguate,
            multiple
          ) => {
            commitChange((oldState) => {
              const parsedName =
                oldState.uploadableFiles[indexToDisambiguate].file?.parsedName;
              return {
                ...oldState,
                uploadableFiles: oldState.uploadableFiles.map(
                  (uploadable, index) =>
                    parsedName !== undefined &&
                    (multiple || index === indexToDisambiguate) &&
                    // Redundant check for single disambiguation, but needed for disambiguate multiples
                    parsedName === uploadable.file?.parsedName &&
                    uploadable.attachmentId === undefined
                      ? {
                          ...uploadable,
                          disambiguated: disambiguatedId,
                        }
                      : uploadable
                ),
              };
            });
          }}
        />
      </div>
      {eagerDataSet.status === 'validating' &&
      canValidateAttachmentDataSet(eagerDataSet) ? (
        <AttachmentsValidationDialog
          dataSet={eagerDataSet}
          onValidated={(validatedFiles) => {
            if (validatedFiles !== undefined) {
              commitChange((oldState) => ({
                ...oldState,
                status: undefined,
                uploadableFiles: validatedFiles,
              }));
            }
          }}
        />
      ) : null}
      {eagerDataSet.status === 'renaming' && (
        <RenameAttachmentDataSetDialog
          attachmentDataSetName={eagerDataSet.name}
          datasetId={'id' in eagerDataSet ? eagerDataSet.id : undefined}
          onSave={(newName) => {
            if (newName !== undefined) {
              commitChange((oldState) => ({ ...oldState, name: newName }));
              triggerSave();
            }
            commitChange((state) => ({ ...state, status: undefined }));
          }}
        />
      )}
      {isSaving ? <LoadingScreen /> : null}
      {eagerDataSet.status === 'uploadInterrupted' ? (
        <Dialog
          buttons={
            <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          }
          header={attachmentsText.uploadInterrupted()}
          onClose={() => {
            commitStatusChange(undefined);
            triggerSave();
          }}
        >
          {attachmentsText.uploadInterruptedDescription()}
        </Dialog>
      ) : eagerDataSet.status === 'deletingInterrupted' ? (
        <Dialog
          buttons={
            <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          }
          header={attachmentsText.rollbackInterrupted()}
          onClose={() => {
            commitStatusChange(undefined);
            triggerSave();
          }}
        >
          {attachmentsText.rollbackInterruptedDescription()}
        </Dialog>
      ) : null}
    </div>
  );
}

function RenameAttachmentDataSetDialog({
  attachmentDataSetName,
  onSave: handleSave,
  datasetId,
}: {
  readonly datasetId: number | undefined;
  readonly attachmentDataSetName: string;
  readonly onSave: (newName: string | undefined) => void;
}): JSX.Element {
  const [pendingName, setPendingName] = React.useState(attachmentDataSetName);
  const id = useId('attachment');
  const navigate = useNavigate();
  const [triedToDelete, setTriedToDelete] = React.useState(false);
  return triedToDelete ? (
    <Dialog
      buttons={
        <>
          <Button.Danger
            onClick={() => {
              fetchAttachmentResourceId.then(async (resourceId) => {
                if (resourceId === undefined) {
                  raise(
                    new Error('Trying to delete from non existent app resource')
                  );
                } else {
                  return ajax<AttachmentDataSetResource<true>>(
                    `/attachment_gw/dataset/${resourceId}/${datasetId}/`,
                    {
                      headers: { Accept: undefined },
                      method: 'DELETE',
                    },
                    { expectedResponseCodes: [Http.NO_CONTENT] }
                  ).then(() => navigate('/specify/'));
                }
              });
            }}
          >
            {commonText.delete()}
          </Button.Danger>
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
        </>
      }
      header={commonText.delete()}
      icon={dialogIcons.warning}
      onClose={() => setTriedToDelete(false)}
    >
      {attachmentsText.deleteAttachmentDatasetWarning()}
    </Dialog>
  ) : (
    <Dialog
      buttons={
        <>
          {typeof datasetId === 'number' ? (
            <Button.Danger onClick={() => setTriedToDelete(true)}>
              {commonText.delete()}
            </Button.Danger>
          ) : null}
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
          <Submit.Blue form={id('form')}>{commonText.save()}</Submit.Blue>
        </>
      }
      header={wbText.dataSetName()}
      icon={icons.pencil}
      onClose={() => handleSave(undefined)}
    >
      <Form id={id('form')} onSubmit={() => handleSave(pendingName)}>
        <Label.Block>{statsText.name()}</Label.Block>
        <Input.Text
          required
          value={pendingName}
          onValueChange={setPendingName}
        />
      </Form>
    </Dialog>
  );
}

function SelectUploadPath({
  onCommit: handleCommit,
  currentKey,
}: {
  readonly onCommit:
    | ((commitableSpec: PartialAttachmentUploadSpec) => void)
    | undefined;
  readonly currentKey: keyof typeof staticAttachmentImportPaths | undefined;
}): JSX.Element {
  const [staticKey, setStaticKey] = React.useState<
    keyof typeof staticAttachmentImportPaths | undefined
  >(currentKey);
  const handleBlur = () => {
    if (staticKey === currentKey || staticKey === undefined || staticKey === '')
      return;
    handleCommit?.(generateUploadSpec(staticKey));
  };
  return (
    <Select
      className="w-full"
      disabled={handleCommit === undefined}
      value={staticKey}
      onBlur={handleBlur}
      onValueChange={setStaticKey}
    >
      <option value="">{attachmentsText.choosePath()}</option>
      {Object.entries(staticAttachmentImportPaths).map(
        ([value, { label }], index) => (
          <option key={index} value={value}>
            {label}
          </option>
        )
      )}
    </Select>
  );
}

function generateUploadSpec(
  staticPathKey: keyof typeof staticAttachmentImportPaths | undefined
): PartialAttachmentUploadSpec {
  if (staticPathKey === undefined) return { staticPathKey };
  const { baseTable, path } = staticAttachmentImportPaths[staticPathKey];
  const queryFieldSpec = QueryFieldSpec.fromPath(baseTable, path.split('.'));
  const field = queryFieldSpec.getField();
  const queryResultsFormatter = (
    value: number | string | null | undefined
  ): string | undefined =>
    value === undefined || value === null || field?.isRelationship
      ? undefined
      : syncFieldFormat(field, queryFieldSpec.parser, value.toString(), true);
  return {
    staticPathKey,
    formatQueryResults: queryResultsFormatter,
    fieldFormatter: field?.getUiFormatter(),
  };
}

function useEagerDataSet(
  baseDataSet: AttachmentDataSetResource<boolean>
): readonly [
  EagerDataSet,
  boolean,
  () => void,
  (
    stateGenerator: (
      oldState: AttachmentDataSetResource<boolean>
    ) => AttachmentDataSetResource<boolean>
  ) => void
] {
  const isBrandNew = !('id' in baseDataSet);
  const isReconstructed =
    baseDataSet.status !== undefined && baseDataSet.status !== null;
  const [eagerDataSet, setEagerDataSet] = React.useState<EagerDataSet>({
    ...baseDataSet,
    status:
      baseDataSet.status === 'uploading'
        ? 'uploadInterrupted'
        : baseDataSet.status === 'deleting'
        ? 'deletingInterrupted'
        : isBrandNew
        ? 'renaming'
        : undefined,
    needsSaved: isReconstructed,
    uploadableFiles: baseDataSet.uploadableFiles ?? [],
    save: false,
    uploadSpec: generateUploadSpec(baseDataSet.uploadSpec.staticPathKey),
  });

  const handleSaved = () => {
    setEagerDataSet((oldEagerState) => ({
      ...oldEagerState,
      needsSaved: false,
      save: false,
    }));
  };

  const navigate = useNavigate();
  const [isSaving, setIsSaving] = React.useState(false);
  const handleSyncedAndSaved = () => {
    setIsSaving(false);
    handleSaved();
  };
  React.useEffect(() => {
    let destructorCalled = false;
    if (eagerDataSet.needsSaved && eagerDataSet.save) {
      setIsSaving(true);
      resolveAttachmentDataSetSync(eagerDataSet).then((savedResource) => {
        if (destructorCalled || savedResource === undefined) return;
        if (isBrandNew) {
          navigate(`/specify/attachments/import/${savedResource.id}`);
        } else {
          handleSyncedAndSaved();
        }
      });
    }
    return () => {
      destructorCalled = true;
    };
  }, [eagerDataSet]);

  return [
    eagerDataSet,
    isSaving,
    () =>
      setEagerDataSet((oldEagerState) => ({
        ...oldEagerState,
        save: true,
      })),
    (stateGenerator) =>
      setEagerDataSet((oldState) => ({
        ...stateGenerator(oldState),
        needsSaved: true,
        save: oldState.save,
      })),
  ];
}

function clearSyncPromiseAndReturn<T>(data: T): T {
  syncingResourcePromise = undefined;
  return data;
}

const cleanFileBeforeSync = (
  file: UnBoundFile
): Omit<BoundFile, 'lastModified' | 'webkitRelativePath'> => ({
  size: file.size,
  name: file.name,
  parsedName: file.parsedName,
  type: file.type,
});

async function resolveAttachmentDataSetSync(rawResourceToSync: EagerDataSet) {
  const resourceId = await fetchAttachmentResourceId;
  if (resourceId === undefined) return undefined;
  const resourceToSync = removeKey(
    {
      ...rawResourceToSync,
      uploadableFiles: rawResourceToSync.uploadableFiles.map((uploadable) => ({
        ...uploadable,
        file: f.maybe(uploadable.file, cleanFileBeforeSync),
      })),
    },
    'needsSaved',
    'save'
  ) as AttachmentDataSetResource<boolean>;
  if ('id' in resourceToSync) {
    // If not creating new "resource", it is fine to PUT while not resolved.
    return ajax<AttachmentDataSetResource<true>>(
      `/attachment_gw/dataset/${resourceId}/${resourceToSync.id}/`,
      {
        headers: { Accept: 'application/json' },
        method: 'PUT',
        body: JSON.stringify(resourceToSync),
      }
    ).then(({ data }) => data);
  }
  // New resource created.
  if (syncingResourcePromise === undefined) {
    {
      syncingResourcePromise = ajax<AttachmentDataSetResource<true>>(
        `/attachment_gw/dataset/${resourceId}/`,
        {
          headers: { Accept: 'application/json' },
          method: 'POST',
          body: JSON.stringify(resourceToSync),
        }
      )
        .then(({ data }) => data)
        .then(clearSyncPromiseAndReturn);
    }
  }
  return syncingResourcePromise;
}
