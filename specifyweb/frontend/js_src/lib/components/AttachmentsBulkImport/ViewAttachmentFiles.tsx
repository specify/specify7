import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { f } from '../../utils/functools';
import type { IR, RA } from '../../utils/types';
import { localized } from '../../utils/types';
import { dialogIcons } from '../Atoms/Icons';
import { formatFileSize } from '../Atoms/Internationalization';
import { Link } from '../Atoms/Link';
import { getResourceViewUrl } from '../DataModel/resource';
import type { Tables } from '../DataModel/types';
import { GenericSortedDataViewer } from '../Molecules/GenericSortedDataViewer';
import { useDragDropFiles } from '../Molecules/useDragDropFiles';
import type { PartialAttachmentUploadSpec } from './Import';
import { ResourceDisambiguationDialog } from './ResourceDisambiguation';
import type { PartialUploadableFileSpec } from './types';
import {
  keyLocalizationMapAttachment,
  resolveAttachmentRecord,
  resolveAttachmentStatus,
} from './utils';
import { datasetVariants } from '../WbUtils/datasetVariants';

const resolveAttachmentDatasetData = (
  uploadableFiles: RA<PartialUploadableFileSpec>,
  setDisambiguationIndex: (index: number) => void,
  baseTableName: keyof Tables | undefined
) =>
  uploadableFiles.map(
    ({ uploadFile, status, matchedId, disambiguated, attachmentId }, index) => {
      const handleDisambiguate =
        matchedId !== undefined &&
          matchedId.length > 1 &&
          attachmentId === undefined &&
          // FEATURE: Allow disambiguating again
          disambiguated === undefined
          ? () => setDisambiguationIndex(index)
          : undefined;

      const resolvedRecord =
        baseTableName === undefined
          ? undefined
          : resolveAttachmentRecord(
            matchedId,
            disambiguated,
            uploadFile.parsedName
          );

      const isRuntimeError =
        status !== undefined &&
        typeof status === 'object' &&
        (status.type === 'cancelled' || status.type === 'skipped');

      const statusText = f.maybe(status, resolveAttachmentStatus) ?? '';
      return {
        selectedFileName: [
          uploadFile.file.name,
          <div className="flex w-fit gap-1">
            {uploadFile.file instanceof File ? '' : dialogIcons.warning}
            {uploadFile.file.name}
          </div>,
        ],
        fileSize: formatFileSize(uploadFile.file.size),
        record: [
          resolvedRecord?.type === 'matched'
            ? resolvedRecord.id
            : resolvedRecord?.reason,
          <button type="button" onClick={handleDisambiguate}>
            {resolvedRecord?.type === 'matched' ? (
              <Link.NewTab
                href={getResourceViewUrl(baseTableName!, resolvedRecord.id)}
              >
                {localized(uploadFile.parsedName?.toString())}
              </Link.NewTab>
            ) : (
              resolvedRecord !== undefined && (
                <div>
                  {resolvedRecord.reason === 'multipleMatches'
                    ? attachmentsText.multipleMatchesClick()
                    : keyLocalizationMapAttachment[resolvedRecord.reason]}
                </div>
              )
            )}
          </button>,
        ],
        progress: [
          statusText,
          <div className="flex w-fit gap-1" title={statusText}>
            {status?.type === 'success' &&
              status.successType === 'uploaded' &&
              dialogIcons.success}
            {statusText}
          </div>,
        ],
        attachmentId,
        canDisambiguate: typeof handleDisambiguate === 'function',
        isNativeError: resolvedRecord?.type === 'invalid',
        isRuntimeError,
      } as const;
    }
  );

export function ViewAttachmentFiles({
  uploadableFiles,
  baseTableName,
  onDisambiguation: handleDisambiguation,
  onFilesDropped: handleFilesDropped,
  headers,
}: {
  readonly uploadableFiles: RA<PartialUploadableFileSpec>;
  readonly baseTableName: keyof Tables | undefined;
  readonly uploadSpec: PartialAttachmentUploadSpec;
  readonly onDisambiguation:
  | ((
    disambiguatedId: number,
    indexToDisambiguate: number,
    multiple: boolean
  ) => void)
  | undefined;
  readonly onFilesDropped?: (file: FileList) => void;
  readonly headers: IR<JSX.Element | LocalizedString>;
}): JSX.Element | null {
  const [disambiguationIndex, setDisambiguationIndex] = React.useState<
    number | undefined
  >(undefined);

  const data = React.useMemo(
    () =>
      resolveAttachmentDatasetData(
        uploadableFiles,
        setDisambiguationIndex,
        baseTableName
      ),
    [uploadableFiles, setDisambiguationIndex, baseTableName]
  );

  const fileDropDivRef = React.useRef<HTMLDivElement>(null);
  const { isDragging, callbacks } = useDragDropFiles(
    handleFilesDropped,
    fileDropDivRef
  );

  return (
    <>
      <div
        className="flex w-full flex-1 flex-col gap-2 overflow-auto rounded bg-[color:var(--background)] p-4 shadow-md"
        {...callbacks}
      >
        <div className="h-full overflow-auto" ref={fileDropDivRef}>
          {data.length === 0 && handleFilesDropped !== undefined ? (
            <StartUploadDescription />
          ) : (
            <>
              <div className="flex w-fit items-center gap-4">
                <div className="font-semibold">
                  {commonText.colonLine({
                    label: attachmentsText.totalFiles(),
                    value: data.length.toString(),
                  })}
                </div>
                <div className="flex min-w-fit gap-1">
                  {uploadableFiles.some(
                    ({ uploadFile: { file } }) => !(file instanceof File)
                  ) && (
                      <>
                        {dialogIcons.warning}
                        {attachmentsText.pleaseReselectAllFiles()}
                      </>
                    )}
                </div>
              </div>
              <GenericSortedDataViewer
                cellClassName={(row, column, index) =>
                  `bg-[color:var(--background)] p-2 print:p-1 ${row.canDisambiguate && column === 'record'
                    ? 'hover:bg-brand-200'
                    : ''
                  }
                  ${(row.isNativeError && column === 'record') ||
                    (row.isRuntimeError && column === 'progress')
                    ? 'wbs-form text-red-600'
                    : ''
                  } ${index % 2 === 0
                    ? 'bg-gray-100/60 dark:bg-[color:var(--form-background)]'
                    : 'bg-[color:var(--background)]'
                  }`
                }
                className="w-full"
                data={data}
                getLink={undefined}
                headerClassName={`border-b-2 ${isDragging ? 'bg-brand-100' : ''
                  }`}
                headers={headers}
              />
            </>
          )}
        </div>
      </div>
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

function StartUploadDescription(): JSX.Element {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <ol className="flex list-decimal flex-col gap-3">
        <li>{attachmentsText.chooseFilesToGetStarted()}</li>
        <li>{attachmentsText.selectIdentifier()}</li>
      </ol>
      <Link.NewTab href={datasetVariants.bulkAttachment.documentationUrl}>
        {headerText.documentation()}
      </Link.NewTab>
    </div>
  );
}
