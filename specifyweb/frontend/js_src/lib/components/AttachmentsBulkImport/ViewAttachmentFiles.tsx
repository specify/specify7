import { RA } from '../../utils/types';
import { PartialUploadableFileSpec } from './types';
import { Tables } from '../DataModel/types';
import React from 'react';
import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { f } from '../../utils/functools';
import { resolveAttachmentStatus } from './utils';
import { ResourceDisambiguationDialog } from './ResourceDisambiguation';
import { SchemaViewerTableList } from '../SchemaViewer/TableList';
import { DragDropFiles } from '../Molecules/DragDropFiles';

const resolveMatched = (
  matches: RA<number> | undefined,
  disambiguated: number | undefined
) =>
  matches === undefined
    ? ''
    : matches.length === 0
    ? attachmentsText.noMatch()
    : matches.length > 1
    ? disambiguated === undefined
      ? attachmentsText.multipleMatches()
      : disambiguated
    : matches[0];

const resolveAttachmentDatasetData = (
  uploadableFiles: RA<PartialUploadableFileSpec>,
  setDisambiguationIndex: (index: number) => void
) =>
  uploadableFiles.map(
    ({ file, status, matchedId, disambiguated, attachmentId }, index) => {
      const disambiguate =
        matchedId !== undefined &&
        matchedId.length > 1 &&
        attachmentId === undefined
          ? () => setDisambiguationIndex(index)
          : undefined;
      return {
        selectedFileName: `${file.name} ${
          file instanceof File ? '' : `(${attachmentsText.noFile()})`
        }`,
        fileSize: file.size,
        parsedName: file.parsedName,
        status: f.maybe(status, resolveAttachmentStatus) ?? '',
        matchedId: [
          resolveMatched(matchedId, disambiguated),
          <div className="contents" onClick={disambiguate}>
            {resolveMatched(matchedId, disambiguated)}
          </div>,
        ],

        attachmentId,
      } as const;
    }
  );

const headers = {
  selectedFileName: commonText.selectedFileName(),
  fileSize: attachmentsText.fileSize(),
  matchedId: attachmentsText.matchedId(),
  status: attachmentsText.status(),
  attachmentId: attachmentsText.attachmentID(),
};
export function ViewAttachmentFiles({
  uploadableFiles,
  baseTableName,
  onDisambiguation: handleDisambiguation,
  onFilesDropped: handleFilesDropped,
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
  readonly onFilesDropped?: (file: FileList) => void;
}): JSX.Element {
  const [disambiguationIndex, setDisambiguationIndex] = React.useState<
    number | undefined
  >(undefined);

  const data = React.useMemo(
    () => resolveAttachmentDatasetData(uploadableFiles, setDisambiguationIndex),
    [uploadableFiles, setDisambiguationIndex]
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
