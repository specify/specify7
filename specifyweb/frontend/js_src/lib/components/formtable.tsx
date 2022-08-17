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
import { hasTablePermission } from '../permissions';
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
import { useInfiniteScroll } from './useInfiniteScroll';
import { loadingGif } from './queryresultstable';

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

const cellClassName =
  'sticky top-0 bg-[color:var(--form-foreground)] z-10 h-full -mx-1 pl-1 pt-1';

/**
 * Show several records in "grid view"
 */
export function FormTable<SCHEMA extends AnySchema>({
  relationship,
  isDependent,
  resources: unsortedResources,
  totalCount = unsortedResources.length,
  onAdd: handleAdd,
  onDelete: handleDelete,
  mode,
  viewName = relationship.relatedModel.view,
  dialog,
  onClose: handleClose,
  sortField = 'id',
  onFetchMore: handleFetchMore,
}: {
  readonly relationship: Relationship;
  readonly isDependent: boolean;
  readonly resources: RA<SpecifyResource<SCHEMA>>;
  readonly totalCount?: number;
  readonly onAdd: ((resource: SpecifyResource<SCHEMA>) => void) | undefined;
  readonly onDelete: (resource: SpecifyResource<SCHEMA>) => void;
  readonly mode: FormMode;
  readonly viewName?: string;
  readonly dialog: 'modal' | 'nonModal' | false;
  readonly onClose: () => void;
  readonly sortField: string | undefined;
  readonly onFetchMore: (() => Promise<void>) | undefined;
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
  const handleAddResource =
    typeof handleAdd === 'function'
      ? function handleAddResource(resource: SpecifyResource<SCHEMA>): void {
          setExpandedRecords({ ...isExpanded, [resource.cid]: true });
          handleAdd(resource);
          addedResource.current = resource;
        }
      : undefined;
  const rowsRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (typeof addedResource.current === 'undefined') return;
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
  const header = `${relationship.label} (${totalCount ?? resources.length})`;
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
    | State<'SearchState', { resource: SpecifyResource<SCHEMA> }>
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

  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const { isFetching, handleScroll } = useInfiniteScroll(
    handleFetchMore,
    scrollerRef
  );

  // FEATURE: add <FormPreferences /> for formTable records when expanded

  const [maxHeight] = usePref('form', 'formTable', 'maxHeight');

  // FEATURE: add <FormPreferences /> for formTable records when expanded
  const children =
    viewDefinition === undefined ? (
      commonText('loading')
    ) : resources.length === 0 ? (
      <p>{formsText('noData')}</p>
    ) : (
      <DataEntry.Grid
        role="table"
        viewDefinition={viewDefinition}
        flexibleColumnWidth={flexibleColumnWidth}
        display="inline"
        className="w-fit sticky pt-0"
        style={{
          gridTemplateColumns: `min-content repeat(${
            viewDefinition.columns.length
          },auto) ${displayViewButton ? 'min-content' : ''} ${
            displayDeleteButton ? 'min-content' : ''
          }`,
          maxHeight: `${maxHeight}px`,
        }}
        forwardRef={scrollerRef}
        onScroll={handleScroll}
      >
        <div className={headerIsVisible ? 'contents' : 'sr-only'} role="row">
          <div role="columnheader" className={cellClassName}>
            <span className="sr-only">{commonText('expand')}</span>
          </div>
          {viewDefinition.rows[0].map((cell, index) => {
            const { text, title } = cellToLabel(
              relationship.relatedModel,
              cell
            );
            return (
              <DataEntry.Cell
                role="columnheader"
                className={cellClassName}
                key={index}
                colSpan={cell.colSpan}
                align="center"
                title={title}
                visible={true}
                ariaLabel={undefined}
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
            <div role="columnheader" className={cellClassName}>
              <span className="sr-only">{commonText('view')}</span>
            </div>
          )}
          {displayDeleteButton && (
            <div role="columnheader" className={cellClassName}>
              <span className="sr-only">{commonText('remove')}</span>
            </div>
          )}
        </div>
        <div className="contents" role="rowgroup" ref={rowsRef}>
          {resources.map((resource, index, { length }) => (
            <React.Fragment key={resource.cid}>
              <div className="contents" role="row">
                {isExpanded[resource.cid] ? (
                  <>
                    <div role="cell" className="flex justify-center">
                      <Button.Icon
                        title={formsText('contract')}
                        aria-label={formsText('contract')}
                        icon="chevronDown"
                        onClick={(): void =>
                          setExpandedRecords({
                            ...isExpanded,
                            [resource.cid]: false,
                          })
                        }
                      />
                    </div>
                    <DataEntry.Cell
                      role="cell"
                      colSpan={viewDefinition.columns.length}
                      align="left"
                      visible={true}
                      ariaLabel={undefined}
                      tabIndex={-1}
                    >
                      <SpecifyForm
                        resource={resource}
                        formType="form"
                        mode={mode}
                        display="inline"
                      />
                    </DataEntry.Cell>
                  </>
                ) : (
                  <>
                    <div role="cell" className="flex justify-center">
                      <Button.Icon
                        title={commonText('expand')}
                        aria-label={commonText('expand')}
                        icon="chevronRight"
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
                          role="cell"
                          key={index}
                          colSpan={colSpan}
                          align={align}
                          visible={visible}
                          ariaLabel={undefined}
                        >
                          <FormCell
                            align={align}
                            resource={resource}
                            mode={viewDefinition.mode}
                            formType="formTable"
                            cellData={cellData}
                            id={cellId}
                            formatId={(suffix: string): string =>
                              id(`${index}-${suffix}`)
                            }
                          />
                        </DataEntry.Cell>
                      )
                    )}
                    {displayViewButton && (
                      <div role="cell" className="flex justify-center">
                        <DataEntry.Visit resource={resource} />
                      </div>
                    )}
                  </>
                )}
                {displayDeleteButton && (
                  <div role="cell" className="flex justify-center">
                    {(!resource.isNew() ||
                      hasTablePermission(
                        relationship.relatedModel.name,
                        'delete'
                      )) && (
                      <Button.Icon
                        title={commonText('remove')}
                        aria-label={commonText('remove')}
                        icon="trash"
                        onClick={(): void => handleDelete(resource)}
                        disabled={
                          !resource.isNew() &&
                          !hasTablePermission(
                            resource.specifyModel.name,
                            'delete'
                          )
                        }
                      />
                    )}
                  </div>
                )}
              </div>
              {index + 1 === length ? undefined : spacer}
            </React.Fragment>
          ))}
          {isFetching && (
            <div role="row" className="contents">
              <div role="cell" className="col-span-full">
                {loadingGif}
              </div>
            </div>
          )}
        </div>
      </DataEntry.Grid>
    );
  const addButton =
    typeof handleAddResource === 'function' &&
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
                handleAddResource(resource);
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
      typeof handleAddResource === 'function' ? (
        <SearchDialog
          forceCollection={undefined}
          extraFilters={undefined}
          templateResource={state.resource}
          onClose={(): void => setState({ type: 'MainState' })}
          onSelected={handleAddResource}
        />
      ) : undefined}
    </DataEntry.SubForm>
  ) : (
    <Dialog
      modal={dialog === 'modal'}
      header={header}
      onClose={handleClose}
      buttons={commonText('close')}
      headerButtons={addButton}
    >
      {children}
    </Dialog>
  );
}

const spacer = (
  <div
    role="cell"
    aria-hidden
    className="col-span-full border-t border-gray-500"
  />
);

export function FormTableCollection({
  collection,
  onAdd: handleAdd,
  onDelete: handleDelete,
  ...props
}: PartialBy<
  Omit<
    Parameters<typeof FormTable>[0],
    'resources' | 'relationship' | 'isDependent' | 'onFetchMore'
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

  const handleFetchMore = React.useCallback(async () => {
    await collection.fetch();
    setRecords(Array.from(collection.models));
  }, [collection]);

  const isDependent = collection instanceof DependentCollection;
  const field = defined(collection.field?.getReverse());
  const isToOne = !relationshipIsToMany(field);
  const disableAdding = isToOne && records.length > 0;
  return (
    <FormTable
      relationship={defined(collection.field?.getReverse())}
      isDependent={isDependent}
      resources={records}
      totalCount={collection._totalCount}
      onAdd={
        disableAdding
          ? undefined
          : handleAdd ??
            ((resource): void => {
              collection.add(resource);
              setRecords(Array.from(collection.models));
            })
      }
      onDelete={(resource): void => {
        collection.remove(resource);
        setRecords(Array.from(collection.models));
        handleDelete?.(resource);
      }}
      onFetchMore={handleFetchMore}
      {...props}
    />
  );
}
