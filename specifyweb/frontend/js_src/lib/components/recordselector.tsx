import React from 'react';
import type { State } from 'typesafe-reducer';

import type { AnySchema } from '../datamodelutils';
import { f } from '../functools';
import { clamp } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import { formsText } from '../localization/forms';
import type { Relationship } from '../specifyfield';
import type { SpecifyModel } from '../specifymodel';
import type { RA } from '../types';
import { Button, Input } from './basic';
import { SearchDialog } from './searchdialog';

export function Slider({
  value,
  count,
  onChange: handleChange,
}: {
  readonly value: number;
  readonly count: number;
  readonly onChange: (newValue: number) => void;
}): JSX.Element | null {
  const [pendingValue, setPendingValue] = React.useState<number>(value);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  React.useEffect(
    () =>
      document.activeElement === inputRef.current
        ? undefined
        : setPendingValue(value),
    [value]
  );
  return count > 0 ? (
    <div className="flex justify-center gap-2 print:hidden">
      <Button.Small
        aria-label={formsText('firstRecord')}
        disabled={value == 0}
        title={formsText('firstRecord')}
        onClick={(): void => handleChange(0)}
      >
        ≪
      </Button.Small>
      <Button.Small
        aria-label={formsText('previousRecord')}
        className="bg-white px-4 dark:bg-neutral-500"
        disabled={value == 0}
        title={formsText('previousRecord')}
        onClick={(): void => handleChange(value - 1)}
      >
        {'<'}
      </Button.Small>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 font-bold">
        <label
          className={`
            relative h-full after:invisible after:p-2
            after:content-[attr(data-value)]
          `}
          data-value={value}
        >
          <span className="sr-only">{formsText('currentRecord', count)}</span>
          <Input.Number
            className={`
              no-arrows absolute top-0 left-0 h-full bg-white
              text-center font-bold ring-0 dark:bg-neutral-600
            `}
            forwardRef={inputRef}
            /*
             * Count is 0 when input is invisible, which causes the field to be
             * invalid (as min is 1) which inhibits form submission
             */
            max={Math.max(1, count)}
            min={1}
            // Convert 0-based indexing to 1-based
            step={1}
            value={Number.isNaN(pendingValue) ? '' : pendingValue + 1}
            onBlur={(): void => setPendingValue(value)}
            onValueChange={(value): void => {
              const newValue = clamp(0, value - 1, count - 1);
              setPendingValue(newValue);
              if (!Number.isNaN(value)) handleChange(newValue);
            }}
          />
        </label>
        <span>/</span>
        <span>{count}</span>
      </div>
      <Button.Small
        aria-label={formsText('nextRecord')}
        className="bg-white px-4 dark:bg-neutral-500"
        disabled={value + 1 == count}
        title={formsText('nextRecord')}
        onClick={(): void => handleChange(value + 1)}
      >
        {'>'}
      </Button.Small>
      <Button.Small
        aria-label={formsText('lastRecord')}
        disabled={value + 1 == count}
        title={formsText('lastRecord')}
        onClick={(): void => handleChange(count - 1)}
      >
        ≫
      </Button.Small>
    </div>
  ) : null;
}

function Search<SCHEMA extends AnySchema>({
  model,
  onAdd: handleAdd,
  onClose: handleClose,
}: {
  readonly model: SpecifyModel<SCHEMA>;
  readonly onAdd: (resources: RA<SpecifyResource<SCHEMA>>) => void;
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
      extraFilters={undefined}
      forceCollection={undefined}
      multiple
      templateResource={resource}
      onClose={handleClose}
      onSelected={handleAdd}
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
  readonly onAdd:
    ((resources: RA<SpecifyResource<SCHEMA>>) => void) | undefined;
  // Callback to call when a record needs to be removed from the record set
  readonly onDelete:
    ((index: number, source: 'deleteButton' | 'minusButton') => void) | undefined;
  readonly defaultIndex?: number;
  // Render function. Allows to customize placement of elements and features
  readonly children: (props: {
    // Delete confirmation or search dialogs
    readonly dialogs: JSX.Element | null;
    // Record Selector slider component
    readonly slider: JSX.Element;
    // Index of current resource in the RecordSet
    readonly index: number;
    // Readonly resourceView: JSX.Element | undefined;
    readonly totalCount: number;
    // Use this to render <ResourceView>
    readonly resource: SpecifyResource<SCHEMA> | undefined;
    // Set this as an "Add" button event listener
    readonly onAdd: (() => void) | undefined;
    // Set this as an "Remove" button event listener
    readonly onRemove:
      | ((source: 'deleteButton' | 'minusButton') => void)
      | undefined;
    // True while fetching new record
    readonly isLoading: boolean;
  }) => JSX.Element;
  // Current index in the collection
  readonly index: number;
  // Event handler for index change
  readonly onSlide: (newIndex: number, callback?: () => void) => void;
  // Total number of elements in the collection
  readonly totalCount: number;
};

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
    State<'AddBySearch'> | State<'Main'>
  >({ type: 'Main' });

  return children({
    slider: (
      <Slider
        count={totalCount}
        value={
          typeof records[index] === 'object' ? index : lastIndexRef.current
        }
        onChange={handleSlide}
      />
    ),
    index,
    totalCount,
    isLoading: records[index] === undefined,
    // While new resource is loading, display previous resource
    resource: records[index] ?? records[lastIndexRef.current],
    dialogs:
      state.type === 'AddBySearch' && typeof handleAdded === 'function' ? (
        <Search
          model={model}
          onAdd={(resources): void => {
            f.maybe(field?.otherSideName, (fieldName) =>
              f.maybe(relatedResource?.url(), (url) =>
                resources.forEach((resource) =>
                  resource.set(fieldName, url as never)
                )
              )
            );
            handleAdded(resources);
          }}
          onClose={(): void => setState({ type: 'Main' })}
        />
      ) : null,
    onAdd:
      typeof handleAdded === 'function'
        ? (): void => {
            if (typeof relatedResource === 'object') {
              const resource = new model.Resource();
              if (
                typeof field?.otherSideName === 'string' &&
                !relatedResource.isNew()
              )
                resource.set(field.otherSideName, relatedResource.url() as any);
              handleAdded([resource]);
            } else setState({ type: 'AddBySearch' });
          }
        : undefined,
    onRemove:
      typeof handleDelete === 'function'
        ? (source): void =>
            records.length > 0
              ? handleSlide(
                  clamp(
                    0,
                    // New index depends on the direction you came from
                    index < lastIndexRef.current ? index - 1 : index,
                    totalCount - 2
                  ),
                  () => handleDelete(index, source)
                )
              : undefined
        : undefined,
  });
}
