import { requireContext } from '../../../tests/helpers';
import { strictParseXml } from '../../AppResources/codeMirrorLinters';
import { getField } from '../../DataModel/helpers';
import { tables } from '../../DataModel/tables';
import { formattersSpec } from '../../Formatters/spec';
import { syncers } from '../syncers';
import { toSimpleXmlNode, updateXml, xmlToJson } from '../xmlToJson';
import { createXmlSpec } from '../xmlUtils';
import { pipe } from '../index';

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
                  separator: '',
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
  const updatedXml = updateXml(newSimpleXmlNode).replaceAll('\t', '  ');

  expect(updatedXml).toMatchInlineSnapshot(`
    "<formatters>
      <format
        name=\\"Accession\\"
        title=\\"Accession\\"
        class=\\"edu.ku.brc.specify.datamodel.Accession\\"
        default=\\"true\\"
      >
        <!-- this comment will be preserved -->
        <switch single=\\"true\\">
          <fields>
            <field>accessionNumber</field>
          </fields>
        </switch>
      </format>
      <format
        name=\\"Accession\\"
        title=\\"Accession\\"
        class=\\"edu.ku.brc.specify.datamodel.Accession\\"
        default=\\"true\\"
      >
        <!-- this comment will be preserved -->
        <switch single=\\"true\\">
          <fields>
            <field>accessionNumber</field>
            <field>accessionAgents</field>
          </fields>
        </switch>
      </format>
      <aggregators>
        <aggregator
          name=\\"AccessionAgent\\"
          title=\\"AccessionAgent\\"
          class=\\"edu.ku.brc.specify.datamodel.Agent\\"
          default=\\"true\\"
          separator=\\"; \\"
          ending=\\"\\"
          count=\\"\\"
          format=\\"AccessionAgent\\"
          orderfieldname=\\"\\"
        />
        <aggregator
          name=\\"AccessionAgent\\"
          title=\\"AccessionAgent\\"
          class=\\"edu.ku.brc.specify.datamodel.AccessionAgent\\"
          default=\\"true\\"
          separator=\\"; \\"
          ending=\\"\\"
          count=\\"\\"
          format=\\"AccessionAgent\\"
          orderfieldname=\\"\\"
        />
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
                  separator: '__',
                },
              ],
            },
          ],
        },
      },
    ],
  });

  const updatedXml = updateXml(newSimpleXmlNode).replaceAll('\t', '  ');
  expect(updatedXml).toMatchInlineSnapshot(`
    "<formatters>
      <format
        name=\\"Accession\\"
        title=\\"Accession\\"
        class=\\"edu.ku.brc.specify.datamodel.Accession\\"
        default=\\"false\\"
      >
        <switch a=\\"b\\" single=\\"true\\">
          <fields>
            <field sep=\\"__\\">accessionNumber</field>
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
      syncers.fallback('fallbackValue')
    ),
    default: pipe(
      syncers.xmlAttribute('default', 'skip'),
      syncers.default('defaultValue')
    ),
  });

  const { serializer, deserializer } = syncers.object(spec);
  const parsed = deserializer(serializer(simpleXmlNode));
  const updatedXml = updateXml(parsed).replaceAll('\t', '  ');
  expect(updatedXml).toMatchInlineSnapshot(`
    "<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?>
    <root fallback=\\"fallbackValue\\"/>"
  `);
});
