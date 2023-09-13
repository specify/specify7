import { RA } from '../../utils/types';
import { PartialUploadableFileSpec } from './types';
import { Tables } from '../DataModel/types';
import React from 'react';
import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { f } from '../../utils/functools';
import { resolveAttachmentRecord, resolveAttachmentStatus } from './utils';
import { ResourceDisambiguationDialog } from './ResourceDisambiguation';
import { SchemaViewerTableList } from '../SchemaViewer/TableList';
import { DragDropFiles } from '../Molecules/DragDropFiles';
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
          resolvedRecord,
          <div className="-m-2" onClick={handleDisambiguate}>
            {resolvedRecord?.type === 'matched' ? (
              <Link.NewTab
                href={getResourceViewUrl(baseTableName!, resolvedRecord.id)}
              >
                {file.parsedName?.toString()}
              </Link.NewTab>
            ) : (
              <div
                className={`flex h-full items-center text-center ${
                  isNativeError
                    ? 'wbs-form bg-[color:var(--invalid-cell)] text-center'
                    : ''
                }`}
              >
                {resolvedRecord?.reason ?? ''}
              </div>
            )}
          </div>,
        ],

        attachmentId,
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
  return (
    <>
      <div className="flex w-fit flex-1 flex-col gap-2  overflow-auto">
        <div>{attachmentsText.totalFiles({ fileCount: data.length })}</div>
        <DragDropFiles
          forwardRef={fileDropDivRef}
          onFileChange={handleFilesDropped}
        >
          {({ isDragging }) => (
            <div className="h-full overflow-auto" ref={fileDropDivRef}>
              <SchemaViewerTableList
                className={'bg-[color:var(--background)]'}
                data={data}
                defaultSortField="selectedFileName"
                getLink={undefined}
                headerClassName={isDragging ? 'bg-brand-100' : ''}
                headers={headers}
                sortName="attachmentImport"
              />
            </div>
          )}
        </DragDropFiles>
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
