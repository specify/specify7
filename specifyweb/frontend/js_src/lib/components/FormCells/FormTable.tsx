import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';
import type { State } from 'typesafe-reducer';

import { useId } from '../../hooks/useId';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import type { IR, RA } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { columnDefinitionsToCss, DataEntry } from '../Atoms/DataEntry';
import { icons } from '../Atoms/Icons';
import { useAttachment } from '../Attachments/Plugin';
import { AttachmentViewer } from '../Attachments/Viewer';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { Relationship } from '../DataModel/specifyField';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { FormMeta } from '../FormMeta';
import type { FormMode } from '../FormParse';
import type { FormCellDefinition, SubViewSortField } from '../FormParse/cells';
import { attachmentView } from '../FormParse/webOnlyViews';
import { SearchDialog } from '../Forms/SearchDialog';
import { SpecifyForm } from '../Forms/SpecifyForm';
import { useViewDefinition } from '../Forms/useViewDefinition';
import { loadingGif } from '../Molecules';
import { Dialog } from '../Molecules/Dialog';
import type { SortConfig } from '../Molecules/Sorting';
import { SortIndicator } from '../Molecules/Sorting';
import { hasTablePermission } from '../Permissions/helpers';
import { usePref } from '../UserPreferences/usePref';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import { FormCell } from './index';

const cellToLabel = (
  model: SpecifyModel,
  cell: FormCellDefinition
): {
  readonly text: LocalizedString | undefined;
  readonly title: LocalizedString | undefined;
} => ({
  text: cell.ariaLabel,
  title:
    cell.type === 'Field' || cell.type === 'SubView'
      ? model.getField(cell.fieldNames?.join('.') ?? '')?.getLocalizedDesc()
      : undefined,
});

const cellClassName =
  'sticky top-0 bg-[color:var(--form-foreground)] z-10 h-full -mx-1 pl-1 pt-1';

// REFACTOR: split this component into smaller
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
  sortField,
  onFetchMore: handleFetchMore,
}: {
  readonly relationship: Relationship;
  readonly isDependent: boolean;
  readonly resources: RA<SpecifyResource<SCHEMA>>;
  readonly totalCount?: number;
  readonly onAdd:
    | ((resources: RA<SpecifyResource<SCHEMA>>) => void)
    | undefined;
  readonly onDelete: ((resource: SpecifyResource<SCHEMA>) => void) | undefined;
  readonly mode: FormMode;
  readonly viewName?: string;
  readonly dialog: 'modal' | 'nonModal' | false;
  readonly onClose: () => void;
  readonly sortField: SubViewSortField | undefined;
  readonly onFetchMore: (() => Promise<void>) | undefined;
}): JSX.Element {
  const [sortConfig, setSortConfig] = React.useState<
    SortConfig<string> | undefined
  >(
    sortField === undefined
      ? undefined
      : {
          sortField: sortField.fieldNames.join('.'),
          ascending: sortField.direction === 'asc',
        }
  );

  const resources =
    sortConfig === undefined
      ? // Note, resources might be sorted by the back-end
        unsortedResources
      : Array.from(unsortedResources).sort(
          sortFunction(
            // FEATURE: handle related fields
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
    const lastRow: HTMLElement | null = rowsRef.current.querySelector(
      `:scope > :nth-child(${resourceIndex}) > [tabindex="-1"]`
    );
    lastRow?.focus();
  }, [resources]);

  const isToOne = !relationshipIsToMany(relationship);
  const disableAdding = isToOne && resources.length > 0;
  const header = commonText.countLine({
    resource: relationship.label,
    count: totalCount ?? resources.length,
  });
  const viewDefinition = useViewDefinition({
    model: relationship.relatedModel,
    viewName,
    fallbackViewName: relationship.relatedModel.view,
    formType: 'formTable',
    mode,
  });
  const fullViewDefinition = useViewDefinition({
    model: relationship.relatedModel,
    viewName: relationship.relatedModel.view,
    fallbackViewName: viewName,
    formType: 'form',
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
  const [flexibleSubGridColumnWidth] = usePref(
    'form',
    'definition',
    'flexibleSubGridColumnWidth'
  );
  const displayDeleteButton =
    mode !== 'view' && typeof handleDelete === 'function';
  const displayViewButton = !isDependent;
  const headerIsVisible =
    resources.length !== 1 || !isExpanded[resources[0].cid];

  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const { isFetching, handleScroll } = useInfiniteScroll(
    handleFetchMore,
    scrollerRef
  );

  const [maxHeight] = usePref('form', 'formTable', 'maxHeight');

  const children =
    viewDefinition === undefined ? (
      commonText.loading()
    ) : resources.length === 0 ? (
      <p>{formsText.noData()}</p>
    ) : (
      <div className="overflow-x-auto">
        <DataEntry.Grid
          className={`sticky w-fit ${headerIsVisible ? 'pt-0' : ''}`}
          display="inline"
          flexibleColumnWidth={flexibleColumnWidth}
          forwardRef={scrollerRef}
          role="table"
          style={{
            gridTemplateColumns: `min-content ${columnDefinitionsToCss(
              viewDefinition.columns,
              flexibleSubGridColumnWidth
            )} min-content`,
            maxHeight: `${maxHeight}px`,
          }}
          viewDefinition={viewDefinition}
          onScroll={handleScroll}
        >
          <div className={headerIsVisible ? 'contents' : 'sr-only'} role="row">
            <div className={cellClassName} role="columnheader">
              <span className="sr-only">{commonText.expand()}</span>
            </div>
            {viewDefinition.rows[0].map((cell, index) => {
              const { text, title } = cellToLabel(
                relationship.relatedModel,
                cell
              );
              const isSortable =
                cell.type === 'Field' || cell.type === 'SubView';
              const fieldName = isSortable
                ? cell.fieldNames?.join('.')
                : undefined;
              return (
                <DataEntry.Cell
                  align="center"
                  className={cellClassName}
                  colSpan={cell.colSpan}
                  key={index}
                  role="columnheader"
                  title={title}
                  visible
                >
                  {isSortable && typeof fieldName === 'string' ? (
                    <Button.LikeLink
                      tabIndex={headerIsVisible ? undefined : -1}
                      onClick={(): void =>
                        setSortConfig({
                          sortField: fieldName,
                          ascending: !(sortConfig?.ascending ?? false),
                        })
                      }
                    >
                      {text}
                      <SortIndicator
                        fieldName={fieldName}
                        sortConfig={sortConfig}
                      />
                    </Button.LikeLink>
                  ) : (
                    text
                  )}
                </DataEntry.Cell>
              );
            })}
            <div className={cellClassName} role="columnheader">
              <span className="sr-only">{commonText.actions()}</span>
            </div>
          </div>
          <div className="contents" ref={rowsRef} role="rowgroup">
            {resources.map((resource) => (
              <React.Fragment key={resource.cid}>
                <div className="contents" role="row">
                  {isExpanded[resource.cid] ? (
                    <>
                      <div className="h-full" role="cell">
                        <Button.Small
                          aria-label={commonText.collapse()}
                          className="h-full"
                          title={commonText.collapse()}
                          onClick={(): void =>
                            setExpandedRecords({
                              ...isExpanded,
                              [resource.cid]: false,
                            })
                          }
                        >
                          {icons.chevronDown}
                        </Button.Small>
                      </div>
                      <DataEntry.Cell
                        align="left"
                        colSpan={viewDefinition.columns.length}
                        role="cell"
                        tabIndex={-1}
                        visible
                      >
                        <SpecifyForm
                          display="inline"
                          resource={resource}
                          viewDefinition={fullViewDefinition}
                        />
                      </DataEntry.Cell>
                    </>
                  ) : (
                    <>
                      <div className="h-full" role="cell">
                        <Button.Small
                          aria-label={commonText.expand()}
                          className="h-full"
                          title={commonText.expand()}
                          onClick={(): void =>
                            setExpandedRecords({
                              ...isExpanded,
                              [resource.cid]: true,
                            })
                          }
                        >
                          {icons.chevronRight}
                        </Button.Small>
                      </div>
                      {viewDefinition.name === attachmentView ? (
                        <Attachment resource={resource} />
                      ) : (
                        viewDefinition.rows[0].map(
                          (
                            {
                              colSpan,
                              align,
                              visible,
                              id: cellId,
                              ...cellData
                            },
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
                        )
                      )}
                    </>
                  )}
                  <div className="flex h-full flex-col gap-2" role="cell">
                    {displayViewButton && isExpanded[resource.cid] ? (
                      <DataEntry.Visit
                        className={`flex-1 ${className.smallButton} ${className.defaultSmallButtonVariant}`}
                        resource={resource}
                      />
                    ) : undefined}
                    {displayDeleteButton &&
                    (!resource.isNew() ||
                      hasTablePermission(
                        relationship.relatedModel.name,
                        'delete'
                      )) ? (
                      <Button.Small
                        aria-label={commonText.remove()}
                        className="h-full"
                        disabled={
                          !resource.isNew() &&
                          !hasTablePermission(
                            resource.specifyModel.name,
                            'delete'
                          )
                        }
                        title={commonText.remove()}
                        onClick={(): void => handleDelete(resource)}
                      >
                        {icons.trash}
                      </Button.Small>
                    ) : undefined}
                    {isExpanded[resource.cid] && (
                      <FormMeta
                        className="flex-1"
                        resource={resource}
                        viewDescription={fullViewDefinition}
                      />
                    )}
                  </div>
                </div>
              </React.Fragment>
            ))}
            {isFetching && (
              <div className="contents" role="row">
                <div className="col-span-full" role="cell">
                  {loadingGif}
                </div>
              </div>
            )}
          </div>
        </DataEntry.Grid>
      </div>
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
      buttons={commonText.close()}
      dimensionsKey={relationship.name}
      header={header}
      headerButtons={addButton}
      modal={dialog === 'modal'}
      onClose={handleClose}
    >
      {children}
    </Dialog>
  );
}

function Attachment({
  resource,
}: {
  readonly resource: SpecifyResource<AnySchema> | undefined;
}): JSX.Element | null {
  const related = React.useState<SpecifyResource<AnySchema> | undefined>(
    undefined
  );
  const [attachment] = useAttachment(resource);
  return typeof attachment === 'object' ? (
    <AttachmentViewer
      attachment={attachment}
      related={related}
      showMeta={false}
      onViewRecord={undefined}
    />
  ) : attachment === false ? (
    <p>{formsText.noData()}</p>
  ) : (
    loadingGif
  );
}
