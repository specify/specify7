interface upload_plan_node extends WritableDictionary<string | boolean | upload_plan_node>{
}

interface upload_plan {
	baseTableName :string,
	uploadable? :upload_plan_node,
	treeRecord? :upload_plan_node
}

interface upload_plan_to_mappings_tree {
	base_table_name: string,
	mappings_tree: mappings_tree,
}

interface upload_plan_processing_functions {
	wbcols:([key,value]:[string,string])=>[key:string,value:object],
	static:([key,value]:[string,string])=>[key:string,value:object],
	toOne:([key,value]:[string,upload_plan])=>[key:string,value:object],
	toMany:([key,value]:[string,object])=>[key:string,value:object],
}