import { theories } from '../../../tests/utils';
import { isSameUrl as rawIsActive } from '../ActiveLink';

const isActive = (current: string, target: string, isExact: boolean): boolean =>
  rawIsActive(new URL(current, globalThis.location.href), target, isExact);

describe('', () => {});

theories(isActive, [
  // Same URLs, strict
  { in: ['http://localhost:3000', 'http://localhost:3000', true], out: true },
  { in: ['/', '/', true], out: true },
  { in: ['/a', '/a', true], out: true },
  { in: ['/b/c?', '/b/c#', true], out: true },
  { in: ['/a/?a', '/a?b', true], out: true },
  { in: ['/bar/', '#b', false], out: true },
  { in: ['/bar/', '', true], out: true },
  { in: ['/bar/', './', true], out: true },
  { in: ['/bar/', '../bar/', true], out: true },
  // Same URLs, not strict
  { in: ['http://localhost:3000', 'http://localhost:3000', false], out: true },
  { in: ['/', '/', false], out: true },
  { in: ['/a', '/a', false], out: true },
  { in: ['/b/c?', '/b/c#', false], out: true },
  { in: ['/a/?a', '/a?b', false], out: true },
  { in: ['/bar/', '#b', false], out: true },
  { in: ['/bar/', '', false], out: true },
  { in: ['/bar/', './', false], out: true },
  { in: ['/bar/', '../bar/', false], out: true },
  // Different URLs, strict
  {
    in: ['http://localhost:3000', 'http://localhost:3000/a', true],
    out: false,
  },
  { in: ['/', '/a', true], out: false },
  { in: ['/a', '/b', true], out: false },
  { in: ['/a#', '/b', true], out: false },
  { in: ['/a', '/b?bar', true], out: false },
  // Different URLs, not strict
  {
    in: ['http://localhost:3000', 'http://localhost:3000/a', false],
    out: false,
  },
  { in: ['/', '/a', false], out: false },
  { in: ['/a', '/b', false], out: false },
  { in: ['/a#', '/b', false], out: false },
  { in: ['/a', '/b?bar', false], out: false },
]);
