import { theories } from '../../../tests/utils';
import { strictParseXml } from '../../AppResources/parseXml';
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
    children: {
      ...simple.children,
      child2: [
        ...simple.children.child2,
        {
          ...simple.children.child2[0],
          text: 'added',
        },
      ],
      child3: [
        {
          type: 'SimpleXmlNode',
          tagName: 'child3',
          attributes: { Test: 'a="' },
          text: ' also added ',
          children: {},
        },
      ],
    },
  };

  const newParsed = fromSimpleXmlNode(newSimple);
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

test('Unknown XML nodes are preserved', () => {
  const rawXml = `<a a="1">
\t<b/>
\t<unknown a="b"/>
</a>`;
  const xml = strictParseXml(rawXml);
  const parsed = xmlToJson(xml);
  const simple = toSimpleXmlNode(parsed);
  const newSimple: SimpleXmlNode = {
    ...simple,
    children: {
      b: simple.children.b,
    },
  };
  const newParsed = fromSimpleXmlNode(newSimple);
  expect(jsonToXml(newParsed).outerHTML).toBe(rawXml);
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
