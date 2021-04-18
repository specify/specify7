/*
 *
 * Caching module for workbench mapper
 *
 *
 */

'use strict';

// Determines how persistent bucket's storage would be
import type { R } from './components/wbplanview';

type BucketType =
  // Persistent across sessions
  | 'localStorage'
  // Persistent only during a single session
  | 'sessionStorage';

interface BucketData {
  // A dictionary of cache records
  records: R<{
    // The amount times a particular cache value was used
    useCount: number;
    // The value that is stored in a particular cache record
    value: unknown;
    /*
     * Optional string identifying a version of a cache value
     * when calling .get() with a version specified, it is compared to
     * record's version. if versions do not much, record is deleted
     */
    version?: string;
  }>;
  type: BucketType;
}

// The data structure that would store all the buckets
const buckets: R<BucketData> = {};
/*
 * The prefix that would be given to all bucketNames when they are committed
 * to localStorage. Used to avoid collisions
 */
const cachePrefix = 'specify7-wbplanview-';
// Start trimming a bucket if records in the bucket are over this limit
const localStorageBucketSoftLimit = 100;
// Start trimming a bucket if records in a bucket are over this limit
const sessionStorageBucketSoftLimit = 100;
// Between 0 and 1 - decides the minimum passing cache usage
const trimAggressiveness = 0.5;
/*
 * Indicates whether initialize() was run. If not, runs it on the next call
 * to get() or set()
 */
let eventListenerIsInitialized = false;

/* Set's an event listener that runs commitToStorage before a page unload */
function initialize(): void {
  if (typeof addEventListener !== 'undefined')
    addEventListener('beforeunload', commitToStorage);
  eventListenerIsInitialized = true;
}

/* Commits persistent cache buckets to localStorage */
function commitToStorage(): void {
  if (typeof localStorage === 'undefined') return;

  Object.entries(buckets)
    .filter(
      ([, bucketData]) =>
        bucketData.type === 'localStorage' &&
        Object.keys(bucketData.records).length > 0
    )
    .map(([bucketName]) => commitBucketToStorage(bucketName));
}

/* Commits a single cache bucket to localStorage */
function commitBucketToStorage(bucketName: string): void {
  localStorage.setItem(
    cachePrefix + bucketName,
    JSON.stringify(buckets[bucketName])
  );
}

/* Tries to fetch a bucket from localStorage */
function fetchBucket(
  // The name of the bucket to fetch
  bucketName: string
): BucketData | false {
  /*
   * {boolean} False if bucket does not exist
   * {object} bucket content if bucket exists
   *
   */
  if (typeof localStorage === 'undefined') return false;

  const fullBucketName = cachePrefix + bucketName;

  const localStorageData = localStorage.getItem(fullBucketName);
  if (localStorageData === null) return false;

  return (buckets[bucketName] = JSON.parse(localStorageData));
}

/* Get value of cacheName in the bucketName */
// Overload with defaultValue
export function get<T>(
  // The name of the bucket
  bucketName: string,
  // The name of the cache
  cacheName: string,
  props: {
    version?: string;
    defaultValue: T;
    defaultSetOptions?: SetOptions;
  }
): T;
// Overload without defaultValue (returns T|false)
export function get<T>(
  // The name of the bucket
  bucketName: string,
  // The name of the cache
  cacheName: string,
  props?:
    | {
        version?: string;
        defaultSetOptions?: SetOptions;
      }
    | undefined
): T | false;
export function get<T>(
  // The name of the bucket
  bucketName: string,
  // The name of the cache
  cacheName: string,
  {
    version,
    defaultValue,
    defaultSetOptions,
  }: {
    version?: string;
    defaultValue?: T;
    defaultSetOptions?: SetOptions;
  } = {}
): T | false {
  /*
   * {boolean} False on error
   * {mixed} value stored under cacheName on success
   *
   */
  if (!eventListenerIsInitialized) initialize();

  if (
    (typeof buckets[bucketName] === 'undefined' && !fetchBucket(bucketName)) ||
    typeof buckets[bucketName].records[cacheName] === 'undefined'
  ) {
    if (typeof defaultValue === 'undefined') return false;
    else set(bucketName, cacheName, defaultValue, defaultSetOptions);
  }

  // If cache version is specified, and it doesn't match, clear the record
  if (
    typeof version !== 'undefined' &&
    buckets[bucketName].records[cacheName].version !== version
  ) {
    delete buckets[bucketName].records[cacheName];
    return false;
  } else {
    buckets[bucketName].records[cacheName].useCount++;

    return buckets[bucketName].records[cacheName].value as T;
  }
}

interface SetOptions {
  /*
   * Which storage type to use. If localStorage - use persistent storage
   * If sessionStorage - data does not persist beyond the page reload
   */
  readonly bucketType?: BucketType;
  // Whether to overwrite the cache value if it is already present
  readonly overwrite?: boolean;
  // Version of this record (used for invalidating older cache)
  readonly version?: string;
  // Whether to commit the value to localStorage as soon as it is changed
  readonly priorityCommit?: boolean;
}

/* Set's cacheValue as cache value under cacheName in `bucketName` */
export function set<T>(
  // The name of the bucket
  bucketName: string,
  // The name of the cache
  cacheName: string,
  /*
   * The value of the cache record. Can be any object that can be
   * converted to json
   */
  cacheValue: T,
  {
    bucketType = 'localStorage',
    overwrite = false,
    version = undefined,
    priorityCommit = false,
  }: SetOptions = {}
): T {
  if (typeof bucketName === 'undefined')
    throw new Error('Bucket name cannot be undefined');

  if (typeof cacheName === 'undefined')
    throw new Error('Cache record name cannot be undefined');

  if (!eventListenerIsInitialized) initialize();

  buckets[bucketName] ??= {
    type: bucketType,
    records: {},
  };

  if (
    !overwrite &&
    typeof buckets[bucketName].records[cacheName] !== 'undefined'
  )
    return buckets[bucketName].records[cacheName].value as T;

  buckets[bucketName].records[cacheName] = {
    value: cacheValue,
    useCount: 0,
    ...(typeof version === 'undefined'
      ? {}
      : {
          version,
        }),
  };

  trimBucket(bucketName);

  if (priorityCommit) commitBucketToStorage(bucketName);

  return cacheValue;
}

/*
 * Trims buckets that go beyond the size limit
 * Runs every time you set a new cache value
 * This method is needed to prevent memory leaks and stay under browser memory
 * limit - ~5 MB for Google Chrome ;(
 *
 */
function trimBucket(
  // The bucket to trim
  bucketName: string
): boolean {
  /*
   * Don't trim cache if the amount records in this bucket is smaller than
   * soft limits
   */
  if (
    (buckets[bucketName].type === 'localStorage' &&
      Object.keys(buckets[bucketName].records).length <
        localStorageBucketSoftLimit) ||
    (buckets[bucketName].type === 'sessionStorage' &&
      Object.keys(buckets[bucketName].records).length <
        sessionStorageBucketSoftLimit)
  )
    return false;

  const cacheUsages = Object.values(buckets[bucketName].records).map(
    ({ useCount }) => useCount
  );
  const totalUsage = cacheUsages.reduce(
    (totalUsage: number, usage: number | string) => totalUsage + Number(usage),
    0
  );
  const cacheItemsCount = cacheUsages.length;
  const averageUsage = totalUsage / cacheItemsCount;

  // Trim all caches with usage equal to or smaller than usageToTrim
  let usageToTrim = Math.round(averageUsage * trimAggressiveness);

  if (usageToTrim === 0) usageToTrim = 1;

  const cacheKeys = Object.keys(buckets[bucketName].records);

  buckets[bucketName].records = Object.fromEntries(
    Object.entries(cacheUsages)
      .map(([cacheIndex, cacheUsage]) => [
        cacheKeys[Number(cacheIndex)],
        cacheUsage,
      ])
      .filter(([, cacheUsage]) => cacheUsage >= usageToTrim)
      .map(([cacheKey]) => [cacheKey, buckets[bucketName].records[cacheKey]])
  );

  return true;
}
