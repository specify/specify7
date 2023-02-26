import { theories } from '../../../tests/utils';
import { mergeSimpleXmlNodes } from '../mergeSimpleXmlNodes';
import type { SimpleXmlNode } from '../xmlToJson';

const base: SimpleXmlNode = {
  type: 'SimpleXmlNode',
  tagName: 'test',
  attributes: {},
  text: undefined,
  children: {},
};

theories(mergeSimpleXmlNodes, [
  {
    in: [
      [
        {
          ...base,
          attributes: { a: 'a1' },
          children: {
            test: [
              {
                ...base,
              },
            ],
          },
        },
        {
          ...base,
          attributes: { a: 'a2' },
          children: {
            test: [
              {
                ...base,
              },
            ],
          },
        },
        {
          ...base,
          attributes: { b: 'b1' },
          children: {
            test2: [
              {
                ...base,
              },
            ],
          },
        },
      ],
    ],
    out: {
      attributes: {
        a: 'a2',
        b: 'b1',
      },
      children: {
        test: [
          {
            attributes: {},
            children: {},
            text: undefined,
            tagName: 'test',
            type: 'SimpleXmlNode',
          },
          {
            attributes: {},
            children: {},
            text: undefined,
            tagName: 'test',
            type: 'SimpleXmlNode',
          },
        ],
        test2: [
          {
            attributes: {},
            children: {},
            text: undefined,
            tagName: 'test',
            type: 'SimpleXmlNode',
          },
        ],
      },
      text: undefined,
      tagName: 'test',
      type: 'SimpleXmlNode',
    },
  },

  {
    in: [
      [
        {
          ...base,
          text: 'a',
        },
        {
          ...base,
          text: 'b',
        },
      ],
    ],
    out: {
      attributes: {},
      text: 'a b',
      children: {},
      tagName: 'test',
      type: 'SimpleXmlNode',
    },
  },
]);
