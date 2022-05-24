import React from 'react';

import type { AnySchema } from '../datamodelutils';
import { sortFunction } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import type { FormMode, FormType } from '../parseform';
import { resourceOn } from '../resource';
import type { Relationship } from '../specifyfield';
import type { Collection } from '../specifymodel';
import { relationshipIsToMany } from '../wbplanviewmappinghelper';
import { Button } from './basic';
import { TableIcon } from './common';
import { crash } from './errorboundary';
import { useBooleanState } from './hooks';
import { IntegratedRecordSelector } from './recordselectorutils';

export const SubViewContext = React.createContext<Relationship | undefined>(
  undefined
);
SubViewContext.displayName = 'SubViewContext';

export function SubView({
  relationship,
  parentResource,
  mode: initialMode,
  parentFormType,
  formType,
  isButton,
  viewName = relationship.relatedModel.view,
  icon = relationship.relatedModel.name,
  sortField,
}: {
  readonly relationship: Relationship;
  readonly parentResource: SpecifyResource<AnySchema>;
  readonly mode: FormMode;
  readonly parentFormType: FormType;
  readonly formType: FormType;
  readonly isButton: boolean;
  readonly icon: string | undefined;
  readonly viewName: string | undefined;
  readonly sortField: string | undefined;
}): JSX.Element {
  const fetchCollection = React.useCallback(
    async function fetchCollection(): Promise<
      Collection<AnySchema> | undefined
    > {
      if (
        relationshipIsToMany(relationship) &&
        relationship.type !== 'zero-to-one'
      )
        return parentResource
          .rgetCollection(relationship.name)
          .then((collection) => {
            if (collection === null)
              return new relationship.relatedModel.DependentCollection({
                related: parentResource,
                field: relationship.getReverse(),
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
        /**
         * If relationship is -to-one, create a collection for the related
         * resource. This allows to reuse most of the code from the -to-many
         * relationships. RecordSelector handles collections with -to-one
         * related field by removing the "+" button after first record is added
         * and not rendering record count or record slider.
         */
        const resource = await parentResource.rgetPromise(relationship.name);
        const collection = (
          relationship.isDependent()
            ? new relationship.relatedModel.DependentCollection({
                related: parentResource,
                field: relationship.getReverse(),
              })
            : new relationship.relatedModel.LazyCollection()
        ) as Collection<AnySchema>;
        if (typeof resource === 'object' && resource !== null)
          collection.add(resource);
        // @ts-expect-error Overwriting read-only property
        collection.related ??= parentResource;
        // @ts-expect-error Overwriting read-only property
        collection.field ??= relationship.getReverse();
        return collection;
      }
    },
    [parentResource, relationship, sortField]
  );

  const [collection, setCollection] = React.useState<
    Collection<AnySchema> | undefined
  >(undefined);
  React.useEffect(
    () =>
      resourceOn(
        parentResource,
        `change:${relationship.name}`,
        (): void => void fetchCollection().then(setCollection).catch(crash),
        true
      ),
    [parentResource, relationship, fetchCollection]
  );

  const [isOpen, _, handleClose, handleToggle] = useBooleanState(!isButton);
  return (
    <SubViewContext.Provider value={relationship}>
      {isButton && (
        <Button.BorderedGray
          title={relationship.label}
          aria-label={relationship.label}
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
          mode={
            relationship.isDependent() && initialMode !== 'view'
              ? 'edit'
              : 'view'
          }
          collection={collection}
          relationship={relationship}
          onAdd={
            relationshipIsToMany(relationship) &&
            relationship.type !== 'zero-to-one'
              ? undefined
              : (resource): void =>
                  void parentResource.set(relationship.name, resource as never)
          }
          onDelete={
            relationshipIsToMany(relationship) &&
            relationship.type !== 'zero-to-one'
              ? undefined
              : (): void =>
                  void parentResource.set(relationship.name, null as never)
          }
          onClose={handleClose}
          sortField={sortField}
        />
      )}
    </SubViewContext.Provider>
  );
}
