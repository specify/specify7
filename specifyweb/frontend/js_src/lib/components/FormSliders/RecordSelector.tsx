import React from 'react';

import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { clamp } from '../../utils/utils';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { Relationship } from '../DataModel/specifyField';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { useSearchDialog } from '../SearchDialog';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import { Slider } from './Slider';

export type RecordSelectorProps<SCHEMA extends AnySchema> = {
  readonly table: SpecifyTable<SCHEMA>;
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
    | ((newIndex: number, replace: boolean, callback?: () => void) => void)
    | undefined;
  readonly isCollapsed?: boolean;
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
  readonly onAdd:
    | ((resources: RA<SpecifyResource<SCHEMA>>) => void)
    | undefined;
  // Set this as an "Remove" button event listener
  readonly onRemove:
    | ((source: 'deleteButton' | 'minusButton') => void)
    | undefined;
  readonly showSearchDialog: () => void;
  // True while fetching new record
  readonly isLoading: boolean;
};

export function useRecordSelector<SCHEMA extends AnySchema>({
  table,
  field,
  records,
  onAdd: handleAdded,
  onDelete: handleDelete,
  relatedResource,
  index,
  onSlide: handleSlide,
  totalCount,
}: RecordSelectorProps<SCHEMA> & {
  // Total number of elements in the collection
  readonly totalCount: number;
}): RecordSelectorState<SCHEMA> {
  const lastIndexRef = React.useRef<number>(index);
  React.useEffect(
    () => (): void => {
      lastIndexRef.current = index;
    },
    [index]
  );

  const isToOne =
    field === undefined
      ? false
      : !relationshipIsToMany(field) || field.type === 'zero-to-one';

  const handleResourcesSelected = React.useMemo(
    () =>
      typeof handleAdded === 'function'
        ? (resources: RA<SpecifyResource<SCHEMA>>): void => {
            if (field?.isDependent() ?? true)
              f.maybe(field?.otherSideName, (fieldName) =>
                f.maybe(relatedResource?.url(), (url) =>
                  resources.forEach((resource) => {
                    resource.set(fieldName, url as never);
                  })
                )
              );
            handleAdded(resources);
          }
        : undefined,
    [handleAdded, relatedResource, field]
  );

  const { searchDialog, showSearchDialog } = useSearchDialog({
    extraFilters: undefined,
    forceCollection: undefined,
    multiple: !isToOne,
    table,
    onSelected: handleResourcesSelected,
    onAdd: handleAdded,
  });

  return {
    slider: (
      <Slider
        count={totalCount}
        value={index}
        onChange={
          handleSlide === undefined
            ? undefined
            : (index): void => handleSlide?.(index, false)
        }
      />
    ),
    index,
    totalCount,
    isLoading: records[index] === undefined && totalCount !== 0,
    // While new resource is loading, display previous resource
    resource: records[index] ?? records[lastIndexRef.current],
    dialogs: searchDialog,
    onAdd:
      typeof handleAdded === 'function'
        ? (resources: RA<SpecifyResource<SCHEMA>>): void => {
            if (typeof relatedResource === 'object') {
              const resource = resources[0];
              if (
                typeof field?.otherSideName === 'string' &&
                field.isDependent() &&
                !relatedResource.isNew()
              )
                resource.set(field.otherSideName, relatedResource.url() as any);
              handleAdded([resource]);
            } else showSearchDialog();
          }
        : undefined,
    onRemove:
      typeof handleDelete === 'function' && typeof handleSlide === 'function'
        ? (source): void =>
            records.length > 0
              ? handleSlide(
                  clamp(
                    0,
                    /*
                     * Previous index decides which direction to go in
                     * once item is deleted
                     */
                    index < lastIndexRef.current ? index - 1 : index,
                    totalCount - 2
                  ),
                  true,
                  () => handleDelete(index, source)
                )
              : undefined
        : undefined,
    showSearchDialog,
  };
}
