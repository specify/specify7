"use strict";


const cache = {

	buckets: {},
	cache_prefix: 'specify7_wbplanview_',
	local_storage_bucket_soft_limit: 200,
	session_storage_bucket_soft_limit: 500,
	trim_aggresivnes: 0.2,  // between 0 and 1
	event_listener_is_initialized: false,

	initialize(){

		window.onbeforeunload = cache.commit_to_storage;
		cache.event_listener_is_initialized = true;

	},

	commit_to_storage(){

		if(typeof localStorage === "undefined")
			return false;

		for(const [bucket_name, bucket_data] of Object.entries(cache.buckets))
			if(
				bucket_data['type'] === 'local_storage' &&
				Object.keys(bucket_data['records']).length !== 0
			){
				const full_bucket_name = cache.cache_prefix + bucket_name;
				localStorage.setItem(full_bucket_name, JSON.stringify(bucket_data));
			}

	},

	initialize_bucket(bucket_name){

		const full_bucket_name = cache.cache_prefix + bucket_name;

		const local_storage_data = localStorage.getItem(full_bucket_name);
		if(local_storage_data === null)
			return false;

		return cache.buckets[bucket_name] = JSON.parse(local_storage_data);

	},

	get(bucket_name, cache_name){

		if(!cache.event_listener_is_initialized)
			cache.initialize();

		if(
			(
				typeof cache.buckets[bucket_name] === "undefined" &&
				!cache.initialize_bucket(bucket_name)
			) ||
			typeof cache.buckets[bucket_name]['records'][cache_name] === "undefined"
		)
			return false;

		else {

			cache.buckets[bucket_name]['records'][cache_name]['use_count']++;

			return cache.buckets[bucket_name]['records'][cache_name]['value'];

		}

	},

	set(bucket_name, cache_name, cache_value, config={}){

		if(!cache.event_listener_is_initialized)
			cache.initialize();

		const {
			bucket_type = 'local_storage',
			overwrite = false,
		} = config;

		if(typeof cache.buckets[bucket_name] === "undefined"){
			cache.buckets[bucket_name] = {
				type: bucket_type,
				records: {},
			}
		}

		if(!overwrite && typeof cache.buckets[bucket_name]['records'][cache_name] !== "undefined")
			return false;

		cache.buckets[bucket_name]['records'][cache_name] = {
			value: cache_value,
			use_count: 0,
		};

		cache.trim_bucket(bucket_name);

	},

	trim_bucket(bucket_name){

		// don't trim cache if smaller than soft limits
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
		},0);
		const cache_items_count = cache_usages.length;
		const average_usage  = total_usage / cache_items_count;
		const usage_to_trim = Math.round(average_usage * cache.trim_aggresivnes);

		console.log('Trimming caches with usage under ' + usage_to_trim);

		const cache_keys = Object.keys(cache.buckets[bucket_name]['records']);
		for(const [cache_index, cache_usage] of Object.entries(cache_usages)){

			if(cache_usage >= usage_to_trim)
				continue;

			const cache_key = cache_keys[cache_index];

			cache.buckets[bucket_name]['records'][cache_key] = undefined;

			console.log('Trimming cache from bucket ' + bucket_name + ' under key ' + cache_key);

		}

		return true;

	},

	wipe_all(){

		cache.buckets = {};
		localStorage.clear();

	}

};

module.exports = cache;