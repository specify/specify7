type automapper_scope = Readonly<'automapper' | 'suggestion'>;
type mapping_path = string[];
type list_of_headers = string[];
type mapping_type = 'existing_header' | 'new_column' | 'new_static_column';
type relationship_type = Readonly<'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'>;