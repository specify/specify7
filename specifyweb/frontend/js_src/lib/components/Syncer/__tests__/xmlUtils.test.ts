import { requireContext } from '../../../tests/helpers';
import { theories } from '../../../tests/utils';
import type { SimpleXmlNode } from '../xmlToJson';
import {
  getAttribute,
  getBooleanAttribute,
  getParsedAttribute,
} from '../xmlUtils';

requireContext();

const attributeName = 'data-someAttribute';
const getElement = (value: string): SimpleXmlNode => ({
  type: 'SimpleXmlNode',
  tagName: 'input',
  attributes: {
    [attributeName.toLowerCase()]: value,
  },
  text: undefined,
  children: {},
});

theories(getAttribute, {
  'Get existing attribute': {
    in: [getElement('1'), attributeName],
    out: '1',
  },
  'Get non-existent attribute': {
    in: [getElement('1'), 'abc'],
    out: undefined,
  },
});

theories(getParsedAttribute, {
  'Get existing attribute': {
    in: [getElement('1'), attributeName],
    out: '1',
  },
  'Trim attribute': {
    in: [getElement('  1  '), attributeName.toLowerCase()],
    out: '1',
  },
  'Ignore blank attributes': {
    in: [getElement(''), attributeName],
    out: undefined,
  },
  'Ignore whitespace-only attributes': {
    in: [getElement('    '), attributeName.toLowerCase()],
    out: undefined,
  },
  'Get non-existent attribute': {
    in: [getElement('1'), 'abc'],
    out: undefined,
  },
});

theories(getBooleanAttribute, {
  'Get existing true attribute': {
    in: [getElement('TRUE'), attributeName.toLowerCase()],
    out: true,
  },
  'Get existing false attribute': {
    in: [getElement('faLse'), attributeName],
    out: false,
  },
  'Get existing false attribute with whitespace': {
    in: [getElement('\tfalSe\n'), attributeName],
    out: false,
  },
  'Treat all non-boolean as false': {
    in: [getElement('\tAbc\n'), attributeName.toLowerCase()],
    out: false,
  },
  'Get non-existent attribute': {
    in: [getElement('1'), 'abc'],
    out: undefined,
  },
});
