import React from 'react';
import type { State } from 'typesafe-reducer';

import { DependentCollection } from '../collectionapi';
import type { AnySchema } from '../datamodelutils';
import { sortFunction } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import type { FormMode } from '../parseform';
import type { FormCellDefinition } from '../parseformcells';
import { hasTablePermission } from '../permissionutils';
import { resourceOn } from '../resource';
import type { Relationship } from '../specifyfield';
import type { Collection, SpecifyModel } from '../specifymodel';
import type { IR, PartialBy, RA } from '../types';
import { defined } from '../types';
import { relationshipIsToMany } from '../wbplanviewmappinghelper';
import { Button, DataEntry } from './basic';
import type { SortConfig } from './common';
import { SortIndicator } from './common';
import { useId } from './hooks';
import { Dialog } from './modaldialog';
import { usePref } from './preferenceshooks';
import { SearchDialog } from './searchdialog';
import { SpecifyForm, useViewDefinition } from './specifyform';
import { FormCell } from './specifyformcell';

const cellToLabel = (
  model: SpecifyModel,
  cell: FormCellDefinition
): {
  readonly text: string | undefined;
  readonly title: string | undefined;
} => ({
  text: cell.ariaLabel,
  title:
    cell.type === 'Field' || cell.type === 'SubView'
      ? model.getField(cell.fieldName ?? '')?.getLocalizedDesc()
      : undefined,
});

/**
 * Show several records in "grid view"
 */
export function FormTable<SCHEMA extends AnySchema>({
  relationship,
  isDependent,
  resources: unsortedResources,
  onAdd: handleAdd,
  onDelete: handleDelete,
  mode,
  viewName = relationship.relatedModel.view,
  dialog,
  onClose: handleClose,
  sortField = 'id',
}: {
  readonly relationship: Relationship;
  readonly isDependent: boolean;
  readonly resources: RA<SpecifyResource<SCHEMA>>;
  readonly onAdd:
    | ((resources: RA<SpecifyResource<SCHEMA>>) => void)
    | undefined;
  readonly onDelete: (resource: SpecifyResource<SCHEMA>) => void;
  readonly mode: FormMode;
  readonly viewName?: string;
  readonly dialog: 'modal' | 'nonModal' | false;
  readonly onClose: () => void;
  readonly sortField: string | undefined;
}): JSX.Element {
  const [sortConfig, setSortConfig] = React.useState<SortConfig<string>>({
    sortField: sortField.startsWith('-') ? sortField.slice(1) : sortField,
    ascending: !sortField.startsWith('-'),
  });
  const resources = Array.from(unsortedResources).sort(
    sortFunction(
      (resource) => resource.get(sortConfig.sortField),
      !sortConfig.ascending
    )
  );

  // When added a new resource, focus that row
  const addedResource = React.useRef<SpecifyResource<SCHEMA> | undefined>(
    undefined
  );
  const handleAddResources =
    typeof handleAdd === 'function'
      ? function handleAddResources(
          resources: RA<SpecifyResource<SCHEMA>>
        ): void {
          const expandedRecords = {
            ...isExpanded,
            ...Object.fromEntries(
              resources.map((resource) => [resource.cid, true] as const)
            ),
          };
          setExpandedRecords(expandedRecords);
          handleAdd(resources);
          addedResource.current = resources[0];
        }
      : undefined;
  const rowsRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (addedResource.current === undefined) return;
    const resourceIndex = resources.indexOf(addedResource.current);
    addedResource.current = undefined;
    if (resourceIndex === -1 || rowsRef.current === null) return;
    (
      rowsRef.current.querySelector(
        `:scope > :nth-child(${resourceIndex}) > [tabindex="-1"]`
      ) as HTMLElement | null
    )?.focus();
  }, [resources]);

  const isToOne = !relationshipIsToMany(relationship);
  const disableAdding = isToOne && resources.length > 0;
  const header = `${relationship.label} (${resources.length})`;
  const viewDefinition = useViewDefinition({
    model: relationship.relatedModel,
    viewName,
    formType: 'formTable',
    mode,
  });

  const id = useId('form-table');
  const [isExpanded, setExpandedRecords] = React.useState<IR<boolean>>({});
  const [state, setState] = React.useState<
    | State<'MainState'>
    | State<'SearchState', { readonly resource: SpecifyResource<SCHEMA> }>
  >({ type: 'MainState' });
  const [flexibleColumnWidth] = usePref(
    'form',
    'definition',
    'flexibleColumnWidth'
  );
  const displayDeleteButton = mode !== 'view';
  const displayViewButton = !isDependent;
  const headerIsVisible =
    resources.length !== 1 || !isExpanded[resources[0].cid];
  const [maxHeight] = usePref('form', 'formTable', 'maxHeight');

  // FEATURE: add <FormPreferences /> for formTable records when expanded
  const children =
    viewDefinition === undefined ? (
      commonText('loading')
    ) : resources.length === 0 ? (
      <p>{formsText('noData')}</p>
    ) : (
      <DataEntry.Grid
        className="sticky w-fit pt-0"
        display="inline"
        flexibleColumnWidth={flexibleColumnWidth}
        role="table"
        style={{
          gridTemplateColumns: `min-content repeat(${
            viewDefinition.columns.length
          },auto) ${displayViewButton ? 'min-content' : ''} ${
            displayDeleteButton ? 'min-content' : ''
          }`,
          maxHeight: `${maxHeight}px`,
        }}
        viewDefinition={viewDefinition}
      >
        <div className={headerIsVisible ? 'contents' : 'sr-only'} role="row">
          <div role="columnheader">
            <span className="sr-only">{commonText('expand')}</span>
          </div>
          {viewDefinition.rows[0].map((cell, index) => {
            const { text, title } = cellToLabel(
              relationship.relatedModel,
              cell
            );
            return (
              <DataEntry.Cell
                align="center"
                className={`
                  sticky top-0 z-10 -mx-1
                  h-full bg-[color:var(--form-foreground)] pl-1 pt-1
                `}
                colSpan={cell.colSpan}
                key={index}
                role="columnheader"
                title={title}
                visible
              >
                {(cell.type === 'Field' || cell.type === 'SubView') &&
                typeof cell.fieldName === 'string' ? (
                  <Button.LikeLink
                    tabIndex={headerIsVisible ? undefined : -1}
                    onClick={(): void =>
                      setSortConfig({
                        sortField: defined(cell.fieldName),
                        ascending: !sortConfig.ascending,
                      })
                    }
                  >
                    {text}
                    <SortIndicator
                      fieldName={cell.fieldName}
                      sortConfig={sortConfig}
                    />
                  </Button.LikeLink>
                ) : (
                  text
                )}
              </DataEntry.Cell>
            );
          })}
          {displayViewButton && (
            <div role="columnheader">{commonText('view')}</div>
          )}
          {displayDeleteButton && (
            <div role="columnheader">
              <span className="sr-only">{commonText('remove')}</span>
            </div>
          )}
        </div>
        <div className="contents" ref={rowsRef} role="rowgroup">
          {resources.map((resource) => (
            <div className="contents" key={resource.cid} role="row">
              {isExpanded[resource.cid] ? (
                <>
                  <div className="flex justify-center" role="cell">
                    <Button.Icon
                      icon="chevronDown"
                      title={formsText('contract')}
                      onClick={(): void =>
                        setExpandedRecords({
                          ...isExpanded,
                          [resource.cid]: false,
                        })
                      }
                    />
                  </div>
                  <DataEntry.Cell
                    align="left"
                    colSpan={
                      viewDefinition.columns.length + (isDependent ? 0 : 1)
                    }
                    role="cell"
                    tabIndex={-1}
                    visible
                  >
                    <SpecifyForm
                      display="inline"
                      formType="form"
                      mode={mode}
                      resource={resource}
                    />
                  </DataEntry.Cell>
                </>
              ) : (
                <>
                  <div className="flex justify-center" role="cell">
                    <Button.Icon
                      icon="chevronRight"
                      title={commonText('expand')}
                      onClick={(): void =>
                        setExpandedRecords({
                          ...isExpanded,
                          [resource.cid]: true,
                        })
                      }
                    />
                  </div>
                  {viewDefinition.rows[0].map(
                    (
                      { colSpan, align, visible, id: cellId, ...cellData },
                      index
                    ) => (
                      <DataEntry.Cell
                        align={align}
                        colSpan={colSpan}
                        key={index}
                        role="cell"
                        visible={visible}
                      >
                        <FormCell
                          align={align}
                          cellData={cellData}
                          formatId={(suffix: string): string =>
                            id(`${index}-${suffix}`)
                          }
                          formType="formTable"
                          id={cellId}
                          mode={viewDefinition.mode}
                          resource={resource}
                        />
                      </DataEntry.Cell>
                    )
                  )}
                  {displayViewButton && (
                    <div className="flex justify-center" role="cell">
                      <DataEntry.Visit resource={resource} />
                    </div>
                  )}
                </>
              )}
              {displayDeleteButton && (
                <div className="flex justify-center" role="cell">
                  {(!resource.isNew() ||
                    hasTablePermission(
                      relationship.relatedModel.name,
                      'delete'
                    )) && (
                    <Button.Icon
                      disabled={
                        !resource.isNew() &&
                        !hasTablePermission(
                          resource.specifyModel.name,
                          'delete'
                        )
                      }
                      icon="trash"
                      title={commonText('remove')}
                      onClick={(): void => handleDelete(resource)}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </DataEntry.Grid>
    );
  const addButton =
    typeof handleAddResources === 'function' &&
    mode !== 'view' &&
    !disableAdding &&
    hasTablePermission(
      relationship.relatedModel.name,
      isDependent ? 'create' : 'read'
    ) ? (
      <DataEntry.Add
        onClick={
          disableAdding
            ? undefined
            : isDependent
            ? (): void => {
                const resource = new relationship.relatedModel.Resource();
                handleAddResources([resource]);
              }
            : (): void =>
                setState({
                  type: 'SearchState',
                  resource: new relationship.relatedModel.Resource(),
                })
        }
      />
    ) : undefined;
  return dialog === false ? (
    <DataEntry.SubForm>
      <DataEntry.SubFormHeader>
        <DataEntry.SubFormTitle>{header}</DataEntry.SubFormTitle>
        {addButton}
      </DataEntry.SubFormHeader>
      {children}
      {state.type === 'SearchState' &&
      typeof handleAddResources === 'function' ? (
        <SearchDialog
          extraFilters={undefined}
          forceCollection={undefined}
          multiple
          templateResource={state.resource}
          onClose={(): void => setState({ type: 'MainState' })}
          onSelected={handleAddResources}
        />
      ) : undefined}
    </DataEntry.SubForm>
  ) : (
    <Dialog
      buttons={commonText('close')}
      header={header}
      headerButtons={addButton}
      modal={dialog === 'modal'}
      onClose={handleClose}
    >
      {children}
    </Dialog>
  );
}

export function FormTableCollection({
  collection,
  onAdd: handleAdd,
  onDelete: handleDelete,
  ...props
}: PartialBy<
  Omit<
    Parameters<typeof FormTable>[0],
    'isDependent' | 'relationship' | 'resources'
  >,
  'onAdd' | 'onDelete'
> & {
  readonly collection: Collection<AnySchema>;
}): JSX.Element {
  const [records, setRecords] = React.useState(Array.from(collection.models));
  React.useEffect(
    () =>
      resourceOn(
        collection,
        'add remove sort',
        () => setRecords(Array.from(collection.models)),
        true
      ),
    [collection]
  );
  const field = defined(collection.field?.getReverse());
  const isDependent = collection instanceof DependentCollection;
  const isToOne = !relationshipIsToMany(field);
  const disableAdding = isToOne && records.length > 0;
  return (
    <FormTable
      isDependent={isDependent}
      relationship={defined(collection.field?.getReverse())}
      resources={records}
      onAdd={
        disableAdding
          ? undefined
          : handleAdd ??
            ((resources): void => {
              collection.add(resources);
              setRecords(Array.from(collection.models));
            })
      }
      onDelete={(resource): void => {
        collection.remove(resource);
        setRecords(Array.from(collection.models));
        handleDelete?.(resource);
      }}
      {...props}
    />
  );
}
