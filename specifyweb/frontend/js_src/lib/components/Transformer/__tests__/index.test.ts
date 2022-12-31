import { strictParseXml } from '../../AppResources/codeMirrorLinters';
import { dataObjectFormatterParser } from '../index';
import { requireContext } from '../../../tests/helpers';

requireContext();

test('Data Object Formatter', () => {
  const parsed = dataObjectFormatterParser(
    strictParseXml(
      `<format name="Accession" title="Accession" class="edu.ku.brc.specify.datamodel.Accession" default="true">
<switch single="true">
<fields>
<field>accessionNumber</field>
</fields>
</switch>
</format>`
    )
  );
  expect(parsed).toEqual({});
});
