/*
*
* Caching module for workbench mapper
*
* */

'use strict';


// Determines how persistent bucket's storage would be
type BucketType =
	'local_storage'  // persistent across sessions
	| 'session_storage'  // persistent only during a single session

interface BucketData {
	records: Record<string, {
		use_count: number,  // the amount times a particular cache value was used
		value: unknown,  // the value that is stored in a particular cache record
		// optional string identifying a version of a cache value
		// when calling .get() with a version specified, it is compared to record's version
		// if versions do not much, record is deleted
		version?: string,
	}>  // a dictionary of cache records
	type: BucketType
}


const buckets: Record<string, BucketData> = {};  // the data structure that would store all the buckets
// the prefix that would be given to all bucket_names when they are committed to localStorage. Used to avoid collisions
const cache_prefix = 'specify7_wbplanview_';
// start trimming a bucket if records in the bucket are over the `local_storage_bucket_soft_limit`
const local_storage_bucket_soft_limit = 100;
// start trimming a bucket if records in a bucket are over the `local_storage_bucket_soft_limit`
const session_storage_bucket_soft_limit = 100;
const trim_aggressiveness = 0.5;  // between 0 and 1 - decides the minimum passing cache usage
// indicates whether initialize() was run. If not, runs it on the next call to get() or set()
let event_listener_is_initialized = false;

/* Set's an event listener that runs commit_to_storage before a page unload */
function initialize(): void {
	window.onbeforeunload = commit_to_storage;
	event_listener_is_initialized = true;
}

/* Commits persistent cache buckets to localStorage */
function commit_to_storage(): void {

	if (typeof localStorage === 'undefined')
		return;

	Object.entries(buckets).filter(([_bucket_name, bucket_data]) =>
		bucket_data.type === 'local_storage' &&
		Object.keys(bucket_data.records).length !== 0,
	).forEach(([bucket_name, bucket_data]) =>
		localStorage.setItem(cache_prefix + bucket_name, JSON.stringify(bucket_data)),
	);

}

/* Tries to fetch a bucket from localStorage */
function fetch_bucket(
	bucket_name: string,  // the name of the bucket to fetch
): BucketData | false
/*
* {boolean} False if bucket does not exist
* {object} bucket content if bucket exists
* */ {

	if (typeof localStorage === 'undefined')
		return false;

	const full_bucket_name = cache_prefix + bucket_name;

	const local_storage_data = localStorage.getItem(full_bucket_name);
	if (local_storage_data === null)
		return false;

	return (
		buckets[bucket_name] = JSON.parse(local_storage_data)
	);

}

/* Get value of cache_name in the bucket_name */
export function get(
	bucket_name: string,  // the name of the bucket
	cache_name: string,  // the name of the cache
	{
		version,
		default_value,
		default_set_options,
	}:{
		version?: string,
		default_value?: unknown,
		default_set_options?: setOptions
	}={}
): unknown
/*
	* {boolean} False on error
	* {mixed} value stored under cache_name on success
	* */ {

	if (!event_listener_is_initialized)
		initialize();

	if (
		(
			typeof buckets[bucket_name] === 'undefined' &&
			!fetch_bucket(bucket_name)
		) ||
		typeof buckets[bucket_name].records[cache_name] === 'undefined'
	){
		if (typeof default_value === 'undefined')
			return false;
		else
			set(bucket_name, cache_name, default_value, default_set_options);
	}

	// if cache version is specified, and it doesn't match, clear the record
	if(
		typeof version === 'string' &&
		(
			typeof buckets[bucket_name].records[cache_name].version === 'undefined' ||
			buckets[bucket_name].records[cache_name].version !== version
		)
	) {
		delete buckets[bucket_name].records[cache_name];
		return false;
	}

	else {

		buckets[bucket_name].records[cache_name].use_count++;

		return buckets[bucket_name].records[cache_name].value;

	}

}

interface setOptions {
	// which storage type to use. If local_storage - use persistent storage
	// If session_storage - data does not persist beyond the page reload
	readonly bucket_type?: BucketType,
	readonly overwrite?: boolean,  // whether to overwrite the cache value if it is already present
	readonly version?: string  // version of this record (used for invalidating older cache)
}

/* Set's cache_value as cache value under cache_name in `bucket_name` */
export function set<T>(
	bucket_name: string,  // the name of the bucket
	cache_name: string,  // the name of the cache
	cache_value: T,  // the value of the cache record. Can be any object that can be converted to json
	{
		bucket_type = 'local_storage',
		overwrite = false,
		version = undefined,
	}:setOptions = {},
): T {

	if (typeof bucket_name === 'undefined')
		throw new Error('Bucket name cannot be undefined');

	if (typeof cache_name === 'undefined')
		throw new Error('Cache record name cannot be undefined');

	if (!event_listener_is_initialized)
		initialize();

	buckets[bucket_name] ??= {
		type: bucket_type,
		records: {},
	};

	if (!overwrite && typeof buckets[bucket_name].records[cache_name] !== 'undefined')
		return buckets[bucket_name].records[cache_name].value as T;

	buckets[bucket_name].records[cache_name] = {
		value: cache_value,
		use_count: 0,
		...(
			typeof version === 'undefined' ?
				{} :
				{
					version,
				}
		)
	};

	trim_bucket(bucket_name);

	return cache_value;

}

/*
* Trims buckets that go beyond the size limit
* Runs every time you set a new cache value
* This method is needed to prevent memory leaks and stay under browser memory limit - ~5 MB for Google Chrome ;(
* */
function trim_bucket(
	bucket_name: string,  // the bucket to trim
): boolean {

	// don't trim cache if the amount records in this bucket is smaller than soft limits
	if (
		(
			buckets[bucket_name].type === 'local_storage' &&
			Object.keys(buckets[bucket_name].records).length < local_storage_bucket_soft_limit
		) ||
		(
			buckets[bucket_name].type === 'session_storage' &&
			Object.keys(buckets[bucket_name].records).length < session_storage_bucket_soft_limit
		)
	)
		return false;

	const cache_usages = Object.values(buckets[bucket_name].records).map(({use_count}) => use_count);
	const total_usage = cache_usages.reduce((
		total_usage: number,
		usage: number|string
	) =>
		total_usage + ~~usage,
		0,
	);
	const cache_items_count = cache_usages.length;
	const average_usage = total_usage / cache_items_count;

	// trim all caches with usage equal to or smaller than usage_to_trim
	let usage_to_trim = Math.round(average_usage * trim_aggressiveness);

	if (usage_to_trim === 0)
		usage_to_trim = 1;

	const cache_keys = Object.keys(buckets[bucket_name].records);

	buckets[bucket_name].records = Object.fromEntries(
		Object.entries(cache_usages).map(([cache_index, cache_usage]) =>
			[cache_keys[~~cache_index], cache_usage],
		).filter(([_cache_key, cache_usage]) =>
			cache_usage >= usage_to_trim,
		).map(([cache_key]) =>
			[cache_key, buckets[bucket_name].records[cache_key]],
		),
	);

	return true;

}