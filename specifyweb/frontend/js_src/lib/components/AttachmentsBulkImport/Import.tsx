import React from 'react';
import { useParams } from 'react-router-dom';
import type { LocalizedString } from 'typesafe-i18n';

import { usePromise } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useErrorContext } from '../../hooks/useErrorContext';
import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { userText } from '../../localization/user';
import { wbText } from '../../localization/workbench';
import { ajax } from '../../utils/ajax';
import { f } from '../../utils/functools';
import type { RA, WritableArray } from '../../utils/types';
import type { IR } from '../../utils/types';
import { removeKey, sortFunction } from '../../utils/utils';
import { Container } from '../Atoms';
import { Button } from '../Atoms/Button';
import { strictGetTable } from '../DataModel/tables';
import type { UiFormatter } from '../FieldFormatters';
import { Dialog } from '../Molecules/Dialog';
import { FilePicker } from '../Molecules/FilePicker';
import { TableIcon } from '../Molecules/TableIcon';
import { hasPermission } from '../Permissions/helpers';
import { NotFoundView } from '../Router/NotFoundView';
import { staticAttachmentImportPaths } from './importPaths';
import { AttachmentDatasetMeta } from './RenameDataSet';
import { AttachmentRollback } from './Rollback';
import { SelectUploadPath } from './SelectUploadPath';
import type {
  AttachmentDataSet,
  FetchedDataSet,
  PartialUploadableFileSpec,
  UnBoundFile,
} from './types';
import { AttachmentUpload } from './Upload';
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

export type EagerDataSet = Omit<AttachmentDataSet, 'uploadresult'> & {
  readonly needsSaved: boolean;
  readonly save: boolean;
} & {
  readonly uploadresult?: {
    readonly timestamp: string;
    // Success is inferred on the front-end, rather than backend.
    readonly success: boolean;
  };
};

export function AttachmentImportById(): JSX.Element | null {
  const { id } = useParams();
  const attachmentId = f.parseInt(id);
  return typeof attachmentId === 'number' ? (
    <AttachmentImportByIdSafe id={attachmentId} />
  ) : (
    <NotFoundView />
  );
}

export const fetchAndReconstructAttachmentDataset = async (id: number) =>
  ajax<FetchedDataSet>(`/attachment_gw/dataset/${id}/`, {
    headers: { Accept: 'application/json' },
    method: 'GET',
  }).then(async ({ data }) => {
    if (data.uploaderstatus === 'main') return data;
    const reconstructFunction =
      data.uploaderstatus === 'uploading'
        ? reconstructUploadingAttachmentSpec
        : reconstructDeletingAttachment;
    return reconstructFunction(data.uploadplan.staticPathKey, data.rows).then(
      (returnFiles) => ({
        ...data,
        rows: returnFiles,
      })
    );
  });

function AttachmentImportByIdSafe({
  id,
}: {
  readonly id: number;
}): JSX.Element | null {
  const [attachmentDataSet] = usePromise<AttachmentDataSet | undefined>(
    React.useMemo(async () => fetchAndReconstructAttachmentDataset(id), [id]),
    true
  );
  return attachmentDataSet === undefined ? null : (
    <AttachmentsImport attachmentDataSetResource={attachmentDataSet} />
  );
}

function AttachmentsImport({
  attachmentDataSetResource,
}: {
  readonly attachmentDataSetResource: AttachmentDataSet;
}): JSX.Element | null {
  const { eagerDataSet, triggerSave, commitChange, unsetUnloadProtect } =
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
    commitChange(
      (oldState) => ({ ...oldState, uploaderstatus: newState }),
      newState === 'validating'
    );

  const applyFileNames = React.useCallback(
    (file: UnBoundFile): PartialUploadableFileSpec =>
      eagerDataSet.uploadplan.staticPathKey === undefined
        ? { uploadFile: file }
        : {
            uploadFile: {
              ...file,
              parsedName: resolveFileNames(
                file.file.name,
                eagerDataSet.uploadplan.formatQueryResults,
                eagerDataSet.uploadplan.fieldFormatter
              ),
            },
          },
    [eagerDataSet.uploadplan.staticPathKey]
  );

  const previousKeyRef = React.useRef(
    attachmentDataSetResource.uploadplan.staticPathKey
  );
  React.useEffect(() => {
    // Reset all parsed names if matching path is changed
    if (previousKeyRef.current !== eagerDataSet.uploadplan.staticPathKey) {
      previousKeyRef.current = eagerDataSet.uploadplan.staticPathKey;
      commitFileChange((files) =>
        files.map(({ uploadFile }) => applyFileNames(uploadFile))
      );
    }
  }, [applyFileNames, commitFileChange]);

  const currentBaseTable =
    eagerDataSet.uploadplan.staticPathKey === undefined
      ? undefined
      : staticAttachmentImportPaths[eagerDataSet.uploadplan.staticPathKey]
          .baseTable;

  const anyUploaded = React.useMemo(
    () =>
      eagerDataSet.rows.some(
        (uploadable) => uploadable.attachmentId !== undefined
      ),
    [eagerDataSet.uploaderstatus]
  );

  const handleFilesSelected = (files: FileList) => {
    const filesList = Array.from(files, (file) => applyFileNames({ file }));
    const oldRows = eagerDataSet.rows;
    const { resolvedFiles, duplicateFiles } = matchSelectedFiles(
      oldRows,
      filesList
    );
    (resolvedFiles as WritableArray<PartialUploadableFileSpec>).sort(
      sortFunction((file) => file.uploadFile.file.name)
    );
    commitChange((oldState) => ({
      ...oldState,
      uploaderstatus: 'main',
      rows: resolvedFiles,
    }));
    setDuplicatedFiles(duplicateFiles);
  };

  const [isRenaming, openRenaming, closeRenaming] = useBooleanState(false);

  const [duplicatesFiles, setDuplicatedFiles] = React.useState<
    RA<PartialUploadableFileSpec>
  >([]);

  const mainHeaders = React.useMemo(() => {
    let headers: IR<JSX.Element | LocalizedString> = {
      selectedFileName: commonText.selectedFileName(),
      fileSize: attachmentsText.fileSize(),
      record: (
        <div className="flex min-w-fit items-center gap-2">
          {currentBaseTable === undefined ? (
            userText.resource()
          ) : (
            <>
              <TableIcon label name={currentBaseTable} />
              {eagerDataSet.uploadplan.staticPathKey === undefined
                ? ''
                : strictGetTable(currentBaseTable).strictGetField(
                    staticAttachmentImportPaths[
                      eagerDataSet.uploadplan.staticPathKey
                    ].path
                  ).label}
            </>
          )}
        </div>
      ),
      progress: attachmentsText.progress(),
    };
    if (process.env.NODE_ENV === 'development')
      headers = { ...headers, attachmentId: attachmentsText.attachmentId() };
    return headers;
  }, [eagerDataSet.uploadplan.staticPathKey]);

  const errorContextData = React.useMemo(
    () => ({
      currentDataSet: eagerDataSet,
      fetchedStatus: attachmentDataSetResource.uploaderstatus,
    }),
    [eagerDataSet.rows, eagerDataSet.uploaderstatus, eagerDataSet.uploadplan]
  );

  useErrorContext('bulkAttachmentImport', errorContextData);

  return (
    <Container.FullGray className="!h-full flex-row overflow-auto">
      <div className="has-alt-background align-center flex h-fit flex-row flex-wrap justify-between gap-2 overflow-auto">
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
            onClick={openRenaming}
          />

          <FilePicker
            acceptedFormats={undefined}
            containerClassName="min-w-fit"
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
          <Button.BorderedGray
            disabled={
              currentBaseTable === undefined ||
              !eagerDataSet.rows.some(
                ({ uploadFile }) => uploadFile.parsedName !== undefined
                // FEATURE: Allow validating without needing saved
              ) ||
              eagerDataSet.needsSaved
            }
            onClick={() => commitStatusChange('validating')}
          >
            {wbText.validate()}
          </Button.BorderedGray>

          {hasPermission('/attachment_import/dataset', 'update') && (
            <Button.Save
              disabled={!eagerDataSet.needsSaved}
              onClick={triggerSave}
            >
              {commonText.save()}
            </Button.Save>
          )}

          <AttachmentUpload
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

          <AttachmentRollback
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
        </div>
      </div>

      <ViewAttachmentFiles
        baseTableName={currentBaseTable}
        headers={mainHeaders}
        uploadableFiles={eagerDataSet.rows}
        uploadSpec={eagerDataSet.uploadplan}
        onDisambiguation={(disambiguatedId, indexToDisambiguate, multiple) =>
          commitChange((oldState) => {
            const parsedName =
              oldState.rows[indexToDisambiguate].uploadFile?.parsedName;
            return {
              ...oldState,
              rows: oldState.rows.map((uploadable, index) =>
                parsedName !== undefined &&
                (multiple || index === indexToDisambiguate) &&
                // Redundant check for single disambiguation, but needed for disambiguate multiples
                parsedName === uploadable.uploadFile?.parsedName &&
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
        onFilesDropped={handleFilesSelected}
      />

      {eagerDataSet.uploaderstatus === 'validating' &&
      eagerDataSet.uploadplan.staticPathKey !== undefined ? (
        <AttachmentsValidationDialog
          files={eagerDataSet.rows}
          uploadSpec={eagerDataSet.uploadplan}
          onValidated={(validatedFiles) =>
            validatedFiles === undefined
              ? undefined
              : commitChange(
                  (oldState) => ({
                    ...oldState,
                    uploaderstatus: 'main',
                    rows: validatedFiles,
                  }),
                  true
                )
          }
        />
      ) : null}
      {isRenaming && (
        <AttachmentDatasetMeta
          dataset={eagerDataSet}
          unsetUnloadProtect={unsetUnloadProtect}
          onChange={(changed) => {
            commitChange((oldState) => ({ ...oldState, ...changed }));
            triggerSave();
            closeRenaming();
          }}
          onClose={closeRenaming}
        />
      )}
      {eagerDataSet.uploaderstatus === 'uploadInterrupted' ? (
        <Dialog
          buttons={commonText.close()}
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
          buttons={commonText.close()}
          header={attachmentsText.rollbackInterrupted()}
          onClose={() => {
            commitStatusChange('main');
            triggerSave();
          }}
        >
          {attachmentsText.rollbackInterruptedDescription()}
        </Dialog>
      ) : null}
      {duplicatesFiles.length > 0 && (
        <Dialog
          buttons={commonText.close()}
          header={attachmentsText.duplicateFilesFound()}
          icon="warning"
          onClose={() => setDuplicatedFiles([])}
        >
          <div className="flex min-w-fit flex-col gap-2 overflow-auto">
            <p>{attachmentsText.duplicateFilesDescription()}</p>
            <ViewAttachmentFiles
              baseTableName={currentBaseTable}
              headers={removeKey(mainHeaders, 'attachmentId', 'progress')}
              uploadableFiles={duplicatesFiles}
              uploadSpec={eagerDataSet.uploadplan}
              onDisambiguation={undefined}
            />
          </div>
        </Dialog>
      )}
    </Container.FullGray>
  );
}
