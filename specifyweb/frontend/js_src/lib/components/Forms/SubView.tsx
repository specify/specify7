import React from 'react';

import { usePromise } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useTriggerState } from '../../hooks/useTriggerState';
import { commonText } from '../../localization/common';
import { overwriteReadOnly } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { attachmentRelatedTables } from '../Attachments';
import { attachmentSettingsPromise } from '../Attachments/attachments';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceOn } from '../DataModel/resource';
import type { Relationship } from '../DataModel/specifyField';
import type { Collection } from '../DataModel/specifyModel';
import { raise, softFail } from '../Errors/Crash';
import type { FormMode, FormType } from '../FormParse';
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
  mode: initialMode,
  parentFormType,
  formType: initialFormType,
  isButton,
  viewName = relationship.relatedModel.view,
  icon = relationship.relatedModel.name,
  sortField: initialSortField,
}: {
  readonly relationship: Relationship;
  readonly parentResource: SpecifyResource<AnySchema>;
  readonly mode: FormMode;
  readonly parentFormType: FormType;
  readonly formType: FormType;
  readonly isButton: boolean;
  readonly icon: string | undefined;
  readonly viewName: string | undefined;
  readonly sortField: SubViewSortField | undefined;
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
            if (collection === null)
              return new relationship.relatedModel.DependentCollection({
                related: parentResource,
                field: relationship.getReverse(),
              }) as Collection<AnySchema>;
            if (sortField === undefined) return collection;
            // BUG: this does not look into related tables
            const field = sortField.fieldNames[0];
            // Overwriting the models on the collection
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
                `${relationship.model.name}.${relationship.name} because ` +
                `reverse relationship does not exist`
            )
          );
          return undefined;
        }
        const collection = (
          relationship.isDependent()
            ? new relationship.relatedModel.DependentCollection({
                related: parentResource,
                field: reverse,
              })
            : new relationship.relatedModel.LazyCollection({
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

  const [isOpen, _, handleClose, handleToggle] = useBooleanState(!isButton);

  const [isAttachmentConfigured] = usePromise(attachmentSettingsPromise, true);

  const isAttachmentTable = attachmentRelatedTables().includes(
    relationship.relatedModel.name
  );

  const isAttachmentMisconfigured =
    isAttachmentTable && !isAttachmentConfigured;

  return (
    <SubViewContext.Provider value={contextValue}>
      {isButton && (
        <Button.BorderedGray
          aria-label={relationship.label}
          aria-pressed={isOpen}
          className="w-fit"
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
        <IntegratedRecordSelector
          collection={collection}
          dialog={isButton ? 'nonModal' : false}
          formType={formType}
          mode={
            !isAttachmentMisconfigured &&
            relationship.isDependent() &&
            initialMode !== 'view'
              ? 'edit'
              : 'view'
          }
          relationship={relationship}
          sortField={sortField}
          viewName={viewName}
          onAdd={
            relationshipIsToMany(relationship) &&
            relationship.type !== 'zero-to-one'
              ? undefined
              : ([resource]): void =>
                  void parentResource.set(relationship.name, resource as never)
          }
          onClose={handleClose}
          onDelete={
            relationshipIsToMany(relationship) &&
            relationship.type !== 'zero-to-one'
              ? undefined
              : (): void =>
                  void parentResource.set(relationship.name, null as never)
          }
        />
      ) : undefined}
    </SubViewContext.Provider>
  );
}
