import { filterArray, RA } from '../../utils/types';
import { PartialUploadableFileSpec } from './types';
import { Tables } from '../DataModel/types';
import React from 'react';
import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { f } from '../../utils/functools';
import { resolveAttachmentRecord, resolveAttachmentStatus } from './utils';
import { ResourceDisambiguationDialog } from './ResourceDisambiguation';
import { useDragDropFiles } from '../Molecules/DragDropFiles';
import { formsText } from '../../localization/forms';
import { PartialAttachmentUploadSpec } from './Import';
import { TableIcon } from '../Molecules/TableIcon';
import { generateMappingPathPreview } from '../WbPlanView/mappingPreview';
import { getResourceViewUrl } from '../DataModel/resource';
import { Link } from '../Atoms/Link';

const resolveAttachmentDatasetData = (
  uploadableFiles: RA<PartialUploadableFileSpec>,
  setDisambiguationIndex: (index: number) => void,
  baseTableName: keyof Tables | undefined
) =>
  uploadableFiles.map(
    ({ file, status, matchedId, disambiguated, attachmentId }, index) => {
      const handleDisambiguate =
        matchedId !== undefined &&
        matchedId.length > 1 &&
        attachmentId === undefined
          ? () => setDisambiguationIndex(index)
          : undefined;

      const resolvedRecord = f.maybe(baseTableName, () =>
        resolveAttachmentRecord(matchedId, disambiguated, file.parsedName)
      );
      const isNativeError = resolvedRecord?.type === 'invalid';
      const isRuntimeError =
        status !== undefined &&
        typeof status === 'object' &&
        (status.type === 'cancelled' || status.type === 'skipped');
      return {
        selectedFileName: `${file.name} ${
          file instanceof File ? '' : `(${attachmentsText.noFile()})`
        }`,
        fileSize: file.size,
        status: f.maybe(status, resolveAttachmentStatus) ?? '',
        record: [
          resolvedRecord?.type === 'matched'
            ? resolvedRecord.id
            : resolvedRecord?.reason,
          <div
            onClick={handleDisambiguate}
            className={
              handleDisambiguate !== undefined ? `hover:bg-brand-200` : ''
            }
          >
            {resolvedRecord?.type === 'matched' ? (
              <Link.NewTab
                href={getResourceViewUrl(baseTableName!, resolvedRecord.id)}
              >
                {file.parsedName?.toString()}
              </Link.NewTab>
            ) : (
              <div>{resolvedRecord?.reason ?? ''}</div>
            )}
          </div>,
        ],

        attachmentId,
        canDisambiguate: typeof handleDisambiguate === 'function',
        errorCells: filterArray([
          isNativeError ? 'record' : undefined,
          isRuntimeError ? 'status' : undefined,
        ]),
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
}): JSX.Element {
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
    [uploadableFiles, setDisambiguationIndex]
  );
  const headers = React.useMemo(
    () => ({
      selectedFileName: commonText.selectedFileName(),
      fileSize: attachmentsText.fileSize(),
      record: (
        <div className="flex min-w-fit gap-2">
          {baseTableName === undefined ? (
            formsText.record()
          ) : (
            <>
              <TableIcon label name={baseTableName} />
              {'mappingPath' in uploadSpec &&
                generateMappingPathPreview(
                  baseTableName,
                  uploadSpec.mappingPath
                )}
            </>
          )}
        </div>
      ),
      status: attachmentsText.status(),
      attachmentId: attachmentsText.attachmentID(),
    }),
    [uploadSpec.staticPathKey]
  );
  const fileDropDivRef = React.useRef<HTMLDivElement>(null);
  const { isDragging, ...restCallbacks } = useDragDropFiles(
    handleFilesDropped,
    fileDropDivRef
  );
  return (
    <>
      <div
        className="flex w-fit flex-1 flex-col gap-2  overflow-auto"
        {...restCallbacks}
      >
        <div>{attachmentsText.totalFiles({ fileCount: data.length })}</div>
        <div className="h-full overflow-auto" ref={fileDropDivRef}>
          <div
            className={`
        grid-table
        w-fit flex-1 grid-cols-[repeat(var(--cols),auto)] rounded border border-gray-400 dark:border-neutral-500 print:p-1
      `}
            role="table"
            style={
              { '--cols': Object.keys(headers).length } as React.CSSProperties
            }
          >
            <div role="row">
              {Object.entries(headers).map(([name, label]) => (
                <div
                  className={`
              sticky top-0 border border-gray-400 bg-[color:var(--background)]
              p-2 font-bold dark:border-neutral-500 print:p-1 ${
                isDragging ? 'bg-brand-100' : ''
              }`}
                  key={name}
                  role="columnheader"
                >
                  {label}
                </div>
              ))}
            </div>
            <div role="rowgroup">
              {data.map((row, index) => {
                const children = Object.keys(headers).map((column) => {
                  const resolveData = row[column];
                  return (
                    <Cell
                      key={column}
                      className={`${
                        row.canDisambiguate
                          ? 'bg-brand-100 hover:bg-brand-200'
                          : row.errorCells.includes(column)
                          ? 'wbs-form bg-[color:var(--invalid-cell)]'
                          : ''
                      }
                          
                          `}
                    >
                      {Array.isArray(resolveData)
                        ? resolveData[1]
                        : row[column]}
                    </Cell>
                  );
                });
                return (
                  <div key={index} role="row">
                    {children}
                  </div>
                );
              })}
            </div>
          </div>
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
function Cell({
  children,
  className,
}: {
  readonly children: React.ReactNode;
  readonly className?: string;
}): JSX.Element {
  return (
    <div
      className={`border border-gray-400 bg-[color:var(--background)] p-2 dark:border-neutral-500 print:p-1 ${
        className ?? ''
      }`}
      role="cell"
    >
      {children}
    </div>
  );
}
