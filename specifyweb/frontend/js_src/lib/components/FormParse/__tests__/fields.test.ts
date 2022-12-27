import { formsText } from '../../../localization/forms';
import { requireContext } from '../../../tests/helpers';
import { theories } from '../../../tests/utils';
import { strictParseXml } from '../../AppResources/codeMirrorLinters';
import { parseFormField } from '../fields';
import { generateInit } from './helpers';

requireContext();

theories(parseFormField, [
  {
    in: [strictParseXml('<cell uiType="text" />'), generateInit({})],
    out: {
      defaultValue: undefined,
      isReadOnly: false,
      max: undefined,
      min: undefined,
      step: undefined,
      type: 'Text',
    },
  },
  {
    in: [
      strictParseXml('<cell readOnly="true" uitype="TEXT" default="a" />'),
      generateInit({ min: '4', max: '-10', step: '3.2' }),
    ],
    out: {
      defaultValue: 'a',
      isReadOnly: true,
      max: -10,
      min: 4,
      step: 3.2,
      type: 'Text',
    },
  },
  {
    in: [
      strictParseXml('<cell uiType="DspTextField" default="abc" />'),
      generateInit({}),
    ],
    out: {
      defaultValue: 'abc',
      isReadOnly: true,
      max: undefined,
      min: undefined,
      step: undefined,
      type: 'Text',
    },
  },
  {
    in: [
      strictParseXml('<cell uiType="formattedtext" default="abc" />'),
      generateInit({}),
    ],
    out: {
      defaultValue: 'abc',
      isReadOnly: false,
      max: undefined,
      min: undefined,
      step: undefined,
      type: 'Text',
    },
  },
  {
    in: [
      strictParseXml('<cell uiType="label" default="abc" />'),
      generateInit({}),
    ],
    out: {
      defaultValue: 'abc',
      isReadOnly: false,
      max: undefined,
      min: undefined,
      step: undefined,
      type: 'Text',
    },
  },
  {
    in: [
      strictParseXml(
        '<cell uiType="checkbox" default="true" label="FINDNEXT" />'
      ),
      generateInit({}),
    ],
    out: {
      defaultValue: true,
      isReadOnly: false,
      type: 'Checkbox',
      printOnSave: false,
      label: 'Find Next',
    },
  },
  {
    in: [
      strictParseXml(
        '<cell uiType="checkbox" default="true" label="some label" />'
      ),
      generateInit({}),
    ],
    out: {
      defaultValue: true,
      isReadOnly: false,
      type: 'Checkbox',
      printOnSave: false,
      label: 'some label',
    },
  },
  {
    in: [
      strictParseXml(
        '<cell uiType="checkbox" default="true" ignore="true" name="printonsave" label="SELECTALL" />'
      ),
      generateInit({}),
    ],
    out: {
      defaultValue: true,
      isReadOnly: false,
      type: 'Checkbox',
      printOnSave: true,
      label: 'Select All',
    },
  },
  {
    in: [
      strictParseXml(
        '<cell uiType="checkbox" ignore="true" name="generatelabelchk" />'
      ),
      generateInit({}),
    ],
    out: {
      defaultValue: false,
      isReadOnly: false,
      type: 'Checkbox',
      printOnSave: true,
      label: formsText('generateLabelOnSave'),
    },
  },
  {
    in: [
      strictParseXml('<cell uiType="textarea" ignore="true" default="a" />'),
      generateInit({}),
    ],
    out: {
      defaultValue: 'a',
      isReadOnly: false,
      type: 'TextArea',
      rows: undefined,
    },
  },
  {
    in: [
      strictParseXml('<cell uiType="textareabrief" ignore="true" />'),
      generateInit({}),
    ],
    out: {
      defaultValue: undefined,
      isReadOnly: false,
      type: 'TextArea',
      rows: 1,
    },
  },
  {
    in: [
      strictParseXml(
        '<cell uiType="textareabrief" rows="3" readOnly="true" ignore="true" default="ab\nc" />'
      ),
      generateInit({}),
    ],
    out: {
      /*
       * New lines are replaced by spaces by the XML parser
       * See https://stackoverflow.com/a/8188290/8584605
       */
      defaultValue: 'ab c',
      isReadOnly: true,
      type: 'TextArea',
      rows: 3,
    },
  },
  {
    in: [
      strictParseXml('<cell uiType="combobox" default="a" picklist="b" />'),
      generateInit({}),
    ],
    out: {
      defaultValue: 'a',
      isReadOnly: false,
      type: 'ComboBox',
      pickList: 'b',
    },
  },
  {
    in: [strictParseXml('<cell uiType="combobox"/>'), generateInit({})],
    out: {
      defaultValue: undefined,
      isReadOnly: false,
      type: 'ComboBox',
      pickList: undefined,
    },
  },
  {
    in: [
      strictParseXml('<cell uiType="querycbx"/>'),
      generateInit({ cloneBtn: 'TRUE', name: 'NAME' }),
    ],
    out: {
      isReadOnly: false,
      hasCloneButton: true,
      type: 'QueryComboBox',
      typeSearch: 'NAME',
    },
  },
  {
    in: [
      strictParseXml('<cell uiType="querycbx" readOnly="true" />'),
      generateInit({}),
    ],
    out: {
      isReadOnly: true,
      hasCloneButton: false,
      type: 'QueryComboBox',
      typeSearch: undefined,
    },
  },
  {
    in: [
      strictParseXml('<cell uiType="plugin" default=" 2020-01-01 " />'),
      generateInit({ name: 'PartialDateUI' }),
    ],
    out: {
      isReadOnly: false,
      type: 'Plugin',
      pluginDefinition: {
        type: 'PartialDateUI',
        defaultValue: new Date('2020-01-01T00:00:00.000Z'),
        dateField: undefined,
        precisionField: undefined,
        defaultPrecision: 'full',
      },
    },
  },
  {
    in: [strictParseXml('<cell uiType="browse" />'), generateInit({})],
    out: {
      isReadOnly: false,
      type: 'FilePicker',
    },
  },
]);

test('parseFormField handles fields without uiType', () => {
  const consoleError = jest.fn();
  jest.spyOn(console, 'error').mockImplementation(consoleError);
  const element = strictParseXml('<cell />');
  expect(parseFormField(element, () => undefined)).toEqual({
    defaultValue: undefined,
    isReadOnly: false,
    max: undefined,
    min: undefined,
    step: undefined,
    type: 'Text',
  });
  expect(consoleError).toHaveBeenCalledWith('field is missing uiType', element);
});
