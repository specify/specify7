import { requireContext } from '../../../tests/helpers';
import { exportsForTests, parseSpecifyProperties } from '../viewSpec';

requireContext();

const { tablesWithFormTable, buildSpecifyProperties } = exportsForTests;

test('Tables with form tables computed correctly', () =>
  expect(tablesWithFormTable()).toMatchSnapshot());

const cases = {
  '': {},
  'name=Agent;title=Catalog Agent': {
    name: 'Agent',
    title: 'Catalog Agent',
  },
  'name=PartialDateUI;df=catalogedDate;tp=catalogedDatePrecision': {
    name: 'PartialDateUI',
    df: 'catalogedDate',
    tp: 'catalogedDatePrecision',
  },
  'name=CollectingEvent;clonebtn=true': {
    name: 'CollectingEvent',
    clonebtn: 'true',
  },
  'align=left;': {
    align: 'left',
  },
  'align=right;fg=0,190,0': {
    align: 'right',
    fg: '0,190,0',
  },
  'name=LocalityGeoRef;title=Geo Ref;geoid=geography;locid=localityName;llid=5':
    {
      name: 'LocalityGeoRef',
      title: 'Geo Ref',
      geoid: 'geography',
      locid: 'localityName',
      llid: '5',
    },
  'a=b=c;d=e=f%3B;': {
    a: 'b=c',
    d: 'e=f;',
  },
  'a=;b': {
    a: '',
    b: '',
  },
};

describe('parseSpecifyProperties', () =>
  void Object.entries(cases).forEach(([input, output]) =>
    test(`parses ${input}`, () =>
      expect(parseSpecifyProperties(input)).toEqual(output))
  ));

describe('buildSpecifyProperties', () =>
  void Object.entries(cases).forEach(([output, input]) =>
    test(`parses ${output}`, () =>
      expect(buildSpecifyProperties(input)).toEqual(output))
  ));
