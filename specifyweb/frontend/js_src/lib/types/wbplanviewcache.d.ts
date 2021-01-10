// Determines how persistent bucket's storage would be
// local_storage - persistent across sessions
// session_storage - persistent only during a single session
type bucket_type = 'local_storage' | 'session_storage'

interface set_parameters {
	// which storage type to use. If local_storage - use persistent storage
	// If session_storage - data does not persist beyond the page reload
	readonly bucket_type?: bucket_type,
	readonly overwrite?: boolean,  // whether to overwrite the cache value if it is already present
}

interface bucket_record {
	use_count: number,  // the amount times a particular cache value was used
	value: any  // the value that is stored in a particular cache record
}

interface bucket_records extends Record<string, bucket_record> {  // a dictionary of cache records
}

interface bucket_data {
	records: bucket_records  // a dictionary of cache records
	type: bucket_type
}

interface buckets extends Record<string, bucket_data> {  // a dictionary of buckets and their data
}