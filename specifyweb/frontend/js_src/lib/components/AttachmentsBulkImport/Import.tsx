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
import { TableIcon } from '../Molecules/TableIcon';
import { NotFoundView } from '../Router/NotFoundView';
import { staticAttachmentImportPaths } from './importPaths';
import { RenameAttachmentDataSetDialog } from './RenameDataSet';
import { SafeRollbackAttachmentsNew } from './Rollback';
import { SelectUploadPath } from './SelectUploadPath';
import type {
  AttachmentDataSetResource,
  FetchedDataSet,
  PartialUploadableFileSpec,
  SavedAttachmentDataSetResource,
  UnBoundFile,
} from './types';
import { SafeUploadAttachmentsNew } from './Upload';
import { useEagerDataSet } from './useEagerDataset';
import {
  matchSelectedFiles,
  reconstructDeletingAttachment,
  reconstructUploadingAttachmentSpec,
  resolveFileNames,
} from './utils';
import { AttachmentsValidationDialog } from './ValidationDialog';
import { ViewAttachmentFiles } from './ViewAttachmentFiles';

export type AttachmentUploadSpec = {
  readonly staticPathKey: keyof typeof staticAttachmentImportPaths;
  readonly formatQueryResults: (
    value: number | string | null | undefined
  ) => string | undefined;
};
export type PartialAttachmentUploadSpec = {
  readonly fieldFormatter?: UiFormatter;
} & (AttachmentUploadSpec | { readonly staticPathKey: undefined });

type AttachmentDataSet =
  | AttachmentDataSetResource
  | SavedAttachmentDataSetResource;
export type EagerDataSet = AttachmentDataSet & {
  readonly needsSaved: boolean;
  readonly save: boolean;
};

const newAttachmentDataSetResource: AttachmentDataSetResource = {
  name: attachmentsText.newAttachmentDataset(),
  rows: [],
  uploadplan: { staticPathKey: undefined },
  uploaderstatus: 'main',
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
    SavedAttachmentDataSetResource | undefined
  >(
    React.useMemo(
      async () =>
        ajax<FetchedDataSet>(`/attachment_gw/dataset/${id}/`, {
          headers: { Accept: 'application/json' },
          method: 'GET',
        }).then(async ({ data }) => {
          if (data.uploaderstatus === 'main') return data;
          const reconstructFunction =
            data.uploaderstatus === 'uploading'
              ? reconstructUploadingAttachmentSpec
              : reconstructDeletingAttachment;
          return reconstructFunction(
            data.uploadplan.staticPathKey,
            data.rows
          ).then((returnFiles) => ({
            ...data,
            rows: returnFiles,
          }));
        }),

      [id]
    ),
    true
  );
  return attachmentDataSet === undefined ? null : (
    <AttachmentsImport attachmentDataSetResource={attachmentDataSet} />
  );
}

function AttachmentsImport<DATASET extends AttachmentDataSet>({
  attachmentDataSetResource,
}: {
  readonly attachmentDataSetResource: DATASET;
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
      rows: newUploadables(oldState.rows),
    }));

  const commitStatusChange = (newState: AttachmentDataSet['uploaderstatus']) =>
    commitChange((oldState) => ({ ...oldState, uploaderstatus: newState }));

  const applyFileNames = React.useCallback(
    (file: UnBoundFile): PartialUploadableFileSpec =>
      eagerDataSet.uploadplan.staticPathKey === undefined
        ? { file }
        : resolveFileNames(
            file,
            eagerDataSet.uploadplan.formatQueryResults,
            eagerDataSet.uploadplan.fieldFormatter
          ),
    [eagerDataSet.uploadplan.staticPathKey]
  );

  const previousKeyRef = React.useRef(
    attachmentDataSetResource.uploadplan.staticPathKey
  );
  React.useEffect(() => {
    // Reset all parsed names if matching path is changes
    if (previousKeyRef.current !== eagerDataSet.uploadplan.staticPathKey) {
      previousKeyRef.current = eagerDataSet.uploadplan.staticPathKey;
      commitFileChange((files) =>
        files.map((file) => applyFileNames(file.file))
      );
    }
  }, [applyFileNames, commitFileChange]);

  const currentBaseTable =
    eagerDataSet.uploadplan.staticPathKey === undefined
      ? undefined
      : staticAttachmentImportPaths[eagerDataSet.uploadplan.staticPathKey]
          .baseTable;

  const anyUploaded = eagerDataSet.rows.some(
    (uploadable) => uploadable.attachmentId !== undefined
  );
  const handleFilesSelected = React.useCallback(
    (files: FileList) => {
      const filesList = Array.from(files).map(applyFileNames);
      commitChange((oldState) => ({
        ...oldState,
        uploaderstatus: 'main',
        rows: matchSelectedFiles(oldState.rows, filesList),
      }));
    },
    [applyFileNames, commitChange]
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
            icon="pencil"
            title={commonText.edit()}
            onClick={() => commitStatusChange('renaming')}
          />
          <FilePicker
            acceptedFormats={undefined}
            disabled={isBrandNew}
            showFileNames={false}
            onFilesSelected={handleFilesSelected}
          />
          <SelectUploadPath
            currentKey={eagerDataSet?.uploadplan.staticPathKey}
            onCommit={
              anyUploaded
                ? undefined
                : (uploadSpec) => {
                    commitChange((oldState) => ({
                      ...oldState,
                      uploadplan: uploadSpec,
                    }));
                  }
            }
          />
        </div>
        <div className="flex flex-row gap-2">
          {currentBaseTable !== undefined && (
            <Button.BorderedGray
              disabled={
                !eagerDataSet.rows.some(
                  ({ file }) => file?.parsedName !== undefined
                )
              }
              onClick={() => commitStatusChange('validating')}
            >
              {wbText.validate()}
            </Button.BorderedGray>
          )}
          <Button.Save
            disabled={!eagerDataSet.needsSaved}
            onClick={triggerSave}
          >
            {commonText.save()}
          </Button.Save>
          {currentBaseTable !== undefined && (
            <SafeUploadAttachmentsNew
              baseTableName={currentBaseTable}
              dataSet={eagerDataSet}
              onSync={(generatedState, isSyncing) => {
                commitChange((oldState) => ({
                  ...oldState,
                  uploaderstatus: isSyncing ? 'uploading' : 'main',
                  rows: generatedState ?? oldState.rows,
                }));
                triggerSave();
              }}
            />
          )}
          {currentBaseTable !== undefined && (
            <SafeRollbackAttachmentsNew
              baseTableName={currentBaseTable}
              dataSet={eagerDataSet}
              onSync={(generatedState, isSyncing) => {
                commitChange((oldState) => ({
                  ...oldState,
                  uploaderstatus: isSyncing ? 'deleting' : 'main',
                  rows: generatedState ?? oldState.rows,
                }));
                triggerSave();
              }}
            />
          )}
        </div>
      </div>

      <ViewAttachmentFiles
        baseTableName={currentBaseTable}
        uploadableFiles={eagerDataSet.rows}
        uploadSpec={eagerDataSet.uploadplan}
        onDisambiguation={(disambiguatedId, indexToDisambiguate, multiple) =>
          commitChange((oldState) => {
            const parsedName =
              oldState.rows[indexToDisambiguate].file?.parsedName;
            return {
              ...oldState,
              rows: oldState.rows.map((uploadable, index) =>
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

      {eagerDataSet.uploaderstatus === 'validating' &&
      eagerDataSet.uploadplan.staticPathKey !== undefined ? (
        <AttachmentsValidationDialog
          files={eagerDataSet.rows}
          uploadSpec={eagerDataSet.uploadplan}
          onValidated={(validatedFiles) =>
            validatedFiles === undefined
              ? undefined
              : commitChange((oldState) => ({
                  ...oldState,
                  uploaderstatus: 'main',
                  rows: validatedFiles,
                }))
          }
        />
      ) : null}
      {eagerDataSet.uploaderstatus === 'renaming' && (
        <RenameAttachmentDataSetDialog
          attachmentDataSetName={eagerDataSet.name}
          datasetId={'id' in eagerDataSet ? eagerDataSet.id : undefined}
          onClose={() =>
            commitChange((state) => ({ ...state, uploaderstatus: 'main' }))
          }
          onRename={(newName) => {
            commitChange((oldState) => ({ ...oldState, name: newName }));
            triggerSave();
          }}
        />
      )}
      {isSaving && <LoadingScreen />}
      {eagerDataSet.uploaderstatus === 'uploadInterrupted' ? (
        <Dialog
          buttons={
            <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          }
          header={attachmentsText.uploadInterrupted()}
          onClose={() => {
            commitStatusChange('main');
            triggerSave();
          }}
        >
          {attachmentsText.uploadInterruptedDescription()}
        </Dialog>
      ) : eagerDataSet.uploaderstatus === 'deletingInterrupted' ? (
        <Dialog
          buttons={
            <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          }
          header={attachmentsText.rollbackInterrupted()}
          onClose={() => {
            commitStatusChange('main');
            triggerSave();
          }}
        >
          {attachmentsText.rollbackInterruptedDescription()}
        </Dialog>
      ) : null}
    </Container.FullGray>
  );
}
