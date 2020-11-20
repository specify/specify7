"use strict";


const cache = {

	buckets: {}, // the data structure that would store all of the buckets
	cache_prefix: 'specify7_wbplanview_',  // the prefix that would be given to all bucket_names when they are committed to localStorage. Used to avoid collisions
	local_storage_bucket_soft_limit: 100,  // start trimming a bucket if there are more than local_storage_bucket_soft_limit records in a bucket
	session_storage_bucket_soft_limit: 100,  // start trimming a bucket if there are more than local_storage_bucket_soft_limit records in a bucket
	trim_aggresivnes: 0.5,  // between 0 and 1 - decides the minimum passing cache usage
	event_listener_is_initialized: false,  // indicates whether initialize() was run. If not, runs it on the next call to get() or set()

	/*
	* Set's an event listener that runs commit_to_storage before page unload
	* */
	initialize(){

		window.onbeforeunload = cache.commit_to_storage;
		cache.event_listener_is_initialized = true;

	},

	/*
	* Commits persistent cache buckets to localStorage
	* */
	commit_to_storage(){

		if (typeof localStorage === "undefined")
			return false;

		for (const [bucket_name, bucket_data] of Object.entries(cache.buckets))
			if (
				bucket_data['type'] === 'local_storage' &&
				Object.keys(bucket_data['records']).length !== 0
			) {
				const full_bucket_name = cache.cache_prefix + bucket_name;
				localStorage.setItem(full_bucket_name, JSON.stringify(bucket_data));
			}

	},

	/*
	* Tries to fetch a bucket from localStorage
	* */
	fetch_bucket(
		/* mixed */ bucket_name  // {boolean} False if bucket does not exist.
		//								   {object} bucket content if bucket exists
	){

		const full_bucket_name = cache.cache_prefix + bucket_name;

		const local_storage_data = localStorage.getItem(full_bucket_name);
		if (local_storage_data === null)
			return false;

		return cache.buckets[bucket_name] = JSON.parse(local_storage_data);

	},

	/*
	* Get value of cache_name in the bucket_name
	* @returns {mixed} - {boolean} False on error
	* 					 {mixed} value stored under cache_name on success
	* */
	get(
		/* string */ bucket_name,  // the name of the bucket
		/* string */ cache_name  // the name of the cache
	){

		if (!cache.event_listener_is_initialized)
			cache.initialize();

		if (
			(
				typeof cache.buckets[bucket_name] === "undefined" &&
				!cache.fetch_bucket(bucket_name)
			) ||
			typeof cache.buckets[bucket_name]['records'][cache_name] === "undefined"
		)
			return false;

		else {

			cache.buckets[bucket_name]['records'][cache_name]['use_count']++;

			return cache.buckets[bucket_name]['records'][cache_name]['value'];

		}

	},

	/*
	* Set's cache_value as cache value under cache_name in bucket_name
	* */
	set(
		/* string */ bucket_name,  // the name of the bucket
		/* string */ cache_name,  // the name of the cache
		/* string */ cache_value,  // the value of the cache. Can be any object that can be converted to json
		/* object */ config = {}  // configuration for cache. Described inside of method definition
	){

		if (!cache.event_listener_is_initialized)
			cache.initialize();

		const {
			bucket_type = 'local_storage',  // which storage type to use. If local_storage - use persistent storage. If session_storage - data does not persist beyond the page reload
			overwrite = false,  // whether to overwrite the cache value if it is already present
		} = config;

		if (typeof cache.buckets[bucket_name] === "undefined") {
			cache.buckets[bucket_name] = {
				type: bucket_type,
				records: {},
			};
		}

		if (!overwrite && typeof cache.buckets[bucket_name]['records'][cache_name] !== "undefined")
			return false;

		cache.buckets[bucket_name]['records'][cache_name] = {
			value: cache_value,
			use_count: 0,
		};

		cache.trim_bucket(bucket_name);

	},

	/*
	* Trims buckets that go beyond the size limit
	* Runs every time you set a new cache value
	* This method is needed to prevent memory leaks and stay under browser memory limit - ~5MB for Google Chrome ;(
	* */
	trim_bucket(
		/* string */ bucket_name  // the bucket to trim
	){

		// don't trim cache if the number of records in this bucket is smaller than soft limits
		if (
			(
				cache.buckets[bucket_name]['type'] === 'local_storage' &&
				Object.keys(cache.buckets[bucket_name]['records']).length < cache.local_storage_bucket_soft_limit
			) ||
			(
				cache.buckets[bucket_name]['type'] === 'session_storage' &&
				Object.keys(cache.buckets[bucket_name]['records']).length < cache.session_storage_bucket_soft_limit
			)
		)
			return false;

		const cache_usages = Object.values(cache.buckets[bucket_name]['records']).map(({use_count}) => use_count);
		const total_usage = cache_usages.reduce((total_usage, usage) => {
			return total_usage + usage;
		}, 0);
		const cache_items_count = cache_usages.length;
		const average_usage = total_usage / cache_items_count;

		//trim all caches with usage equal to or smaller than usage_to_trim
		let usage_to_trim = Math.round(average_usage * cache.trim_aggresivnes);

		if (usage_to_trim === 0)
			usage_to_trim = 1;

		const cache_keys = Object.keys(cache.buckets[bucket_name]['records']);
		const new_records = {};
		for (const [cache_index, cache_usage] of Object.entries(cache_usages)) {

			const cache_key = cache_keys[cache_index];

			if (cache_usage >= usage_to_trim)
				new_records[cache_key] = cache.buckets[bucket_name]['records'][cache_key];

		}
		cache.buckets[bucket_name]['records'] = new_records;

		return true;

	},

	wipe_all(){

		cache.buckets = {};
		localStorage.clear();

	}

};

module.exports = cache;