import React from 'react';

import type { AnySchema } from '../datamodelutils';
import { f } from '../functools';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import type { FormMode, FormType } from '../parseform';
import { getView, processViewDefinition } from '../parseform';
import type { cellAlign, CellTypes } from '../parseformcells';
import { hasTablePermission } from '../permissions';
import type { Collection } from '../specifymodel';
import { defined } from '../types';
import { relationshipIsToMany } from '../wbplanviewmappinghelper';
import { H3 } from './basic';
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
  Label({ cellData: { text, labelForCellId, title }, formatId, align }) {
    return typeof text === 'string' && text.length === 0 ? null : (
      <label
        htmlFor={
          typeof labelForCellId === 'string'
            ? formatId(labelForCellId)
            : undefined
        }
        title={title}
        style={{
          textAlign:
            align === 'right'
              ? 'right'
              : align === 'center'
              ? 'center'
              : undefined,
        }}
      >
        {text}
      </label>
    );
  },
  Separator({ cellData: { label } }) {
    return typeof label === 'string' ? (
      <H3 className="border-b border-gray-500">{label}</H3>
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
    const field = defined(
      resource.specifyModel.getRelationship(fieldName ?? '')
    );

    /*
     * SubView is turned into formTable if formTable is the default FormType for
     * the related table
     */
    const [actualFormType] = useAsyncState<FormType>(
      React.useCallback(
        async () =>
          getView(field.relatedModel.view)
            .then((viewDefinition) =>
              typeof viewDefinition === 'object'
                ? processViewDefinition(viewDefinition, formType, mode)
                : undefined
            )
            .then((definition) => definition?.formType ?? 'form'),
        [field.relatedModel, formType, mode]
      ),
      false
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
            ? resource.rgetCollection(field.name)
            : false,
        [field, resource]
      ),
      false
    );

    return hasTablePermission(field.relatedModel.name, 'read') ? (
      typeof interactionCollection === 'undefined' ||
      typeof actualFormType === 'undefined' ? null : interactionCollection ===
          false || actualFormType === 'form' ? (
        <SubView
          mode={mode}
          isButton={isButton}
          parentFormType={parentFormType}
          formType={formType}
          parentResource={resource}
          field={field}
          viewName={viewName}
          icon={icon}
          sortField={sortField}
        />
      ) : (
        <FormTableInteraction
          mode={mode}
          collection={interactionCollection}
          dialog={false}
          onDelete={undefined}
          onClose={f.never}
          sortField={sortField}
        />
      )
    ) : (
      f.log(
        `SubView hidden due to lack of read permissions to ${field.relatedModel.name} table`
      ) ?? null
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
      resource={resource}
      mode={mode}
      cellData={cellData as CellTypes['Field']}
      id={id}
      formatId={formatId}
      formType={formType}
    />
  );
}
