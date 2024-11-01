/**
 * Attachments viewer
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useAsyncState, usePromise } from '../../hooks/useAsyncState';
import { useCachedState } from '../../hooks/useCachedState';
import { useCollection } from '../../hooks/useCollection';
import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { schemaText } from '../../localization/schema';
import { f } from '../../utils/functools';
import { replaceItem } from '../../utils/utils';
import { Container, H2 } from '../Atoms';
import { Button, DialogContext } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Input, Label, Select } from '../Atoms/Form';
import { DEFAULT_FETCH_LIMIT, fetchCollection } from '../DataModel/collection';
import { backendFilter } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import { genericTables, tables } from '../DataModel/tables';
import type { Attachment, Tables } from '../DataModel/types';
import { useMenuItem } from '../Header/MenuContext';
import { Dialog } from '../Molecules/Dialog';
import { ProtectedTable } from '../Permissions/PermissionDenied';
import { OrderPicker } from '../Preferences/Renderers';
import { attachmentSettingsPromise } from './attachments';
import { AttachmentGallery } from './Gallery';
import { allTablesWithAttachments, tablesWithAttachments } from './utils';

export const defaultAttachmentScale = 10;
const minScale = 4;
const maxScale = 50;
const defaultSortOrder = '-timestampCreated';
const defaultFilter = { type: 'all' } as const;

export function AttachmentsView({
  onClick,
}: {
  readonly onClick?: (attachment: SerializedResource<Attachment>) => void;
}): JSX.Element | null {
  const navigate = useNavigate();
  const [isConfigured] = usePromise(attachmentSettingsPromise, true);

  return isConfigured === undefined ? null : isConfigured ? (
    <ProtectedTable action="read" tableName="Attachment">
      <Attachments onClick={onClick} />
    </ProtectedTable>
  ) : (
    <Dialog
      buttons={commonText.close()}
      header={attachmentsText.attachmentServerUnavailable()}
      onClose={(): void => navigate('/specify/')}
    >
      {attachmentsText.attachmentServerUnavailableDescription()}
    </Dialog>
  );
}

function Attachments({
  onClick,
}: {
  readonly onClick?: (attachment: SerializedResource<Attachment>) => void;
}): JSX.Element {
  useMenuItem('attachments');

  const isInDialog = React.useContext(DialogContext);

  const navigate = useNavigate();

  const [order = defaultSortOrder, setOrder] = useCachedState(
    'attachments',
    'sortOrder'
  );

  const [filter = defaultFilter, setFilter] = useCachedState(
    'attachments',
    'filter'
  );

  const [collectionSizes] = useAsyncState(
    React.useCallback(
      async () =>
        f.all({
          all: fetchCollection(
            'Attachment',
            {
              limit: 1,
              domainFilter: true,
            },
            allTablesWithAttachments().length === tablesWithAttachments().length
              ? {}
              : backendFilter('tableId').isIn(
                  tablesWithAttachments().map(({ tableId }) => tableId)
                )
          ).then<number>(({ totalCount }) => totalCount),
          unused: fetchCollection(
            'Attachment',
            { limit: 1, domainFilter: true },
            backendFilter('tableId').isNull()
          ).then<number>(({ totalCount }) => totalCount),
          byTable: f.all(
            Object.fromEntries(
              tablesWithAttachments().map(({ name, tableId }) => [
                name,
                fetchCollection('Attachment', {
                  limit: 1,
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  tableID: tableId,
                  domainFilter: true,
                }).then<number>(({ totalCount }) => totalCount),
              ])
            )
          ),
        }),
      []
    ),
    false
  );

  const [scale = defaultAttachmentScale, setScale] = useCachedState(
    'attachments',
    'scale'
  );

  const [collection, setCollection, fetchMore] = useCollection(
    React.useCallback(
      async (offset) =>
        fetchCollection(
          'Attachment',
          {
            domainFilter: true,
            offset,
            orderBy: order,
            limit: DEFAULT_FETCH_LIMIT,
          },
          filter.type === 'unused'
            ? backendFilter('tableId').isNull()
            : filter.type === 'byTable'
            ? {
                tableId: genericTables[filter.tableName].tableId,
              }
            : allTablesWithAttachments().length ===
              tablesWithAttachments().length
            ? {}
            : backendFilter('tableId').isIn(
                tablesWithAttachments().map(({ tableId }) => tableId)
              )
        ),
      [order, filter]
    )
  );

  return (
    <Container.FullGray>
      <header
        className={`flex flex-wrap items-center gap-2 ${className.hasAltBackground}`}
      >
        <H2>{attachmentsText.attachments()}</H2>
        <Label.Inline>
          <span className="sr-only">{commonText.filter()}</span>
          <Select
            value={filter.type === 'byTable' ? filter.tableName : filter.type}
            onValueChange={(filter: string): void =>
              setFilter(
                filter === 'all' || filter === 'unused'
                  ? { type: filter }
                  : {
                      type: 'byTable',
                      tableName: filter as keyof Tables,
                    }
              )
            }
          >
            <option value="all">
              {typeof collectionSizes === 'object'
                ? commonText.countLine({
                    resource: commonText.all(),
                    count: collectionSizes.all,
                  })
                : commonText.all()}
            </option>
            {collectionSizes?.unused !== 0 && (
              <option value="unused">
                {typeof collectionSizes === 'object'
                  ? commonText.countLine({
                      resource: commonText.unused(),
                      count: collectionSizes.unused,
                    })
                  : commonText.unused()}
              </option>
            )}
            <optgroup label={schemaText.tables()}>
              {tablesWithAttachments()
                .filter(({ name }) => collectionSizes?.byTable[name] !== 0)
                .map(({ name, label }) => (
                  <option key={name} value={name}>
                    {label}
                    {typeof collectionSizes === 'object'
                      ? ` (${collectionSizes.byTable[name]})`
                      : ''}
                  </option>
                ))}
            </optgroup>
          </Select>
        </Label.Inline>
        <Label.Inline>
          {attachmentsText.orderBy()}
          <div>
            <OrderPicker
              order={order}
              table={tables.Attachment}
              onChange={setOrder}
            />
          </div>
        </Label.Inline>
        <span className="-ml-2 flex-1" />
        {/* Don't display scale if in dialog to not have resizing/glitching issue */}
        {isInDialog === undefined && (
          <>
            <Label.Inline>
              {attachmentsText.scale()}
              <Input.Generic
                max={maxScale}
                min={minScale}
                type="range"
                value={scale}
                onValueChange={(value): void =>
                  setScale(Number.parseInt(value))
                }
              />
            </Label.Inline>
            <Button.BorderedGray
              onClick={() => navigate('/specify/overlay/attachments/import/')}
            >
              {commonText.import()}
            </Button.BorderedGray>
          </>
        )}
      </header>
      <AttachmentGallery
        attachments={collection?.records ?? []}
        isComplete={
          typeof collection === 'object' &&
          collection.totalCount === collection.records.length
        }
        key={`${order}_${JSON.stringify(filter)}`}
        scale={scale}
        onChange={(attachment, index): void =>
          collection === undefined
            ? undefined
            : setCollection({
                records: replaceItem(collection.records, index, attachment),
                totalCount: collection.totalCount,
              })
        }
        onClick={onClick}
        onFetchMore={collection === undefined ? undefined : fetchMore}
      />
    </Container.FullGray>
  );
}
