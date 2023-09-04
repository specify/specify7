import React from 'react';
import { OverlayContext } from '../Router/Router';
import { useNavigate } from 'react-router-dom';
import { usePromise } from '../../hooks/useAsyncState';
import { Dialog } from '../Molecules/Dialog';
import { Button } from '../Atoms/Button';
import { commonText } from '../../localization/common';
import { attachmentsText } from '../../localization/attachments';
import { wbText } from '../../localization/workbench';
import { Link } from '../Atoms/Link';
import { DateElement } from '../Molecules/DateElement';
import { RA } from '../../utils/types';
import { ajax } from '../../utils/ajax';
import { AttachmentDataSetMeta } from './types';
import { fetchAttachmentResourceId } from './fetchAttachmentResource';

async function fetchAttachmentMappings(
  resourceId: number
): Promise<RA<AttachmentDataSetMeta>> {
  return ajax<RA<AttachmentDataSetMeta>>(
    `/attachment_gw/dataset/${resourceId}/`,
    {
      headers: { Accept: 'application/json' },
      method: 'GET',
    }
  ).then(({ data }) => data);
}

export function AttachmentsImportOverlay(): JSX.Element | null {
  const handleClose = React.useContext(OverlayContext);
  const navigate = useNavigate();
  const attachmentDataSetsPromise = React.useMemo(
    async () =>
      fetchAttachmentResourceId.then(async (resourceId) =>
        resourceId === undefined
          ? Promise.resolve(undefined)
          : fetchAttachmentMappings(resourceId)
      ),
    []
  );
  const [attachmentDataSets] = usePromise(attachmentDataSetsPromise, true);

  return attachmentDataSets === undefined ? null : (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          <Button.Info
            onClick={() => navigate('/specify/attachments/import/new')}
          >
            {commonText.new()}
          </Button.Info>
        </>
      }
      header={attachmentsText.attachmentImportDatasetsCount({
        count: attachmentDataSets.length,
      })}
      onClose={handleClose}
    >
      <table className="grid-table grid-cols-[repeat(3,auto)] gap-2">
        <thead>
          <tr>
            <th scope="col">{wbText.dataSetName()}</th>
            <th scope="col">{attachmentsText.timeStampCreated()}</th>
            <th scope="col">{attachmentsText.timeStampModified()}</th>
          </tr>
        </thead>
        <tbody>
          {attachmentDataSets.map((attachmentDataSet) => (
            <tr key={attachmentDataSet.id}>
              <td>
                <Link.Default
                  className="overflow-x-auto"
                  href={`/specify/attachments/import/${attachmentDataSet.id}`}
                >
                  {attachmentDataSet.name}
                </Link.Default>
              </td>
              <td>
                <DateElement date={attachmentDataSet.timeStampCreated} />
              </td>
              <td>
                {typeof attachmentDataSet.timeStampModified === 'string' ? (
                  <DateElement date={attachmentDataSet.timeStampModified} />
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Dialog>
  );
}
