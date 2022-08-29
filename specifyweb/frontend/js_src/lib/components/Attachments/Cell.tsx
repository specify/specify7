import { Attachment } from '../DataModel/types';
import { SpecifyModel } from '../DataModel/specifyModel';
import { f } from '../../utils/functools';
import { getModelById } from '../DataModel/schema';
import { useAsyncState } from '../../hooks/useAsyncState';
import React from 'react';
import { fetchThumbnail } from './attachments';
import { useBooleanState } from '../../hooks/useBooleanState';
import { LoadingContext } from '../Core/Contexts';
import { deserializeResource } from '../../hooks/resource';
import { hasTablePermission } from '../Permissions/helpers';
import { Button } from '../Atoms/Button';
import { fetchRelated } from '../DataModel/collection';
import { idFromUrl } from '../DataModel/resource';
import { caseInsensitiveHash } from '../../utils/utils';
import { commonText } from '../../localization/common';
import { ResourceView } from '../Forms/ResourceView';
import { originalAttachmentsView } from '../Forms/SpecifyForm';
import { AttachmentPreview } from './Preview';
import { tablesWithAttachments } from './index';
import {SerializedResource} from '../DataModel/helperTypes';
import {TableIcon} from '../Molecules/TableIcon';

export function AttachmentCell({
  attachment,
  onViewRecord: handleViewRecord,
}: {
  readonly attachment: SerializedResource<Attachment>;
  readonly onViewRecord:
    | ((model: SpecifyModel, recordId: number) => void)
    | undefined;
}): JSX.Element {
  const tableId = attachment?.tableID ?? undefined;
  const model =
    typeof tableId === 'number'
      ? f.var(getModelById(tableId), (model) =>
          tablesWithAttachments().includes(model) ? model : undefined
        )
      : undefined;

  const [thumbnail] = useAsyncState(
    React.useCallback(async () => fetchThumbnail(attachment), [attachment]),
    false
  );

  const [isMetaOpen, _, handleMetaClose, handleMetaToggle] = useBooleanState();
  const title = attachment.title || thumbnail?.alt;
  const loading = React.useContext(LoadingContext);

  const resource = React.useMemo(
    () => deserializeResource(attachment),
    [attachment]
  );

  return (
    <div className="relative">
      {typeof handleViewRecord === 'function' &&
        (model === undefined || hasTablePermission(model.name, 'read')) && (
          <Button.LikeLink
            className="absolute top-0 left-0"
            title={model?.label}
            onClick={(): void =>
              model === undefined
                ? handleMetaToggle()
                : loading(
                    fetchRelated(
                      attachment,
                      `${model.name as 'agent'}Attachments`
                    )
                      .then(({ records }) =>
                        typeof records[0] === 'object'
                          ? idFromUrl(
                              caseInsensitiveHash(
                                records[0],
                                model.name as 'agent'
                              ) ?? ''
                            )
                          : undefined
                      )
                      .then((id) =>
                        typeof id === 'number'
                          ? handleViewRecord(model, id)
                          : handleMetaToggle()
                      )
                  )
            }
          >
            <TableIcon label name={model?.name ?? 'Attachment'} />
          </Button.LikeLink>
        )}
      <Button.Icon
        aria-pressed={isMetaOpen}
        className="absolute top-0 right-0"
        icon="informationCircle"
        title={commonText('metadata')}
        onClick={handleMetaToggle}
      />
      {isMetaOpen && (
        <ResourceView
          canAddAnother={false}
          dialog="modal"
          isDependent={false}
          isSubForm={false}
          mode="edit"
          resource={resource}
          title={title}
          viewName={originalAttachmentsView}
          onClose={handleMetaClose}
          onDeleted={undefined}
          onSaved={undefined}
        />
      )}
      {typeof thumbnail === 'object' ? (
        <AttachmentPreview attachment={attachment} thumbnail={thumbnail} />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center">
          {commonText('loading')}
        </div>
      )}
    </div>
  );
}
