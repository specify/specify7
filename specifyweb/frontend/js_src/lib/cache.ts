/**
 * LocalStorage and SessionStorage front-end cache
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
import type { R } from './types';
import { omit } from './helpers';

/** Determines how persistent bucket's storage would be */
export type BucketType =
  // Persistent across sessions
  | 'localStorage'
  // Persistent only during a single session
  | 'sessionStorage';

type BucketData = {
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
};

/** The data structure that would store all the buckets */
const buckets: R<BucketData> = {};

/**
 * The prefix that would be given to all bucketNames when they are committed
 * to localStorage.
 *
 * It is used to avoid collisions with other applications when running Specify 7
 * in development on localhost
 */
const cachePrefix = 'specify7-';

/**
 * Indicates whether initialize() was run. If not, runs it on the next call
 * to get() or set()
 */
let eventListenerIsInitialized = false;

/** Set's an event listener that runs commitToStorage before a page unload */
function initialize(): void {
  addEventListener?.('beforeunload', commitToStorage);
  eventListenerIsInitialized = true;
}

/** Commits persistent cache buckets to localStorage */
function commitToStorage(): void {
  if (typeof localStorage === 'undefined') return;

  Object.entries(buckets)
    .filter(
      ([, bucketData]) =>
        bucketData.type === 'localStorage' &&
        Object.keys(bucketData.records).length > 0
    )
    .forEach(([bucketName]) => commitBucketToStorage(bucketName));
}

/** Commits a single cache bucket to localStorage */
function commitBucketToStorage(bucketName: string): void {
  localStorage.setItem(
    `${cachePrefix}${bucketName}`,
    JSON.stringify(buckets[bucketName])
  );
}

/** Tries to fetch a bucket from localStorage */
function fetchBucket(
  // The name of the bucket to fetch
  bucketName: string
): BucketData | false {
  /*
   * {boolean} False if bucket does not exist
   * {object} bucket content if bucket exists
   *
   */
  if (
    typeof localStorage === 'undefined' ||
    typeof sessionStorage === 'undefined'
  )
    return false;

  const fullBucketName = `${cachePrefix}${bucketName}`;

  const data =
    localStorage.getItem(fullBucketName) ??
    sessionStorage.getItem(fullBucketName);

  if (data === null) return false;
  buckets[bucketName] = JSON.parse(data) as BucketData;
  return buckets[bucketName];
}

/**
 * Get value of cacheName in the bucketName
 * Bucket names and cache names are defined in CacheDefinitions
 */
export const get: {
  // Overload with a default value
  <
    BUCKET_NAME extends string & keyof CacheDefinitions,
    CACHE_NAME extends string & keyof CacheDefinitions[BUCKET_NAME]
  >(
    bucketName: BUCKET_NAME,
    cacheName: CACHE_NAME,
    props: {
      readonly version?: string;
      readonly defaultSetOptions?: SetOptions;
      readonly defaultValue: CacheDefinitions[BUCKET_NAME][CACHE_NAME];
    }
  ): CacheDefinitions[BUCKET_NAME][CACHE_NAME];
  // Overload without a default value (returns T|undefined)
  <
    BUCKET_NAME extends string & keyof CacheDefinitions,
    CACHE_NAME extends string & keyof CacheDefinitions[BUCKET_NAME]
  >(
    bucketName: BUCKET_NAME,
    cacheName: CACHE_NAME,
    props?: {
      readonly version?: string;
      readonly defaultSetOptions?: SetOptions;
    }
  ): CacheDefinitions[BUCKET_NAME][CACHE_NAME] | undefined;
} = <
  BUCKET_NAME extends string & keyof CacheDefinitions,
  CACHE_NAME extends string & keyof CacheDefinitions[BUCKET_NAME]
>(
  bucketName: BUCKET_NAME,
  cacheName: CACHE_NAME,
  props?: {
    readonly version?: string;
    readonly defaultSetOptions?: SetOptions;
    readonly defaultValue?: CacheDefinitions[BUCKET_NAME][CACHE_NAME];
  }
) =>
  genericGet<CacheDefinitions[BUCKET_NAME][CACHE_NAME]>(
    bucketName,
    cacheName,
    props
  );

/** Get value of cacheName in the bucketName */
// Overload with defaultValue
export function genericGet<T>(
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
// Overload without defaultValue (returns T|undefined)
export function genericGet<T = never>(
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
): T | undefined;
export function genericGet<T>(
  // The name of the bucket
  bucketName: string,
  // The name of the cache
  cacheName: string,
  {
    version,
    defaultSetOptions,
    defaultValue,
  }: {
    readonly version?: string;
    readonly defaultSetOptions?: SetOptions;
    readonly defaultValue?: T;
  } = {}
): T | undefined {
  /*
   * {boolean} False on error
   * {mixed} value stored under cacheName on success
   */
  if (!eventListenerIsInitialized) initialize();

  if (
    (typeof buckets[bucketName] === 'undefined' &&
      !Boolean(fetchBucket(bucketName))) ||
    typeof buckets[bucketName].records[cacheName] === 'undefined'
  ) {
    if (typeof defaultValue === 'undefined') return undefined;
    genericSet(bucketName, cacheName, defaultValue, defaultSetOptions);
  }

  // If cache version is specified, and it doesn't match, clear the record
  if (
    typeof version === 'string' &&
    buckets[bucketName].records[cacheName].version !== version
  ) {
    console.warn(`Deleted cache key ${cacheName} due to version mismatch`);
    buckets[bucketName].records = omit(buckets[bucketName].records, [
      cacheName,
    ]);
    if (typeof defaultValue === 'undefined') return undefined;
    genericSet(bucketName, cacheName, defaultValue, {
      ...defaultSetOptions,
      overwrite: true,
    });
  }

  buckets[bucketName].records[cacheName].useCount += 1;
  return buckets[bucketName].records[cacheName].value as T;
}

type SetOptions = {
  /*
   * Which storage type to use. If localStorage - use persistent storage
   * If sessionStorage - data does not persist beyond the page reload
   */
  readonly bucketType?: BucketType;
  // Whether to overwrite the cache value if it is already present
  readonly overwrite?: boolean;
  // Version of this record (used for invalidating older cache)
  readonly version?: string;
};

export const set = <
  BUCKET_NAME extends string & keyof CacheDefinitions,
  CACHE_NAME extends string & keyof CacheDefinitions[BUCKET_NAME]
>(
  bucketName: BUCKET_NAME,
  cacheName: CACHE_NAME,
  cacheValue: CacheDefinitions[BUCKET_NAME][CACHE_NAME],
  setOptions?: SetOptions
) =>
  genericSet<CacheDefinitions[BUCKET_NAME][CACHE_NAME]>(
    bucketName,
    cacheName,
    cacheValue,
    setOptions
  );

/** Set's cacheValue as cache value under cacheName in `bucketName` */
export function genericSet<T>(
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
  }: SetOptions = {}
): T {
  if (typeof bucketName === 'undefined')
    throw new Error('Bucket name cannot be undefined');

  if (typeof cacheName === 'undefined')
    throw new Error('Cache record name cannot be undefined');

  if (!eventListenerIsInitialized) initialize();

  if (typeof buckets[bucketName] === 'undefined') fetchBucket(bucketName);

  buckets[bucketName] ??= {
    type: bucketType,
    records: {},
  };

  if (!overwrite && typeof buckets[bucketName].records[cacheName] === 'object')
    return buckets[bucketName].records[cacheName].value as T;

  buckets[bucketName].records[cacheName] = {
    value: cacheValue,
    useCount: 0,
    ...(typeof version === 'string' ? { version } : {}),
  };

  return cacheValue;
}
