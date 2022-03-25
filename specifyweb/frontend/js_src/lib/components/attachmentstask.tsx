import React from 'react';
import type { State } from 'typesafe-reducer';

import * as attachments from '../attachments';
import { fetchOriginalUrl } from '../attachments';
import { fetchCollection } from '../collection';
import type { Attachment, Tables } from '../datamodel';
import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import { idFromUrl } from '../resource';
import { router } from '../router';
import { getModel, getModelById, schema } from '../schema';
import { setCurrentView } from '../specifyapp';
import type { Collection, SpecifyModel } from '../specifymodel';
import type { RA } from '../types';
import { filterArray } from '../types';
import { f } from '../wbplanviewhelper';
import { Button, Container, H2, Label, Link, Select } from './basic';
import { TableIcon } from './common';
import { LoadingContext } from './contexts';
import { crash } from './errorboundary';
import { useAsyncState, useBooleanState, useTitle } from './hooks';
import { LoadingScreen } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import { ResourceView } from './resourceview';

const previewSize = 123;

export function AttachmentCell({
  attachment,
  onViewRecord: handleViewRecord,
}: {
  readonly attachment: SpecifyResource<Attachment> | undefined;
  readonly onViewRecord:
    | ((model: SpecifyModel, recordId: number) => void)
    | undefined;
}): JSX.Element {
  const tableId = attachment?.get('tableID') ?? undefined;
  const model = typeof tableId === 'number' ? getModelById(tableId) : undefined;

  const [thumbnail] = useAsyncState(
    React.useCallback(
      () =>
        typeof attachment === 'undefined'
          ? undefined
          : attachments.fetchThumbnail(attachment, previewSize),
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
      window.open(originalUrl, '_blank');
    }
  }, [isPreviewPending, originalUrl, handleNoPreviewPending]);

  const [isMetaOpen, _, handleMetaClose, handleMetaToggle] = useBooleanState();
  const title = attachment?.get('title') ?? thumbnail?.alt;
  const loading = React.useContext(LoadingContext);

  return (
    <div className="relative min-w-[theme(spacing.10)] min-h-[theme(spacing.10)]">
      {typeof attachment === 'object' && (
        <>
          {typeof handleViewRecord === 'function' && (
            <Button.LikeLink
              className="absolute top-0 left-0"
              title={model?.label}
              onClick={(): void =>
                typeof model === 'undefined'
                  ? handleMetaToggle()
                  : loading(
                      attachment
                        .rgetCollection(
                          `${model.name as 'agent'}Attachments`,
                          true
                        )
                        .then(({ models }) =>
                          idFromUrl(models[0].get(model.name as 'agent') ?? '')
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
              resource={attachment}
              dialog="modal"
              onClose={handleMetaClose}
              canAddAnother={false}
              isSubForm={false}
              mode="edit"
              onDeleted={undefined}
              onSaved={undefined}
            />
          )}
        </>
      )}
      {typeof thumbnail === 'object' ? (
        <Link.Default
          className="dark:bg-black shadow-gray-500 flex items-center justify-center bg-white rounded shadow-lg"
          href={originalUrl}
          target="_blank"
          onClick={(): void =>
            /*
             * If clicked on a link before originalUrl is loaded,
             * remember that and open the link as soon as loaded.
             * In the meanwhile, display a loading screen
             */
            typeof originalUrl === 'undefined'
              ? handlePreviewPending()
              : undefined
          }
        >
          <img
            className="object-contain max-w-full max-h-full"
            src={thumbnail.src}
            alt={attachment?.get('title') ?? thumbnail.alt}
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

export function AttachmentsView(): JSX.Element {
  useTitle(commonText('attachments'));

  const [order, setOrder] = React.useState<
    keyof Attachment['fields'] | `-${keyof Attachment['fields']}`
  >('-timestampCreated');

  const [filter, setFilter] = React.useState<
    | State<'all'>
    | State<'unused'>
    | State<'byTable', { readonly tableName: keyof Tables }>
  >({ type: 'all' });

  const tablesWithAttachments = React.useMemo(
    () =>
      filterArray(
        Object.keys(schema.models)
          .filter((tableName) => tableName.endsWith('Attachments'))
          .map((tableName) =>
            getModel(tableName.slice(0, -1 * 'Attachment'.length))
          )
      ),
    []
  );

  const [collectionSizes] = useAsyncState(
    React.useCallback(
      async () =>
        f.all({
          all: fetchCollection('Attachment', { limit: 1 }).then<number>(
            ({ totalCount }) => totalCount
          ),
          unused: fetchCollection('Attachment', { limit: 1 }).then<number>(
            ({ totalCount }) => totalCount
          ),
          byTable: f.all(
            Object.fromEntries(
              tablesWithAttachments.map(({ name }) => [
                name,
                fetchCollection('Attachment', { limit: 1 }).then<number>(
                  ({ totalCount }) => totalCount
                ),
              ])
            )
          ),
        }),
      [tablesWithAttachments]
    ),
    false
  );

  const collection = React.useMemo(
    () =>
      new schema.models.Attachment.LazyCollection({
        domainfilter: true,
        filters: {
          orderby: order,
          ...(filter.type === 'unused'
            ? { tableId__isnull: true }
            : filter.type === 'byTable'
            ? {
                tableId: schema.models[filter.tableName].tableId,
              }
            : {}),
        },
      }) as Collection<Attachment>,
    [order, filter]
  );

  const containerRef = React.useRef<HTMLElement | null>(null);

  const fillPage = React.useCallback(
    async () =>
      // Fetch more attachments when within 200px of the bottom
      containerRef.current !== null &&
      !collection.isComplete() &&
      Math.max(
        containerRef.current.scrollTop,
        containerRef.current.clientHeight
      ) +
        preFetchDistance >
        containerRef.current.scrollHeight
        ? collection
            .fetchPromise()
            .then(({ models }) => setAttachments(Array.from(models)))
            .catch(crash)
        : undefined,
    [collection]
  );

  const [attachments, setAttachments] = React.useState<
    RA<SpecifyResource<Attachment> | undefined>
  >([]);
  React.useEffect(() => {
    setAttachments([]);
    fillPage().catch(crash);
  }, [fillPage]);

  const [viewRecord, setViewRecord] = React.useState<
    SpecifyResource<AnySchema> | undefined
  >(undefined);

  return (
    <Container.Full>
      <header className="gap-x-2 flex items-center">
        <H2>{commonText('attachments')}</H2>
        <Label.ForCheckbox>
          <span className="sr-only">{formsText('filter')}</span>
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
              {tablesWithAttachments
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
          <span className="sr-only">{formsText('order')}</span>
          <Select
            value={order.startsWith('-') ? order.slice(1) : order}
            onValueChange={(value): void => setOrder(value as typeof order)}
          >
            <option value="">{commonText('none')}</option>
            <optgroup label={commonText('ascending')}>
              {schema.models.Attachment.fields
                .filter(({ overrides }) => !overrides.isHidden)
                .map(({ name, label }) => (
                  <option value={name} key={name}>
                    {label}
                  </option>
                ))}
            </optgroup>
            <optgroup label={commonText('descending')}>
              {schema.models.Attachment.fields
                .filter(({ overrides }) => !overrides.isHidden)
                .map(({ name, label }) => (
                  <option value={`-${name}`} key={name}>
                    {label}
                  </option>
                ))}
            </optgroup>
          </Select>
        </Label.ForCheckbox>
      </header>
      <Container.Base
        className="flex-1 !w-max-none overflow-y-auto gap-4 grid items-center
          grid-cols-[repeat(auto-fit,minmax(150px,1fr))]"
        forwardRef={containerRef}
        onScroll={collection.isComplete() ? undefined : fillPage}
      >
        {attachments.map((attachment, index) => (
          <AttachmentCell
            key={index}
            attachment={attachment}
            onViewRecord={(model, id) =>
              setViewRecord(new model.Resource({ id }))
            }
          />
        ))}
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
        />
      )}
    </Container.Full>
  );
}

const Attachments = createBackboneView(AttachmentsView);

export default function Routes(): void {
  router.route('attachments/', 'attachments', function () {
    setCurrentView(new Attachments());
  });
}
