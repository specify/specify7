import { theories } from '../../../tests/utils';
import { exportsForTests, findNodePosition } from '../findNodePosition';

const { findChild, findClosing } = exportsForTests;

theories(findNodePosition, [
  {
    in: ['<a><b></b></a>', [{ type: 'Root', node: '' }]],
    out: { from: 0, to: 0 },
  },
  {
    in: [
      '<a ba="b" a="b" c="d"><b></b></a>',
      [
        { type: 'Root', node: '' },
        { type: 'Attribute', attribute: 'a' },
      ],
    ],
    out: { from: 10, to: 15 },
  },
  {
    in: [
      '<?xml version="1.0" encoding="UTF-8"?>\n<a b="a" a="b" c="d"><b></b></a>',
      [
        { type: 'Root', node: '' },
        { type: 'Attribute', attribute: 'a' },
      ],
    ],
    out: { from: 48, to: 53 },
  },
  {
    in: [
      '<a b="a" a="b" c="d"><b><c><!--<c>--></c>\n<c tar="bar"></c></b></a>',
      [
        { type: 'Root', node: '' },
        { type: 'Child', tagName: 'b' },
        { type: 'Children', tagName: 'c' },
        { type: 'Index', index: 1 },
        { type: 'Attribute', attribute: 'tar' },
      ],
    ],
    out: { from: 45, to: 54 },
  },
  {
    in: [
      '<a b="a" a="b" c="d"><b><c><!--<c>--></c>\n<c tar="bar">BAS!!</c></b></a>',
      [
        { type: 'Root', node: '' },
        { type: 'Child', tagName: 'b' },
        { type: 'Children', tagName: 'c' },
        { type: 'Index', index: 1 },
      ],
    ],
    out: { from: 42, to: 42 },
  },
  {
    in: [
      '<a b="a" a="b" c="d"><b><c><!--<c>--></c>\n<c tar="bar">BAS!!</c></b></a>',
      [
        { type: 'Root', node: '' },
        { type: 'Child', tagName: 'b' },
        { type: 'Children', tagName: 'c' },
        { type: 'Index', index: 1 },
        { type: 'Content' },
      ],
    ],
    out: { from: 55, to: 60 },
  },
]);

theories(findChild, [
  { in: ['<a><b></b></a>', 'a', 0], out: 0 },
  { in: ['<a><b></b></a>', 'b', 0], out: undefined },
  { in: ['<a></a><b></b>', 'b', 0], out: 7 },
  { in: ['<a />', 'b', 0], out: undefined },
  { in: ['<b />', 'b', 0], out: 0 },
  { in: ['<b/>', 'b', 0], out: 0 },
  { in: ['<bar /><b />', 'b', 0], out: 7 },
  { in: ['<b\n/>', 'b', 0], out: 0 },
  { in: ['<![CDATA[<bar>]]><b/>', 'b', 0], out: 17 },
  { in: ['<b a="b"></b><b><!--<a />--></b>', 'b', 1], out: 13 },
  { in: ['<a></a><a /><b bar="var" />', 'b', 0], out: 12 },
  { in: ['<a href="b" d></a><b tar></b>', 'b', 0], out: 18 },
  { in: ['<a></a><b b="a"><!--<a />--></b>', 'b', 0], out: 7 },
  { in: ['<a></a><!--<b b="b">b<b />--><b></b>', 'b', 0], out: 29 },
  { in: ['<b></b><!--<b>b</b>-<b  />-><b></b>', 'b', 0], out: 0 },
  { in: ['<b></b><!--<b>b</b />--><b></b>', 'b', 1], out: 24 },
  { in: ['<a /><a></a><a></a>', 'a', 2], out: 12 },
  { in: ['<a /><a></a><a></a>', 'a', 3], out: undefined },
  { in: ['<b></b><b attribute="/"></b><b></b></a>', 'b', 1], out: 7 },
]);

theories(findClosing, [
  { in: ['<a></a>'], out: 3 },
  { in: ['<a href="b"><b /></a>'], out: 17 },
  { in: ['<a href="b"><!--<a><b />\n</a>--><a></a></a>'], out: 39 },
  { in: ['<a href="b"><b /><!--</a>'], out: undefined },
]);
