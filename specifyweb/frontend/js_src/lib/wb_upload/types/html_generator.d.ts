interface mapping_line_parameters {
	readonly line_data :mapping_element_parameters[],
	readonly header_data :{
		readonly mapping_type :string,
		readonly header_name :string,
	},
	readonly line_attributes? :string[]
}

interface mapping_element_parameters {
	readonly name :string,
	readonly friendly_name :string,
	readonly fields_data :object
	readonly table_name? :string
	readonly mapping_element_type? :string
}