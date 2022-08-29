/**
 * Parse XML cell with a field definition into JSON
 *
 * Documentation - https://github.com/specify/specify7/wiki/Form-System#field
 * On any modifications, please check if documentation needs to be updated.
 */

import type { State } from 'typesafe-reducer';

import { f } from '../../utils/functools';
import {
  getAttribute,
  getBooleanAttribute,
  getParsedAttribute,
} from '../../utils/utils';
import { formsText } from '../../localization/forms';
import type { PluginDefinition } from './plugins';
import { parseUiPlugin } from './plugins';
import { legacyLocalize } from '../InitialContext/legacyUiLocalization';
import type { IR } from '../../utils/types';

export type FieldTypes = {
  readonly Checkbox: State<
    'Checkbox',
    {
      readonly defaultValue: boolean | undefined;
      readonly label: string | undefined;
      readonly printOnSave: boolean;
    }
  >;
  readonly TextArea: State<
    'TextArea',
    {
      readonly defaultValue: string | undefined;
      readonly rows: number | undefined;
    }
  >;
  readonly ComboBox: State<
    'ComboBox',
    {
      readonly defaultValue: string | undefined;
      readonly pickList: string | undefined;
    }
  >;
  readonly QueryComboBox: State<
    'QueryComboBox',
    {
      readonly hasCloneButton: boolean;
      readonly typeSearch: string | undefined;
    }
  >;
  readonly Text: State<
    'Text',
    {
      readonly defaultValue: string | undefined;
      // These are used by numeric fields only:
      readonly min: number | undefined;
      readonly max: number | undefined;
      readonly step: number | undefined;
    }
  >;
  readonly Plugin: State<
    'Plugin',
    {
      readonly pluginDefinition: PluginDefinition;
    }
  >;
  readonly FilePicker: State<'FilePicker'>;
};

const withStringDefault = (
  cell: Element
): {
  readonly defaultValue: string | undefined;
} => ({
  defaultValue: getAttribute(cell, 'default'),
});

const processFieldType: {
  readonly [KEY in keyof FieldTypes]: (
    cell: Element,
    getProperty: (name: string) => string | undefined
  ) => FieldTypes[KEY];
} = {
  Checkbox: (cell) =>
    f.var(
      (getBooleanAttribute(cell, 'ignore') ?? false) &&
        ['printonsave', 'generateinvoice', 'generatelabelchk'].includes(
          getParsedAttribute(cell, 'name')?.toLowerCase() ?? ''
        ),
      (printOnSave) => ({
        type: 'Checkbox',
        defaultValue: getBooleanAttribute(cell, 'default') ?? false,
        label:
          f.maybe(getParsedAttribute(cell, 'label'), legacyLocalize) ??
          (printOnSave ? formsText('printOnSave') : undefined),
        printOnSave,
      })
    ),
  TextArea(cell) {
    const rows = f.parseInt(getParsedAttribute(cell, 'rows'));
    return {
      type: 'TextArea',
      ...withStringDefault(cell),
      rows:
        rows === undefined
          ? getParsedAttribute(cell, 'uiType')?.toLowerCase() ===
            'textareabrief'
            ? 1
            : undefined
          : rows,
    };
  },
  ComboBox: (cell) => ({
    type: 'ComboBox',
    ...withStringDefault(cell),
    pickList: getParsedAttribute(cell, 'pickList'),
  }),
  Text: (cell, getProperty) => ({
    type: 'Text',
    ...withStringDefault(cell),
    min: f.parseInt(getProperty('min')),
    max: f.parseInt(getProperty('max')),
    step: f.parseFloat(getProperty('step')),
  }),
  QueryComboBox: (_cell, getProperty) => ({
    type: 'QueryComboBox',
    hasCloneButton: getProperty('cloneBtn')?.toLowerCase() === 'true',
    typeSearch: getProperty('name'),
  }),
  Plugin: (cell, getProperty) => ({
    type: 'Plugin',
    pluginDefinition: parseUiPlugin(
      getProperty,
      withStringDefault(cell).defaultValue
    ),
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

export function parseFormField(
  cell: Element,
  getProperty: (name: string) => string | undefined
): FormFieldDefinition {
  let uiType = getParsedAttribute(cell, 'uiType');
  if (uiType === undefined) {
    console.error('field is missing uiType', cell);
    uiType = 'text';
  }

  const isReadOnly =
    getBooleanAttribute(cell, 'readOnly') ??
    uiType.toLowerCase() === 'dsptextfield';

  let parser = processFieldType[fieldTypesTranslations[uiType.toLowerCase()]];
  if (parser === undefined) {
    console.error('unknown field uiType', { uiType, cell });
    parser = processFieldType.Text;
  }

  return {
    isReadOnly,
    ...parser(cell, getProperty),
  };
}
