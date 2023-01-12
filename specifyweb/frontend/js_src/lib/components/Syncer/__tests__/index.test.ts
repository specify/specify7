import { requireContext } from '../../../tests/helpers';
import { strictParseXml } from '../../AppResources/codeMirrorLinters';
import { formattersSpec } from '../../Formatters/spec';
import { syncers } from '../syncers';
import { formatXml } from '../xmlUtils';

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

  const spec = formattersSpec();

  const { serializer, deserializer } = syncers.object(spec);
  const parsed = serializer(element);

  jest.spyOn(console, 'warn').mockImplementation(jest.fn());
  jest.spyOn(console, 'error').mockImplementation(jest.fn());
  deserializer(
    {
      ...parsed,
      aggregators: [
        {
          ...parsed.aggregators[0],
          tableName: 'Agent',
        },
        ...parsed.aggregators,
      ],
    },
    element
  );

  // FIXME: use this XML beautifier
  expect(formatXml(element.outerHTML, '  ')).toMatchInlineSnapshot(`
    "<formatters>
      <format name=\\"Accession\\" title=\\"Accession\\" class=\\"edu.ku.brc.specify.datamodel.Accession\\" default=\\"true\\">
        <!-- this comment will be preserved -->
          <switch single=\\"true\\">
            <fields>
              <field>accessionNumber</field>
            </fields>
          </switch>
        </format>
        <aggregators>
          <aggregator name=\\"AccessionAgent\\" title=\\"AccessionAgent\\" class=\\"edu.ku.brc.specify.datamodel.Agent\\" default=\\"true\\" separator=\\"; \\" ending=\\"\\" count=\\"\\" format=\\"AccessionAgent\\" orderfieldname=\\"\\" orderFieldName=\\"\\"/>
          <aggregator name=\\"AccessionAgent\\" title=\\"AccessionAgent\\" class=\\"edu.ku.brc.specify.datamodel.AccessionAgent\\" default=\\"true\\" separator=\\"; \\" ending=\\"\\" count=\\"\\" format=\\"AccessionAgent\\" orderFieldName=\\"\\"/>
        </aggregators>
      </formatters>
    "
  `);
});
