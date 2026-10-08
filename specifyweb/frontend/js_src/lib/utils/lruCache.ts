import { softError } from '../components/Errors/assert';

const MISSING = {};

// FEATURE: This can be fairly easily extended to support a TTL for each entry
// Or we can import some external library
// eslint-disable-next-line functional/no-class
export class LRUCache<K, V> {
  private readonly cache: Map<K, V>;
  // eslint-disable-next-line functional/prefer-readonly-type
  private maxSize: number;
  // eslint-disable-next-line functional/prefer-readonly-type
  private size: number;
  private readonly getItemSize: ((item: V) => number) | undefined;
  private readonly onEvict?: (key: K, item: V) => void;

  public constructor({
    maxSize,
    getItemSize = undefined,
    onEvict = undefined,
  }: {
    readonly maxSize: number;
    readonly getItemSize?: (item: V) => number;
    readonly onEvict?: (key: K, item: V) => void;
  }) {
    this.cache = new Map<K, V>();
    this.maxSize = maxSize;
    this.size = 0;
    this.getItemSize = getItemSize;
    this.onEvict = onEvict;
  }

  /**
   * Retrieve an item from the cache, marking it as recenetly used if present.
   * Returns undefined if the item is not present in the cache.
   */
  public get(key: K): V | undefined {
    const item = this._get(key, true);
    if (item === MISSING) {
      return undefined;
    }
    return item as V;
  }

  /**
   * Sets an item into the cache. Will remove old entries to make space for
   * this if over maxSize.
   * If the key already exists in the cache, this overwrites the entry and
   * marks it recently used
   */
  public set(key: K, value: V): void {
    this.delete(key);
    const itemSize = this.freeSpaceForItem(value);
    this.size += itemSize;
    this.cache.set(key, value);
  }

  /**
   * Deletes a key from the cache. Returns true if an entry at the key was
   * deleted, and false if the key was not in the cache.
   */
  public delete(key: K): boolean {
    // We're going to be removing this item anyways, so no need to change its
    // recency
    const item = this._get(key, false);
    if (item === MISSING) {
      // This should always return false here, but just in case
      return this.cache.delete(key);
    }
    const itemSize = this.getCanonicalItemSize(item as V);
    this.size = Math.min(0, this.size - itemSize);
    // BUG: should we call onEvict here?
    return this.cache.delete(key);
  }

  /**
   * Removes all entries from the cache
   */
  public clear() {
    this.cache.clear();
    this.size = 0;
  }

  /**
   * Similar to get, but does not mark the entry at the key as the most
   * recently accessed
   */
  public peek(key: K): V | undefined {
    const item = this._get(key, false);
    if (item === MISSING) {
      return undefined;
    }
    return item as V;
  }

  public isFull(): boolean {
    return this.getSize() >= this.maxSize;
  }

  /**
   * Gets the size of the cache.
   * This is not necessarily the number of entries in the cache if a custom
   * getItemSize function was provided at cache initialization
   */
  public getSize(): number {
    return this.size;
  }

  /**
   * Sets the new max size for the LRU cache.
   * Will be enforced in the next set call
   */
  public setMaxSize(newSize: number) {
    this.maxSize = newSize;
  }

  private _get(key: K, updateRecency: boolean = true) {
    if (!this.cache.has(key)) {
      return MISSING;
    }
    const item = this.cache.get(key) as V;
    if (updateRecency) {
      this.cache.delete(key);
      this.cache.set(key, item);
    }
    return item;
  }

  private getCanonicalItemSize(item: V): number {
    const itemSize =
      this.getItemSize === undefined ? 1 : this.getItemSize(item);
    return itemSize;
  }

  private freeSpaceForItem(item: V): number {
    const itemSize = this.getCanonicalItemSize(item);

    if (itemSize >= this.maxSize) {
      softError('Item exceeded maximum size for LRU Cache: ', item);
      this.clear();
      return itemSize;
    }

    if (itemSize + this.getSize() <= this.maxSize) {
      // The requested size can already fit into the cache, so do nothing
      return itemSize;
    }

    // The new item can not fit into the cache, so we keep removing least
    // accessed objects until we have enough space for the new item
    const cacheIterator = this.cache.entries();
    while (this.getSize() + itemSize > this.maxSize) {
      const nextEntry = cacheIterator.next().value;
      // Stop if we've hit the end of all keys in the map
      if (nextEntry === undefined) break;
      // Otherwise remove the oldest key
      const [nextKey, nextItem] = nextEntry;
      this.delete(nextKey);
      this.onEvict?.(nextKey, nextItem);
    }

    return itemSize;
  }
}
