import React from 'react';

import type { AnySchema } from '../datamodelutils';
import { f } from '../functools';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import type { FormMode, FormType } from '../parseform';
import { getView, processViewDefinition } from '../parseform';
import type { cellAlign, CellTypes } from '../parseformcells';
import { hasPathPermission } from '../permissionutils';
import { schema } from '../schema';
import type { Collection } from '../specifymodel';
import { relationshipIsToMany } from '../wbplanviewmappinghelper';
import { DataEntry } from './basic';
import { TableIcon } from './common';
import { FormTableInteraction } from './formtableinteractionitem';
import { useAsyncState } from './hooks';
import { RenderForm } from './specifyform';
import { UiCommand } from './specifyformcommand';
import { FormField } from './specifyformfield';
import { SubView } from './subview';

const cellRenderers: {
  readonly [KEY in keyof CellTypes]: (props: {
    readonly mode: FormMode;
    readonly cellData: CellTypes[KEY];
    readonly id: string | undefined;
    readonly formatId: (id: string) => string;
    readonly resource: SpecifyResource<AnySchema>;
    readonly formType: FormType;
    readonly align: typeof cellAlign[number];
  }) => JSX.Element | null;
} = {
  Field({
    mode,
    cellData: { fieldDefinition, fieldName, isRequired },
    id,
    formatId,
    resource,
    formType,
  }) {
    return (
      <FormField
        fieldDefinition={fieldDefinition}
        fieldName={fieldName}
        formType={formType}
        id={typeof id === 'string' ? formatId(id.toString()) : undefined}
        isRequired={isRequired}
        mode={mode}
        resource={resource}
      />
    );
  },
  Label({ cellData: { text, labelForCellId, title }, formatId, align }) {
    const style: React.CSSProperties = {
      textAlign:
        align === 'right' ? 'right' : (align === 'center' ? 'center' : undefined),
    };
    return typeof text === 'string' &&
      text.length === 0 ? null : (typeof labelForCellId === 'string' ? (
      <label htmlFor={formatId(labelForCellId)} style={style} title={title}>
        {text}
      </label>
    ) : (
      <p style={style} title={title}>
        {text}
      </p>
    ));
  },
  Separator({ cellData: { label, icon, forClass } }) {
    return typeof label === 'string' || typeof forClass === 'string' ? (
      <DataEntry.SubFormTitle
        className="border-b border-gray-500"
        title={
          typeof forClass === 'string'
            ? schema.models[forClass].localization.desc?.toString() ?? undefined
            : undefined
        }
      >
        {typeof forClass === 'string' ? (
          <>
            <TableIcon label={false} name={forClass} />
            {schema.models[forClass].label}
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
    resource,
    mode,
    formType: parentFormType,
    cellData: { fieldName, formType, isButton, icon, viewName, sortField },
  }) {
    const relationship = resource.specifyModel.getRelationship(fieldName ?? '');

    /*
     * SubView is turned into formTable if formTable is the default FormType for
     * the related table
     */
    const [actualFormType] = useAsyncState<FormType>(
      React.useCallback(
        async () =>
          typeof relationship === 'object'
            ? getView(viewName ?? relationship.relatedModel.view)
                .then((viewDefinition) =>
                  typeof viewDefinition === 'object'
                    ? processViewDefinition(viewDefinition, formType, mode)
                    : undefined
                )
                .then((definition) => definition?.formType ?? 'form')
            : f.error(
                `Can't render subView for an unknown field: ${
                  fieldName ?? 'undefined'
                }`
              ),
        [viewName, formType, mode, relationship, fieldName]
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
          [
            'LoanPreparation',
            'GiftPreparation',
            'DisposalPreparation',
          ].includes(relationship.relatedModel.name)
            ? resource.rgetCollection(relationship.name)
            : false,
        [relationship, resource]
      ),
      false
    );

    if (relationship === undefined) return null;
    else if (relationship.type === 'many-to-many') {
      // ResourceApi does not support .rget() on a many-to-many
      console.error('Many-to-many relationships are not supported');
      return null;
    } else if (
      hasPathPermission(
        resource.specifyModel.name,
        relationship.relatedModel.name.split('.'),
        'read'
      )
    ) {
      if (interactionCollection === undefined || actualFormType === undefined)
        return null;
      else if (interactionCollection === false || actualFormType === 'form')
        return (
          <SubView
            formType={actualFormType}
            icon={icon}
            isButton={isButton}
            mode={mode}
            parentFormType={parentFormType}
            parentResource={resource}
            relationship={relationship}
            sortField={sortField}
            viewName={viewName}
          />
        );
      else
        return (
          <FormTableInteraction
            collection={interactionCollection}
            dialog={false}
            mode={mode}
            sortField={sortField}
            onClose={f.never}
            onDelete={undefined}
          />
        );
    } else {
      console.log(
        `SubView hidden due to lack of read permissions to ${resource.specifyModel.name}.${relationship.relatedModel.name}`
      );
      return null;
    }
  },
  Panel({ mode, formType, resource, cellData: { display, ...cellData } }) {
    const form = (
      <RenderForm
        display={display}
        resource={resource}
        viewDefinition={{
          ...cellData,
          mode,
          formType,
          model: resource.specifyModel,
        }}
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
  Unsupported({ cellData: { cellType } }) {
    return (
      <>
        {`${formsText('unsupportedCellType')} ${
          cellType ?? commonText('nullInline')
        }`}
      </>
    );
  },
};

export function FormCell({
  resource,
  mode,
  cellData,
  id,
  formatId,
  formType,
  align,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly mode: FormMode;
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
      mode={mode}
      resource={resource}
    />
  );
}
