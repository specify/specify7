import React from 'react';

import collectionapi from '../collectionapi';
import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import * as navigation from '../navigation';
import * as queryString from '../querystring';
import specifyform from '../specifyform';
import type { Collection } from '../specifymodel';
import type { RA } from '../types';
import { crash } from './errorboundary';
import { LoadingScreen } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import { RecordSelector } from './recordselector';

function getDefaultIndex(queryParameter: string, lastIndex: number): number {
  const parameters = queryString.parse();
  const index = Number.parseInt(parameters[queryParameter]);
  return parameters[queryParameter] === 'end'
    ? lastIndex
    : Number.isNaN(index)
    ? 0
    : index;
}

function setQueryParameter(queryParameter: string, index: number): void {
  const parameters = { [queryParameter]: index.toString() };
  navigation.push(queryString.format(window.location.href, parameters));
}

/** A wrapper for RecordSelector to integrate with Backbone.Collection */
function CollectionToRecordSelector<SCHEMA extends AnySchema>({
  collection,
  onAdd: handleAdd,
  onDelete: handleDelete,
  onSlide: handleSlide,
  ...rest
}: {
  readonly collection: Collection<SCHEMA>;
} & Partial<Pick<Parameters<typeof RecordSelector>[0], 'onAdd' | 'onDelete'>> &
  Omit<
    Parameters<typeof RecordSelector>[0],
    | 'model'
    | 'relatedResource'
    | 'records'
    | 'isDependent'
    | 'onAdd'
    | 'onDelete'
  >): JSX.Element {
  const [isLoading, setIsLoading] = React.useState(true);
  const [records, setRecords] = React.useState<RA<SpecifyResource<SCHEMA>>>(
    collection.models
  );
  const isDependent = collection instanceof collectionapi.Dependent;
  const isLazy = collection instanceof collectionapi.Lazy;

  // Fetch records if needed
  React.useEffect(() => {
    if (isLazy)
      Promise.resolve(collection.fetchIfNotPopulated())
        .then(() => setIsLoading(false))
        .catch(crash);
    else setIsLoading(false);
  }, [collection, isLazy]);

  // Listen for changes to collection
  React.useEffect(() => {
    const updateRecords = (): void => setRecords(collection.models);
    collection.on('add remove destroy', updateRecords);
    return (): void => collection.off('add remove destroy', updateRecords);
  }, [collection]);

  return isLoading ? (
    <LoadingScreen />
  ) : (
    <RecordSelector
      model={collection.model.specifyModel}
      relatedResource={collection.related}
      records={records}
      isDependent={isDependent}
      onAdd={(resource): void => {
        collection.add(resource);
        handleAdd?.(resource);
      }}
      onDelete={(index): void => {
        collection.remove(records[index]);
        handleDelete?.(index);
      }}
      onSlide={(index: number): void => {
        if (
          isLazy &&
          index === collection.models.length - 1 &&
          !collection.isComplete()
        )
          collection.fetchIfNotFetching().catch(crash);
        handleSlide?.(index);
      }}
      {...rest}
    />
  );
}

/** A Wrapper for RecordSelector for easier usage in Backbone Views */
function IntegratedRecordSelector({
  subformNode,
  htmlElement = subformNode,
  isReadOnly = false,
  collection,
  ...rest
}: Omit<
  Parameters<typeof CollectionToRecordSelector>[0],
  'sliderPosition' | 'formType' | 'viewName' | 'isReadOnly'
> & {
  subformNode: HTMLElement;
  htmlElement?: HTMLElement;
  isReadOnly?: boolean;
}): JSX.Element {
  return (
    <CollectionToRecordSelector
      collection={collection}
      isReadOnly={isReadOnly || specifyform.subViewMode(subformNode) === 'view'}
      sliderPosition={
        htmlElement.classList.contains('slider-at-top') ? 'top' : 'bottom'
      }
      defaultIndex={getDefaultIndex(
        htmlElement.dataset['url-param'] ?? '',
        collection.models.length
      )}
      onSlide={(index): void =>
        typeof htmlElement.dataset['url-param'] === 'string'
          ? setQueryParameter(htmlElement.dataset['url-param'], index)
          : undefined
      }
      formType={specifyform.getSubViewType(subformNode)}
      viewName={htmlElement.dataset['specify-viewname']}
      {...rest}
    />
  );
}

export const RecordSelectorView = createBackboneView(IntegratedRecordSelector);
