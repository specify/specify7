import { requireContext } from '../../../tests/helpers';
import { localized } from '../../../utils/types';
import { strictParseXml } from '../../AppResources/parseXml';
import { getField } from '../../DataModel/helpers';
import { tables } from '../../DataModel/tables';
import { formattersSpec } from '../../Formatters/spec';
import { pipe } from '../index';
import { syncers } from '../syncers';
import { toSimpleXmlNode, xmlToJson } from '../xmlToJson';
import { updateXml } from '../xmlToString';
import { createXmlSpec } from '../xmlUtils';
import { formatXmlForTests as format } from './utils';

requireContext();

test('Editing Data Object Formatter', () => {
  const element = strictParseXml(
    `<formatters>
      <format name="Accession" title="Accession" class="edu.ku.brc.specify.datamodel.Accession" default="true">
        <!-- this comment will be preserved -->
        <switch single="true">
          <fields>
            <field>accessionNumber</field>
          </fields>
        </switch>
      </format>
      <aggregators>
        <aggregator name="AccessionAgent" title="AccessionAgent" class="edu.ku.brc.specify.datamodel.AccessionAgent" default="true" separator="; " ending="" count="" format="AccessionAgent" orderfieldname=""/>
      </aggregators>
    </formatters>`
  );
  const xmlNode = xmlToJson(element);
  const simpleXmlNode = toSimpleXmlNode(xmlNode);

  const spec = formattersSpec();

  const { serializer, deserializer } = syncers.object(spec);
  const parsed = serializer(simpleXmlNode);

  const newSimpleXmlNode = deserializer({
    ...parsed,
    formatters: [
      ...parsed.formatters,
      {
        ...parsed.formatters[0],
        definition: {
          ...parsed.formatters[0].definition,
          fields: [
            {
              ...parsed.formatters[0].definition.fields[0],
              fields: [
                ...parsed.formatters[0].definition.fields[0].fields,
                {
                  separator: localized(''),
                  aggregator: undefined,
                  formatter: undefined,
                  fieldFormatter: undefined,
                  field: [getField(tables.Accession, 'accessionAgents')],
                },
              ],
            },
          ],
        },
      },
    ],
    aggregators: [
      {
        ...parsed.aggregators[0],
        table: tables.Agent,
      },
      ...parsed.aggregators,
    ],
  });
  const updatedXml = format(updateXml(newSimpleXmlNode));

  expect(updatedXml).toMatchInlineSnapshot(`
    "<?xml version='1.0' encoding='UTF-8'?>
    <formatters>
      <format name='Accession' title='Accession' class='edu.ku.brc.specify.datamodel.Accession' default='true'>
        <!-- this comment will be preserved -->
        <switch single='true'>
          <fields>
            <field>accessionNumber</field>
          </fields>
        </switch>
      </format>
      <format name='Accession' title='Accession' class='edu.ku.brc.specify.datamodel.Accession' default='true'>
        <!-- this comment will be preserved -->
        <switch single='true'>
          <fields>
            <field>accessionNumber</field>
            <field>accessionAgents</field>
          </fields>
        </switch>
      </format>
      <aggregators>
        <aggregator name='AccessionAgent' title='AccessionAgent' class='edu.ku.brc.specify.datamodel.Agent' default='true' separator='; ' ending='' format='AccessionAgent'/>
        <aggregator name='AccessionAgent' title='AccessionAgent' class='edu.ku.brc.specify.datamodel.AccessionAgent' default='true' separator='; ' ending='' format='AccessionAgent'/>
      </aggregators>
    </formatters>"
  `);
});

test('Removing a child does not carry over unknown attributes from previous node', () => {
  const element = strictParseXml(`<formatters>
      <format
        name="Accession"
        title="Accession"
        class="edu.ku.brc.specify.datamodel.Accession"
      >
        <switch a="b">
          <fields>
            <field e="f"><b g="l">a</b></field>
            <field sep=",">accessionNumber</field>
          </fields>
        </switch>
      </format>
      <aggregators></aggregators>
    </formatters>`);

  const xmlNode = xmlToJson(element);
  const simpleXmlNode = toSimpleXmlNode(xmlNode);

  const spec = formattersSpec();

  const { serializer, deserializer } = syncers.object(spec);
  const parsed = serializer(simpleXmlNode);

  const formatter = parsed.formatters[0].definition;
  const newSimpleXmlNode = deserializer({
    ...parsed,
    formatters: [
      {
        ...parsed.formatters[0],
        definition: {
          ...formatter,
          fields: [
            {
              ...formatter.fields[0],
              fields: [
                // Removed first field. Modified second
                {
                  ...formatter.fields[0].fields[1],
                  separator: localized('__'),
                },
              ],
            },
          ],
        },
      },
    ],
  });

  const updatedXml = format(updateXml(newSimpleXmlNode));
  expect(updatedXml).toMatchInlineSnapshot(`
    "<?xml version='1.0' encoding='UTF-8'?>
    <formatters>
      <format name='Accession' title='Accession' class='edu.ku.brc.specify.datamodel.Accession' default=''>
        <switch a='b' single='true'>
          <fields>
            <field sep='__'>accessionNumber</field>
          </fields>
        </switch>
      </format>
      <aggregators/>
    </formatters>"
  `);
});

test(`Default value VS Fallback value`, () => {
  const xml = strictParseXml(`<root />`);
  const xmlNode = xmlToJson(xml);
  const simpleXmlNode = toSimpleXmlNode(xmlNode);

  const spec = createXmlSpec({
    fallback: pipe(
      syncers.xmlAttribute('fallback', 'skip'),
      syncers.fallback<string>('fallbackValue')
    ),
    default: pipe(
      syncers.xmlAttribute('default', 'skip'),
      syncers.default<string>('defaultValue')
    ),
  });

  const { serializer, deserializer } = syncers.object(spec);
  const parsed = deserializer(serializer(simpleXmlNode));
  const updatedXml = format(updateXml(parsed));
  expect(updatedXml).toMatchInlineSnapshot(`
    "<?xml version='1.0' encoding='UTF-8'?>
    <root fallback='fallbackValue'/>"
  `);
});

/**
 * Test modifying and removing attributes and children when there are two
 * specs operating on the same node. This happens in the form system, where
 * cellSpec and fieldSpec and textFieldSpec might all be run on the same node.
 */
test('Unknown attributes & nested syncers', () => {
  const xml = strictParseXml(`<root a1="A1" ar="AR1" u1="U1" b1="B1" br="BR1">
    <a aa="aaa" aar="AAR" />
    <ar aa="aaa" />
    <b bb="bbb" bbr="BBR" />
    <br bb="bbb" />
    <u uu="uuu" />
  </root>`);
  const xmlNode = xmlToJson(xml);
  const simpleXmlNode = toSimpleXmlNode(xmlNode);

  const spec = createXmlSpec({
    attributeA: syncers.xmlAttribute('a1', 'required'),
    removeA: syncers.xmlAttribute('ar', 'skip'),
    removeChildA: syncers.xmlChild('ar', 'optional'),
    childA: pipe(
      syncers.xmlChild('a', 'required'),
      syncers.object(
        createXmlSpec({
          attributeAa: syncers.xmlAttribute('aa', 'required'),
          removeA: syncers.xmlAttribute('aar', 'skip'),
        })
      )
    ),
    nested: syncers.object(
      createXmlSpec({
        attributeB: syncers.xmlAttribute('b1', 'required'),
        removeB: syncers.xmlAttribute('br', 'skip'),
        removeChildB: syncers.xmlChild('br', 'optional'),
        childB: pipe(
          syncers.xmlChild('b', 'required'),
          syncers.object(
            createXmlSpec({
              removeB: syncers.xmlAttribute('bbr', 'skip'),
              attributeBb: syncers.xmlAttribute('bb', 'required'),
            })
          )
        ),
      })
    ),
  });

  const { serializer, deserializer } = syncers.object(spec);
  const parsed = serializer(simpleXmlNode);
  const updated = deserializer({
    ...parsed,
    attributeA: localized('A2'),
    removeA: undefined,
    removeChildA: undefined,
    childA: {
      ...parsed.childA,
      attributeAa: localized('aaa2'),
      removeA: undefined,
    },
    nested: {
      ...parsed.nested,
      attributeB: localized('B2'),
      removeB: undefined,
      removeChildB: undefined,
      childB: {
        ...parsed.nested.childB,
        removeB: undefined,
        attributeBb: localized('bbb2'),
      },
    },
  });

  const updatedXml = format(updateXml(updated));
  expect(updatedXml).toMatchInlineSnapshot(`
    "<?xml version='1.0' encoding='UTF-8'?>
    <root a1='A2' u1='U1' b1='B2'>
      <a aa='aaa2'/>
      <b bb='bbb2'/>
      <u uu='uuu'/>
    </root>"
  `);
});
