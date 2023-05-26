import { requireContext } from '../../../tests/helpers';
import { strictParseXml } from '../../AppResources/codeMirrorLinters';
import { tables } from '../../DataModel/tables';
import { error } from '../../Errors/assert';
import { formatXmlForTests } from '../../Syncer/__tests__/utils';
import { syncers } from '../../Syncer/syncers';
import { toSimpleXmlNode, updateXml, xmlToJson } from '../../Syncer/xmlToJson';
import {
  exportsForTests,
  formDefinitionSpec,
  parseSpecifyProperties,
} from '../viewSpec';
import { testFormDefinition } from './testFormDefinition';
import { localized } from '../../../utils/types';

requireContext();

const { buildSpecifyProperties } = exportsForTests;

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
  ';a=b;': {
    a: 'b',
  },
};

const inCases = {
  'a=;b': {
    a: '',
    b: '',
  },
  '=a;': {},
};

describe('parseSpecifyProperties', () =>
  void Object.entries({ ...cases, ...inCases }).forEach(([input, output]) =>
    test(`parses ${input}`, () =>
      expect(parseSpecifyProperties(input)).toEqual(output))
  ));

describe('buildSpecifyProperties', () =>
  void Object.entries(cases).forEach(([output, input]) =>
    test(`parses ${output}`, () => {
      const trimmed = output.endsWith(';') ? output.slice(0, -1) : output;
      expect(buildSpecifyProperties(input)).toEqual(
        trimmed.startsWith(';') ? trimmed.slice(1) : trimmed
      );
    })
  ));

test('Can edit form definition', () => {
  const xml = strictParseXml(`<viewdef>${testFormDefinition}</viewdef>`);
  const xmlNode = xmlToJson(xml);
  const simpleXmlNode = toSimpleXmlNode(xmlNode);
  const { serializer, deserializer } = syncers.object(
    formDefinitionSpec(tables.Accession)
  );
  const parsed = serializer(simpleXmlNode);
  const updated = deserializer({
    ...parsed,
    columnDefinitions: [
      parsed.columnDefinitions[0],
      ...parsed.columnDefinitions,
    ],
    rows: {
      ...parsed.rows,
      rows: [
        parsed.rows.rows[0],
        [
          ...parsed.rows.rows[0],
          {
            ...parsed.rows.rows[0][1],
            definition:
              parsed.rows.rows[0][1].definition.type === 'Label'
                ? {
                    ...parsed.rows.rows[0][1].definition,
                    label: localized('New Label'),
                  }
                : error('Expected a label cell at this position'),
          },
        ],
        ...parsed.rows.rows,
      ],
    },
  });
  const updatedXml = formatXmlForTests(updateXml(updated));
  expect(updatedXml).toMatchSnapshot();
});
