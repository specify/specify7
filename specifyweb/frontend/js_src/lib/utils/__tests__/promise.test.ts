import { flippedPromise } from '../promise';

test('flippedPromise can be resolved from the outside', async () => {
  const promise = flippedPromise<string>();
  expect(promise).toBeInstanceOf(Promise);
  const resolvedValue = 'resolved value';
  promise.resolve(resolvedValue);
  await expect(promise).resolves.toEqual(resolvedValue);
});

test('flippedPromise can be rejected from the outside', async () => {
  const promise = flippedPromise<string>();
  promise.reject('error');
  await expect(promise).rejects.toBe('error');
});
