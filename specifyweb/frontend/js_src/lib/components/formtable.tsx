import React from 'react';
import type { State } from 'typesafe-reducer';

import collectionapi from '../collectionapi';
import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import { localizeLabel } from '../localizeform';
import type { FormMode } from '../parseform';
import type { FormCellDefinition } from '../parseformcells';
import type { Relationship } from '../specifyfield';
import type { Collection, SpecifyModel } from '../specifymodel';
import type { IR, RA } from '../types';
import { defined } from '../types';
import { relationshipIsToMany } from '../wbplanviewmappinghelper';
import { Button, DataEntry, H3 } from './basic';
import { useId } from './hooks';
import { Dialog } from './modaldialog';
import { SearchDialog } from './searchdialog';
import { SpecifyForm, useViewDefinition } from './specifyform';
import { FormCell } from './specifyformcell';
import { hasTablePermission } from '../permissions';

const cellToLabel = (
  model: SpecifyModel,
  cell: FormCellDefinition
): {
  readonly children: string | undefined;
  readonly title: string | undefined;
} => ({
  ...(cell.type === 'Field' || cell.type === 'SubView'
    ? localizeLabel({
        text: undefined,
        model,
        fieldName: cell.fieldName,
        id: cell.id,
      })
    : {
        title: undefined,
        children:
          (cell.type === 'Label'
            ? cell.text ?? cell.labelForCellId
            : cell.type === 'Separator'
            ? cell.label
            : undefined) ?? cell.id,
      }),
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
}: {
  readonly relationship: Relationship;
  readonly isDependent: boolean;
  readonly resources: RA<SpecifyResource<SCHEMA>>;
  readonly onAdd: (resource: SpecifyResource<SCHEMA>) => void;
  readonly onDelete: (resource: SpecifyResource<SCHEMA>) => void;
  readonly mode: FormMode;
  readonly viewName?: string;
  readonly dialog: 'modal' | 'nonModal' | false;
  readonly onClose: () => void;
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
      <DataEntry.Grid role="table" viewDefinition={viewDefinition}>
        <div className="contents" role="row">
          <div role="columnheader">{commonText('expand')}</div>
          {viewDefinition.rows[0].map((cell, index) => {
            const { title, children } = cellToLabel(
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
                // TODO: add column sorting option
              >
                {children}
              </DataEntry.Cell>
            );
          })}
          {mode !== 'edit' && (
            <div role="columnheader">{commonText('remove')}</div>
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
                    colSpan={viewDefinition.columns.length}
                    align="left"
                    visible={true}
                  >
                    <SpecifyForm
                      resource={resource}
                      viewName={viewName}
                      formType="form"
                      mode={mode}
                      hasHeader={false}
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
                      >
                        <FormCell
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
                </>
              )}
              {mode === 'edit' && (
                <div role="cell">
                  <Button.Icon
                    title={commonText('remove')}
                    aria-label={commonText('remove')}
                    icon="trash"
                    onClick={(): void => handleDelete(resource)}
                    disabled={
                      !resource.isNew() &&
                      !hasTablePermission(resource.specifyModel.name, 'delete')
                    }
                  />
                </div>
              )}
            </div>
          ))}
          {resources.length === 0 && <p>{formsText('noData')}</p>}
        </div>
        {state.type === 'SearchState' && (
          <SearchDialog
            forceCollection={undefined}
            extraFilters={undefined}
            templateResource={state.resource}
            onClose={(): void => setState({ type: 'MainState' })}
            onSelected={(resource): void => {
              setExpandedRecords({ ...isExpanded, [resource.cid]: true });
              handleAdd(resource);
            }}
          />
        )}
      </DataEntry.Grid>
    );
  const addButton =
    mode !== 'view' &&
    !disableAdding &&
    hasTablePermission(
      relationship.relatedModel.name,
      isDependent ? 'read' : 'create'
    ) ? (
      <Button.LikeLink
        onClick={
          disableAdding
            ? undefined
            : isDependent
            ? void setState({
                type: 'SearchState',
                resource: new relationship.relatedModel.Resource(),
              })
            : (): void => {
                const resource = new relationship.relatedModel.Resource();
                setExpandedRecords({ ...isExpanded, [resource.cid]: true });
                handleAdd(resource);
              }
        }
      >
        {commonText('add')}
      </Button.LikeLink>
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
  const isDependent = collection instanceof collectionapi.Dependent;
  const [records, setRecords] = React.useState(collection.models);
  return (
    <FormTable
      relationship={defined(collection.field?.getReverse())}
      isDependent={isDependent}
      resources={records}
      onAdd={(resource): void => {
        collection.add(resource);
        setRecords(collection.models);
        handleAdd?.(resource);
      }}
      onDelete={(resource): void => {
        collection.remove(resource);
        setRecords(collection.models);
        handleDelete?.(resource);
      }}
      {...props}
    />
  );
}
