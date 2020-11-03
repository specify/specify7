"use strict";


const cache = {

	buckets: {},
	cache_prefix: 'specify7_wbplanview_',
	local_storage_bucket_soft_limit: 200,
	session_storage_bucket_soft_limit: 500,
	trim_aggresivnes: 0.2,  // between 0 and 1

	initialize(){
		window.onbeforeunload = cache.commit_to_storage;
	},

	commit_to_storage(){

		for(const [bucket_name, bucket_data] of Object.entries(cache.buckets))
			if(bucket_data['type'] === 'local_storage' && Object.keys(bucket_data['data']).length !== 0)
				localStorage.setItem(bucket_name, JSON.stringify(bucket_data));

	},

	initialize_bucket(bucket_name){

		const full_bucket_name = cache.cache_prefix + bucket_name;

		const local_storage_data = localStorage.getItem(full_bucket_name);
		if(local_storage_data === null)
			return false;

		return cache.buckets[bucket_name] = JSON.parse(local_storage_data);

	},

	get(bucket_name, cache_name){

		const full_bucket_name = cache.cache_prefix + bucket_name;

		if(
			(
				typeof cache.buckets[full_bucket_name] === "undefined" &&
				!cache.initialize_bucket(full_bucket_name)
			) ||
			typeof cache.buckets[full_bucket_name]['data'][cache_name] === "undefined"
		)
			return false;

		else {

			cache.buckets[full_bucket_name]['usage']++;

			return cache.buckets[full_bucket_name]['data'][cache_name];

		}

	},

	set(bucket_name, cache_name, cache_value, bucket_type='local_storage'){

		const full_bucket_name = cache.cache_prefix + bucket_name;

		if(typeof cache.buckets[full_bucket_name] === "undefined"){
			cache.buckets[full_bucket_name] = {
				'type': bucket_type,
				'data': {},
				'usage': 0,
			}
		}

		cache.buckets[full_bucket_name]['data'][cache_name] = cache_value;

		cache.trim_bucket(bucket_name);

	},

	trim_bucket(bucket_name){

		const full_bucket_name = cache.cache_prefix + bucket_name;

		// don't trim cache if smaller than soft limits
		if (
			(
				cache.buckets[full_bucket_name]['type'] === 'local_storage' &&
				Object.keys(cache.buckets[full_bucket_name]).length < cache.local_storage_bucket_soft_limit
			) ||
			(
				cache.buckets[full_bucket_name]['type'] === 'session_storage' &&
				Object.keys(cache.buckets[full_bucket_name]).length < cache.session_storage_bucket_soft_limit
			)
		)
			return false;

		const cache_usages = Object.values(cache.buckets[full_bucket_name]['data']).map(({usage}) => usage);
		const total_usage = cache_usages.reduce((total_usage, usage) => {
			return total_usage + usage;
		},0)
		const cache_items_count = cache.buckets[full_bucket_name].length;
		const average_usage  = total_usage / cache_items_count;
		const usage_to_trim = Math.round(average_usage * cache.trim_aggresivnes);

		console.log('Trimming caches with usage under ' + usage_to_trim)

		const cache_keys = Object.keys(cache.buckets[full_bucket_name]['data']);
		for(const [cache_index, cache_usage] of cache_usages){

			if(cache_usage >= usage_to_trim)
				continue;

			const cache_key = cache_keys[cache_index];

			cache.buckets[full_bucket_name]['data'][cache_key] = undefined;

			console.log('Trimming cache from bucket ' + full_bucket_name + ' under key ' + cache_key);

		}

		return true;

	},

};

module.exports = cache;