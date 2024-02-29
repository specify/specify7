/**
 * Parse XML cell with a field definition into JSON
 *
 * Documentation - https://github.com/specify/specify7/wiki/Form-System#field
 * On any modifications, please check if documentation needs to be updated.
 */

import type { LocalizedString } from 'typesafe-i18n';
import type { State } from 'typesafe-reducer';

import { reportsText } from '../../localization/report';
import { f } from '../../utils/functools';
import { parserFromType } from '../../utils/parser/definitions';
import type { IR, RA, ValueOf } from '../../utils/types';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { addContext } from '../Errors/logContext';
import { specialPickListMapping } from '../FormFields/ComboBox';
import { legacyLocalize } from '../InitialContext/legacyUiLocalization';
import { hasPermission, hasToolPermission } from '../Permissions/helpers';
import type { SimpleXmlNode } from '../Syncer/xmlToJson';
import {
  getAttribute,
  getBooleanAttribute,
  getParsedAttribute,
} from '../Syncer/xmlUtils';
import type { PluginDefinition } from './plugins';
import { parseUiPlugin } from './plugins';

export type FieldTypes = {
  readonly Checkbox: State<
    'Checkbox',
    {
      readonly defaultValue: boolean | undefined;
      readonly label: LocalizedString | undefined;
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
      readonly pickList: string;
    }
  >;
  readonly QueryComboBox: State<
    'QueryComboBox',
    {
      readonly hasCloneButton: boolean;
      readonly hasNewButton: boolean;
      readonly hasSearchButton: boolean;
      readonly hasEditButton: boolean;
      readonly hasViewButton: boolean;
      readonly typeSearch: string | undefined;
      readonly searchView: string | undefined;
    }
  >;
  readonly Text: State<
    'Text',
    {
      readonly defaultValue: string | undefined;
      // These are used by numeric and date fields
      readonly min: number | string | undefined;
      readonly max: number | string | undefined;
      // These are used by numeric field only
      readonly step: number | undefined;
      readonly minLength: number | undefined;
      readonly maxLength: number | undefined;
    }
  >;
  readonly Plugin: State<
    'Plugin',
    {
      readonly pluginDefinition: PluginDefinition;
    }
  >;
  readonly Blank: State<'Blank'>;
};

const withStringDefault = (
  cell: SimpleXmlNode
): {
  readonly defaultValue: string | undefined;
} => ({
  defaultValue: getAttribute(cell, 'default'),
});

const processFieldType: {
  readonly [KEY in keyof FieldTypes]: (payload: {
    readonly cell: SimpleXmlNode;
    readonly getProperty: (name: string) => string | undefined;
    readonly table: SpecifyTable;
    readonly fields: RA<LiteralField | Relationship> | undefined;
  }) => FieldTypes[keyof FieldTypes];
} = {
  Checkbox({ cell, table, fields }) {
    const printOnSave =
      (getBooleanAttribute(cell, 'ignore') ?? false) &&
      ['printonsave', 'generateinvoice', 'generatelabelchk'].includes(
        getParsedAttribute(cell, 'name')?.toLowerCase() ?? ''
      );
    if (printOnSave) {
      if (!hasPermission('/report', 'execute')) return { type: 'Blank' };
    } else if (fields === undefined) {
      console.error(
        `Trying to render a checkbox on a ${table.name} form without a field name`
      );
      return { type: 'Blank' };
    } else if (fields.at(-1)?.isRelationship === true) {
      console.error("Can't render a check box for a relationship field");
      return { type: 'Blank' };
    }
    return {
      type: 'Checkbox',
      defaultValue: getBooleanAttribute(cell, 'default'),
      label:
        f.maybe(getParsedAttribute(cell, 'label'), legacyLocalize) ??
        (printOnSave ? reportsText.generateLabelOnSave() : undefined),
      printOnSave,
    };
  },
  TextArea({ cell, table, fields }) {
    const rows = f.parseInt(getParsedAttribute(cell, 'rows'));
    if (fields === undefined)
      console.error(
        `Trying to render a text area on the ${table.name} form with unknown field name`
      );
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
  ComboBox: (props) => {
    const { cell, fields, table } = props;
    if (fields === undefined) {
      console.error(
        'Trying to render a ComboBox on a form without a field name'
      );
      return { type: 'Blank' };
    } else if (fields.at(-1)?.name === 'division')
      return processFieldType.QueryComboBox(props);
    else if (hasToolPermission('pickLists', 'read')) {
      const field = fields.at(-1);
      const pickListName =
        getParsedAttribute(cell, 'pickList') ??
        field?.getPickList() ??
        specialPickListMapping[table.name as '']?.[field?.name ?? ''] ??
        specialPickListMapping[''][field?.name ?? ''];

      if (typeof pickListName === 'string')
        return {
          type: 'ComboBox',
          ...withStringDefault(cell),
          pickList: pickListName,
        };
      else {
        console.error('PickList name is missing');
        return processFieldType.Text(props);
      }
    } else return { type: 'Blank' };
  },
  Text: (props) => {
    const { cell, getProperty, fields } = props;
    const field = fields?.at(-1);
    const fieldType =
      typeof field === 'object' && !field.isRelationship
        ? parserFromType(field.type).type
        : undefined;
    if (fieldType === 'date')
      return processFieldType.Plugin({
        ...props,
        getProperty: (name: string) =>
          name === 'name'
            ? 'PartialDateUI'
            : name === 'canChangePrecision'
            ? 'false'
            : getProperty(name),
      });
    else if (fieldType === 'checkbox') return processFieldType.Checkbox(props);

    const defaults = withStringDefault(cell);
    if (defaults.defaultValue === undefined && field === undefined)
      return { type: 'Blank' };

    return {
      type: 'Text',
      ...defaults,
      min: f.parseInt(getProperty('min')),
      max: f.parseInt(getProperty('max')),
      step: f.parseFloat(getProperty('step')),
      minLength: f.parseInt(getProperty('minLength')),
      maxLength: f.parseInt(getProperty('maxLength')),
    };
  },
  QueryComboBox({ getProperty, fields }) {
    if (fields === undefined) {
      console.error('Trying to render a query combobox without a field name');
      return { type: 'Blank' };
    } else if (fields.at(-1)?.isRelationship === true) {
      return {
        type: 'QueryComboBox',
        hasCloneButton: getProperty('cloneBtn')?.toLowerCase() === 'true',
        hasNewButton: getProperty('newBtn')?.toLowerCase() !== 'false',
        hasSearchButton: getProperty('searchBtn')?.toLowerCase() !== 'false',
        hasEditButton: getProperty('editBtn')?.toLowerCase() !== 'false',
        hasViewButton: getProperty('viewBtn')?.toLowerCase() === 'true',
        typeSearch: getProperty('name'),
        searchView: getProperty('searchView'),
      };
    } else {
      console.error('QueryComboBox can only be used to display a relationship');
      return { type: 'Blank' };
    }
  },
  Plugin: ({ cell, getProperty, table, fields }) => ({
    type: 'Plugin',
    pluginDefinition: parseUiPlugin({
      cell,
      getProperty,
      defaultValue: withStringDefault(cell).defaultValue,
      table,
      fields,
    }),
  }),
  Blank: () => ({ type: 'Blank' }),
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
  browse: 'Text',
};

export type FormFieldDefinition = ValueOf<FieldTypes> & {
  readonly isReadOnly: boolean;
};

export function parseFormField({
  cell,
  getProperty,
  table,
  fields,
}: {
  readonly cell: SimpleXmlNode;
  readonly getProperty: (name: string) => string | undefined;
  readonly table: SpecifyTable;
  readonly fields: RA<LiteralField | Relationship> | undefined;
}): FormFieldDefinition {
  let uiType: string | undefined = getParsedAttribute(cell, 'uiType');
  if (uiType === undefined) {
    console.warn('Field is missing uiType', cell);
    uiType = 'text';
  }
  addContext({ fieldType: uiType });

  let parser = processFieldType[fieldTypesTranslations[uiType.toLowerCase()]];
  if (parser === undefined) {
    console.error('unknown field uiType', { uiType, cell });
    parser = processFieldType.Text;
  }

  const parseResult = parser({ cell, getProperty, table, fields });

  const isReadOnly =
    (getBooleanAttribute(cell, 'readOnly') ??
      uiType.toLowerCase() === 'dsptextfield') ||
    parseResult.type === 'Blank';

  return {
    isReadOnly,
    ...parseResult,
  };
}
