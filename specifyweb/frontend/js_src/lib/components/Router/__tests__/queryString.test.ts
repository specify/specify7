import { theories } from '../../../tests/utils';
import {
  formatUrl,
  locationToUrl,
  parseUrl,
  resolveRelative,
} from '../queryString';

theories(formatUrl, [
  { in: ['http://localhost:3000', {}], out: 'http://localhost:3000/' },
  { in: ['http://localhost:3000/a', {}], out: 'http://localhost:3000/a' },
  {
    in: ['http://localhost:3000/a', { a: 'b' }],
    out: 'http://localhost:3000/a?a=b',
  },
  {
    in: ['http://localhost:3000/a/b/', { a: 'b', c: 3, e: undefined }],
    out: 'http://localhost:3000/a/b/?a=b&c=3',
  },
  {
    in: ['./a/b/', { a: 'b', c: 3, e: undefined }],
    out: 'http://localhost/a/b/?a=b&c=3',
  },
]);

theories(locationToUrl, [
  { in: [{ pathname: '/a', search: '?b', hash: '#c' }], out: '/a?b#c' },
]);

theories(parseUrl, [
  { in: ['http://localhost/'], out: {} },
  { in: ['http://localhost/?a=b&b=3'], out: { a: 'b', b: '3' } },
  { in: ['http://localhost/?a=b&a=3'], out: { a: '3' } },
  { in: ['/?a=b&a=3'], out: { a: '3' } },
  { in: ['./?a=b&a=3'], out: { a: '3' } },
]);

theories(resolveRelative, [
  { in: ['./a/b'], out: '/a/b' },
  {
    in: ['./a/b', 'http://localhost:3000/a/b/?a=b&c=3'],
    out: '/a/b/a/b?a=b&c=3',
  },
  {
    in: ['./a/b', 'http://localhost:3000/a/b?a=b&c=3'],
    out: '/a/b/a/b?a=b&c=3',
  },
  {
    in: ['../a/b?c=5&d=e', 'http://localhost:3000/a/b/?a=b&c=3'],
    out: '/a/a/b?a=b&c=5&d=e',
  },
  {
    in: ['../../../../../', 'http://localhost:3000/a/b/?a=b'],
    out: '/?a=b',
  },
]);
