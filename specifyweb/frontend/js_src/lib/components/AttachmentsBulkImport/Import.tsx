import React from 'react';
import { useParams } from 'react-router-dom';

import { usePromise } from '../../hooks/useAsyncState';
import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import { ajax } from '../../utils/ajax';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import type { UiFormatter } from '../Forms/uiFormatters';
import { Dialog, LoadingScreen } from '../Molecules/Dialog';
import { FilePicker } from '../Molecules/FilePicker';
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
  CanValidate,
  PartialUploadableFileSpec,
  AttachmentDataSetResource,
  FetchedDataSet,
  UnBoundFile,
} from './types';
import { SafeUploadAttachmentsNew } from './AttachmentsUpload';
import { ViewAttachmentFiles } from './ViewAttachmentFiles';
import { AttachmentsValidationDialog } from './AttachmentsValidationDialog';
import { fetchAttachmentResourceId } from './fetchAttachmentResource';
import { RenameAttachmentDataSetDialog } from './RenameAttachmentDataSet';
import { useEagerDataSet } from './useEagerDataset';
import { SelectUploadPath } from './SelectUploadPath';

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
