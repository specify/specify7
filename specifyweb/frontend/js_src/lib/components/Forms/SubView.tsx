import React from 'react';

import { usePromise } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useCollection } from '../../hooks/useCollection';
import { useTriggerState } from '../../hooks/useTriggerState';
import { commonText } from '../../localization/common';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { DataEntry } from '../Atoms/DataEntry';
import { attachmentSettingsPromise } from '../Attachments/attachments';
import { attachmentRelatedTables } from '../Attachments/utils';
import { ReadOnlyContext } from '../Core/Contexts';
import type { CollectionFetchFilters } from '../DataModel/collection';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceOn } from '../DataModel/resource';
import type { Relationship } from '../DataModel/specifyField';
import type { FormType } from '../FormParse';
import type { SubViewSortField } from '../FormParse/cells';
import { IntegratedRecordSelector } from '../FormSliders/IntegratedRecordSelector';
import { TableIcon } from '../Molecules/TableIcon';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';

type SubViewContextType =
  | {
      readonly relationship: Relationship | undefined;
      readonly formType: FormType;
      readonly sortField: SubViewSortField | undefined;
      /**
       * Don't render a relationship if it is already being rendered in a
       * parent subview.
       * Avoids infinite cycles in rendering forms
       */
      readonly parentContext: RA<Relationship> | undefined;
      readonly handleChangeFormType: (formType: FormType) => void;
      readonly handleChangeSortField: (
        sortField: SubViewSortField | undefined
      ) => void;
    }
  | undefined;

export const SubViewContext =
  React.createContext<SubViewContextType>(undefined);
SubViewContext.displayName = 'SubViewContext';

export function SubView({
  relationship,
  parentResource,
  parentFormType,
  formType: initialFormType,
  isButton,
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

  const [collection, _setCollection, handleFetch] = useCollection({
    parentResource,
    relationship,
    sortBy: sortField,
  });

  React.useEffect(
    () =>
      resourceOn(
        parentResource,
        'saved',
        (): void => {
          if (!relationship.isDependent()) {
            handleFetch({
              offset: 0,
              reset: true,
            } as CollectionFetchFilters<AnySchema>);
          }
        },
        false
      ),
    [parentResource, relationship, handleFetch]
  );

  const subviewContext = React.useContext(SubViewContext);

  const [formType, setFormType] = useTriggerState(initialFormType);
  const parentContext = React.useMemo(
    () => subviewContext?.parentContext ?? [],
    [subviewContext?.parentContext]
  );

  const contextValue = React.useMemo<SubViewContextType>(
    () => ({
      relationship,
      formType,
      sortField,
      parentContext: [...parentContext, relationship],
      handleChangeFormType: setFormType,
      handleChangeSortField: setSortField,
    }),
    [
      relationship,
      formType,
      sortField,
      parentContext,
      setFormType,
      setSortField,
    ]
  );

  const isReadOnly = React.useContext(ReadOnlyContext);

  const [isOpen, _, handleClose, handleToggle] = useBooleanState(!isButton);

  const [isAttachmentConfigured] = usePromise(attachmentSettingsPromise, true);

  const isAttachmentTable = attachmentRelatedTables().includes(
    relationship.relatedTable.name
  );

  const isAttachmentMisconfigured =
    isAttachmentTable && !isAttachmentConfigured;

  return (
    <SubViewContext.Provider value={contextValue}>
      {parentContext.includes(relationship) ||
      collection === false ? undefined : (
        <>
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
                relationship.isVirtual ||
                isAttachmentMisconfigured
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
                onAdd={
                  relationshipIsToMany(relationship) &&
                  relationship.type !== 'zero-to-one'
                    ? undefined
                    : ([resource]): void =>
                        void parentResource.set(
                          relationship.name,
                          resource as never
                        )
                }
                onClose={handleClose}
                onDelete={
                  relationshipIsToMany(relationship) &&
                  relationship.type !== 'zero-to-one'
                    ? undefined
                    : (): void =>
                        void parentResource.set(
                          relationship.name,
                          null as never
                        )
                }
                onFetch={handleFetch}
              />
            </ReadOnlyContext.Provider>
          ) : isButton ? undefined : (
            <DataEntry.SubForm>
              <DataEntry.SubFormHeader>
                <DataEntry.SubFormTitle>
                  {relationship.label}
                </DataEntry.SubFormTitle>
              </DataEntry.SubFormHeader>
              {commonText.loading()}
            </DataEntry.SubForm>
          )}
        </>
      )}
    </SubViewContext.Provider>
  );
}
