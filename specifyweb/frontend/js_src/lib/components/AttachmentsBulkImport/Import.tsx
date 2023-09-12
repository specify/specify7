import React from 'react';
import { useParams } from 'react-router-dom';

import { usePromise } from '../../hooks/useAsyncState';
import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import { ajax } from '../../utils/ajax';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { Container } from '../Atoms';
import { Button } from '../Atoms/Button';
import type { UiFormatter } from '../Forms/uiFormatters';
import { Dialog, LoadingScreen } from '../Molecules/Dialog';
import { FilePicker } from '../Molecules/FilePicker';
import { NotFoundView } from '../Router/NotFoundView';
import { SafeRollbackAttachmentsNew } from './AttachmentsRollback';
import { SafeUploadAttachmentsNew } from './AttachmentsUpload';
import { AttachmentsValidationDialog } from './AttachmentsValidationDialog';
import { fetchAttachmentResourceId } from './fetchAttachmentResource';
import { staticAttachmentImportPaths } from './importPaths';
import { RenameAttachmentDataSetDialog } from './RenameAttachmentDataSet';
import { SelectUploadPath } from './SelectUploadPath';
import type {
  AttachmentDataSetResource,
  CanValidate,
  FetchedDataSet,
  PartialUploadableFileSpec,
  UnBoundFile,
} from './types';
import { useEagerDataSet } from './useEagerDataset';
import {
  matchSelectedFiles,
  reconstructDeletingAttachment,
  reconstructUploadingAttachmentSpec,
  resolveFileNames,
} from './utils';
import { ViewAttachmentFiles } from './ViewAttachmentFiles';
import { MappingPath } from '../WbPlanView/Mapper';
import { TableIcon } from '../Molecules/TableIcon';

export type AttachmentUploadSpec = {
  readonly staticPathKey: keyof typeof staticAttachmentImportPaths;
  readonly formatQueryResults: (
    value: number | string | null | undefined
  ) => string | undefined;
  readonly mappingPath: MappingPath;
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

const newAttachmentDataSetResource: AttachmentDataSetResource<false> = {
  name: attachmentsText.newAttachmentDataset(),
  uploadableFiles: [],
  uploadSpec: { staticPathKey: undefined },
};
export function NewAttachmentImport(): JSX.Element | null {
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
    <AttachmentImportByIdSafe id={attachmentId} />
  ) : (
    <NotFoundView />
  );
}

function AttachmentImportByIdSafe({
  id,
}: {
  readonly id: number;
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
                `/attachment_gw/dataset/${resourceId}/${id}/`,
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
      [id]
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
  const [eagerDataSet, isSaving, isBrandNew, triggerSave, commitChange] =
    useEagerDataSet(attachmentDataSetResource);

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
    // Reset all parsed names if matching path is changes
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
  const handleFilesSelected = React.useCallback(
    (files: FileList) => {
      const filesList = Array.from(files).map(applyFileNames);
      commitChange((oldState) => ({
        ...oldState,
        status: undefined,
        uploadableFiles: matchSelectedFiles(
          oldState.uploadableFiles,
          filesList
        ),
      }));
    },
    [commitChange]
  );
  return (
    <Container.FullGray className="h-fit flex-row">
      <div className="align-center flex h-fit flex-row justify-between gap-2">
        <div className="flex flex-row gap-2">
          {currentBaseTable && (
            <div className="flex flex-1 items-center">
              <TableIcon label name={currentBaseTable} />
            </div>
          )}
          <div className="min-w-fit self-center">{eagerDataSet.name}</div>
          <Button.Icon
            title={commonText.edit()}
            onClick={() => commitStatusChange('renaming')}
            icon="pencil"
          />
          <FilePicker
            acceptedFormats={undefined}
            disabled={isBrandNew}
            showFileNames={false}
            onFilesSelected={handleFilesSelected}
          />
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
        </div>
        <div className="flex flex-row gap-2">
          <Button.BorderedGray
            disabled={
              !eagerDataSet.uploadableFiles.some(
                ({ file }) => file?.parsedName !== undefined
              ) || !canValidateAttachmentDataSet(eagerDataSet)
            }
            onClick={() => commitStatusChange('validating')}
          >
            {wbText.validate()}
          </Button.BorderedGray>
          <Button.BorderedGray
            disabled={!eagerDataSet.needsSaved}
            onClick={triggerSave}
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

      <ViewAttachmentFiles
        baseTableName={currentBaseTable}
        uploadableFiles={eagerDataSet.uploadableFiles}
        uploadSpec={eagerDataSet.uploadSpec}
        onDisambiguation={(disambiguatedId, indexToDisambiguate, multiple) =>
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
          })
        }
        onFilesDropped={isBrandNew ? undefined : handleFilesSelected}
      />

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
      {isSaving && <LoadingScreen />}
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
    </Container.FullGray>
  );
}
