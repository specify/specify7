import React from 'react';

import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import type { FormMode, FormType } from '../parseform';
import type { Relationship } from '../specifyfield';
import type { Collection } from '../specifymodel';
import { relationshipIsToMany } from '../wbplanviewmappinghelper';
import { Button } from './basic';
import { TableIcon } from './common';
import { useAsyncState, useBooleanState } from './hooks';
import { IntegratedRecordSelector } from './recordselectorutils';

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
  icon = parentResource.specifyModel.getIcon(),
}: {
  readonly field: Relationship;
  readonly parentResource: SpecifyResource<AnySchema>;
  readonly mode: FormMode;
  readonly parentFormType: FormType;
  readonly formType: FormType;
  readonly isButton: boolean;
  readonly icon: string | undefined;
  readonly viewName: string | undefined;
}): JSX.Element {
  const [resourceUrl, setResourceUrl] = React.useState<string | null>('');
  React.useEffect(() => {
    const handleChange = (): void =>
      setResourceUrl(parentResource.get('field'));
    parentResource.on(`change:${field.name.toLowerCase()}`, handleChange);
    handleChange();
    return (): void =>
      parentResource.off(`change:${field.name.toLowerCase()}`, handleChange);
  }, [parentResource, field]);

  const [collection] = useAsyncState(
    React.useCallback(() => {
      if (resourceUrl === '') return undefined;
      else if (relationshipIsToMany(field))
        return parentResource.rgetCollection(field.name);
      else {
        const resource = parentResource.rgetPromise(field.name);
        const collection = (
          field.isDependent()
            ? new field.relatedModel.DependentCollection({
                related: parentResource,
                field: field.getReverse(),
              })
            : new field.relatedModel.LazyCollection()
        ) as Collection<AnySchema>;
        if (typeof resource === 'object') collection.add(resource);
        return collection;
      }
    }, [resourceUrl, parentResource, field]),
    false
  );

  const [isOpen, _, handleClose, handleToggle] = useBooleanState(!isButton);
  return (
    <SubViewContext.Provider value={field}>
      {isButton && (
        <Button.Gray
          title={field.label}
          aria-pressed={isOpen}
          onClick={handleToggle}
        >
          {parentFormType === 'form' && <TableIcon name={icon} />}
          <span className="bg-neutral-800 p-1 font-bold bg-white border-gray-500 rounded">
            {collection?.models.length ?? commonText('loading')}
          </span>
        </Button.Gray>
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
        />
      )}
    </SubViewContext.Provider>
  );
}
