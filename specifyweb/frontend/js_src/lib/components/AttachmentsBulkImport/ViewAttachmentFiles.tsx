import { RA } from '../../utils/types';
import { PartialUploadableFileSpec } from './types';
import { Tables } from '../DataModel/types';
import React from 'react';
import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { f } from '../../utils/functools';
import { resolveAttachmentStatus } from './utils';
import { ResourceDisambiguationDialog } from './ResourceDisambiguation';

export function ViewAttachmentFiles({
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
            <th className="border-2 border-black">
              {attachmentsText.number()}
            </th>
            <th className="border-2 border-black">
              {commonText.selectedFileName()}
            </th>
            <th className="border-2 border-black">
              {attachmentsText.fileSize()}
            </th>
            <th className="border-2 border-black">
              {attachmentsText.fileType()}
            </th>
            <th className="border-2 border-black">
              {attachmentsText.parsedName()}
            </th>
            <th className="border-2 border-black">
              {attachmentsText.matchedId()}
            </th>
            <th className="border-2 border-black">
              {attachmentsText.status()}
            </th>
            <th className="border-2 border-black">
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
                className={
                  index === disambiguationIndex
                    ? 'bg-[color:var(--save-button-color)]'
                    : disambiguate === undefined
                    ? ''
                    : 'hover:bg-brand-200'
                }
                key={index}
              >
                <td className="border-2 border-black">{index + 1}</td>
                <td className="border-2 border-black">
                  {`${uploadableFile.file.name} ${
                    uploadableFile.file instanceof File
                      ? ''
                      : `(${attachmentsText.noFile()})`
                  }`}
                </td>
                <td className="border-2 border-black">
                  {uploadableFile.file.size ?? ''}
                </td>
                <td className="border-2 border-black">
                  {uploadableFile.file.type}
                </td>
                <td className="border-2 border-black">
                  {uploadableFile.file.parsedName ?? ''}
                </td>
                <td className="border-2 border-black" onClick={disambiguate}>
                  {uploadableFile.matchedId === undefined
                    ? ''
                    : uploadableFile.matchedId.length === 0
                    ? attachmentsText.noMatch()
                    : uploadableFile.matchedId.length > 1
                    ? uploadableFile.disambiguated === undefined
                      ? 'Multiple Matches'
                      : uploadableFile.disambiguated
                    : uploadableFile.matchedId[0]}
                </td>
                <td className="border-2 border-black">
                  {f.maybe(uploadableFile.status, resolveAttachmentStatus) ??
                    ''}
                </td>
                <td className="border-2 border-black">
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
