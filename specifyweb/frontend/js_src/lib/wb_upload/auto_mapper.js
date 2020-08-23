"use strict";

const auto_mapper_definitions = require('./json/automapper_definitions.js');
const mappings = require('./mappings.js');

const auto_mapper = {

	//get data model and ranks
	constructor: (data_model, ranks)=>{

		auto_mapper.regex_1 = /[^a-z\s]/g;
		auto_mapper.regex_2 = /\s/g;
		auto_mapper.depth = 2;//TODO: experiment with the best depth value
		auto_mapper.comparisons = {
			'regex': (header,regex)=>{ return header.match(regex); },
			'string': (header,string)=>{ return header===string; },
			'contains': (header,string)=>{ return header.indexOf(string)!==-1; }
		};

	},

	//find mapping for each header
	map: (raw_headers, base_table) => {

		// //compile the list of tables to search in
		// const tables_to_use = auto_mapper.collect_tables(base_table, auto_mapper.depth);
		//
		// //filter out unnecessary data from the data model
		// const data_model = auto_mapper.data_model.filter(value => tables_to_use.includes(value));
		//
		// //try to map headers based on `auto_mapper_definitions.json`
		// let mapped_headers;
		// let unmapped_headers;
		// [mapped_headers,unmapped_headers] = auto_mapper.bulk_definitions_search(headers,tables_to_use);
		//
		// //figure out complete mappings path
		// //E.x turn `Agent > Agent Type` into `Accession > Accession Agents > Agent > Agent Type`
		// Object.keys(mapped_headers).forEach((header_name)=>{
		//
		// 	let table_name;
		// 	let field_name;
		// 	[table_name,field_name] = mapped_headers[header_name];
		//
		// 	mapped_headers[header_name] = auto_mapper.create_full_mappings_path(header_name,table_name,field_name);
		//
		// });

		const headers = {};

		//strip extra characters to increase mapping success
		Object.values(headers).forEach(function (original_name) {

			let stripped_name = original_name.toLowerCase();
			stripped_name = stripped_name.trim();
			stripped_name = stripped_name.replace(auto_mapper.regex_1, '');
			stripped_name = stripped_name.replace(auto_mapper.regex_2, ' ');
			const final_name = stripped_name.replace(' ', '');

			headers[original_name] = [stripped_name, final_name];

		});

		// Object.keys(auto_mapper.tables).forEach((table_name) => {
		//
		// 	const table_data = auto_mapper.tables[table_name];
		// 	const table_fields =
		//
		// });

		auto_mapper.find_mappings(base_table,headers,auto_mapper.depth);

		return auto_mapper.results;

		//TODO:
		//use modified get_html_for_table_fields to get list of fields and relationships
		//search tree ranks too

	},

	find_mappings: (table_name, unmapped_headers, depth=[], searched_tables=[], path=[])=>{

		if(searched_tables.length===0){
			auto_mapper.unmapped_headers = unmapped_headers;
			auto_mapper.results = {};
		}

		if(searched_tables.indexOf(table_name)!==-1)
			return;

		const table_data = mappings.tables[table_name];
		const fields = table_data['fields'];

		Object.keys(fields).forEach((field_name)=>{


			const field_data = fields[field_name];


			//compile regex strings
			if(typeof field_data['regex'] !== "undefined")
				Object.keys(field_data['regex']).forEach((regex_index)=>{
					field_data['regex'][regex_index] = new RegExp(field_data['regex'][regex_index]);
				});

			//headers
			Object.keys(auto_mapper.unmapped_headers).forEach((header_key)=>{

				const header = auto_mapper.unmapped_headers[header_key];
				if(header!==false){

					let matched = false;

					Object.keys(auto_mapper.comparisons).forEach((comparison_key)=>{

						if(typeof field_data[comparison_key] !== "undefined")
							Object.values(field_data[comparison_key]).forEach((comparison_value)=>{
								if(auto_mapper.comparisons[comparison_key](header_key,comparison_value)){
									matched = auto_mapper.make_mapping(path,table_name,field_name,header_key);
									if(matched)
										return false;
								}
							});

						if(matched)
							return false;

					});

				}
			});


			const friendly_field_name = fields['friendly_field_name'];

			Object.keys(auto_mapper.unmapped_headers).forEach((header_name)=>{

				const header_data = auto_mapper.unmapped_headers[header_name];

				if(header_data === false)
					return true;

				let stripped_name;
				let final_name;

				[stripped_name, final_name] = header_data;

				if(field_name === stripped_name || friendly_field_name === final_name)
					auto_mapper.make_mapping(path,table_name,field_name,header_name);

			});

		});


		const relationships = table_data['relationships'];

	},

	make_mapping: (path,table_name,field_name,header_name)=>{

		auto_mapper.unmapped_headers[header_name] = false;

		path.push(table_name);
		path.push(field_name);

		auto_mapper.results[header_name] = path;

		return false;//return whether the field got mapped or was mapped previously

	},


	//compile the list of tables to search in
	collect_tables: (current_table, depth, tables = []) => {

		tables.push(current_table);

		depth--;

		if (depth === 0)
			return tables;

		Object.values(mappings.tables[current_table]['relationships']).forEach((relationship_data) => {
			const table_name = relationship_data['table_name'];

			if (tables.indexOf(table_name) === -1)
				tables = collect_tables(table_name, depth, tables);
		});

		return tables;

	},

	//try to map headers based on `auto_mapper_definitions.json`
	bulk_definitions_search: (headers,tables_to_search) => {

		const mapped_headers = {};
		let unmapped_headers = headers;

		tables_to_search = tables_to_search.filter(value => auto_mapper_definitions.includes(value));

		//tables
		tables_to_search.forEach((table_name)=>{

			//fields
			const fields = auto_mapper_definitions[table_name];
			Object.keys(fields).forEach((field_name)=>{


				const field_data = fields[field_name];

				//compile regex strings
				if(typeof field_data['regex'] !== "undefined")
					Object.keys(field_data['regex']).forEach((regex_index)=>{
						field_data['regex'][regex_index] = new RegExp(field_data['regex'][regex_index]);
					});

				//headers
				Object.keys(unmapped_headers).forEach((header_key)=>{

					const header = unmapped_headers[header_key];
					if(header!==false){

						let matched = false;

						const comparisons = {
							'regex': (header,regex)=>{ return header.match(regex); },
							'string': (header,string)=>{ return header===string; },
							'contains': (header,string)=>{ return header.indexOf(string)!==-1; }
						};

						Object.keys(comparisons).forEach((comparison_key)=>{

							if(typeof field_data[comparison_key] !== "undefined")
								Object.values(field_data[comparison_key]).forEach((comparison_value)=>{
									if(comparisons[comparison_key](header,comparison_value)){
										matched = true;
										return false;
									}
								});

							if(matched){
								unmapped_headers[header_key] = false;
								mapped_headers[header] = [table_name,field_name];
								return false;
							}

						});

					}
				});

			});

		});

		return [mapped_headers,unmapped_headers]

	},

	//turn partial mappings path into a full mappings path
	create_full_mappings_path(header_name, table_name, field_name) {
		return undefined;
	}
}

module.exports = auto_mapper;