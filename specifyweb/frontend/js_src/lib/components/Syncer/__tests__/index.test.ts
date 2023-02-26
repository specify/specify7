import { requireContext } from '../../../tests/helpers';
import { strictParseXml } from '../../AppResources/codeMirrorLinters';
import { getField } from '../../DataModel/helpers';
import { tables } from '../../DataModel/tables';
import { formattersSpec } from '../../Formatters/spec';
import { syncers } from '../syncers';
import { toSimpleXmlNode, updateXml, xmlToJson } from '../xmlToJson';

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
  const updatedXml = updateXml(xmlNode, newSimpleXmlNode).replaceAll(
    '\t',
    '  '
  );

  expect(updatedXml).toMatchInlineSnapshot(`
    "<formatters>
      <format name=\\"Accession\\" title=\\"Accession\\" class=\\"edu.ku.brc.specify.datamodel.Accession\\" default=\\"true\\">
        <!-- this comment will be preserved -->
        <switch single=\\"true\\">
          <fields>
            <field>accessionNumber</field>
          </fields>
        </switch>
      </format>
      <format name=\\"Accession\\" title=\\"Accession\\" class=\\"edu.ku.brc.specify.datamodel.Accession\\" default=\\"true\\">
        <switch single=\\"true\\">
          <fields>
            <field>accessionNumber</field>
            <field>accessionAgents</field>
          </fields>
        </switch>
      </format>
      <aggregators>
        <aggregator name=\\"AccessionAgent\\" title=\\"AccessionAgent\\" class=\\"edu.ku.brc.specify.datamodel.Agent\\" default=\\"true\\" separator=\\"; \\" ending=\\"\\" count=\\"\\" format=\\"AccessionAgent\\" orderfieldname=\\"\\"/>
        <aggregator name=\\"AccessionAgent\\" title=\\"AccessionAgent\\" class=\\"edu.ku.brc.specify.datamodel.AccessionAgent\\" default=\\"true\\" separator=\\"; \\" ending=\\"\\" count=\\"\\" format=\\"AccessionAgent\\" orderfieldname=\\"\\"/>
      </aggregators>
    </formatters>"
  `);
});
