/**
 * Attachments viewer
 */

import React from 'react';

import { fetchOriginalUrl, fetchThumbnail } from '../attachments';
import {
  DEFAULT_FETCH_LIMIT,
  fetchCollection,
  fetchRelated,
} from '../collection';
import type { Attachment, Tables } from '../datamodel';
import type { AnySchema, SerializedResource } from '../datamodelutils';
import { f } from '../functools';
import { caseInsensitiveHash } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import { hasTablePermission } from '../permissions';
import { idFromUrl } from '../resource';
import { getModel, getModelById, schema } from '../schema';
import type { SpecifyModel } from '../specifymodel';
import type { RA } from '../types';
import { filterArray } from '../types';
import {
  Button,
  className,
  Container,
  H2,
  Input,
  Label,
  Link,
  Select,
} from './basic';
import { useCollection } from './collection';
import { TableIcon } from './common';
import { LoadingContext } from './contexts';
import { crash } from './errorboundary';
import { useAsyncState, useBooleanState, useTitle } from './hooks';
import { LoadingScreen } from './modaldialog';
import { OrderPicker } from './preferencesrenderers';
import { loadingGif } from './queryresultstable';
import { deserializeResource } from './resource';
import { ResourceView } from './resourceview';
import { originalAttachmentsView } from './specifyform';
import { useCachedState } from './statecache';

const previewSize = 123;

const tablesWithAttachments = f.store(() =>
  filterArray(
    Object.keys(schema.models)
      .filter((tableName) => tableName.endsWith('Attachment'))
      .map((tableName) =>
        getModel(tableName.slice(0, -1 * 'Attachment'.length))
      )
  )
);
const filteredTables = f.store(() =>
  tablesWithAttachments().filter((model) =>
    hasTablePermission(model.name, 'read')
  )
);

export function AttachmentCell({
  attachment,
  onViewRecord: handleViewRecord,
}: {
  readonly attachment: SerializedResource<Attachment> | undefined;
  readonly onViewRecord:
    | ((model: SpecifyModel, recordId: number) => void)
    | undefined;
}): JSX.Element {
  const tableId = attachment?.tableID ?? undefined;
  const model =
    typeof tableId === 'number'
      ? f.var(getModelById(tableId), (model) =>
          filteredTables().includes(model) ? model : undefined
        )
      : undefined;

  const [thumbnail] = useAsyncState(
    React.useCallback(
      () =>
        attachment === undefined
          ? undefined
          : fetchThumbnail(attachment, previewSize),
      [attachment]
    ),
    false
  );

  const [originalUrl] = useAsyncState(
    React.useCallback(
      () =>
        typeof attachment === 'object'
          ? fetchOriginalUrl(attachment)
          : undefined,
      [attachment]
    ),
    false
  );

  const [isPreviewPending, handlePreviewPending, handleNoPreviewPending] =
    useBooleanState();
  React.useEffect(() => {
    if (isPreviewPending && typeof originalUrl === 'string') {
      handleNoPreviewPending();
      globalThis.open(originalUrl, '_blank');
    }
  }, [isPreviewPending, originalUrl, handleNoPreviewPending]);

  const [isMetaOpen, _, handleMetaClose, handleMetaToggle] = useBooleanState();
  const title = attachment?.title || thumbnail?.alt;
  const loading = React.useContext(LoadingContext);

  const resource = React.useMemo(
    () => f.maybe(attachment, deserializeResource),
    [attachment]
  );

  return (
    <div className="relative">
      {typeof attachment === 'object' && (
        <>
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
                <TableIcon name={model?.name ?? 'Attachment'} />
              </Button.LikeLink>
            )}
          <Button.Icon
            className="absolute top-0 right-0"
            title={commonText('metadata')}
            aria-label={commonText('metadata')}
            onClick={handleMetaToggle}
            icon="informationCircle"
            aria-pressed={isMetaOpen}
          />
          {isMetaOpen && (
            <ResourceView
              title={title}
              resource={resource}
              dialog="modal"
              onClose={handleMetaClose}
              canAddAnother={false}
              isSubForm={false}
              mode="edit"
              onDeleted={undefined}
              onSaved={undefined}
              viewName={originalAttachmentsView}
              isDependent={false}
            />
          )}
        </>
      )}
      {typeof thumbnail === 'object' ? (
        <Link.Default
          className={`dark:bg-black shadow-gray-500 flex items-center
            justify-center bg-white rounded shadow-lg`}
          href={originalUrl}
          target="_blank"
          onClick={(): void =>
            /*
             * If clicked on a link before originalUrl is loaded,
             * remember that and open the link as soon as loaded.
             * In the meanwhile, display a loading screen
             */
            originalUrl === undefined ? handlePreviewPending() : undefined
          }
        >
          <img
            className="dark:border-black object-contain max-w-full max-h-full border-8 border-white"
            src={thumbnail.src}
            alt={attachment?.title || thumbnail.alt}
            style={{
              width: `${thumbnail.width}px`,
              height: `${thumbnail.height}px`,
            }}
          />
          {isPreviewPending && <LoadingScreen />}
        </Link.Default>
      ) : (
        <div className="flex items-center justify-center w-10 h-10">
          {commonText('loading')}
        </div>
      )}
    </div>
  );
}

const preFetchDistance = 200;
const defaultScale = 10;
const minScale = 4;
const maxScale = 50;
const defaultSortOrder = '-timestampCreated';
const defaultFilter = { type: 'all' } as const;

export function AttachmentsView(): JSX.Element {
  useTitle(commonText('attachments'));

  const [order = defaultSortOrder, setOrder] = useCachedState({
    bucketName: 'attachments',
    cacheName: 'sortOrder',
    defaultValue: defaultSortOrder,
    staleWhileRefresh: false,
  });

  const [filter = defaultFilter, setFilter] = useCachedState({
    bucketName: 'attachments',
    cacheName: 'filter',
    defaultValue: defaultFilter,
    staleWhileRefresh: false,
  });

  const [collectionSizes] = useAsyncState(
    React.useCallback(
      async () =>
        f.all({
          all: fetchCollection(
            'Attachment',
            {
              limit: 1,
            },
            tablesWithAttachments().length === filteredTables().length
              ? {}
              : {
                  tableId__in: filteredTables()
                    .map(({ tableId }) => tableId)
                    .join(','),
                }
          ).then<number>(({ totalCount }) => totalCount),
          unused: fetchCollection(
            'Attachment',
            { limit: 1 },
            { tableId__isNull: 'true' }
          ).then<number>(({ totalCount }) => totalCount),
          byTable: f.all(
            Object.fromEntries(
              filteredTables().map(({ name, tableId }) => [
                name,
                fetchCollection('Attachment', {
                  limit: 1,
                  tableID: tableId,
                }).then<number>(({ totalCount }) => totalCount),
              ])
            )
          ),
        }),
      []
    ),
    false
  );

  const [scale = defaultScale, setScale] = useCachedState({
    bucketName: 'attachments',
    cacheName: 'scale',
    defaultValue: defaultScale,
    staleWhileRefresh: false,
  });

  const [collection, fetchMore] = useCollection(
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
            ? { tableId__isNull: 'true' }
            : filter.type === 'byTable'
            ? {
                tableId: schema.models[filter.tableName].tableId,
              }
            : tablesWithAttachments().length === filteredTables().length
            ? {}
            : {
                tableId__in: filteredTables()
                  .map(({ tableId }) => tableId)
                  .join(','),
              }
        ),
      [order, filter]
    )
  );

  return (
    <Container.FullGray>
      <header
        className={`gap-x-2 flex items-center ${className.hasAltBackground}`}
      >
        <H2>{commonText('attachments')}</H2>
        <Label.ForCheckbox>
          <span className="sr-only">{commonText('filter')}</span>
          <Select
            value={filter.type === 'byTable' ? filter.tableName : filter.type}
            onValueChange={(filter): void =>
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
              {commonText('all')}
              {typeof collectionSizes === 'object'
                ? ` (${collectionSizes.all})`
                : ''}
            </option>
            {collectionSizes?.unused !== 0 && (
              <option value="unused">
                {commonText('unused')}
                {typeof collectionSizes === 'object'
                  ? ` (${collectionSizes.unused})`
                  : ''}
              </option>
            )}
            <optgroup label={commonText('tables')}>
              {filteredTables()
                .filter(({ name }) => collectionSizes?.byTable[name] !== 0)
                .map(({ name, label }) => (
                  <option value={name} key={name}>
                    {label}
                    {typeof collectionSizes === 'object'
                      ? ` (${collectionSizes.byTable[name]})`
                      : ''}
                  </option>
                ))}
            </optgroup>
          </Select>
        </Label.ForCheckbox>
        <Label.ForCheckbox>
          {formsText('order')}
          <div>
            <OrderPicker
              model={schema.models.Attachment}
              order={order}
              onChange={setOrder}
            />
          </div>
        </Label.ForCheckbox>
        <span className="flex-1 -ml-2" />
        <Label.ForCheckbox>
          {commonText('scale')}
          <Input.Generic
            type="range"
            min={minScale}
            max={maxScale}
            value={scale}
            onValueChange={(value) => setScale(Number.parseInt(value))}
          />
        </Label.ForCheckbox>
      </header>
      <Gallery
        attachments={collection?.records ?? []}
        isComplete={
          typeof collection === 'object' &&
          collection.totalCount === collection.records.length
        }
        onFetchMore={fetchMore}
        scale={scale}
      />
    </Container.FullGray>
  );
}

function Gallery({
  attachments,
  onFetchMore: handleFetchMore,
  scale,
  isComplete,
}: {
  readonly attachments: RA<SerializedResource<Attachment>>;
  readonly onFetchMore: () => Promise<void>;
  readonly scale: number;
  readonly isComplete: boolean;
}): JSX.Element {
  const containerRef = React.useRef<HTMLElement | null>(null);

  const fillPage = React.useCallback(
    async () =>
      // Fetch more attachments when within 200px of the bottom
      containerRef.current !== null &&
      containerRef.current.scrollTop + preFetchDistance >
        containerRef.current.scrollHeight - containerRef.current.clientHeight
        ? handleFetchMore().catch(crash)
        : undefined,
    [handleFetchMore]
  );

  React.useEffect(
    () =>
      // Fetch attachments while scroll bar is not visible
      void (containerRef.current?.scrollHeight ===
      containerRef.current?.clientHeight
        ? fillPage().catch(crash)
        : undefined),
    [fillPage, attachments]
  );

  const [viewRecord, setViewRecord] = React.useState<
    SpecifyResource<AnySchema> | undefined
  >(undefined);
  return (
    <>
      <Container.Base
        className="flex-1 gap-4 grid items-center
          grid-cols-[repeat(auto-fit,minmax(var(--scale),1fr))]"
        style={
          {
            '--scale': `${scale}rem`,
          } as React.CSSProperties
        }
        forwardRef={containerRef}
        onScroll={isComplete ? undefined : fillPage}
      >
        {attachments.map((attachment, index) => (
          <AttachmentCell
            key={index}
            attachment={attachment}
            onViewRecord={(model, id): void =>
              setViewRecord(new model.Resource({ id }))
            }
          />
        ))}
        {isComplete
          ? attachments.length === 0 && <p>{formsText('noAttachments')}</p>
          : loadingGif}
      </Container.Base>
      {typeof viewRecord === 'object' && (
        <ResourceView
          resource={viewRecord}
          dialog="modal"
          onClose={(): void => setViewRecord(undefined)}
          onDeleted={undefined}
          onSaved={undefined}
          canAddAnother={false}
          isSubForm={false}
          mode="edit"
          isDependent={false}
        />
      )}
    </>
  );
}
