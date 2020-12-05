// common
type scope = 'automapper' | 'suggestion'
type mapping_path = string[]
type values = string[]
interface options {
	regex? :values,
	string? :values,
	contains? :values,
}


// table_synonyms
interface table_synonym_definition {
	mapping_path_filter :mapping_path,
	synonyms :string[]
}


type table_synonyms = {
	[table_name :string] :table_synonym_definition[]
}


// dont_match
interface dont_match_instances {
	[field_name :string] :scope[]
}

interface dont_match {
	[table_name :string] :dont_match_instances
}


// shortcuts
interface shortcut_options extends options {
}

interface shortcut_definition {
	mapping_path :mapping_path,
	headers :shortcut_options
}

type shortcut = {
	[scope_name in scope]? :shortcut_definition[]
}

interface shortcuts {
	[table_name :string] :shortcut
}


// synonyms
interface synonym_options extends shortcut_options {
	formatted_header_field_synonym? :values,
}

interface synonym_headers {
	headers: synonym_options
}

type field_synonym = {
	[scope_name in scope]? :synonym_headers;
};

interface synonym {
	[field_name :string] :field_synonym
}

interface synonyms {
	[table_name :string] :synonym
}


// main structure
interface auto_mapper_definitions_interface {
	table_synonyms :table_synonyms,
	dont_match :dont_match,
	shortcuts :shortcuts,
	synonyms: synonyms,
}

type auto_mapper_definition_branches = 'table_synonyms'|'dont_match'|'shortcuts'|'synonyms';