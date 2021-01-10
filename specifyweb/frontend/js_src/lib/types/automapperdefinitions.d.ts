type comparison_types = 'regex' | 'string' | 'contains'

// common

interface options {
	readonly regex? :RegExp[],
	readonly string? :string[],
	readonly contains? :string[],
}


// table_synonyms
interface table_synonym_definition {
	readonly mapping_path_filter :mapping_path,
	readonly synonyms :string[]
}


type table_synonyms = Readonly<Record<string, table_synonym_definition[]>>


// dont_match
interface dont_match_instances extends Readonly<Record<string, automapper_scope[]>> {
}

interface dont_match extends Readonly<Record<string, dont_match_instances>> {
}


// shortcuts
interface shortcut_options extends options {
}

interface shortcut_definition {
	readonly mapping_path :mapping_path,
	readonly headers :shortcut_options
}

type shortcut = Readonly<Partial<Record<automapper_scope, shortcut_definition[]>>>

interface shortcuts extends Readonly<Record<string, shortcut>> {
}


// synonyms
interface synonym_options extends shortcut_options {
	readonly formatted_header_field_synonym? :string[],
}

interface synonym_headers {
	readonly headers :synonym_options
}

type field_synonym = Readonly<Partial<Record<automapper_scope, synonym_headers>>>

interface synonym extends Readonly<Record<string, field_synonym>> {
}

interface synonyms extends Readonly<Record<string, synonym>> {
}


// main structure
interface auto_mapper_definitions_interface {
	readonly table_synonyms :table_synonyms,
	readonly dont_match :dont_match,
	readonly shortcuts :shortcuts,
	readonly synonyms :synonyms,
}

type auto_mapper_definition_branches = Readonly<'table_synonyms' | 'dont_match' | 'shortcuts' | 'synonyms'>;