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
import { Link } from '../Atoms/Link';
import { Submit } from '../Atoms/Submit';
import type { Tables } from '../DataModel/types';
import { raise } from '../Errors/Crash';
import type { UiFormatter } from '../Forms/uiFormatters';
import { contextUnlockedPromise, foreverFetch } from '../InitialContext';
import { DateElement } from '../Molecules/DateElement';
import { Dialog, LoadingScreen } from '../Molecules/Dialog';
import { FilePicker } from '../Molecules/FilePicker';
import {
  createDataResource,
  fetchResourceId,
} from '../Preferences/BasePreferences';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import { NotFoundView } from '../Router/NotFoundView';
import { OverlayContext } from '../Router/Router';
import {
  matchSelectedFiles,
  reconstructDeletingAttachment,
  reconstructUploadingAttachmentSpec,
  resolveAttachmentStatus,
  resolveFileNames,
  validateAttachmentFiles,
} from './batchUploadUtils';
import { SafeRollbackAttachmentsNew } from './DeleteStateDialog';
import { staticAttachmentImportPaths } from './importPaths';
import { ResourceDisambiguationDialog } from './ResourceDisambiguationDialog';
import type {
  BoundFile,
  CanValidate,
  PartialUploadableFileSpec,
  PostWorkUploadSpec,
  UnBoundFile,
} from './types';
import { SafeUploadAttachmentsNew } from './UploadStateDialog';

const attachmentDatasetName = 'Bulk Attachment Imports New 100';

export type AttachmentUploadSpec = {
  readonly staticPathKey: keyof typeof staticAttachmentImportPaths;
  readonly formatQueryResults: (
    value: number | string | null | undefined
  ) => string | undefined;
};
export type PartialAttachmentUploadSpec = {
  readonly fieldFormatter?: UiFormatter;
} & (AttachmentUploadSpec | { readonly staticPathKey: undefined });

type SavedDataSetResources = {
  readonly id: number;
  readonly timeStampCreated: string;
  readonly timeStampModified?: string;
};
type AttachmentDataSetResource<SAVED extends boolean> = (SAVED extends true
  ? SavedDataSetResources
  : {}) & {
  readonly name: string;
  readonly uploadableFiles: RA<PartialUploadableFileSpec>;
  readonly status?:
    | 'deleting'
    | 'deletingInterrupted'
    | 'renaming'
    | 'uploading'
    | 'uploadInterrupted'
    | 'validating';
  readonly uploadSpec: PartialAttachmentUploadSpec;
};

type FetchedDataSet =
  | (AttachmentDataSetResource<true> & {
      readonly uploadSpec: {
        readonly staticPathKey: keyof typeof staticAttachmentImportPaths;
      };
    } & (
        | {
            readonly status: 'deleting';
            readonly uploadableFiles: RA<PostWorkUploadSpec<'deleting'>>;
          }
        | {
            readonly status: 'uploading';
            readonly uploadableFiles: RA<PostWorkUploadSpec<'uploading'>>;
          }
      ))
  | (AttachmentDataSetResource<true> & { readonly status: undefined });

type AttachmentDataSetMeta = Pick<
  AttachmentDataSetResource<true>,
  'id' | 'name' | 'timeStampCreated' | 'timeStampModified'
>;

export type EagerDataSet = AttachmentDataSetResource<boolean> & {
  readonly needsSaved: boolean;
  readonly save: boolean;
};

let attachmentResourcePromise: Promise<number> | undefined = undefined;

let syncingResourcePromise:
  | Promise<AttachmentDataSetResource<true> | undefined>
  | undefined = undefined;

async function fetchAttachmentResourceId(): Promise<number | undefined> {
  const entryPoint = await contextUnlockedPromise;
  if (entryPoint === 'main') {
    if (typeof attachmentResourcePromise === 'object')
      return attachmentResourcePromise;
    attachmentResourcePromise = fetchResourceId(
      '/context/user_resource/',
      attachmentDatasetName
    ).then(async (resourceId) =>
      resourceId === undefined
        ? createDataResource(
            '/context/user_resource/',
            attachmentDatasetName,
            '[]'
          ).then(({ id }) => id)
        : Promise.resolve(resourceId)
    );
    return attachmentResourcePromise;
  } else return foreverFetch();
}

fetchAttachmentResourceId().then(f.void);

async function fetchAttachmentMappings(
  resourceId: number
): Promise<RA<AttachmentDataSetMeta>> {
  return ajax<RA<AttachmentDataSetMeta>>(
    `/attachment_gw/dataset/${resourceId}/`,
    {
      headers: { Accept: 'application/json' },
      method: 'GET',
    }
  ).then(({ data }) => data);
}

export function canValidateAttachmentDataSet(
  dataSet: EagerDataSet
): dataSet is CanValidate {
  return (
    'staticPathKey' in dataSet.uploadSpec &&
    dataSet.uploadSpec.staticPathKey !== undefined
  );
}

export function AttachmentsImportOverlay(): JSX.Element | null {
  const handleClose = React.useContext(OverlayContext);
  const navigate = useNavigate();
  const attachmentDataSetsPromise = React.useMemo(
    async () =>
      fetchAttachmentResourceId().then(async (resourceId) =>
        resourceId === undefined
          ? Promise.resolve(undefined)
          : fetchAttachmentMappings(resourceId)
      ),
    []
  );
  const [attachmentDataSets] = usePromise(attachmentDataSetsPromise, true);

  return attachmentDataSets === undefined ? null : (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          <Button.Info
            onClick={() => navigate('/specify/attachments/import/new')}
          >
            {commonText.new()}
          </Button.Info>
        </>
      }
      header={attachmentsText.attachmentImportDatasetsCount({
        count: attachmentDataSets.length,
      })}
      onClose={handleClose}
    >
      <table className="grid-table grid-cols-[repeat(3,auto)] gap-2">
        <thead>
          <tr>
            <th scope="col">{wbText.dataSetName()}</th>
            <th scope="col">{attachmentsText.timeStampCreated()}</th>
            <th scope="col">{attachmentsText.timeStampModified()}</th>
          </tr>
        </thead>
        <tbody>
          {attachmentDataSets.map((attachmentDataSet) => (
            <tr key={attachmentDataSet.id}>
              <td>
                <Link.Default
                  className="overflow-x-auto"
                  href={`/specify/attachments/import/${attachmentDataSet.id}`}
                >
                  {attachmentDataSet.name}
                </Link.Default>
              </td>
              <td>
                <DateElement date={attachmentDataSet.timeStampCreated} />
              </td>
              <td>
                {typeof attachmentDataSet.timeStampModified === 'string' ? (
                  <DateElement date={attachmentDataSet.timeStampModified} />
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Dialog>
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
        fetchAttachmentResourceId().then(async (resourceId) =>
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
        <ViewAttachFiles
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
        <ValidationDialog
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

function ValidationDialog({
  onValidated: handleValidated,
  dataSet,
}: {
  readonly onValidated: (
    validatedFiles: RA<PartialUploadableFileSpec> | undefined
  ) => void;
  readonly dataSet: CanValidate;
}): JSX.Element {
  React.useEffect(() => {
    let destructorCalled = false;
    validateAttachmentFiles(dataSet.uploadableFiles, dataSet.uploadSpec).then(
      (postValidation) => {
        if (destructorCalled) handleValidated(undefined);
        handleValidated(postValidation);
      }
    );
    return () => {
      destructorCalled = true;
    };
  }, [handleValidated, dataSet]);
  return (
    <Dialog
      buttons={
        <Button.Danger onClick={() => handleValidated(undefined)}>
          {commonText.cancel()}
        </Button.Danger>
      }
      header={wbText.validating()}
      onClose={undefined}
    >
      {wbText.validating()}
    </Dialog>
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
              fetchAttachmentResourceId().then(async (resourceId) => {
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

function ViewAttachFiles({
  uploadableFiles,
  baseTableName,
  onDisambiguation: handleDisambiguation,
}: {
  readonly uploadableFiles: RA<PartialUploadableFileSpec>;
  readonly baseTableName: keyof Tables | undefined;
  readonly onDisambiguation:
    | ((
        disambiguatedId: number,
        indexToDisambiguate: number,
        multiple: boolean
      ) => void)
    | undefined;
}): JSX.Element {
  const [disambiguationIndex, setDisambiguationIndex] = React.useState<
    number | undefined
  >(undefined);

  return (
    <>
      <table className="table-auto border-collapse border-spacing-2 border-2 border-black text-center">
        <thead>
          <tr>
            <th className="border-2 border-black">
              {attachmentsText.number()}
            </th>
            <th className="border-2 border-black">
              {commonText.selectedFileName()}
            </th>
            <th className="border-2 border-black">
              {attachmentsText.fileSize()}
            </th>
            <th className="border-2 border-black">
              {attachmentsText.fileType()}
            </th>
            <th className="border-2 border-black">
              {attachmentsText.parsedName()}
            </th>
            <th className="border-2 border-black">
              {attachmentsText.matchedId()}
            </th>
            <th className="border-2 border-black">
              {attachmentsText.status()}
            </th>
            <th className="border-2 border-black">
              {attachmentsText.attachmentID()}
            </th>
          </tr>
        </thead>
        <tbody>
          {uploadableFiles.map((uploadableFile, index) => {
            const disambiguate =
              uploadableFile.matchedId !== undefined &&
              uploadableFile.matchedId.length > 1 &&
              uploadableFile.attachmentId === undefined
                ? () => setDisambiguationIndex(index)
                : undefined;
            return (
              <tr
                className={
                  index === disambiguationIndex
                    ? 'bg-[color:var(--save-button-color)]'
                    : disambiguate === undefined
                    ? ''
                    : 'hover:bg-brand-200'
                }
                key={index}
              >
                <td className="border-2 border-black">{index + 1}</td>
                <td className="border-2 border-black">
                  {`${uploadableFile.file.name} ${
                    uploadableFile.file instanceof File
                      ? ''
                      : `(${attachmentsText.noFile()})`
                  }`}
                </td>
                <td className="border-2 border-black">
                  {uploadableFile.file.size ?? ''}
                </td>
                <td className="border-2 border-black">
                  {uploadableFile.file.type}
                </td>
                <td className="border-2 border-black">
                  {uploadableFile.file.parsedName ?? ''}
                </td>
                <td className="border-2 border-black" onClick={disambiguate}>
                  {uploadableFile.matchedId === undefined
                    ? ''
                    : uploadableFile.matchedId.length === 0
                    ? 'No Match'
                    : uploadableFile.matchedId.length > 1
                    ? uploadableFile.disambiguated === undefined
                      ? 'Multiple Matches'
                      : uploadableFile.disambiguated
                    : uploadableFile.matchedId[0]}
                </td>
                <td className="border-2 border-black">
                  {f.maybe(uploadableFile.status, resolveAttachmentStatus) ??
                    ''}
                </td>
                <td className="border-2 border-black">
                  {uploadableFile.attachmentId ?? ''}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {typeof disambiguationIndex === 'number' &&
      typeof handleDisambiguation === 'function' &&
      baseTableName !== undefined ? (
        <ResourceDisambiguationDialog
          baseTable={baseTableName}
          handleAllResolve={(resourceId) => {
            handleDisambiguation(resourceId, disambiguationIndex, true);
            setDisambiguationIndex(undefined);
          }}
          handleResolve={(resourceId) => {
            handleDisambiguation(resourceId, disambiguationIndex, false);
            setDisambiguationIndex(undefined);
          }}
          previousSelected={uploadableFiles[disambiguationIndex].disambiguated}
          resourcesToResolve={uploadableFiles[disambiguationIndex].matchedId!}
          onClose={() => setDisambiguationIndex(undefined)}
        />
      ) : undefined}
    </>
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

export async function resolveAttachmentDataSetSync(
  rawResourceToSync: EagerDataSet
) {
  const resourceId = await fetchAttachmentResourceId();
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
