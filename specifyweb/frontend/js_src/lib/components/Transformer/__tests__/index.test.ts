import { requireContext } from '../../../tests/helpers';
import { strictParseXml } from '../../AppResources/codeMirrorLinters';
import {
  dataObjectFormatterBuilder,
  dataObjectFormatterParser,
} from '../dataObjectFormatter';

requireContext();

test('Data Object Formatter', () => {
  const element = strictParseXml(
    `<format name="Accession" title="Accession" class="edu.ku.brc.specify.datamodel.Accession" default="true">
<switch single="true">
<fields>
<field>accessionNumber</field>
</fields>
</switch>
</format>`
  );
  const parsed = dataObjectFormatterParser()(element);
  dataObjectFormatterBuilder()(element, {
    ...parsed,
    title: '4',
  });
  expect(element).toEqual({});
});
