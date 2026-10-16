type PromiseGenerator<T> = () => Promise<T>;

// eslint-disable-next-line functional/no-class
export class PromiseQueue<K, V> {
  private readonly maxConcurrentPromises: number;
  private readonly queue: Map<K, PromiseGenerator<V>>;
  private readonly activePromises: Map<K, Promise<V>>;

  public constructor(maxConcurrentPromises: number = 5) {
    this.queue = new Map();
    this.activePromises = new Map();
    this.maxConcurrentPromises = maxConcurrentPromises;
  }

  /**
   * Add the promise to the Queue. If the queue has capacity to run the
   * promise, it starts executing immediately.
   * Otherwise the promise is held in a queue and will be executed when
   * available.
   *
   * Returns the promise if made active and false if the promise was held in
   * the queue.
   */
  public enqueue(key: K, promiseGen: PromiseGenerator<V>): Promise<V> | false {
    if (this.activePromises.size >= this.maxConcurrentPromises) {
      // Add the promise to the queue
      this.queue.set(key, promiseGen);
      return false;
    } else {
      // The promise can be handled directly
      return this.activatePromise(key, promiseGen);
    }
  }

  /**
   * Returns the promise if active, false if the promise is in the queue, and
   * undefined if the promise is not active or in the queue
   */
  public get(key: K): Promise<V> | false | undefined {
    const activePromise = this.activePromises.get(key);
    if (activePromise !== undefined) {
      return activePromise;
    }
    const queuedPromise = this.queue.get(key);
    if (queuedPromise !== undefined) {
      return false;
    }
    return undefined;
  }

  /**
   * Removes all promises from the queue
   */
  public clear() {
    this.queue.clear();
  }

  private activatePromise(key: K, promiseGen: PromiseGenerator<V>): Promise<V> {
    const activePromise = promiseGen();
    const wrapped = this.wrapPromise(key, activePromise);
    this.activePromises.set(key, wrapped);
    return wrapped;
  }

  private wrapPromise(key: K, promise: Promise<V>): Promise<V> {
    return promise.finally(() => {
      this.activePromises.delete(key);
      this.queueNext();
    });
  }

  private queueNext() {
    const firstItem = this.queue.entries().next().value;
    // If there's no items in the iterator, we don't need to do anything
    if (firstItem === undefined) {
      return;
    }
    const [key, promiseGen] = firstItem;
    this.queue.delete(key);
    this.activatePromise(key, promiseGen);
  }
}
