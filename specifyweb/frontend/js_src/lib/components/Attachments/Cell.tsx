import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { f } from '../../utils/functools';
import type { GetSet } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { LoadingContext } from '../Core/Contexts';
import { fetchRelated } from '../DataModel/collection';
import { deserializeResource } from '../DataModel/helpers';
import type { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { idFromUrl } from '../DataModel/resource';
import { getModelById } from '../DataModel/schema';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { Attachment } from '../DataModel/types';
import { softFail } from '../Errors/Crash';
import { Dialog } from '../Molecules/Dialog';
import { TableIcon } from '../Molecules/TableIcon';
import { hasTablePermission } from '../Permissions/helpers';
import { tablesWithAttachments } from './index';
import { AttachmentPreview } from './Preview';

export function AttachmentCell({
  attachment,
  onOpen: handleOpen,
  related: [related, setRelated],
  onViewRecord: handleViewRecord,
}: {
  readonly attachment: SerializedResource<Attachment>;
  readonly onOpen: () => void;
  readonly related: GetSet<SpecifyResource<AnySchema> | undefined>;
  readonly onViewRecord:
    | ((model: SpecifyModel, recordId: number) => void)
    | undefined;
}): JSX.Element {
  const model = f.maybe(attachment.tableID ?? undefined, getAttachmentTable);

  return (
    <div className="relative">
      {typeof handleViewRecord === 'function' &&
      model !== undefined &&
      hasTablePermission(model.name, 'read') ? (
        <AttachmentRecordLink
          attachment={attachment}
          className="absolute top-0 left-0"
          model={model}
          related={[related, setRelated]}
          variant="icon"
          onViewRecord={handleViewRecord}
        />
      ) : undefined}
      <AttachmentPreview
        attachment={attachment}
        onOpen={(): void => {
          if (related === undefined && typeof model === 'object')
            fetchAttachmentParent(model, attachment)
              .then(setRelated)
              .catch(softFail);
          handleOpen();
        }}
      />
    </div>
  );
}

export function getAttachmentTable(tableId: number): SpecifyModel | undefined {
  const model = getModelById(tableId);
  return tablesWithAttachments().includes(model) ? model : undefined;
}

/**
 * A button to open a record associated with the attachment
 */
export function AttachmentRecordLink({
  variant,
  className,
  model,
  attachment,
  onViewRecord: handleViewRecord,
  related: [related, setRelated],
}: {
  readonly variant: 'button' | 'icon';
  readonly className: string;
  readonly model: SpecifyModel;
  readonly attachment: SerializedResource<Attachment>;
  readonly onViewRecord: (model: SpecifyModel, recordId: number) => void;
  readonly related: GetSet<SpecifyResource<AnySchema> | undefined>;
}): JSX.Element {
  const loading = React.useContext(LoadingContext);
  const [isFailed, handleFailed, handleNotFailed] = useBooleanState();
  const Component = variant === 'icon' ? Button.LikeLink : Button.Blue;
  return (
    <>
      <Component
        className={className}
        title={model?.label}
        onClick={(): void =>
          loading(
            (typeof related === 'object'
              ? Promise.resolve(related)
              : fetchAttachmentParent(model, attachment).then((related) => {
                  setRelated(related);
                  return related;
                })
            )
              .then((related) =>
                typeof related === 'object'
                  ? getBaseResourceId(model, related)
                  : undefined
              )
              .then((id) =>
                typeof id === 'number'
                  ? handleViewRecord(model, id)
                  : handleFailed()
              )
          )
        }
      >
        <TableIcon label name={model?.name ?? 'Attachment'} />
        {variant === 'button' && model?.label}
      </Component>
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

/** Fetch CollectionObjectAttachment for a given Attachment */
async function fetchAttachmentParent(
  model: SpecifyModel,
  attachment: SerializedResource<Attachment>
): Promise<SpecifyResource<AnySchema> | undefined> {
  const { records } = await fetchRelated(
    attachment,
    `${model.name as 'collectionObject'}Attachments`
  );
  return deserializeResource(records[0]);
}

/**
 * Get CollectionObject id from CollectionObjectAttachment
 */
function getBaseResourceId(
  model: SpecifyModel,
  related: SpecifyResource<AnySchema>
): number | undefined {
  // This would be a URL to CollectionObject
  const resourceUrl = related.get(model.name as 'CollectionObject');
  return idFromUrl(resourceUrl ?? '');
}
