import React from 'react';

import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import { localizeLabel } from '../localizeform';
import type { FormMode, FormType } from '../parseform';
import type { CellTypes } from '../parseformcells';
import { defined } from '../types';
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
    cellData: { text, labelForCellId },
    formatId,
    id,
    resource,
    fieldName,
  }) {
    const htmlFor =
      typeof labelForCellId === 'number'
        ? formatId(labelForCellId.toString())
        : undefined;
    const { children, ...props } = localizeLabel({
      text: text?.trim(),
      id,
      resource,
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
    formType,
    cellData: { fieldName, formType, isButton, icon },
  }) {
    return (
      <SubView
        mode={mode}
        isButton={isButton}
        parentFormType={formType}
        formType={formType}
        parentResource={resource}
        field={defined(resource.specifyModel.getRelationship(fieldName ?? ''))}
        icon={icon}
      />
    );
  },
  // FIXME: figure out what to do with this
  Panel({ mode, cellData }) {},
  Command({ cellData: { name, label }, id, resource }) {
    return <UiCommand name={name} label={label} resource={resource} id={id} />;
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
  const Render = cellRenderers[cellData.type];
  return (
    <Render
      resource={resource}
      mode={mode}
      cellData={cellData}
      id={id}
      formatId={formatId}
      formType={formType}
    />
  );
}
