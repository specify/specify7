import React from 'react';
import { Form, Input, Label, Select } from '../Atoms/Form';
import { useId } from '../../hooks/useId';

import { FilePicker } from '../Molecules/FilePicker';
import { className } from '../Atoms/className';
import { Button } from '../Atoms/Button';
import { Submit } from '../Atoms/Submit';
import { wbText } from '../../localization/workbench';
import {
  matchSelectedFiles,
  reconstructDeletingAttachment,
  reconstructUploadingAttachmentSpec,
  resolveAttachmentStatus,
  resolveFileNames,
  validateAttachmentFiles,
} from './batchUploadUtils';
import {
  BoundFile,
  CanValidate,
  PartialUploadableFileSpec,
  PostWorkUploadSpec,
  UnBoundFile,
} from './types';
import { SafeUploadAttachmentsNew } from './UploadStateDialog';
import { attachmentsText } from '../../localization/attachments';
import { staticAttachmentImportPaths } from './importPaths';
import { UiFormatter } from '../Forms/uiFormatters';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import { syncFieldFormat } from '../../utils/fieldFormat';
import { RA } from '../../utils/types';
import { Dialog, LoadingScreen } from '../Molecules/Dialog';
import { commonText } from '../../localization/common';
import { SafeRollbackAttachmentsNew } from './DeleteStateDialog';
import { ResourceDisambiguationDialog } from './ResourceDisambiguationDialog';
import {
  createDataResource,
  fetchResourceId,
} from '../Preferences/BasePreferences';
import { ajax } from '../../utils/ajax';
import { contextUnlockedPromise, foreverFetch } from '../InitialContext';
import { f } from '../../utils/functools';
import { usePromise } from '../../hooks/useAsyncState';
import { Link } from '../Atoms/Link';
import { DateElement } from '../Molecules/DateElement';
import { OverlayContext } from '../Router/Router';
import { useNavigate, useParams } from 'react-router-dom';
import { Tables } from '../DataModel/types';
import { NotFoundView } from '../Router/NotFoundView';
import { removeKey } from '../../utils/utils';
import { dialogIcons, icons } from '../Atoms/Icons';
import { statsText } from '../../localization/stats';
import { raise } from '../Errors/Crash';
import { Http } from '../../utils/ajax/definitions';

const attachmentDatasetName = 'Bulk Attachment Imports New 100';

export type AttachmentUploadSpec = {
  readonly staticPathKey: keyof typeof staticAttachmentImportPaths;
  readonly formatQueryResults: (
    value: string | null | undefined | number
  ) => string | undefined;
};
export type PartialAttachmentUploadSpec = {
  readonly fieldFormatter?: UiFormatter;
} & ({ readonly staticPathKey: undefined } | AttachmentUploadSpec);

type SavedDataSetResources = {
  readonly id: number;
  readonly timeStampCreated: string;
  readonly timeStampModified?: string;
};
type AttachmentDataSetResource<SAVED extends boolean> = {
  readonly name: string;
  readonly uploadableFiles: RA<PartialUploadableFileSpec>;
  readonly status?:
    | 'uploading'
    | 'deleting'
    | 'validating'
    | 'renaming'
    | 'uploadInterrupted'
    | 'deletingInterrupted';
  readonly uploadSpec: PartialAttachmentUploadSpec;
} & (SAVED extends true ? SavedDataSetResources : {});

type FetchedDataSet =
  | (AttachmentDataSetResource<true> & { readonly status: undefined })
  | (AttachmentDataSetResource<true> & {
      readonly uploadSpec: {
        readonly staticPathKey: keyof typeof staticAttachmentImportPaths;
      };
    } & (
        | {
            readonly status: 'uploading';
            readonly uploadableFiles: RA<PostWorkUploadSpec<'uploading'>>;
          }
        | {
            readonly status: 'deleting';
            readonly uploadableFiles: RA<PostWorkUploadSpec<'deleting'>>;
          }
      ));

type AttachmentDataSetMeta = Pick<
  AttachmentDataSetResource<true>,
  'name' | 'timeStampCreated' | 'timeStampModified' | 'id'
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
    ).then((resourceId) => {
      return resourceId === undefined
        ? createDataResource(
            '/context/user_resource/',
            attachmentDatasetName,
            '[]'
          ).then(({ id }) => id)
        : Promise.resolve(resourceId);
    });
    return attachmentResourcePromise;
  } else return foreverFetch();
}

fetchAttachmentResourceId().then(f.void);

function fetchAttachmentMappings(
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
    () =>
      fetchAttachmentResourceId().then((resourceId) =>
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
                  href={`/specify/attachments/import/${attachmentDataSet.id}`}
                  className="overflow-x-auto"
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
      () =>
        fetchAttachmentResourceId().then((resourceId) =>
          resourceId === undefined
            ? undefined
            : ajax<FetchedDataSet>(
                `/attachment_gw/dataset/${resourceId}/${attachmentDataSetId}/`,
                {
                  headers: { Accept: 'application/json' },
                  method: 'GET',
                }
              ).then(({ data }) => {
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

  const prevKeyRef = React.useRef(
    attachmentDataSetResource.uploadSpec.staticPathKey
  );
  React.useEffect(() => {
    //Reset all parsed names if matching path is changeds
    if (prevKeyRef.current !== eagerDataSet.uploadSpec.staticPathKey) {
      prevKeyRef.current = eagerDataSet.uploadSpec.staticPathKey;
      commitFileChange((files) =>
        files.map((file) => applyFileNames(file.file))
      );
    }
  }, [applyFileNames, commitFileChange]);

  const currentBaseTable =
    eagerDataSet.uploadSpec.staticPathKey !== undefined
      ? staticAttachmentImportPaths[eagerDataSet.uploadSpec.staticPathKey]
          .baseTable
      : undefined;

  const anyUploaded = eagerDataSet.uploadableFiles.some(
    (uploadable) => uploadable.attachmentId !== undefined
  );
  return (
    <div className={`${className.containerFullGray} flex-cols h-fit`}>
      <div className="align-center flex-col-2 flex h-[1.5em] gap-2">
        {eagerDataSet.name}
        {
          <Button.Icon
            title={commonText.edit()}
            icon={'pencil'}
            onClick={() => commitStatusChange('renaming')}
          />
        }
      </div>
      <div className="flex h-fit">
        <div className="flex flex-1 gap-2">
          <div className="max-w-2 flex">
            <FilePicker
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
              acceptedFormats={undefined}
            />
          </div>
          <SelectUploadPath
            onCommit={
              anyUploaded
                ? undefined
                : (uploadSpec) => {
                    commitChange((oldState) => ({
                      ...oldState,
                      uploadSpec: uploadSpec,
                    }));
                  }
            }
            currentKey={eagerDataSet?.uploadSpec.staticPathKey}
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
              dataSet={eagerDataSet}
              onSync={(generatedState, isSyncing) => {
                commitChange((oldState) => ({
                  ...oldState,
                  status: isSyncing ? 'uploading' : undefined,
                  uploadableFiles: generatedState ?? oldState.uploadableFiles,
                }));
                triggerSave();
              }}
              baseTableName={currentBaseTable}
            />
            <SafeRollbackAttachmentsNew
              dataSet={eagerDataSet}
              baseTableName={currentBaseTable}
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
          uploadableFiles={eagerDataSet.uploadableFiles}
          baseTableName={currentBaseTable}
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
          onValidated={(validatedFiles) => {
            if (validatedFiles !== undefined) {
              commitChange((oldState) => ({
                ...oldState,
                status: undefined,
                uploadableFiles: validatedFiles,
              }));
            }
          }}
          dataSet={eagerDataSet}
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
          header={attachmentsText.uploadInterrupted()}
          buttons={
            <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          }
          onClose={() => {
            commitStatusChange(undefined);
            triggerSave();
          }}
        >
          {attachmentsText.uploadInterruptedDescription()}
        </Dialog>
      ) : eagerDataSet.status === 'deletingInterrupted' ? (
        <Dialog
          header={attachmentsText.rollbackInterrupted()}
          buttons={
            <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          }
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
      header={commonText.delete()}
      onClose={() => setTriedToDelete(false)}
      icon={dialogIcons.warning}
      buttons={
        <>
          <Button.Danger
            onClick={() => {
              fetchAttachmentResourceId().then((resourceId) => {
                if (resourceId === undefined) {
                  raise(
                    new Error('Trying to delete from non existent app resource')
                  );
                  return;
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
    >
      {attachmentsText.deleteAttachmentDatasetWarning()}
    </Dialog>
  ) : (
    <Dialog
      header={wbText.dataSetName()}
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
      onClose={() => handleSave(undefined)}
      icon={icons.pencil}
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
            <th className={'border-2 border-black'}>
              {attachmentsText.number()}
            </th>
            <th className={'border-2 border-black'}>
              {commonText.selectedFileName()}
            </th>
            <th className={'border-2 border-black'}>
              {attachmentsText.fileSize()}
            </th>
            <th className={'border-2 border-black'}>
              {attachmentsText.fileType()}
            </th>
            <th className={'border-2 border-black'}>
              {attachmentsText.parsedName()}
            </th>
            <th className={'border-2 border-black'}>
              {attachmentsText.matchedId()}
            </th>
            <th className={'border-2 border-black'}>
              {attachmentsText.status()}
            </th>
            <th className={'border-2 border-black'}>
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
                key={index}
                className={
                  index === disambiguationIndex
                    ? 'bg-[color:var(--save-button-color)]'
                    : disambiguate !== undefined
                    ? 'hover:bg-brand-200'
                    : ''
                }
              >
                <td className={'border-2 border-black'}>{index + 1}</td>
                <td className={'border-2 border-black'}>
                  {`${uploadableFile.file.name} ${
                    uploadableFile.file instanceof File
                      ? ''
                      : `(${attachmentsText.noFile()})`
                  }`}
                </td>
                <td className={'border-2 border-black'}>
                  {uploadableFile.file.size ?? ''}
                </td>
                <td className={'border-2 border-black'}>
                  {uploadableFile.file.type}
                </td>
                <td className={'border-2 border-black'}>
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
                <td className={'border-2 border-black'}>
                  {f.maybe(uploadableFile.status, resolveAttachmentStatus) ??
                    ''}
                </td>
                <td className={'border-2 border-black'}>
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
          resourcesToResolve={uploadableFiles[disambiguationIndex].matchedId!}
          previousSelected={uploadableFiles[disambiguationIndex].disambiguated}
          handleResolve={(resourceId) => {
            handleDisambiguation(resourceId, disambiguationIndex, false);
            setDisambiguationIndex(undefined);
          }}
          handleAllResolve={(resourceId) => {
            handleDisambiguation(resourceId, disambiguationIndex, true);
            setDisambiguationIndex(undefined);
          }}
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
      onValueChange={setStaticKey}
      onBlur={handleBlur}
      value={staticKey}
      disabled={handleCommit === undefined}
      className="w-full"
    >
      <option value={''}>{attachmentsText.choosePath()}</option>
      {Object.entries(staticAttachmentImportPaths).map(
        ([value, { label }], index) => (
          <option value={value} key={index}>
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
    value: string | null | undefined | number
  ): string | undefined =>
    value === undefined || value === null || field?.isRelationship
      ? undefined
      : syncFieldFormat(field, queryFieldSpec.parser, value.toString(), true);
  return {
    staticPathKey: staticPathKey,
    formatQueryResults: queryResultsFormatter,
    fieldFormatter: field?.getUiFormatter(),
  };
}

function useEagerDataSet(
  baseDataSet: AttachmentDataSetResource<boolean>
): [
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
): Omit<BoundFile, 'lastModified' | 'webkitRelativePath'> => {
  return {
    size: file.size,
    name: file.name,
    parsedName: file.parsedName,
    type: file.type,
  };
};

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
