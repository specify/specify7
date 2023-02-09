import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
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

  const [_, handleMetaToggle] = useBooleanState();

  const loading = React.useContext(LoadingContext);

  return (
    <div className="relative">
      {typeof handleViewRecord === 'function' &&
        (model === undefined || hasTablePermission(model.name, 'read')) && (
          <Button.LikeLink
            className="absolute top-0 left-0"
            title={model?.label}
            onClick={(): void =>
              loading(
                // Fetch related CollectionObjectAttachment tables
                fetchRelated(attachment, `${model!.name as 'agent'}Attachments`)
                  .then(({ records }) =>
                    // Get key id of CollectionObject with URL value
                    typeof records[0] === 'object'
                      ? idFromUrl(
                          caseInsensitiveHash(
                            records[0],
                            model!.name as 'agent'
                          ) ?? ''
                        )
                      : undefined
                  )
                  .then((id) =>
                    typeof id === 'number'
                      ? handleViewRecord(model!, id)
                      : handleMetaToggle()
                  )
              )
            }
          >
            <TableIcon label name={model?.name ?? 'Attachment'} />
          </Button.LikeLink>
        )}
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
