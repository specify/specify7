import { requireContext } from '../../../tests/helpers';
import { strictParseXml } from '../../AppResources/parseXml';
import { xmlToSpec } from '../../Syncer/xmlUtils';
import { webLinksSpec } from '../spec';

requireContext();

test('new web link definition is parsed', () => {
  const xml = strictParseXml(`
    <vector>
      <weblinkdef>
        <name>CustomLink</name>
        <baseURLStr>https://example.org/&lt;this&gt;</baseURLStr>
        <args>
          <weblinkdefarg>
            <name>this</name>
          </weblinkdefarg>
        </args>
        <usedByList />
      </weblinkdef>
    </vector>
  `);

  const { webLinks } = xmlToSpec(xml, webLinksSpec());

  expect(webLinks).toHaveLength(1);
  expect(webLinks[0].name).toBe('CustomLink');
  expect(webLinks[0].parts).toEqual([
    { type: 'UrlPart', value: 'https://example.org/' },
    { type: 'ThisField' },
  ]);
});
