import { requireContext } from '../../../tests/helpers';
import { strictParseXml } from '../../AppResources/codeMirrorLinters';
import { schema } from '../../DataModel/schema';
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
    ...parsed,
    aggregators: [
      {
        ...parsed.aggregators[0],
        table: schema.models.Agent,
      },
      ...parsed.aggregators,
    ],
  });
  const updatedXml = updateXml(xmlNode, newSimpleXmlNode).replaceAll(
    '\t',
    '  '
  );

  expect(updatedXml).toMatchInlineSnapshot(`
    "<formatters xmlns=\\"http://www.w3.org/1999/xhtml\\">
      <format name=\\"Accession\\" title=\\"Accession\\" class=\\"edu.ku.brc.specify.datamodel.Accession\\" default=\\"true\\">
        <!-- this comment will be preserved -->
        <switch single=\\"true\\">
          <fields>
            <field>accessionNumber</field>
          </fields>
        </switch>
      </format>
      <aggregators>
        <aggregator name=\\"AccessionAgent\\" title=\\"AccessionAgent\\" class=\\"edu.ku.brc.specify.datamodel.Agent\\" default=\\"true\\" separator=\\"; \\" ending=\\"\\" count=\\"\\" format=\\"AccessionAgent\\" orderfieldname=\\"\\" />
        <aggregator name=\\"AccessionAgent\\" title=\\"AccessionAgent\\" class=\\"edu.ku.brc.specify.datamodel.AccessionAgent\\" default=\\"true\\" separator=\\"; \\" ending=\\"\\" count=\\"\\" format=\\"AccessionAgent\\" orderfieldname=\\"\\" />
      </aggregators>
    </formatters>"
  `);
});
