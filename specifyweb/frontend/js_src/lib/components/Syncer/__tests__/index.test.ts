import { requireContext } from '../../../tests/helpers';
import { strictParseXml } from '../../AppResources/codeMirrorLinters';
import { formattersSpec } from '../dataObjectFormatter';
import { xmlBuilder, xmlParser } from '../index';

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

  const parser = xmlParser(spec);
  const parsed = parser(element);

  const builder = xmlBuilder(spec);
  builder(
    {
      ...parsed,
      formatters: [
        {
          ...parsed.formatters[0],
          title: 'Test',
        },
      ],
      aggregators: [],
    },
    element
  );

  expect(element.outerHTML).toMatchInlineSnapshot(`
    "<formatters>
          <format name=\\"Accession\\" title=\\"Test\\" class=\\"edu.ku.brc.specify.datamodel.Accession\\" default=\\"true\\">
            <!-- this comment will be preserved -->
            <switch single=\\"true\\">
              <fields>
                <field>accessionNumber</field>
              </fields>
            </switch>
          </format>
          <aggregators>
            
          </aggregators>
        </formatters>"
  `);
});
