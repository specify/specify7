type uploadResultsTableColumns = Readonly<Record<number, string>>;

interface uploadResultsTableRow {
	readonly record_id: number,
	readonly row_index: number,
	readonly columns: uploadResultsTableColumns
}

type uploadResultsTables = Readonly<Record<string, uploadResultsTableRow[]>>;

interface uploadResults {
	readonly tables: uploadResultsTables,
	readonly picklists: uploadedPicklistItems,
}

interface uploadedColumn {
	readonly column_index: number,
	readonly row_index?: number,
	readonly record_id?: number,
	readonly cell_value: string,
	span_size?: number,
}

interface uploadedRow {
	readonly record_id: number,
	readonly row_index: number,
	readonly columns: uploadedColumn[],
}

interface uploadedTreeRank {
	readonly parent_id: number,
	readonly rank_id: number,
	readonly node_name: string,
	readonly children: number[]
	readonly row_index: number,
	readonly columns: uploadedColumn[],
}

interface uploadedTreeRankProcessed extends Omit<uploadedTreeRank, 'children'> {
	readonly children: Readonly<Record<number, uploadedTreeRankProcessed>>
}

interface uploadedTreeRankSpacedOut extends Partial<Omit<uploadedTreeRank, 'children'>> {
	readonly children: Readonly<Record<number, uploadedTreeRankSpacedOut|undefined>>,
}


interface uploadedRowsTable {
	readonly table_label: string,
	readonly column_names: string[],
	readonly table_icon: string,
	readonly get_record_view_url: (row_id: number) => string,
	readonly rows: uploadedRow[],
	readonly rows_count?: number,
}

type uploadedRows = Readonly<Record<string, uploadedRowsTable>>

interface uploadedPicklistItem {
	readonly picklist_value: string,
	readonly row_index: number,
	readonly column_index: number,
}

type uploadedPicklistItems = Readonly<Record<string, uploadedPicklistItem[]>>;

interface WBUploadedViewConstructorProps {
	wb: specify_resource,
	hot: Handsontable,
	readonly uploadResults: uploadResults,
	openStatus: (state: string) => void,
	removeCallback: ()=>void,
}

interface WBUploadedViewBaseProps {
	uploadedRows: uploadedRows,
	uploadedPicklistItems: uploadedPicklistItems,
}

interface WBUploadedViewComponentProps extends Readonly<WBUploadedViewBaseProps> {
	readonly handleClose: () => void,
	readonly hot: Handsontable,
}

interface WBUploadedViewBackboneProps extends WBUploadedViewConstructorProps,
	WBUploadedViewBaseProps, ReactBackboneExtendBaseProps {
}

type UploadedRecordsTypes = 'table' | 'picklist'
type handleCellClicked = (row_index: number, column_index: number) => void;

interface UploadedRecordsBaseProps {
	readonly onToggleTableRecordsVisibility: (table_name: string) => void,
	readonly tableRecordsVisibilityState: recordsVisibilityState,
	readonly type: UploadedRecordsTypes,
	readonly onCreateRecordSet?: (table_name: string) => void,
	readonly onCreateDataSet?: (table_name: string) => void,
	readonly onCellClicked: handleCellClicked,
}

interface UploadedRecordsTableProps extends UploadedRecordsBaseProps {
	readonly uploadedRecords: uploadedRows,
	readonly onCreateRecordSet: (table_name: string) => void,
	readonly onCreateDataSet: (table_name: string) => void,
	readonly type: 'table',
}

interface UploadedRecordsPicklistProps extends UploadedRecordsBaseProps {
	readonly uploadedRecords: uploadedPicklistItems,
	readonly type: 'picklist',
}

type UploadedRecordsProps = UploadedRecordsTableProps | UploadedRecordsPicklistProps;


interface UploadedTableBaseProps {
	readonly uploadedTable: uploadedRowsTable | uploadedPicklistItems,
	readonly table_name: string,
	readonly tableIsCollapsed: boolean,
	readonly onCreateRecordSet?: () => void,
	readonly onCreateDataSet?: () => void,
	readonly onToggleTableRecordsVisibility: () => void,
	readonly type: UploadedRecordsTypes,
	readonly onCellClicked: handleCellClicked,
}

interface UploadedTableTableProps extends UploadedTableBaseProps {
	readonly uploadedTable: uploadedRowsTable,
	readonly onCreateRecordSet: () => void,
	readonly onCreateDataSet: () => void,
	readonly type: 'table',
}

interface UploadedTablePicklistProps extends UploadedTableBaseProps {
	readonly type: 'picklist',
	readonly uploadedTable: uploadedPicklistItems,
}

type UploadedTableProps = UploadedTableTableProps | UploadedTablePicklistProps

interface UploadedTableHeaderBaseProps {
	readonly table_icon?: string,
	readonly table_name?: string,
	readonly label: string,
	readonly rows_count: number,
	readonly tableIsCollapsed: boolean,
	readonly onCreateRecordSet?: () => void,
	readonly onCreateDataSet?: () => void,
	readonly onToggleTableRecordsVisibility: () => void,
	readonly type: UploadedRecordsTypes,
}

interface UploadedTableHeaderTableProps extends UploadedTableHeaderBaseProps {
	readonly table_icon: string,
	readonly table_name: string,
	readonly label: string,
	readonly rows_count: number,
	readonly tableIsCollapsed: boolean,
	readonly onCreateRecordSet: () => void,
	readonly onCreateDataSet: () => void,
	readonly onToggleTableRecordsVisibility: () => void,
	readonly type: UploadedRecordsTypes,
}

interface UploadedTableHeaderPicklistProps extends UploadedTableHeaderBaseProps {
	readonly label: string,
	readonly rows_count: number,
	readonly tableIsCollapsed: boolean,
	readonly onToggleTableRecordsVisibility: () => void,
	readonly type: UploadedRecordsTypes,
}

type UploadedTableHeaderProps = UploadedTableHeaderTableProps | UploadedTableHeaderPicklistProps;

interface UploadedTableRowsBaseProps {
	readonly rows: (uploadedRow | uploadedPicklistItem)[],
	readonly column_names?: string[],
	readonly get_record_view_url?: (row_id: number) => string,
	readonly type: UploadedRecordsTypes,
	readonly onCellClicked: handleCellClicked,
	readonly tableIsTree: boolean,
}

interface UploadedTableRowsTableProps extends UploadedTableRowsBaseProps {
	readonly rows: uploadedRow[],
	readonly column_names: string[],
	readonly get_record_view_url: (row_id: number) => string,
	readonly type: 'table',
}

interface UploadedTableRowsPicklistProps extends UploadedTableRowsBaseProps {
	readonly rows: uploadedPicklistItem[],
	readonly type: 'picklist',
}

type UploadedTableRowsProps = UploadedTableRowsTableProps | UploadedTableRowsPicklistProps;

interface UploadedTableRowsHeaderProps {
	readonly column_names: string[],
}

interface UploadedTableRowBaseProps {
	readonly onCellClicked: handleCellClicked,
	readonly rows: (uploadedRow | uploadedPicklistItem)[]
	readonly get_record_view_url?: (row_id: number) => string,
}

interface UploadedTableRowTableProps extends UploadedTableRowBaseProps {
	readonly rows: uploadedRow[]
	readonly get_record_view_url: (row_id: number) => string,
}

interface UploadedTableRowPicklistProps extends UploadedTableRowBaseProps {
	readonly rows: uploadedPicklistItem[]
}


type recordsVisibilityState = Readonly<Record<string, boolean>>;

interface WBUploadedState extends State<'WBUploadedState'> {
	readonly tableRecordsVisibilityState: recordsVisibilityState,
	readonly picklistRecordsVisibilityState: recordsVisibilityState,
	readonly props: WBUploadedViewComponentProps,
}

interface CreateRecordSetAction extends Action<'CreateRecordSetAction'> {
	readonly table_name: string,
}

interface CreateDataSetAction extends Action<'CreateDataSetAction'> {
	readonly table_name: string,
}

interface ToggleTableRecordsVisibilityAction extends Action<'ToggleTableRecordsVisibilityAction'> {
	readonly table_name: string,
}

interface CellClickedAction extends Action<'CellClickedAction'> {
	readonly row_index: number,
	readonly column_index: number,
}

type WBUploadedActions =
	CreateRecordSetAction
	| CreateDataSetAction
	| ToggleTableRecordsVisibilityAction
	| CellClickedAction;
