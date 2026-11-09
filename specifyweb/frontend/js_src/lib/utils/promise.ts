export type ResolvablePromise<T = undefined> = Promise<T> & {
   
  resolve: T extends undefined ? (value?: T) => void : (value: T) => void;
   
  reject: (value?: unknown) => void;
};

/**
 * A promise that can be resolved from outside the promise
 */
export function flippedPromise<T = undefined>(): ResolvablePromise<T> {
  let resolveCallback: ResolvablePromise<T>['resolve'] = undefined!;
  let rejectCallback: ResolvablePromise<T>['reject'] = undefined!;
  const promise: ResolvablePromise<T> = new Promise<T>((resolve, reject) => {
    resolveCallback = resolve as ResolvablePromise<T>['resolve'];
    rejectCallback = reject;
  }) as ResolvablePromise<T>;
  promise.resolve = resolveCallback;
  promise.reject = rejectCallback;
  return promise;
}
