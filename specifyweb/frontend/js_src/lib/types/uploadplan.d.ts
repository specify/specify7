interface upload_plan_uploadTable_wbcols extends Record<string, string> {
}

interface upload_plan_uploadTable_static extends Record<string, string | boolean | number> {
}

type upload_plan_uploadTable_toOne = upload_plan_uploadable

interface upload_plan_uploadTable_toMany extends Omit<upload_plan_uploadTable_table, 'toMany'> {
}

type upload_plan_field_group_types = 'wbcols' | 'static' | 'toOne' | 'toMany'

type upload_plan_uploadTable_table_group<GROUP_NAME extends upload_plan_field_group_types> =
	GROUP_NAME extends 'wbcols' ? upload_plan_uploadTable_wbcols :
		GROUP_NAME extends 'static' ? upload_plan_uploadTable_static :
			GROUP_NAME extends 'toOne' ? upload_plan_uploadTable_toOne :
				upload_plan_uploadTable_toMany

interface upload_plan_uploadTable_table {
	wbcols :upload_plan_uploadTable_wbcols,
	static :upload_plan_uploadTable_static,
	toOne :upload_plan_uploadTable_toOne,
	toMany :upload_plan_uploadTable_toMany,
}

interface upload_plan_uploadTable extends Record<string, upload_plan_uploadTable_table> {
}

interface upload_plan_treeRecord {
	ranks :upload_plan_treeRecord_ranks,
}

interface upload_plan_treeRecord_ranks extends Record<string, string> {
}

type upload_plan_uploadable =
	{uploadTable :upload_plan_uploadTable_table} |
	{treeRecord :upload_plan_treeRecord}

interface upload_plan_structure {
	baseTableName :string,
	uploadable :upload_plan_uploadable
}