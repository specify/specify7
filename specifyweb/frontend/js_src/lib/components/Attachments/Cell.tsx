import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { caseInsensitiveHash } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { LoadingContext } from '../Core/Contexts';
import { fetchRelated } from '../DataModel/collection';
import type { SerializedResource } from '../DataModel/helperTypes';
import { idFromUrl } from '../DataModel/resource';
import { getModelById } from '../DataModel/schema';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { Attachment } from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';
import { TableIcon } from '../Molecules/TableIcon';
import { hasTablePermission } from '../Permissions/helpers';
import { fetchThumbnail } from './attachments';
import { tablesWithAttachments } from './index';
import { AttachmentPreview } from './Preview';

export function AttachmentCell({
  attachment,
  onViewRecord: handleViewRecord,
  onChange: handleChange,
}: {
  readonly attachment: SerializedResource<Attachment>;
  readonly onViewRecord:
    | ((model: SpecifyModel, recordId: number) => void)
    | undefined;
  readonly onChange: (attachment: SerializedResource<Attachment>) => void;
}): JSX.Element {
  const model =
    typeof attachment.tableID === 'number'
      ? getAttachmentModel(attachment.tableID)
      : undefined;

  const [thumbnail] = useAsyncState(
    React.useCallback(async () => fetchThumbnail(attachment), [attachment]),
    false
  );

  return (
    <div className="relative">
      {typeof handleViewRecord === 'function' &&
      model !== undefined &&
      hasTablePermission(model.name, 'read') ? (
        <RecordLink
          attachment={attachment}
          model={model}
          onViewRecord={handleViewRecord}
        />
      ) : undefined}
      {typeof thumbnail === 'object' ? (
        <AttachmentPreview
          attachment={attachment}
          thumbnail={thumbnail}
          onChange={handleChange}
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center">
          {commonText.loading()}
        </div>
      )}
    </div>
  );
}

function getAttachmentModel(
  tableId: number | undefined
): SpecifyModel | undefined {
  if (tableId === undefined) return undefined;
  const model = getModelById(tableId);
  return tablesWithAttachments().includes(model) ? model : undefined;
}

/**
 * A button to open a record associated with the attachment
 */
function RecordLink({
  model,
  attachment,
  onViewRecord: handleViewRecord,
}: {
  readonly model: SpecifyModel;
  readonly attachment: SerializedResource<Attachment>;
  readonly onViewRecord: (model: SpecifyModel, recordId: number) => void;
}): JSX.Element {
  const loading = React.useContext(LoadingContext);
  const [isFailed, handleFailed, handleNotFailed] = useBooleanState();
  return (
    <>
      <Button.LikeLink
        className="absolute top-0 left-0"
        title={model?.label}
        onClick={(): void =>
          loading(
            fetchRelatedId(model, attachment).then((id) =>
              typeof id === 'number'
                ? handleViewRecord(model, id)
                : handleFailed()
            )
          )
        }
      >
        <TableIcon label name={model?.name ?? 'Attachment'} />
      </Button.LikeLink>
      {isFailed ? (
        <Dialog
          buttons={commonText.close()}
          header={attachmentsText.unableToFindRelatedRecord()}
          onClose={handleNotFailed}
        >
          {attachmentsText.unableToFindRelatedRecordDescription()}
        </Dialog>
      ) : undefined}
    </>
  );
}

/**
 * For an attachment related to CollectionObjectAttachment, fetch the ID of
 * the CollectionObject
 */
async function fetchRelatedId(
  model: SpecifyModel,
  attachment: SerializedResource<Attachment>
): Promise<number | undefined> {
  const { records } = await fetchRelated(
    attachment,
    `${model.name as 'agent'}Attachments`
  );
  if (records[0] === undefined) return undefined;
  // This would be a URL to CollectionObject
  const resourceUrl = caseInsensitiveHash(records[0], model.name as 'agent');
  return idFromUrl(resourceUrl ?? '');
}
