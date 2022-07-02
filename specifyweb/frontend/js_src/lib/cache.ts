/**
 * LocalStorage front-end cache
 *
 * Mostly used for remembering user preferences (last used leaflet map or WB
 * Column sort order), but can also be used to store results of computationally
 * expensive operations.
 *
 * @remarks
 * localStorage limit in most browsers is 5MB.
 * You can measure current usage with a function like this:
 * https://stackoverflow.com/a/17887889/8584605
 * There used to be a piece of code in cache.ts that trimmed underused old cache
 * entries when cache was getting too big, but it was removed as cache is
 * no longer used to store large objects
 *
 * @module
 */

import type { CacheDefinitions } from './cachedefinitions';
import { eventListener } from './events';
import type { R } from './types';

type BucketData = {
  // A dictionary of cache records
  records: R<{
    // The value that is stored in a particular cache record
    value: unknown;
  }>;
};

/** The data structure that would store all the buckets */
const buckets: R<BucketData> = {};

/**
 * The prefix that would be given to all bucketNames when they are committed
 * to localStorage.
 *
 * It is used to avoid collisions with other applications when running Specify 7
 * in development on localhost as well as to differentiate the localStorage
 * usages by this component from other components and third party libraries.
 */
const cachePrefix = 'specify7-';

/**
 * Indicates whether initialize() was run. If not, runs it on the next call
 * to get() or set()
 */
let eventListenerIsInitialized = false;

/** Set's an event listener that runs commitToStorage before a page unload */
function initialize(): void {
  globalThis.addEventListener?.('beforeunload', commitToStorage);
  eventListenerIsInitialized = true;
}

/** Commits persistent cache buckets to localStorage */
function commitToStorage(): void {
  if (globalThis.localStorage === undefined) return;

  Object.entries(buckets)
    .filter(([, bucketData]) => Object.keys(bucketData.records).length > 0)
    .forEach(([bucketName]) => commitBucketToStorage(bucketName));
}

/** Commits a single cache bucket to localStorage */
function commitBucketToStorage(bucketName: string): void {
  globalThis.localStorage.setItem(
    `${cachePrefix}${bucketName}`,
    JSON.stringify(buckets[bucketName])
  );
}

/** Tries to fetch a bucket from localStorage */
function fetchBucket(bucketName: string): void {
  if (globalThis.localStorage === undefined) return;

  const fullBucketName = `${cachePrefix}${bucketName}`;
  const data = globalThis.localStorage.getItem(fullBucketName);

  if (data !== null) buckets[bucketName] = JSON.parse(data) as BucketData;
}

/**
 * Get value of cacheName in the bucketName
 * Bucket names and cache names are defined in CacheDefinitions
 */
export const getCache = <
  BUCKET_NAME extends string & keyof CacheDefinitions,
  CACHE_NAME extends string & keyof CacheDefinitions[BUCKET_NAME]
>(
  bucketName: BUCKET_NAME,
  cacheName: CACHE_NAME
): CacheDefinitions[BUCKET_NAME][CACHE_NAME] =>
  genericGet<CacheDefinitions[BUCKET_NAME][CACHE_NAME]>(bucketName, cacheName);

/** Get value of cacheName in the bucketName */
function genericGet<TYPE>(
  // The name of the bucket
  bucketName: string,
  // The name of the cache
  cacheName: string
): TYPE {
  if (!eventListenerIsInitialized) initialize();

  if (buckets[bucketName] === undefined) fetchBucket(bucketName);

  return buckets[bucketName]?.records[cacheName]?.value as TYPE;
}

export const setCache = <
  BUCKET_NAME extends string & keyof CacheDefinitions,
  CACHE_NAME extends string & keyof CacheDefinitions[BUCKET_NAME]
>(
  bucketName: BUCKET_NAME,
  cacheName: CACHE_NAME,
  cacheValue: CacheDefinitions[BUCKET_NAME][CACHE_NAME]
) =>
  genericSet<CacheDefinitions[BUCKET_NAME][CACHE_NAME]>(
    bucketName,
    cacheName,
    cacheValue
  );

export const cacheEvents = eventListener<{ change: undefined }>();

function genericSet<T>(
  // The name of the bucket
  bucketName: string,
  // The name of the cache
  cacheName: string,
  // The value of the cache record. Can be any serializable value
  cacheValue: T
): T {
  if (!eventListenerIsInitialized) initialize();

  if (buckets[bucketName] === undefined) fetchBucket(bucketName);
  if (buckets[bucketName]?.records[cacheName]?.value === cacheValue)
    return cacheValue;

  buckets[bucketName] ??= {
    records: {},
  };

  buckets[bucketName].records[cacheName] = {
    value: cacheValue,
  };

  cacheEvents.trigger('change');

  return cacheValue;
}
