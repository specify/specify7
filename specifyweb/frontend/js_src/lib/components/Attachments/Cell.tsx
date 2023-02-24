import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { caseInsensitiveHash } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { LoadingContext } from '../Core/Contexts';
import { fetchRelated } from '../DataModel/collection';
import { deserializeResource, getField } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import { idFromUrl } from '../DataModel/resource';
import { getModelById, schema } from '../DataModel/schema';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { Attachment } from '../DataModel/types';
import { ResourceView } from '../Forms/ResourceView';
import { originalAttachmentsView } from '../Forms/useViewDefinition';
import { TableIcon } from '../Molecules/TableIcon';
import { hasTablePermission } from '../Permissions/helpers';
import { fetchThumbnail } from './attachments';
import { tablesWithAttachments } from './index';
import { AttachmentPreview } from './Preview';

export function AttachmentCell({
  attachment,
  onViewRecord: handleViewRecord,
}: {
  readonly attachment: SerializedResource<Attachment>;
  readonly onViewRecord:
    | ((model: SpecifyModel, recordId: number) => void)
    | undefined;
}): JSX.Element {
  const model =
    typeof attachment.tableID === 'number'
      ? getAttachmentModel(attachment.tableID)
      : undefined;

  const [thumbnail] = useAsyncState(
    React.useCallback(async () => fetchThumbnail(attachment), [attachment]),
    false
  );

  const [isMetaOpen, _, handleMetaClose, handleMetaToggle] = useBooleanState();
  const title = (attachment.title || thumbnail?.alt) as
    | LocalizedString
    | undefined;
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
        title={
          getField(schema.models.WorkbenchTemplateMappingItem, 'metaData').label
        }
        onClick={handleMetaToggle}
      />
      {isMetaOpen && (
        <ResourceView
          dialog="modal"
          isDependent={false}
          isSubForm={false}
          mode="edit"
          resource={resource}
          title={title}
          viewName={originalAttachmentsView}
          onAdd={undefined}
          onClose={handleMetaClose}
          onDeleted={undefined}
          onSaved={undefined}
        />
      )}
      {typeof thumbnail === 'object' ? (
        <AttachmentPreview attachment={attachment} thumbnail={thumbnail} />
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
