import React from 'react';

import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { LANGUAGE } from '../../localization/utils/config';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { Link } from '../Atoms/Link';
import { getResourceViewUrl } from '../DataModel/resource';
import { strictGetModel } from '../DataModel/schema';
import type { Tables } from '../DataModel/types';
import { GenericSortedDataViewer } from '../Molecules/GenericSortedDataViewer';
import { TableIcon } from '../Molecules/TableIcon';
import { useDragDropFiles } from '../Molecules/useDragDropFiles';
import type { PartialAttachmentUploadSpec } from './Import';
import { staticAttachmentImportPaths } from './importPaths';
import { ResourceDisambiguationDialog } from './ResourceDisambiguation';
import type { PartialUploadableFileSpec } from './types';
import {
  keyLocalizationMapAttachment,
  resolveAttachmentRecord,
  resolveAttachmentStatus,
} from './utils';

const sizeFormatter = new Intl.NumberFormat(LANGUAGE, {
  unit: 'byte',
  notation: 'compact',
  unitDisplay: 'narrow',
  style: 'unit',
});
const resolveAttachmentDatasetData = (
  uploadableFiles: RA<PartialUploadableFileSpec>,
  setDisambiguationIndex: (index: number) => void,
  baseTableName: keyof Tables | undefined
) =>
  uploadableFiles.map(
    ({ uploadFile, status, matchedId, disambiguated, attachmentId }, index) => {
      const handleDisambiguate: (() => void) | undefined =
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
        selectedFileName: `${uploadFile.file.name} ${
          uploadFile.file instanceof File ? '' : `(${attachmentsText.noFile()})`
        }`,
        fileSize: sizeFormatter.format(uploadFile.file.size),
        // Will be replaced by icons soon
        status: [statusText, <p>{statusText}</p>],
        record: [
          resolvedRecord?.type === 'matched'
            ? resolvedRecord.id
            : resolvedRecord?.reason,
          <button onClick={handleDisambiguate}>
            {resolvedRecord?.type === 'matched' ? (
              <Link.NewTab
                href={getResourceViewUrl(baseTableName!, resolvedRecord.id)}
              >
                {uploadFile.parsedName?.toString()}
              </Link.NewTab>
            ) : (
              resolvedRecord !== undefined && (
                <div>{keyLocalizationMapAttachment[resolvedRecord.reason]}</div>
              )
            )}
          </button>,
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
  uploadSpec,
  onDisambiguation: handleDisambiguation,
  onFilesDropped: handleFilesDropped,
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
  const headers = React.useMemo(
    () => ({
      selectedFileName: commonText.selectedFileName(),
      fileSize: attachmentsText.fileSize(),
      record: (
        <div className="flex min-w-fit items-center gap-2">
          {baseTableName === undefined ? (
            formsText.record()
          ) : (
            <>
              <TableIcon label name={baseTableName} />
              {uploadSpec.staticPathKey === undefined
                ? ''
                : strictGetModel(baseTableName).strictGetField(
                    staticAttachmentImportPaths[uploadSpec.staticPathKey].path
                  ).label}
            </>
          )}
        </div>
      ),
      status: attachmentsText.status(),
      attachmentId: attachmentsText.attachmentId(),
    }),
    [uploadSpec.staticPathKey]
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
        <div className="font-semibold">
          {commonText.colonLine({
            label: attachmentsText.totalFiles(),
            value: data.length.toString(),
          })}
        </div>
        <div className="h-full overflow-auto" ref={fileDropDivRef}>
          <GenericSortedDataViewer
            cellClassName={(row, column, index) =>
              `bg-[color:var(--background)] p-2 print:p-1 ${
                row.canDisambiguate && column === 'record'
                  ? 'hover:bg-brand-200'
                  : ''
              }
                  ${
                    (row.isNativeError && column === 'record') ||
                    (row.isRuntimeError && column === 'status')
                      ? 'wbs-form text-red-600'
                      : ''
                  } ${
                index % 2 === 0
                  ? 'bg-gray-100/60 dark:bg-[color:var(--form-background)]'
                  : 'bg-[color:var(--background)]'
              }`
            }
            className="w-full"
            data={data}
            getLink={undefined}
            headerClassName={`border-b-2 ${isDragging ? 'bg-brand-100' : ''}`}
            headers={headers}
          />
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
