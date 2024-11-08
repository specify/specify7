import React from 'react';

import { usePromise } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useTriggerState } from '../../hooks/useTriggerState';
import { commonText } from '../../localization/common';
import type { RA } from '../../utils/types';
import { overwriteReadOnly } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { attachmentSettingsPromise } from '../Attachments/attachments';
import { attachmentRelatedTables } from '../Attachments/utils';
import { ReadOnlyContext } from '../Core/Contexts';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceOn } from '../DataModel/resource';
import type { Relationship } from '../DataModel/specifyField';
import type { Collection } from '../DataModel/specifyTable';
import { raise, softFail } from '../Errors/Crash';
import type { FormType } from '../FormParse';
import type { SubViewSortField } from '../FormParse/cells';
import { IntegratedRecordSelector } from '../FormSliders/IntegratedRecordSelector';
import { TableIcon } from '../Molecules/TableIcon';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';

export const SubViewContext = React.createContext<
  | {
      readonly relationship: Relationship | undefined;
      readonly formType: FormType;
      readonly sortField: SubViewSortField | undefined;
      readonly handleChangeFormType: (formType: FormType) => void;
      readonly handleChangeSortField: (
        sortField: SubViewSortField | undefined
      ) => void;
    }
  | undefined
>(undefined);
SubViewContext.displayName = 'SubViewContext';

export function SubView({
  relationship,
  parentResource,
  parentFormType,
  formType: initialFormType,
  isButton: rawIsButton,
  viewName = relationship.relatedTable.view,
  icon = relationship.relatedTable.name,
  sortField: initialSortField,
  isCollapsed,
}: {
  readonly relationship: Relationship;
  readonly parentResource: SpecifyResource<AnySchema>;
  readonly parentFormType: FormType;
  readonly formType: FormType;
  readonly isButton: boolean;
  readonly icon: string | undefined;
  readonly viewName: string | undefined;
  readonly sortField: SubViewSortField | undefined;
  readonly isCollapsed?: boolean;
}): JSX.Element {
  const [sortField, setSortField] = useTriggerState(initialSortField);

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
            // TEST: check if this can ever happen
            if (collection === null || collection === undefined)
              return new relationship.relatedTable.DependentCollection({
                related: parentResource,
                field: relationship.getReverse(),
              }) as Collection<AnySchema>;
            if (sortField === undefined) return collection;
            // BUG: this does not look into related tables
            const field = sortField.fieldNames[0];
            // Overwriting the tables on the collection
            overwriteReadOnly(
              collection,
              'models',
              Array.from(collection.models).sort(
                sortFunction(
                  (resource) => resource.get(field),
                  sortField.direction === 'desc'
                )
              )
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
        const reverse = relationship.getReverse();
        if (reverse === undefined) {
          softFail(
            new Error(
              `Can't render a SubView for ` +
                `${relationship.table.name}.${relationship.name} because ` +
                `reverse relationship does not exist`
            )
          );
          return undefined;
        }
        const collection = (
          relationship.isDependent()
            ? new relationship.relatedTable.DependentCollection({
                related: parentResource,
                field: reverse,
              })
            : new relationship.relatedTable.LazyCollection({
                filters: {
                  [reverse.name]: parentResource.id,
                },
              })
        ) as Collection<AnySchema>;
        if (relationship.isDependent() && parentResource.isNew())
          // Prevent fetching related for newly created parent
          overwriteReadOnly(collection, '_totalCount', 0);

        if (typeof resource === 'object' && resource !== null)
          collection.add(resource);
        overwriteReadOnly(
          collection,
          'related',
          collection.related ?? parentResource
        );
        overwriteReadOnly(
          collection,
          'field',
          collection.field ?? relationship.getReverse()
        );
        return collection;
      }
    },
    [parentResource, relationship, sortField]
  );

  const [collection, setCollection] = React.useState<
    Collection<AnySchema> | undefined
  >(undefined);
  const versionRef = React.useRef<number>(0);
  React.useEffect(
    () =>
      resourceOn(
        parentResource,
        `change:${relationship.name}`,
        (): void => {
          versionRef.current += 1;
          const localVersionRef = versionRef.current;
          fetchCollection()
            .then((collection) =>
              /*
               * If value changed since begun fetching, don't update the
               * collection to prevent a race condition.
               * REFACTOR: simplify this
               */
              versionRef.current === localVersionRef
                ? setCollection(collection)
                : undefined
            )
            .catch(raise);
        },
        true
      ),
    [parentResource, relationship, fetchCollection]
  );

  const [formType, setFormType] = useTriggerState(initialFormType);
  const contextValue = React.useMemo(
    () => ({
      relationship,
      formType,
      sortField,
      handleChangeFormType: setFormType,
      handleChangeSortField: setSortField,
    }),
    [relationship, formType, sortField, setFormType, setSortField]
  );

  const isReadOnly = React.useContext(ReadOnlyContext);

  // See https://github.com/specify/specify7/issues/3127
  const isButton = rawIsButton || (!isReadOnly && !relationship.isDependent());
  const [isOpen, _, handleClose, handleToggle] = useBooleanState(!isButton);

  const [isAttachmentConfigured] = usePromise(attachmentSettingsPromise, true);

  const isAttachmentTable = attachmentRelatedTables().includes(
    relationship.relatedTable.name
  );

  const handleAdd = React.useCallback(
    (resources: RA<SpecifyResource<AnySchema>>): void => {
      const [resource] = resources;
      const isToMany =
        relationshipIsToMany(relationship) &&
        relationship.type !== 'zero-to-one';

      if (isToMany && !relationship.isDependent())
        parentResource.addIndependentResources(relationship.name, resources);
      else if (!isToMany && !relationship.isDependent()) {
        parentResource.setIndependentResource(relationship.name, resource);
      } else if (!isToMany)
        parentResource.set(relationship.name, resource as never);
    },
    [parentResource, relationship]
  );

  const handleRemove = React.useCallback(
    (_index: number, _source: 'deleteButton' | 'minusButton'): void => {
      const isToMany =
        relationshipIsToMany(relationship) &&
        relationship.type !== 'zero-to-one';

      if (!isToMany) parentResource.set(relationship.name, null as never);
    },
    [parentResource, relationship]
  );

  const isAttachmentMisconfigured =
    isAttachmentTable && !isAttachmentConfigured;

  return (
    <SubViewContext.Provider value={contextValue}>
      {isButton && (
        <Button.BorderedGray
          aria-label={relationship.label}
          aria-pressed={isOpen}
          className={`
            w-fit 
            ${
              (collection?.models.length ?? 0) > 0
                ? '!ring-brand-300 dark:!ring-brand-400 ring-2 dark:!ring-2'
                : ''
            } 
          ${isOpen ? '!bg-brand-300 dark:!bg-brand-500' : ''}`}
          title={relationship.label}
          onClick={handleToggle}
        >
          {
            /*
             * Attachment table icons have lots of vertical white space, making
             * them look overly small on the forms.
             * See https://github.com/specify/specify7/issues/1259
             * Thus, have to introduce some inconsistency here
             */
            parentFormType === 'form' && (
              <TableIcon className="h-8 w-8" label={false} name={icon} />
            )
          }
          <span className="rounded border-gray-500 bg-white p-1 font-bold dark:bg-neutral-800">
            {collection?.models.length ?? commonText.loading()}
          </span>
        </Button.BorderedGray>
      )}
      {typeof collection === 'object' && isOpen ? (
        <ReadOnlyContext.Provider
          value={
            isReadOnly ||
            isAttachmentMisconfigured ||
            (!relationship.isDependent() && !isButton)
          }
        >
          <IntegratedRecordSelector
            collection={collection}
            dialog={isButton ? 'nonModal' : false}
            formType={formType}
            isCollapsed={isCollapsed}
            relationship={relationship}
            sortField={sortField}
            viewName={viewName}
            onAdd={handleAdd}
            onClose={handleClose}
            onDelete={handleRemove}
          />
        </ReadOnlyContext.Provider>
      ) : undefined}
    </SubViewContext.Provider>
  );
}
