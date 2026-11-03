'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const merge = require('deepmerge');

function assertSafe(result) {
  assert.equal(Object.getPrototypeOf(result), Object.prototype);
  assert.equal(Object.hasOwn(result, '__proto__'), false);
  assert.equal(result.poisoned, undefined);
  assert.equal({}.poisoned, undefined);
}

test('Jest resolves the local security-fixed dependency', () => {
  const { createRequire } = require('node:module');
  const jestRequire = createRequire(require.resolve('jest-config'));
  assert.equal(jestRequire('deepmerge'), merge);
  assert.equal(
    jestRequire('deepmerge/package.json').name,
    '@specify/deepmerge'
  );
});

for (const nullPrototype of [false, true]) {
  for (const poisonedSide of ['target', 'source']) {
    test(`rejects __proto__ on ${poisonedSide}, null prototype: ${nullPrototype}`, () => {
      const payload = JSON.parse('{"__proto__":{"poisoned":true},"safe":1}');
      const target = nullPrototype ? Object.create(null) : {};
      const source = poisonedSide === 'source' ? payload : { other: 2 };
      if (poisonedSide === 'target') {
        Object.defineProperty(target, '__proto__', {
          value: payload.__proto__,
          enumerable: true,
        });
        target.safe = 1;
      }
      const result = merge(target, source);
      assertSafe(result);
      assert.equal(result.safe, 1);
    });
  }
}

test('protects nested target objects, arrays, and merge.all', () => {
  const payload = JSON.parse('{"__proto__":{"poisoned":true},"safe":1}');
  const result = merge(
    { nested: payload, items: [payload] },
    { nested: { other: 2 }, items: [payload] }
  );
  assertSafe(result.nested);
  result.items.forEach(assertSafe);
  assertSafe(merge.all([payload, { other: 2 }]));
  assert.equal(result.nested.other, 2);
});

test('does not follow constructor.prototype into Object.prototype', () => {
  const result = merge(
    {},
    JSON.parse('{"constructor":{"prototype":{"poisoned":true}}}')
  );
  assertSafe(result);
  assert.equal(Object.hasOwn(result, 'constructor'), false);
});

test('preserves deep cloning, array concatenation, symbols, and special values', () => {
  const symbol = Symbol('config');
  const date = new Date();
  const regexp = /test/;
  const element = { $$typeof: Symbol.for('react.element'), props: {} };
  const target = { nested: { first: 1 }, items: [{ first: 1 }] };
  const source = {
    nested: { second: 2 },
    items: [{ second: 2 }],
    [symbol]: { value: 3 },
    date,
    regexp,
    element,
  };
  const result = merge(target, source);
  assert.deepEqual(result.nested, { first: 1, second: 2 });
  assert.deepEqual(result.items, [{ first: 1 }, { second: 2 }]);
  assert.notEqual(result.nested, target.nested);
  assert.notEqual(result.items[0], target.items[0]);
  assert.deepEqual(result[symbol], { value: 3 });
  assert.notEqual(result[symbol], source[symbol]);
  assert.equal(result.date, date);
  assert.equal(result.regexp, regexp);
  assert.equal(result.element, element);
  assert.deepEqual(target, { nested: { first: 1 }, items: [{ first: 1 }] });
});

test('preserves merge.all, custom merge options, and clone: false', () => {
  assert.deepEqual(merge.all([{ a: 1 }, { b: 2 }, { a: 3 }]), { a: 3, b: 2 });
  assert.throws(() => merge.all({}), /first argument should be an array/);
  const nested = { value: 1 };
  assert.equal(merge({}, { nested }, { clone: false }).nested, nested);
  assert.deepEqual(
    merge(
      { items: [1] },
      { items: [2] },
      { arrayMerge: (_, source) => source }
    ),
    { items: [2] }
  );
  assert.deepEqual(
    merge(
      { nested: { a: 1 } },
      { nested: { b: 2 } },
      { customMerge: (key) => (key === 'nested' ? () => 'custom' : undefined) }
    ),
    { nested: 'custom' }
  );
  assert.equal(
    merge({}, { nested }, { isMergeableObject: () => false }).nested,
    nested
  );
});
