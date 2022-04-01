import React from 'react';
import type { State } from 'typesafe-reducer';

import collectionapi from '../collectionapi';
import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import type { FormMode } from '../parseform';
import type { FormCellDefinition } from '../parseformcells';
import { hasTablePermission } from '../permissions';
import type { Relationship } from '../specifyfield';
import type { Collection, SpecifyModel } from '../specifymodel';
import type { IR, RA } from '../types';
import { defined } from '../types';
import { relationshipIsToMany } from '../wbplanviewmappinghelper';
import { Button, DataEntry, H3, Link } from './basic';
import { useId } from './hooks';
import { Dialog } from './modaldialog';
import { SearchDialog } from './searchdialog';
import { SpecifyForm, useViewDefinition } from './specifyform';
import { FormCell } from './specifyformcell';
import { replaceKey } from '../helpers';

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

export function FormTable<SCHEMA extends AnySchema>({
  relationship,
  isDependent,
  resources,
  onAdd: handleAdd,
  onDelete: handleDelete,
  mode,
  viewName = relationship.relatedModel.view,
  dialog,
  onClose: handleClose,
  sortField,
}: {
  readonly relationship: Relationship;
  readonly isDependent: boolean;
  readonly resources: RA<SpecifyResource<SCHEMA>>;
  readonly onAdd: ((resource: SpecifyResource<SCHEMA>) => void) | undefined;
  readonly onDelete: (resource: SpecifyResource<SCHEMA>) => void;
  readonly mode: FormMode;
  readonly viewName?: string;
  readonly dialog: 'modal' | 'nonModal' | false;
  readonly onClose: () => void;
  readonly sortField: string | undefined;
}): JSX.Element {
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
    | State<'SearchState', { resource: SpecifyResource<SCHEMA> }>
  >({ type: 'MainState' });
  const children =
    typeof viewDefinition === 'undefined' ? (
      commonText('loading')
    ) : (
      <DataEntry.Grid
        role="table"
        viewDefinition={replaceKey(viewDefinition, 'columns', [
          undefined,
          ...viewDefinition.columns,
          undefined,
          ...(isDependent ? [] : [undefined]),
        ])}
      >
        <div className="contents" role="row">
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
                role="columnheader"
                key={index}
                colSpan={cell.colSpan}
                align={cell.align}
                title={title}
                visible={true}
                ariaLabel={undefined}
                // TODO: add column sorting option
              >
                {text}
              </DataEntry.Cell>
            );
          })}
          {!isDependent && <div role="columnheader">{commonText('view')}</div>}
          {mode !== 'view' && (
            <div role="columnheader">
              <span className="sr-only">{commonText('remove')}</span>
            </div>
          )}
        </div>
        <div className="contents" role="rowgroup">
          {resources.map((resource) => (
            <div className="contents" role="row" key={resource.cid}>
              {isExpanded[resource.cid] ? (
                <>
                  <div role="cell">
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
                    colSpan={
                      viewDefinition.columns.length + (isDependent ? 0 : 1)
                    }
                    align="left"
                    visible={true}
                    ariaLabel={undefined}
                  >
                    <SpecifyForm
                      resource={resource}
                      viewName={viewName}
                      formType="form"
                      mode={mode}
                    />
                  </DataEntry.Cell>
                </>
              ) : (
                <>
                  <div role="cell">
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
                          formType={viewDefinition.formType}
                          cellData={cellData}
                          id={cellId}
                          formatId={(suffix: string): string =>
                            id(`${index}-${suffix}`)
                          }
                        />
                      </DataEntry.Cell>
                    )
                  )}
                  {!isDependent && (
                    <div role="cell">
                      {!resource.isNew() && (
                        <Link.NewTab
                          className="text-blue-500"
                          title={formsText('visit')}
                          aria-label={formsText('visit')}
                          href={resource.viewUrl()}
                        />
                      )}
                    </div>
                  )}
                </>
              )}
              {mode !== 'view' &&
                (resource.isNew() ||
                  hasTablePermission(
                    relationship.relatedModel.name,
                    'delete'
                  )) && (
                  <div role="cell">
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
                  </div>
                )}
            </div>
          ))}
          {resources.length === 0 && <p>{formsText('noData')}</p>}
        </div>
        {state.type === 'SearchState' ? (
          <SearchDialog
            forceCollection={undefined}
            extraFilters={undefined}
            templateResource={state.resource}
            onClose={(): void => setState({ type: 'MainState' })}
            onSelected={(resource): void => {
              setExpandedRecords({ ...isExpanded, [resource.cid]: true });
              handleAdd?.(resource);
            }}
          />
        ) : undefined}
      </DataEntry.Grid>
    );
  const addButton =
    typeof handleAdd === 'function' &&
    mode !== 'view' &&
    !disableAdding &&
    hasTablePermission(
      relationship.relatedModel.name,
      isDependent ? 'read' : 'create'
    ) ? (
      <Button.Icon
        onClick={
          disableAdding
            ? undefined
            : isDependent
            ? (): void =>
                setState({
                  type: 'SearchState',
                  resource: new relationship.relatedModel.Resource(),
                })
            : (): void => {
                const resource = new relationship.relatedModel.Resource();
                setExpandedRecords({ ...isExpanded, [resource.cid]: true });
                handleAdd?.(resource);
              }
        }
        title={commonText('add')}
        aria-label={commonText('add')}
        icon="plus"
      />
    ) : undefined;
  return dialog === false ? (
    <DataEntry.SubForm>
      <DataEntry.SubFormHeader>
        <H3>{header}</H3>
        {addButton}
      </DataEntry.SubFormHeader>
      {children}
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

export function FormTableCollection({
  collection,
  onAdd: handleAdd,
  onDelete: handleDelete,
  ...props
}: Omit<
  Parameters<typeof FormTable>[0],
  'resources' | 'relationship' | 'isDependent' | 'onAdd' | 'onDelete'
> & {
  readonly collection: Collection<AnySchema>;
  readonly onAdd: ((resource: SpecifyResource<AnySchema>) => void) | undefined;
  readonly onDelete:
    | ((resource: SpecifyResource<AnySchema>) => void)
    | undefined;
}): JSX.Element {
  const [records, setRecords] = React.useState(collection.models);
  const field = defined(collection.field?.getReverse());
  const isDependent = collection instanceof collectionapi.Dependent;
  const isToOne = !relationshipIsToMany(field);
  const disableAdding = isToOne && records.length > 0;
  return (
    <FormTable
      relationship={defined(collection.field?.getReverse())}
      isDependent={isDependent}
      resources={records}
      onAdd={
        disableAdding
          ? undefined
          : (resource): void => {
              collection.add(resource);
              setRecords(collection.models);
              handleAdd?.(resource);
            }
      }
      onDelete={(resource): void => {
        collection.remove(resource);
        setRecords(collection.models);
        handleDelete?.(resource);
      }}
      {...props}
    />
  );
}
