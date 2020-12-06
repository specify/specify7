type bucket_type = 'local_storage'|'session_storage'

interface set_parameters {
	readonly bucket_type? :bucket_type,
	readonly overwrite? :boolean,
}

interface bucket_record {
	use_count:number,
	value:any
}

interface bucket_records {
	[record_name:string]:bucket_record
}

interface bucket_data {
	records:bucket_records
	type:bucket_type
}

interface buckets {
	[bucket_name:string]:bucket_data
}