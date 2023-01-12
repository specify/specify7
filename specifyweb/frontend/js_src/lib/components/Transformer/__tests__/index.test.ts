import { requireContext } from '../../../tests/helpers';
import { strictParseXml } from '../../AppResources/codeMirrorLinters';
import { formatterSpec } from '../dataObjectFormatter';
import { xmlBuilder, xmlParser } from '../index';

requireContext();

test('Editing Data Object Formatter', () => {
  const element = strictParseXml(
    `<format name="Accession" title="Accession" class="edu.ku.brc.specify.datamodel.Accession" default="true">
      <!-- this comment will be preserved -->
      <switch single="true">
        <fields>
          <field>accessionNumber</field>
        </fields>
      </switch>
    </format>`
  );

  const spec = formatterSpec();
  const parser = xmlParser(spec);
  const parsed = parser(element);

  const builder = xmlBuilder(spec);
  builder(element, { ...parsed, title: '4' });

  expect(element.outerHTML).toMatchInlineSnapshot(`
    "<format name=\\"Accession\\" title=\\"4\\" class=\\"edu.ku.brc.specify.datamodel.Accession\\" default=\\"true\\">
          <!-- this comment will be preserved -->
          <switch single=\\"true\\">
            <fields>
              <field>accessionNumber</field>
            </fields>
          </switch>
        </format>"
  `);
});
