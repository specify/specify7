import React from 'react';

import { useDistantRelated } from '../../hooks/resource';
import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { f } from '../../utils/functools';
import { DataEntry } from '../Atoms/DataEntry';
import { ReadOnlyContext, SearchDialogContext } from '../Core/Contexts';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { Collection } from '../DataModel/specifyTable';
import { tables } from '../DataModel/tables';
import { UiCommand } from '../FormCommands';
import { FormField } from '../FormFields';
import type { FormType } from '../FormParse';
import { fetchView, resolveViewDefinition } from '../FormParse';
import type { cellAlign, CellTypes } from '../FormParse/cells';
import { RenderForm } from '../Forms/SpecifyForm';
import { SubView } from '../Forms/SubView';
import { propsToFormMode } from '../Forms/useViewDefinition';
import { TableIcon } from '../Molecules/TableIcon';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import { FormTableInteraction } from './FormTableInteraction';

const cellRenderers: {
  readonly [KEY in keyof CellTypes]: (props: {
    readonly cellData: CellTypes[KEY];
    readonly id: string | undefined;
    readonly formatId: (id: string) => string;
    readonly resource: SpecifyResource<AnySchema>;
    readonly formType: FormType;
    readonly align: typeof cellAlign[number];
  }) => JSX.Element | null;
} = {
  Field({
    cellData: { fieldDefinition, fieldNames, isRequired },
    id,
    formatId,
    resource,
    formType,
  }) {
    const fields = React.useMemo(
      () => resource.specifyTable.getFields(fieldNames?.join('.') ?? ''),
      [resource.specifyTable, fieldNames]
    );
    return (
      <FormField
        fieldDefinition={fieldDefinition}
        fields={fields}
        formType={formType}
        id={typeof id === 'string' ? formatId(id.toString()) : undefined}
        isRequired={isRequired}
        resource={resource}
      />
    );
  },
  Label({ cellData: { text, labelForCellId, title }, formatId, align }) {
    const style: React.CSSProperties = {
      textAlign:
        align === 'right' ? 'right' : align === 'center' ? 'center' : undefined,
    };
    return typeof text === 'string' &&
      text.length === 0 ? null : typeof labelForCellId === 'string' ? (
      <label htmlFor={formatId(labelForCellId)} style={style} title={title}>
        {text}
      </label>
    ) : (
      <p style={style} title={title}>
        {text}
      </p>
    );
  },
  Separator({ cellData: { label, icon, forClass } }) {
    return typeof label === 'string' || typeof forClass === 'string' ? (
      <DataEntry.SubFormTitle
        className="border-b border-gray-500"
        title={
          typeof forClass === 'string'
            ? tables[forClass].localization.desc ?? undefined
            : undefined
        }
      >
        {typeof forClass === 'string' ? (
          <>
            <TableIcon label={false} name={forClass} />
            {tables[forClass].label}
          </>
        ) : (
          <>
            {typeof icon === 'string' && (
              <TableIcon label={false} name={icon} />
            )}
            {label}
          </>
        )}
      </DataEntry.SubFormTitle>
    ) : (
      <hr className="w-full border-b border-gray-500" />
    );
  },
  SubView({
    resource: rawResource,
    formType: parentFormType,
    cellData: { fieldNames, formType, isButton, icon, viewName, sortField },
  }) {
    const fields = React.useMemo(
      () => rawResource.specifyTable.getFields(fieldNames?.join('.') ?? ''),
      [rawResource, fieldNames]
    );
    const data = useDistantRelated(rawResource, fields);

    const relationship =
      data?.field?.isRelationship === true ? data.field : undefined;

    const isReadOnly =
      React.useContext(ReadOnlyContext) || rawResource !== data?.resource;
    const isInSearchDialog = React.useContext(SearchDialogContext);

    /*
     * SubView is turned into formTable if formTable is the default FormType for
     * the related table
     */
    const [actualFormType] = useAsyncState<FormType>(
      React.useCallback(
        async () =>
          typeof relationship === 'object'
            ? fetchView(viewName ?? relationship.relatedTable.view)
                .then((viewDefinition) =>
                  typeof viewDefinition === 'object'
                    ? resolveViewDefinition(
                        viewDefinition,
                        formType,
                        propsToFormMode(isReadOnly, isInSearchDialog)
                      )
                    : undefined
                )
                .then((definition) => definition?.formType ?? 'form')
            : undefined,
        [viewName, formType, isReadOnly, isInSearchDialog, relationship]
      ),
      false
    );

    const [interactionCollection] = useAsyncState<
      Collection<AnySchema> | false
    >(
      React.useCallback(
        () =>
          typeof relationship === 'object' &&
          relationshipIsToMany(relationship) &&
          typeof data?.resource === 'object' &&
          [
            'LoanPreparation',
            'GiftPreparation',
            'DisposalPreparation',
          ].includes(relationship.relatedTable.name)
            ? data?.resource.rgetCollection(relationship.name)
            : false,
        [relationship, data?.resource]
      ),
      false
    );
    if (
      relationship === undefined ||
      data?.resource === undefined ||
      interactionCollection === undefined ||
      actualFormType === undefined
    )
      return null;
    return (
      <ReadOnlyContext.Provider value={isReadOnly}>
        {interactionCollection === false || actualFormType === 'form' ? (
          <SubView
            formType={actualFormType}
            icon={icon}
            isButton={isButton}
            parentFormType={parentFormType}
            parentResource={data.resource}
            relationship={relationship}
            sortField={sortField}
            viewName={viewName}
          />
        ) : (
          <FormTableInteraction
            collection={interactionCollection}
            dialog={false}
            sortField={sortField}
            onClose={f.never}
            onDelete={undefined}
          />
        )}
      </ReadOnlyContext.Provider>
    );
  },
  Panel({ formType, resource, cellData: { display, ...cellData } }) {
    const isReadOnly = React.useContext(ReadOnlyContext);
    const isInSearchDialog = React.useContext(SearchDialogContext);
    const mode = propsToFormMode(isReadOnly, isInSearchDialog);
    const viewDefinition = React.useMemo(
      () => ({
        ...cellData,
        mode,
        formType,
        table: resource.specifyTable,
      }),
      [cellData, formType, resource.specifyTable, mode]
    );

    const form = (
      <RenderForm
        display={display}
        resource={resource}
        viewDefinition={viewDefinition}
      />
    );
    return display === 'inline' ? <div className="mx-auto">{form}</div> : form;
  },
  Command({
    cellData: {
      commandDefinition: { label, commandDefinition },
    },
    id,
    resource,
  }) {
    return (
      <UiCommand
        commandDefinition={commandDefinition}
        id={id}
        label={label}
        resource={resource}
      />
    );
  },
  Blank() {
    return null;
  },
  Unsupported({ cellData: { cellType = commonText.nullInline() } }) {
    return (
      <>
        {commonText.colonLine({
          label: formsText.unsupportedCellType(),
          value: cellType,
        })}
      </>
    );
  },
};

export function FormCell({
  resource,
  cellData,
  id,
  formatId,
  formType,
  align,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly cellData: CellTypes[keyof CellTypes];
  readonly id: string | undefined;
  readonly formatId: (id: string) => string;
  readonly formType: FormType;
  readonly align: typeof cellAlign[number];
}): JSX.Element {
  const Render = cellRenderers[cellData.type] as typeof cellRenderers['Field'];
  return (
    <Render
      align={align}
      cellData={cellData as CellTypes['Field']}
      formatId={formatId}
      formType={formType}
      id={id}
      resource={resource}
    />
  );
}
