import React from 'react';

import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import type { FormMode } from '../parseform';
import type { CellTypes } from '../parseformcells';
import { UiCommand } from '../specifyformcommand';
import { FormField } from './specifyformfield';

const cellRenderers: {
  readonly [KEY in keyof CellTypes]: (props: {
    readonly mode: FormMode;
    readonly cellData: CellTypes[KEY];
    readonly id: number | undefined;
    readonly formatId: (id: string) => string;
    readonly resource: SpecifyResource<AnySchema>;
  }) => JSX.Element;
} = {
  Field({
    mode,
    cellData: { fieldDefinition, fieldName, isRequired },
    id,
    formatId,
    resource,
  }) {
    return (
      <FormField
        id={typeof id === 'number' ? formatId(id.toString()) : undefined}
        resource={resource}
        mode={mode}
        fieldDefinition={fieldDefinition}
        fieldName={fieldName}
        isRequired={isRequired}
      />
    );
  },
  Label({ cellData: { text, labelForCellId }, formatId, id }) {
    return (
      <label
        // FIXME: remove the need for this
        id={typeof id === 'number' ? formatId(id.toString()) : undefined}
        htmlFor={
          typeof labelForCellId === 'number'
            ? formatId(labelForCellId.toString())
            : undefined
        }
      >
        {text}
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
  SubView({ mode, cellData }) {},
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
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly mode: FormMode;
  readonly cellData: CellTypes[keyof CellTypes];
  readonly id: number | undefined;
  readonly formatId: (id: string) => string;
}): JSX.Element {
  const Render = cellRenderers[cellData.type] as (props: {
    readonly mode: FormMode;
    readonly cellData: CellTypes[keyof CellTypes];
    readonly id: number | undefined;
    readonly formatId: (id: string) => string;
    readonly resource: SpecifyResource<AnySchema>;
  }) => JSX.Element;
  return (
    <Render
      resource={resource}
      mode={mode}
      cellData={cellData}
      id={id}
      formatId={formatId}
    />
  );
}
