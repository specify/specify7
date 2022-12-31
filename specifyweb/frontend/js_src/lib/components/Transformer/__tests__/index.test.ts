import { strictParseXml } from '../../AppResources/codeMirrorLinters';
import {
  dataObjectFormatterBuilder,
  dataObjectFormatterParser,
} from '../index';
import { requireContext } from '../../../tests/helpers';

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
  const parsed = dataObjectFormatterParser(element);
  dataObjectFormatterBuilder({
    ...parsed,
    title: { value: '4', notes: parsed.title.notes },
  });
  expect(element).toEqual({});
});
