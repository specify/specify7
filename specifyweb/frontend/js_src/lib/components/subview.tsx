import React from 'react';

import type { AnySchema } from '../datamodelutils';
import { sortFunction } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import type { FormMode, FormType } from '../parseform';
import type { Relationship } from '../specifyfield';
import type { Collection } from '../specifymodel';
import { relationshipIsToMany } from '../wbplanviewmappinghelper';
import { Button } from './basic';
import { TableIcon } from './common';
import { useAsyncState, useBooleanState } from './hooks';
import { IntegratedRecordSelector } from './recordselectorutils';
import { resourceOn } from '../resource';

export const SubViewContext = React.createContext<Relationship | undefined>(
  undefined
);
SubViewContext.displayName = 'SubViewContext';

export function SubView({
  field,
  parentResource,
  mode: initialMode,
  parentFormType,
  formType,
  isButton,
  viewName = field.relatedModel.view,
  icon = field.relatedModel.name,
  sortField,
}: {
  readonly field: Relationship;
  readonly parentResource: SpecifyResource<AnySchema>;
  readonly mode: FormMode;
  readonly parentFormType: FormType;
  readonly formType: FormType;
  readonly isButton: boolean;
  readonly icon: string | undefined;
  readonly viewName: string | undefined;
  readonly sortField: string | undefined;
}): JSX.Element {
  const [resourceUrl, setResourceUrl] = React.useState<string | null>('');
  React.useEffect(
    () =>
      resourceOn(
        parentResource,
        `change:${field.name}`,
        (): void => setResourceUrl(parentResource.get(field.name)),
        true
      ),
    [parentResource, field]
  );

  const [collection] = useAsyncState(
    React.useCallback(async () => {
      if (resourceUrl === '') return undefined;
      else if (relationshipIsToMany(field) && field.type !== 'zero-to-one')
        return parentResource.rgetCollection(field.name).then((collection) => {
          if (collection === null)
            return new field.relatedModel.DependentCollection({
              related: parentResource,
              field: field.getReverse(),
            }) as Collection<AnySchema>;
          if (typeof sortField === 'undefined') return collection;
          const isReverse = sortField.startsWith('-');
          const fieldName = sortField.startsWith('-')
            ? sortField.slice(1)
            : sortField;
          // @ts-expect-error Overwriting the models on the collection
          collection.models = Array.from(collection.models).sort(
            sortFunction((resource) => resource.get(fieldName), isReverse)
          );
          return collection;
        });
      else {
        const resource = await parentResource.rgetPromise(field.name);
        const collection = (
          field.isDependent()
            ? new field.relatedModel.DependentCollection({
                related: parentResource,
                field: field.getReverse(),
              })
            : new field.relatedModel.LazyCollection()
        ) as Collection<AnySchema>;
        if (typeof resource === 'object' && resource !== null)
          collection.add(resource);
        return collection;
      }
    }, [sortField, resourceUrl, parentResource, field]),
    false
  );

  const [isOpen, _, handleClose, handleToggle] = useBooleanState(!isButton);
  return (
    <SubViewContext.Provider value={field}>
      {isButton && (
        <Button.BorderedGray
          title={field.label}
          aria-label={field.label}
          aria-pressed={isOpen}
          onClick={handleToggle}
          className="w-fit"
        >
          {/*
           * Attachment table icons have lots of vertical white space, making
           * them look overly small on the forms.
           * See https://github.com/specify/specify7/issues/1259
           * Thus, have to introduce some inconsistency here
           */}
          {parentFormType === 'form' && (
            <TableIcon name={icon} tableLabel={undefined} className="w-8 h-8" />
          )}
          <span className="dark:bg-neutral-800 p-1 font-bold bg-white border-gray-500 rounded">
            {collection?.models.length ?? commonText('loading')}
          </span>
        </Button.BorderedGray>
      )}
      {typeof collection === 'object' && isOpen && (
        <IntegratedRecordSelector
          viewName={viewName}
          formType={formType}
          dialog={isButton ? 'nonModal' : false}
          mode={field.isDependent() && initialMode !== 'view' ? 'edit' : 'view'}
          collection={collection}
          onAdd={
            relationshipIsToMany(field)
              ? undefined
              : (resource): void =>
                  void parentResource.set(field.name, resource as never)
          }
          onDelete={
            relationshipIsToMany(field)
              ? undefined
              : (): void => void parentResource.set(field.name, null as never)
          }
          onClose={handleClose}
          sortField={sortField}
        />
      )}
    </SubViewContext.Provider>
  );
}
