import React from 'react';

import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import QueryCbxSearch from '../querycbxsearch';
import type { Relationship } from '../specifyfield';
import type { SpecifyModel } from '../specifymodel';
import type { RA } from '../types';
import { defined } from '../types';
import { clamp, f } from '../wbplanviewhelper';
import { Button, className, Input } from './basic';
import { crash } from './errorboundary';
import { Dialog } from './modaldialog';
import type { FormType, ResourceViewProps } from './resourceview';
import { ResourceView } from './resourceview';

export function RecordSelectorButtons({
  onAdd: handleAdd,
  onDelete: handleDelete,
  onVisit: handleVisit,
}: {
  readonly onAdd: (() => void) | undefined;
  readonly onDelete: (() => void) | undefined;
  readonly onVisit: (() => void) | undefined;
}): JSX.Element {
  return (
    <>
      {typeof handleAdd === 'function' && (
        <Button.LikeLink onClick={handleAdd}>
          {commonText('add')}
        </Button.LikeLink>
      )}
      {typeof handleDelete === 'function' && (
        <Button.LikeLink onClick={handleDelete}>
          {commonText('delete')}
        </Button.LikeLink>
      )}
      {typeof handleVisit === 'function' && (
        <Button.LikeLink onClick={handleVisit}>
          {formsText('visit')}
        </Button.LikeLink>
      )}
    </>
  );
}

export function Slider({
  value,
  count,
  onChange: handleChange,
  onAdd: handleAdd,
}: {
  readonly value: number;
  readonly count: number;
  readonly onChange: (newValue: number) => void;
  readonly onAdd: (() => void) | undefined;
}): JSX.Element {
  const [isBlank, setIsBlank] = React.useState<boolean>(false);
  return (
    <div
      className={`gap-x-2 print:hidden flex justify-center ${
        count === 0 ? 'invisible' : ''
      }`}
    >
      <Button.Simple
        aria-label={formsText('firstRecord')}
        title={formsText('firstRecord')}
        disabled={value == 0}
        onClick={(): void => handleChange(0)}
      >
        ≪
      </Button.Simple>
      <Button.Simple
        className="dark:bg-neutral-500 px-4 bg-white"
        aria-label={formsText('previousRecord')}
        title={formsText('previousRecord')}
        disabled={value == 0}
        onClick={(): void => handleChange(value - 1)}
      >
        &lt;
      </Button.Simple>
      <div className="grid font-bold items-center grid-cols-[1fr_auto_1fr]">
        <label
          className={`h-full relative after:invisible after:p-2
            after:content-[attr(data-value)]`}
          data-value={value}
        >
          <span className="sr-only">{formsText('currentRecord')(count)}</span>
          <Input
            type="number"
            className="no-arrows dark:bg-neutral-600 absolute top-0 left-0 w-full h-full font-bold bg-white border-0"
            min="1"
            max={count}
            step="1"
            // Convert 0-based indexing to 1-based
            value={isBlank ? '' : value + 1}
            onChange={({ target }): void => {
              setIsBlank(target.value.length === 0);
              if (target.value.length > 0) {
                const value = clamp(
                  0,
                  count - 1,
                  Number.parseInt(target.value) - 1
                );
                handleChange(value);
              }
            }}
            onBlur={(): void => setIsBlank(false)}
          />
        </label>
        <span>/</span>
        <span>{count}</span>
      </div>
      <Button.Simple
        className="dark:bg-neutral-500 px-4 bg-white"
        aria-label={formsText('nextRecord')}
        title={formsText('nextRecord')}
        disabled={value + 1 == count}
        onClick={(): void => handleChange(value + 1)}
      >
        &gt;
      </Button.Simple>
      <Button.Simple
        aria-label={formsText('lastRecord')}
        title={formsText('lastRecord')}
        disabled={value + 1 == count}
        onClick={(): void => handleChange(count - 1)}
      >
        ≫
      </Button.Simple>
      {typeof handleAdd === 'function' && (
        <Button.Simple
          className={className.greenButton}
          aria-label={formsText('createRecordButtonDescription')}
          title={formsText('createRecordButtonDescription')}
          onClick={(): void => handleAdd()}
        >
          +
        </Button.Simple>
      )}
    </div>
  );
}

function Search<SCHEMA extends AnySchema>({
  model,
  otherSideName,
  parentUrl,
  onAdd: handleAdd,
}: {
  readonly model: SpecifyModel<SCHEMA>;
  readonly otherSideName: string;
  readonly parentUrl: string;
  readonly onAdd: (resource: SpecifyResource<SCHEMA>) => void;
}): JSX.Element {
  React.useEffect(() => {
    if (containerRef.current === null) return;
    // TODO: rewrite to React
    const view = new QueryCbxSearch({
      el: containerRef.current,
      model: new model.Resource(
        {},
        {
          noBusinessRules: true,
          noValidation: true,
        }
      ),
      selected(resource: SpecifyResource<SCHEMA>) {
        resource.set(otherSideName, parentUrl as any);
        resource
          .save()
          .then(() => handleAdd(resource))
          .catch(crash);
      },
    }).render();
    return (): void => view.remove();
  }, [model, otherSideName, parentUrl]);

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  return <div ref={containerRef} />;
}

export type RecordSelectorProps<SCHEMA extends AnySchema> = {
  readonly isReadOnly: boolean;
  readonly model: SpecifyModel<SCHEMA>;
  readonly formType?: FormType;
  readonly viewName?: string;
  readonly field?: Relationship;
  readonly records: RA<SpecifyResource<SCHEMA> | undefined>;
  readonly onAdd: undefined | ((resource: SpecifyResource<SCHEMA>) => void);
  readonly onDelete: () => void;
  readonly relatedResource?: SpecifyResource<AnySchema>;
  readonly isDependent: boolean;
  readonly defaultIndex?: number;
  readonly onSaved?: ResourceViewProps<SCHEMA>['onSaved'];
  readonly renderResourceView: ResourceViewProps<SCHEMA>['children'];
  readonly children: (props: {
    // Delete confirmation or search dialogs
    readonly dialogs: JSX.Element;
    readonly slider: JSX.Element;
    readonly index: number;
    readonly totalCount: number;
    readonly resource: SpecifyResource<SCHEMA> | undefined;
    readonly resourceView: JSX.Element | undefined;
    readonly onAdd: () => void;
    readonly onRemove: () => void;
    // True while fetching new record
    readonly isLoading: boolean;
  }) => JSX.Element;
  readonly index: number;
  readonly onSlide: (newIndex: number) => void;
  readonly totalCount: number;
};

// FIXME: display old record with Loading message while loading new record
export function RecordSelector<SCHEMA extends AnySchema>({
  isReadOnly: readOnly,
  model,
  formType = 'form',
  viewName,
  field,
  records,
  onAdd: handleAdded,
  onDelete: handleDelete,
  isDependent,
  relatedResource,
  onSaved: handleSaved,
  renderResourceView,
  children,
  index,
  onSlide: handleSlide,
  totalCount,
}: RecordSelectorProps<SCHEMA>): JSX.Element {
  const lastIndexRef = React.useRef<number>(index);
  React.useEffect(
    () => (): void => {
      lastIndexRef.current = index;
    },
    [index]
  );

  const isReadOnly = readOnly && !isDependent;

  const [state, setState] = React.useState<
    'main' | 'deleteDialog' | 'addBySearch'
  >();

  function handleAdd(): void {
    if (typeof handleAdded === 'undefined') return;

    if (isDependent) {
      const resource = new model.Resource();
      if (
        typeof field?.otherSideName === 'string' &&
        typeof relatedResource === 'object' &&
        !relatedResource.isNew()
      )
        resource.set(field.otherSideName, relatedResource.url() as any);
      handleAdded(resource);
      handleSlide(totalCount);
    } else setState('addBySearch');
  }

  function handleRemove(): void {
    if (records.length === 0) return;
    handleSlide(Math.min(index, totalCount - 2));

    if (isDependent) handleDelete();
    else setState('deleteDialog');
  }

  return children({
    slider: (
      <Slider
        value={index}
        count={totalCount}
        onChange={handleSlide}
        onAdd={undefined}
      />
    ),
    index,
    totalCount,
    isLoading: typeof records[index] === 'object',
    resource: records[index],
    resourceView:
      typeof records[index] === 'object' ||
      typeof records[lastIndexRef.current] === 'object' ? (
        <ResourceView
          resource={defined(records[index] ?? records[lastIndexRef.current])}
          mode={isReadOnly ? 'view' : 'edit'}
          viewName={viewName}
          type={formType}
          canAddAnother={false}
          isSubView={true}
          onClose={f.void}
          onSaved={handleSaved}
          onDeleted={handleDelete}
        >
          {renderResourceView}
        </ResourceView>
      ) : undefined,
    dialogs: (
      <>
        {state === 'deleteDialog' ? (
          <Dialog
            title={field?.label ?? model?.label}
            header={formsText('removeRecordDialogHeader')}
            onClose={(): void => setState('main')}
            buttons={
              <>
                <Button.Red
                  onClick={(): void => {
                    handleDelete();
                    setState('main');
                  }}
                >
                  {commonText('delete')}
                </Button.Red>
                <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
              </>
            }
          >
            {formsText('removeRecordDialogMessage')}
          </Dialog>
        ) : state === 'addBySearch' && typeof handleAdded === 'function' ? (
          <Search
            model={model}
            otherSideName={defined(field?.otherSideName)}
            parentUrl={defined(relatedResource).url()}
            onAdd={(record) => {
              handleAdded(record);
              handleSlide(totalCount);
            }}
          />
        ) : undefined}
      </>
    ),
    onAdd: handleAdd,
    onRemove: handleRemove,
  });
}
