import { theories } from '../../../tests/utils';
import { mergeSimpleXmlNodes } from '../mergeSimpleXmlNodes';
import type { SimpleXmlNode } from '../xmlToJson';

const base: SimpleXmlNode = {
  type: 'SimpleXmlNode',
  tagName: 'test',
  attributes: {},
  content: {
    type: 'Children',
    children: {},
  },
};

theories(mergeSimpleXmlNodes, [
  {
    in: [
      [
        {
          ...base,
          attributes: { a: 'a1' },
          content: {
            type: 'Children',
            children: {
              test: [
                {
                  ...base,
                },
              ],
            },
          },
        },
        {
          ...base,
          attributes: { a: 'a2' },
          content: {
            type: 'Children',
            children: {
              test: [
                {
                  ...base,
                },
              ],
            },
          },
        },
        {
          ...base,
          attributes: { b: 'b1' },
          content: {
            type: 'Children',
            children: {
              test2: [
                {
                  ...base,
                },
              ],
            },
          },
        },
      ],
    ],
    out: {
      attributes: {
        a: 'a2',
        b: 'b1',
      },
      content: {
        children: {
          test: [
            {
              attributes: {},
              content: {
                children: {},
                type: 'Children',
              },
              tagName: 'test',
              type: 'SimpleXmlNode',
            },
            {
              attributes: {},
              content: {
                children: {},
                type: 'Children',
              },
              tagName: 'test',
              type: 'SimpleXmlNode',
            },
          ],
          test2: [
            {
              attributes: {},
              content: {
                children: {},
                type: 'Children',
              },
              tagName: 'test',
              type: 'SimpleXmlNode',
            },
          ],
        },
        type: 'Children',
      },
      tagName: 'test',
      type: 'SimpleXmlNode',
    },
  },

  {
    in: [
      [
        {
          ...base,
          content: {
            type: 'Text',
            string: 'a',
          },
        },
        {
          ...base,
          content: {
            type: 'Text',
            string: 'b',
          },
        },
      ],
    ],
    out: {
      attributes: {},
      content: {
        string: 'a b',
        type: 'Text',
      },
      tagName: 'test',
      type: 'SimpleXmlNode',
    },
  },
]);
