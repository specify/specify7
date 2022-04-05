import React from 'react';

import type { AnySchema } from '../datamodelutils';
import { f } from '../functools';
import { clamp } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import type { Relationship } from '../specifyfield';
import type { SpecifyModel } from '../specifymodel';
import type { RA } from '../types';
import { Button, className, Input } from './basic';
import { Dialog } from './modaldialog';
import { SearchDialog } from './searchdialog';

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
          <Input.Number
            className="no-arrows dark:bg-neutral-600 absolute top-0 left-0 w-full h-full font-bold bg-white border-0"
            min="1"
            max={count}
            step="1"
            // Convert 0-based indexing to 1-based
            value={isBlank ? '' : value + 1}
            onValueChange={(value): void => {
              setIsBlank(Number.isNaN(value));
              if (!Number.isNaN(value))
                handleChange(clamp(0, count - 1, value - 1));
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
          onClick={handleAdd}
        >
          +
        </Button.Simple>
      )}
    </div>
  );
}

function Search<SCHEMA extends AnySchema>({
  model,
  onAdd: handleAdd,
  onClose: handleClose,
}: {
  readonly model: SpecifyModel<SCHEMA>;
  readonly onAdd: (resource: SpecifyResource<SCHEMA>) => void;
  readonly onClose: () => void;
}): JSX.Element {
  const resource = React.useMemo(
    () =>
      new model.Resource(
        {},
        {
          noBusinessRules: true,
          noValidation: true,
        }
      ),
    [model]
  );
  return (
    <SearchDialog<SCHEMA>
      templateResource={resource}
      forceCollection={undefined}
      extraFilters={undefined}
      onSelected={(resource): void => {
        handleAdd(resource);
        handleClose();
      }}
      onClose={handleClose}
    />
  );
}

export type RecordSelectorProps<SCHEMA extends AnySchema> = {
  readonly model: SpecifyModel<SCHEMA>;
  // Related field
  readonly field?: Relationship;
  // A record on which this record set is dependent
  readonly relatedResource?: SpecifyResource<AnySchema>;
  // List of record set items
  readonly records: RA<SpecifyResource<SCHEMA> | undefined>;
  // Callback to call when new record needs to be added to the record set
  readonly onAdd: undefined | ((resource: SpecifyResource<SCHEMA>) => void);
  // Callback to call when new record needs to be added to the record set
  readonly onDelete: undefined | ((index: number) => void);
  readonly defaultIndex?: number;
  // Render function. Allows to customize placement of elements and features
  readonly children: (props: {
    // Delete confirmation or search dialogs
    readonly dialogs: JSX.Element;
    // Record Selector slider component
    readonly slider: JSX.Element;
    // Index of current resource in the RecordSet
    readonly index: number;
    // Readonly resourceView: JSX.Element | undefined;
    readonly totalCount: number;
    // Use this to render <ResourceView>
    readonly resource: SpecifyResource<SCHEMA> | undefined;
    // Set this as an "Add" button event listener
    readonly onAdd: () => void;
    // Set this as an "Remove" button event listener
    readonly onRemove: () => void;
    // True while fetching new record
    readonly isLoading: boolean;
  }) => JSX.Element;
  // Current index in the collection
  readonly index: number;
  // Event handler for index change
  readonly onSlide: (newIndex: number) => void;
  // Total number of elements in the collection
  readonly totalCount: number;
};

// FIXME: STYLE: display old record with Loading message while loading new record
export function BaseRecordSelector<SCHEMA extends AnySchema>({
  model,
  field,
  records,
  onAdd: handleAdded,
  onDelete: handleDelete,
  relatedResource,
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

  const [state, setState] = React.useState<
    'main' | 'deleteDialog' | 'addBySearch'
  >();

  function handleAdd(): void {
    if (typeof handleAdded === 'undefined') return;

    if (typeof relatedResource === 'object') {
      const resource = new model.Resource();
      if (typeof field?.otherSideName === 'string' && !relatedResource.isNew())
        resource.set(field.otherSideName, relatedResource.url() as any);
      handleAdded(resource);
      handleSlide(totalCount);
    } else setState('addBySearch');
  }

  function handleRemove(): void {
    if (records.length === 0 || typeof handleDelete === 'undefined') return;
    handleSlide(Math.min(index, totalCount - 2));

    if (typeof relatedResource === 'object') handleDelete(index);
    else setState('deleteDialog');
  }

  return children({
    slider: (
      <Slider
        value={
          typeof records[index] === 'object' ? index : lastIndexRef.current
        }
        count={totalCount}
        onChange={handleSlide}
        onAdd={undefined}
      />
    ),
    index,
    totalCount,
    isLoading: typeof records[index] === 'object',
    // While new resource is loading, display previous resource
    resource: records[index] ?? records[lastIndexRef.current],
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
                    handleDelete?.(index);
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
            onAdd={(record): void => {
              f.maybe(field?.otherSideName, (fieldName) =>
                f.maybe(relatedResource?.url(), (url) =>
                  record.set(fieldName, url as never)
                )
              );
              handleAdded(record);
              handleSlide(totalCount);
            }}
            onClose={(): void => setState('main')}
          />
        ) : undefined}
      </>
    ),
    onAdd: handleAdd,
    onRemove: handleRemove,
  });
}
