import React from 'react';

import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import { localizeLabel } from '../localizeform';
import type { FormMode, FormType } from '../parseform';
import { getView, parseViewDefinition } from '../parseform';
import type { CellTypes } from '../parseformcells';
import type { Collection } from '../specifymodel';
import { defined } from '../types';
import { f } from '../wbplanviewhelper';
import { relationshipIsToMany } from '../wbplanviewmappinghelper';
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
  }) => JSX.Element;
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
        id={typeof id === 'string' ? formatId(id.toString()) : undefined}
        resource={resource}
        mode={mode}
        fieldDefinition={fieldDefinition}
        fieldName={fieldName}
        isRequired={isRequired}
        formType={formType}
      />
    );
  },
  Label({
    cellData: { text, labelForCellId, fieldName },
    formatId,
    id,
    resource,
  }) {
    const htmlFor =
      typeof labelForCellId === 'string' ? formatId(labelForCellId) : undefined;
    const { children, ...props } = localizeLabel({
      text: text?.trim(),
      id,
      model: resource.specifyModel,
      fieldName,
    });
    return (
      <label htmlFor={htmlFor} {...props} aria-hidden={children.length === 0}>
        {children}
      </label>
    );
  },
  Separator({ cellData: { label } }) {
    return typeof label === 'string' ? (
      <h3 className="border-b border-gray-500">{label}</h3>
    ) : (
      <hr className="w-full border-b border-gray-500" />
    );
  },
  SubView({
    resource,
    mode,
    formType: parentFormType,
    cellData: { fieldName, formType, isButton, icon, viewName },
  }) {
    const field = defined(
      resource.specifyModel.getRelationship(fieldName ?? '')
    );
    const [interactionCollection] = useAsyncState<
      false | Collection<AnySchema>
    >(
      React.useCallback(
        () =>
          relationshipIsToMany(field) &&
          ['LoanPreparation', 'GiftPreparation'].includes(
            field.relatedModel.name
          )
            ? resource.rgetCollection(field.name).then(async (collection) =>
                getView(field.relatedModel.view)
                  .then((viewDefinition) =>
                    // The form has to actually be built to tell if it is a formTable.
                    typeof viewDefinition === 'object'
                      ? parseViewDefinition(viewDefinition, formType, mode)
                      : undefined
                  )
                  .then((definition) =>
                    definition?.formType === 'table' ? collection : undefined
                  )
              )
            : false,
        [field, resource]
      )
    );
    return typeof interactionCollection === 'undefined' ? (
      <></>
    ) : interactionCollection === false ? (
      <SubView
        mode={mode}
        isButton={isButton}
        parentFormType={parentFormType}
        formType={formType}
        parentResource={resource}
        field={field}
        viewName={viewName}
        icon={icon}
      />
    ) : (
      <FormTableInteraction
        mode={mode}
        collection={interactionCollection}
        dialog={false}
        onDelete={undefined}
        onClose={f.never}
      />
    );
  },
  Panel({ mode, formType, resource, cellData }) {
    return (
      <RenderForm
        viewDefinition={{
          ...cellData,
          mode,
          formType,
          model: resource.specifyModel,
        }}
        resource={resource}
        hasHeader={false}
      />
    );
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
        label={label}
        commandDefinition={commandDefinition}
        resource={resource}
        id={id}
      />
    );
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
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly mode: FormMode;
  readonly cellData: CellTypes[keyof CellTypes];
  readonly id: string | undefined;
  readonly formatId: (id: string) => string;
  readonly formType: FormType;
}): JSX.Element {
  const Render = cellRenderers[cellData.type] as typeof cellRenderers['Field'];
  return (
    <Render
      resource={resource}
      mode={mode}
      cellData={cellData as CellTypes['Field']}
      id={id}
      formatId={formatId}
      formType={formType}
    />
  );
}
