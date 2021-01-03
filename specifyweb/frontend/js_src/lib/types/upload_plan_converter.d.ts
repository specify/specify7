interface upload_plan_node extends Dictionary<string | boolean | upload_plan_node>{
}

interface upload_plan {
	baseTableName :string,
	uploadable? :upload_plan_node,
	treeRecord? :upload_plan_node
}