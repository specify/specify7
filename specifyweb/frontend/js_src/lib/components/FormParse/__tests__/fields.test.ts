import { reportsText } from '../../../localization/report';
import { requireContext } from '../../../tests/helpers';
import { localized } from '../../../utils/types';
import { strictParseXml } from '../../AppResources/parseXml';
import { getField } from '../../DataModel/helpers';
import { tables } from '../../DataModel/tables';
import type { SimpleXmlNode } from '../../Syncer/xmlToJson';
import { toSimpleXmlNode, xmlToJson } from '../../Syncer/xmlToJson';
import { parseFormField } from '../fields';
import { generateInit } from './helpers';

requireContext();

const xml = (xml: string): SimpleXmlNode =>
  toSimpleXmlNode(xmlToJson(strictParseXml(xml)));

const parse = (
  xmlString: string,
  parameters: Partial<Parameters<typeof parseFormField>[0]>
): ReturnType<typeof parseFormField> =>
  parseFormField({
    cell: xml(xmlString),
    getProperty: generateInit({}),
    table: tables.CollectionObject,
    fields: [tables.CollectionObject.strictGetField('catalogNumber')],
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
      whiteSpaceSensitive: false,
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
      whiteSpaceSensitive: false,
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
      whiteSpaceSensitive: false,
    }));

  test('Legacy text field', () =>
    expect(parse('<cell uiType="formattedtext" default="abc" />', {})).toEqual({
      defaultValue: 'abc',
      isReadOnly: false,
      max: undefined,
      min: undefined,
      step: undefined,
      whiteSpaceSensitive: false,
      type: 'Text',
    }));

  test('Label', () =>
    expect(parse('<cell uiType="label" default="abc" />', {})).toEqual({
      defaultValue: 'abc',
      isReadOnly: false,
      max: undefined,
      min: undefined,
      step: undefined,
      whiteSpaceSensitive: false,
      type: 'Text',
    }));

  test('Localized checkbox', () =>
    expect(parse('<cell uiType="checkbox" label="FINDNEXT" />', {})).toEqual({
      defaultValue: undefined,
      isReadOnly: false,
      type: 'Checkbox',
      printOnSave: false,
      label: localized('Find Next'),
    }));

  test('Raw Localized checkbox', () =>
    expect(
      parse('<cell uiType="checkbox" default="false" label="some label" />', {})
    ).toEqual({
      defaultValue: false,
      isReadOnly: false,
      type: 'Checkbox',
      printOnSave: false,
      label: localized('some label'),
    }));

  test('Can set default value to false', () =>
    expect(parse('<cell uiType="checkbox" default="false" />', {})).toEqual({
      defaultValue: false,
      isReadOnly: false,
      type: 'Checkbox',
      printOnSave: false,
      label: undefined,
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
      label: localized('Select All'),
    }));

  test('Legacy Print on Save checkbox', () =>
    expect(
      parse(
        '<cell uiType="checkbox" ignore="true" name="generatelabelchk" />',
        {}
      )
    ).toEqual({
      defaultValue: undefined,
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
      whiteSpaceSensitive: false,
    });
  });

  test('Query Combo Box', () =>
    expect(
      parse('<cell uiType="querycbx"/>', {
        getProperty: generateInit({
          cloneBtn: 'TRUE',
          newBtn: 'false',
          searchBtn: 'true',
          editBtn: 'true',
          name: 'NAME',
          searchView: 'a',
          viewBtn: 'true',
        }),
        fields: [tables.CollectionObject.strictGetField('accession')],
      })
    ).toEqual({
      isReadOnly: false,
      hasCloneButton: true,
      hasNewButton: false,
      hasSearchButton: true,
      hasEditButton: true,
      type: 'QueryComboBox',
      typeSearch: 'NAME',
      searchView: 'a',
      hasViewButton: true,
    }));

  test('Readonly Query Combo Box', () =>
    expect(
      parse(
        '<cell uiType="querycbx" readOnly="true" initialize="newBtn=false"/>',
        {
          fields: [tables.CollectionObject.strictGetField('accession')],
        }
      )
    ).toEqual({
      isReadOnly: true,
      hasCloneButton: false,
      hasNewButton: true,
      hasEditButton: true,
      hasSearchButton: true,
      searchView: undefined,
      type: 'QueryComboBox',
      typeSearch: undefined,
      hasViewButton: false,
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
        fields: [getField(tables.CollectionObject, 'timestampCreated')],
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
      whiteSpaceSensitive: false,
    }));
});

test('parseFormField handles fields without uiType', () => {
  const consoleWarn = jest.fn();
  jest.spyOn(console, 'warn').mockImplementation(consoleWarn);
  const cell = xml('<cell />');
  expect(
    parseFormField({
      cell,
      getProperty: generateInit({}),
      table: tables.CollectionObject,
      fields: undefined,
    })
  ).toEqual({
    isReadOnly: true,
    type: 'Blank',
  });
  expect(consoleWarn).toHaveBeenCalledWith('Field is missing uiType', cell);
});
