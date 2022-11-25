import React from 'react';
import type { State } from 'typesafe-reducer';

import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { clamp } from '../../utils/utils';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { Relationship } from '../DataModel/specifyField';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { SearchDialog } from '../Forms/SearchDialog';
import { Slider } from './Slider';

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
    | ((resources: RA<SpecifyResource<SCHEMA>>) => void)
    | undefined;
  // Callback to call when a record needs to be removed from the record set
  readonly onDelete:
    | ((index: number, source: 'deleteButton' | 'minusButton') => void)
    | undefined;
  readonly defaultIndex?: number;
  // Current index in the collection
  readonly index: number;
  // Event handler for index change
  readonly onSlide:
    | ((newIndex: number, callback?: () => void) => void)
    | undefined;
  // Total number of elements in the collection
  readonly totalCount: number;
};

export type RecordSelectorState<SCHEMA extends AnySchema> = {
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
};

export function useRecordSelector<SCHEMA extends AnySchema>({
  model,
  field,
  records,
  onAdd: handleAdded,
  onDelete: handleDelete,
  relatedResource,
  index,
  onSlide: handleSlide,
  totalCount,
}: RecordSelectorProps<SCHEMA>): RecordSelectorState<SCHEMA> {
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

  return {
    slider: <Slider count={totalCount} value={index} onChange={handleSlide} />,
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
      typeof handleDelete === 'function' && typeof handleSlide === 'function'
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
  };
}
