import { requireContext } from '../../../tests/helpers';
import { strictParseXml } from '../../AppResources/parseXml';
import { xmlToSpec } from '../../Syncer/xmlUtils';
import { localized } from '../../../utils/types';
import { resolveWebLinkParts, webLinksSpec } from '../spec';

requireContext();

test.each(['https://orcid.org/', 'https://www.wikidata.org/entity/'])(
  'preserves full identifiers and prefixes bare identifiers for %s',
  (prefix) => {
    const parts = [
      { type: 'UrlPart', value: localized(prefix) },
      { type: 'ThisField' },
    ] as const;
    expect(resolveWebLinkParts(parts, [prefix, `${prefix}123`]).join('')).toBe(
      `${prefix}123`
    );
    expect(resolveWebLinkParts(parts, [prefix, '123']).join('')).toBe(
      `${prefix}123`
    );
  }
);

test('preserves full identifiers followed by literal suffixes', () => {
  const prefix = 'https://example.org/';
  const parts = [
    { type: 'UrlPart', value: localized(prefix) },
    { type: 'ThisField' },
    { type: 'UrlPart', value: localized('/details') },
  ] as const;
  expect(
    resolveWebLinkParts(parts, [prefix, `${prefix}123`, '/details']).join('')
  ).toBe(`${prefix}123/details`);
});

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
