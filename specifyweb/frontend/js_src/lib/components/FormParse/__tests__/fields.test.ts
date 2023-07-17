import type { LocalizedString } from 'typesafe-i18n';

import { reportsText } from '../../../localization/report';
import { requireContext } from '../../../tests/helpers';
import { strictParseXml } from '../../AppResources/codeMirrorLinters';
import { getField } from '../../DataModel/helpers';
import { schema } from '../../DataModel/schema';
import { parseFormField } from '../fields';
import { generateInit } from './helpers';

requireContext();

const parse = (
  xml: string,
  parameters: Partial<Parameters<typeof parseFormField>[0]>
): ReturnType<typeof parseFormField> =>
  parseFormField({
    cell: strictParseXml(xml),
    getProperty: generateInit({}),
    model: schema.models.CollectionObject,
    fields: [schema.models.CollectionObject.strictGetField('catalogNumber')],
    ...parameters,
  });

describe('parseFormField', () => {
  test('Simplest case', () =>
    expect(parse('<cell uiType="text" />', {})).toEqual({
      defaultValue: undefined,
      isReadOnly: false,
      max: undefined,
      min: undefined,
      step: undefined,
      type: 'Text',
    }));

  test('Readonly Text field', () =>
    expect(
      parse('<cell readOnly="true" uitype="TEXT" default="a" />', {
        getProperty: generateInit({ min: '4', max: '-10', step: '3.2' }),
      })
    ).toEqual({
      defaultValue: 'a',
      isReadOnly: true,
      max: -10,
      min: 4,
      step: 3.2,
      type: 'Text',
    }));

  test('Legacy readonly text field', () =>
    expect(
      parse('<cell uiType="DspTextField" default="abc" />', {
        getProperty: generateInit({ min: '4', max: '-10', step: '3.2' }),
      })
    ).toEqual({
      defaultValue: 'abc',
      isReadOnly: true,
      max: -10,
      min: 4,
      step: 3.2,
      type: 'Text',
    }));

  test('Legacy text field', () =>
    expect(parse('<cell uiType="formattedtext" default="abc" />', {})).toEqual({
      defaultValue: 'abc',
      isReadOnly: false,
      max: undefined,
      min: undefined,
      step: undefined,
      type: 'Text',
    }));

  test('Label', () =>
    expect(parse('<cell uiType="label" default="abc" />', {})).toEqual({
      defaultValue: 'abc',
      isReadOnly: false,
      max: undefined,
      min: undefined,
      step: undefined,
      type: 'Text',
    }));

  test('Localized checkbox', () =>
    expect(
      parse('<cell uiType="checkbox" default="true" label="FINDNEXT" />', {})
    ).toEqual({
      defaultValue: true,
      isReadOnly: false,
      type: 'Checkbox',
      printOnSave: false,
      label: 'Find Next' as LocalizedString,
    }));

  test('Raw Localized checkbox', () =>
    expect(
      parse('<cell uiType="checkbox" default="true" label="some label" />', {})
    ).toEqual({
      defaultValue: true,
      isReadOnly: false,
      type: 'Checkbox',
      printOnSave: false,
      label: 'some label' as LocalizedString,
    }));

  test('Print on Save checkbox', () =>
    expect(
      parse(
        '<cell uiType="checkbox" default="true" ignore="true" name="printonsave" label="SELECTALL" />',
        {}
      )
    ).toEqual({
      defaultValue: true,
      isReadOnly: false,
      type: 'Checkbox',
      printOnSave: true,
      label: 'Select All' as LocalizedString,
    }));

  test('Legacy Print on Save checkbox', () =>
    expect(
      parse(
        '<cell uiType="checkbox" ignore="true" name="generatelabelchk" />',
        {}
      )
    ).toEqual({
      defaultValue: false,
      isReadOnly: false,
      type: 'Checkbox',
      printOnSave: true,
      label: reportsText.generateLabelOnSave(),
    }));

  test('Textarea', () =>
    expect(
      parse('<cell uiType="textarea" ignore="true" default="a" />', {})
    ).toEqual({
      defaultValue: 'a',
      isReadOnly: false,
      type: 'TextArea',
      rows: undefined,
    }));

  test('Legacy Textarea', () =>
    expect(parse('<cell uiType="textareabrief" ignore="true" />', {})).toEqual({
      defaultValue: undefined,
      isReadOnly: false,
      type: 'TextArea',
      rows: 1,
    }));

  test('Advanced Legacy Textarea', () =>
    expect(
      parse(
        '<cell uiType="textareabrief" rows="3" readOnly="true" ignore="true" default="ab\nc" />',
        {}
      )
    ).toEqual({
      /*
       * New lines are replaced by spaces by the XML parser
       * See https://stackoverflow.com/a/8188290/8584605
       */
      defaultValue: 'ab c',
      isReadOnly: true,
      type: 'TextArea',
      rows: 3,
    }));

  test('Combo box', () =>
    expect(
      parse('<cell uiType="combobox" default="a" picklist="b" />', {})
    ).toEqual({
      defaultValue: 'a',
      isReadOnly: false,
      type: 'ComboBox',
      pickList: 'b',
    }));

  test('Invalid combo box', () => {
    jest.spyOn(console, 'error').mockImplementation();
    expect(parse('<cell uiType="combobox"/>', {})).toEqual({
      defaultValue: undefined,
      isReadOnly: false,
      type: 'Text',
      max: undefined,
      min: undefined,
      step: undefined,
    });
  });

  test('Query Combo Box', () =>
    expect(
      parse('<cell uiType="querycbx"/>', {
        getProperty: generateInit({ cloneBtn: 'TRUE', name: 'NAME' }),
        fields: [schema.models.CollectionObject.strictGetField('accession')],
      })
    ).toEqual({
      isReadOnly: false,
      hasCloneButton: true,
      type: 'QueryComboBox',
      typeSearch: 'NAME',
    }));

  test('Readonly Query Combo Box', () =>
    expect(
      parse('<cell uiType="querycbx" readOnly="true" />', {
        fields: [schema.models.CollectionObject.strictGetField('accession')],
      })
    ).toEqual({
      isReadOnly: true,
      hasCloneButton: false,
      type: 'QueryComboBox',
      typeSearch: undefined,
    }));

  test('Query Combo Box for non-relationship', () => {
    jest.spyOn(console, 'error').mockImplementation();
    expect(parse('<cell uiType="querycbx"/>', {})).toEqual({
      isReadOnly: true,
      type: 'Blank',
    });
  });

  test('Partial Date plugin', () =>
    expect(
      parse('<cell uiType="plugin" default=" 2020-01-01 " />', {
        getProperty: generateInit({ name: 'PartialDateUI' }),
      })
    ).toEqual({
      isReadOnly: false,
      type: 'Plugin',
      pluginDefinition: {
        type: 'PartialDateUI',
        defaultValue: new Date('2020-01-01T00:00:00.000Z'),
        canChangePrecision: true,
        dateFields: ['catalogNumber'],
        precisionField: undefined,
        defaultPrecision: 'full',
      },
    }));

  test('Text component is converted into partial date for data fields', () =>
    expect(
      parse('<cell uiType="text" />', {
        fields: [getField(schema.models.CollectionObject, 'timestampCreated')],
      })
    ).toEqual({
      isReadOnly: false,
      type: 'Plugin',
      pluginDefinition: {
        type: 'PartialDateUI',
        defaultValue: undefined,
        canChangePrecision: false,
        dateFields: ['timestampCreated'],
        precisionField: undefined,
        defaultPrecision: 'full',
      },
    }));

  test('File picker is rendered as a text field', () =>
    expect(parse('<cell uiType="browse" initialize="min=3" />', {})).toEqual({
      defaultValue: undefined,
      isReadOnly: false,
      type: 'Text',
      max: undefined,
      maxLength: undefined,
      min: undefined,
      minLength: undefined,
      step: undefined,
    }));
});

test('parseFormField handles fields without uiType', () => {
  const consoleWarn = jest.fn();
  jest.spyOn(console, 'warn').mockImplementation(consoleWarn);
  const cell = strictParseXml('<cell />');
  expect(
    parseFormField({
      cell,
      getProperty: generateInit({}),
      model: schema.models.CollectionObject,
      fields: undefined,
    })
  ).toEqual({
    isReadOnly: true,
    type: 'Blank',
  });
  expect(consoleWarn).toHaveBeenCalledWith('Field is missing uiType', cell);
});
