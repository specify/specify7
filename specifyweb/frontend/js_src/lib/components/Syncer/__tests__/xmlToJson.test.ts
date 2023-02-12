import { theories } from '../../../tests/utils';
import { strictParseXml } from '../../AppResources/codeMirrorLinters';
import { formatXmlNode } from '../formatXmlNode';
import { fromSimpleXmlNode } from '../fromSimpleXmlNode';
import type { SimpleXmlNode } from '../xmlToJson';
import { jsonToXml, toSimpleXmlNode, xmlToJson } from '../xmlToJson';

test('XML to JSON and back', () => {
  const rawXml = `<test a="b">
    <child1 b="c">
      <!-- comment <b /> -->
      <bar />
      <bar>  </bar>
      text</child1>
    <child2>text</child2>
  </test>`;
  const xml = strictParseXml(rawXml);
  const parsed = xmlToJson(xml);
  const simple = toSimpleXmlNode(parsed);

  const newSimple: SimpleXmlNode = {
    ...simple,
    content:
      simple.content.type === 'Children'
        ? {
            ...simple.content,
            children: {
              ...simple.content.children,
              child2: [
                ...simple.content.children.child2,
                {
                  ...simple.content.children.child2[0],
                  content: {
                    type: 'Text',
                    string: 'added',
                  },
                },
              ],
              child3: [
                {
                  type: 'SimpleXmlNode',
                  tagName: 'child3',
                  attributes: { Test: 'a="' },
                  content: {
                    type: 'Text',
                    string: ' also added ',
                  },
                },
              ],
            },
          }
        : simple.content,
  };

  const newParsed = fromSimpleXmlNode(parsed, newSimple);
  const newRawXml = `<test a="b">
\t<child1 b="c">
\t\t<!-- comment <b /> -->
\t\t<bar/>
\t\t<bar/>
\t\ttext
\t</child1>
\t<child2>text</child2>
\t<child2>added</child2>
\t<child3 test="a=&quot;">also added</child3>
</test>`;

  expect(jsonToXml(newParsed).outerHTML).toBe(newRawXml);
});

const formatXml = (xml: string): string =>
  jsonToXml(formatXmlNode(xmlToJson(strictParseXml(xml)))).outerHTML;

theories(formatXml, [
  {
    in: ['<a b="c"><b></b></a>'],
    out: '<a b="c">\n\t<b/>\n</a>',
  },
  {
    in: ['<a>a<!-- comment -->a</a>'],
    out: '<a>\n\ta\n\t<!-- comment -->\n\ta\n</a>',
  },
]);
