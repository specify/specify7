import type { State } from 'typesafe-reducer';

import type { Tables } from './datamodel';
import { getModel } from './schema';
import type { IR } from './types';

export type FieldTypes = {
  readonly Checkbox: State<
    'Checkbox',
    {
      defaultValue: boolean | undefined;
      label: string | undefined;
      printOnSave: boolean;
    }
  >;
  readonly TextArea: State<
    'TextArea',
    {
      defaultValue: string | undefined;
      rows: number | undefined;
    }
  >;
  readonly ComboBox: State<
    'ComboBox',
    {
      defaultValue: string | undefined;
      pickList: string | undefined;
    }
  >;
  readonly QueryComboBox: State<
    'QueryComboBox',
    {
      readonly hasCloneButton: boolean;
      readonly typeSearch: keyof Tables | undefined;
    }
  >;
  readonly Text: State<
    'Text',
    {
      readonly defaultValue: string | undefined;
      // These are used by number input box:
      readonly min: number | undefined;
      readonly max: number | undefined;
      readonly step: number | undefined;
    }
  >;
  readonly Plugin: State<
    'Plugin',
    {
      readonly defaultValue: string | undefined;
      // FIXME: rewrite UiPlugins to React
      readonly plugin: keyof typeof uiPlugins;
    }
  >;
  readonly FilePicker: State<'FilePicker'>;
};

function withStringDefault(cell: Element): {
  readonly defaultValue: string | undefined;
} {
  const defaultValue = cell.getAttribute('default') ?? undefined;
  return {
    defaultValue:
      typeof defaultValue === 'undefined' ? undefined : defaultValue,
  };
}

const processFieldType: {
  readonly [KEY in keyof FieldTypes]: (
    cell: Element,
    properties: IR<string>
  ) => FieldTypes[KEY];
} = {
  Checkbox(cell) {
    const fieldName = cell.getAttribute('name') ?? '';
    const defaultValue = cell.getAttribute('default') ?? undefined;
    const ignore = cell.getAttribute('ignore')?.toLowerCase() === 'true';
    return {
      type: 'Checkbox',
      defaultValue:
        typeof defaultValue === 'undefined'
          ? undefined
          : defaultValue.toLowerCase() === 'true',
      label: cell.getAttribute('label') ?? undefined,
      printOnSave:
        ignore &&
        ['printonsave', 'generateinvoice', 'generatelabelchk'].includes(
          fieldName.toLowerCase()
        ),
    };
  },
  TextArea(cell) {
    const rows = Number.parseInt(cell.getAttribute('rows') ?? '');
    return {
      type: 'TextArea',
      ...withStringDefault(cell),
      rows: Number.isNaN(rows)
        ? cell.getAttribute('uiType')?.toLowerCase() === 'textareabrief'
          ? 1
          : undefined
        : rows,
    };
  },
  ComboBox: (cell) => ({
    type: 'ComboBox',
    ...withStringDefault(cell),
    pickList: cell.getAttribute('pickList') ?? undefined,
  }),
  Text(cell, properties) {
    const min = Number.parseInt(properties.min);
    const max = Number.parseInt(properties.max);
    const step = Number.parseInt(properties.step);
    return {
      type: 'Text',
      ...withStringDefault(cell),
      min: Number.isNaN(min) ? undefined : min,
      max: Number.isNaN(max) ? undefined : max,
      step: Number.isNaN(step) ? undefined : step,
    };
  },
  QueryComboBox: (cell, properties) => ({
    type: 'QueryComboBox',
    hasCloneButton: properties.clonebtn?.toLowerCase() === 'true',
    typeSearch: getModel(properties.name ?? '')?.name,
  }),
  Plugin: (cell, properties) => ({
    type: 'Plugin',
    ...withStringDefault(cell),
    plugin:
      uiPlugins[properties.name as keyof typeof uiPlugins] ??
      uiPlugins.Unavailable,
  }),
  FilePicker: () => ({ type: 'FilePicker' }),
};

const fieldTypesTranslations: IR<keyof FieldTypes> = {
  checkbox: 'Checkbox',
  textarea: 'TextArea',
  textareabrief: 'TextArea',
  combobox: 'ComboBox',
  spinner: 'Text',
  querycbx: 'QueryComboBox',
  text: 'Text',
  dsptextfield: 'Text',
  formattedtext: 'Text',
  label: 'Text',
  plugin: 'Plugin',
  browse: 'FilePicker',
};

export type FormFieldDefinition = FieldTypes[keyof FieldTypes] & {
  readonly isReadOnly: boolean;
};

export function parseFormCell(
  cell: Element,
  properties: IR<string>
): FormFieldDefinition {
  let uiType = cell.getAttribute('uiType') ?? undefined;
  if (typeof uiType === 'undefined') {
    console.error('field is missing uiType', cell);
    uiType = 'text';
  }

  const isReadOnly =
    cell.getAttribute('readonly')?.toLowerCase() === 'true' ||
    uiType.toLowerCase() === 'dsptextfield';

  let parser = processFieldType[fieldTypesTranslations[uiType.toLowerCase()]];
  if (typeof parser === 'undefined') {
    console.error('unknown field uiType', { uiType, cell });
    parser = processFieldType.Text;
  }

  return { isReadOnly, ...parser(cell, properties) };
}
