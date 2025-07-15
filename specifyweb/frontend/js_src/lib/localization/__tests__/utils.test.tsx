import React from 'react';

import { theories } from '../../tests/utils';
import { localized } from '../../utils/types';
import {
  createDictionary,
  rawDictionary,
  StringToJsx,
  whitespaceSensitive,
} from '../utils';
import { DEFAULT_LANGUAGE } from '../utils/config';

const raw = {
  simpleKey: {
    comment: 'This is a comment',
    'en-us': 'Simple Key',
    'ru-ru': 'Simple Key',
  },
  parameters: {
    'en-us': 'A {parameter:string} {count:number}',
    'ru-ru': 'B {count:number} {parameter:string}',
  },
  pluralRules: {
    'en-us': '{{none | one item | ?? items}}',
    'ru-ru': '{{none | one item | ?? items}}',
  },
  jsx: {
    'en-us':
      '<link>A</link> {parameter:string} <link \n\t >B</link> <br /> <button>B</button> _',
    'ru-ru': '<link>B</link> {parameter2:number} <button>B</button>',
  },
} as const;
const dictionary = createDictionary(raw);

test('Default language is en-us', () => expect(DEFAULT_LANGUAGE).toBe('en-us'));

test('Can retrieve original dictionary', () =>
  expect(
    // Need to bypass the get() proxy
    Object.getOwnPropertyDescriptor(dictionary, rawDictionary)?.value
  ).toBe(raw));

test('Simple Key', () => expect(dictionary.simpleKey()).toBe('Simple Key'));

test('Key with parameters', () =>
  expect(
    dictionary.parameters({
      parameter: 'a',
      count: 2,
    })
  ).toBe('A a 2'));

describe('Key with plural parameter', () => {
  test('none', () => expect(dictionary.pluralRules(0)).toBe('none'));
  test('one item', () => expect(dictionary.pluralRules(1)).toBe('one item'));
  test('2 items', () => expect(dictionary.pluralRules(2)).toBe('2 items'));
});

theories(whitespaceSensitive, [
  {
    in: [localized('a')],
    out: 'a',
  },
  {
    in: [localized('\n b \n')],
    out: 'b',
  },
  {
    in: [localized('\n b \n c \n')],
    out: 'b c',
  },
  {
    in: [localized('\n b\n\n d \n')],
    out: 'b\nd',
  },
]);

test('Key with JSX', () =>
  expect(
    // eslint-disable-next-line new-cap
    StringToJsx({
      string: dictionary.jsx({ parameter: 'a' }),
      components: {
        link: (label) => <span>{label}</span>,
        button: (label) => <p>{label}</p>,
        br: <br />,
      },
    })
  ).toMatchInlineSnapshot(`
    <>

      <>
        <span>
          A
        </span>
      </>
       a
      <>
        <span>
          B
        </span>
      </>

      <>
        <br />
      </>

      <>
        <p>
          B
        </p>
      </>
       _
    </>
  `));
