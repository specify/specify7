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
	column_index: number,
	cell_value: string,
}

interface uploadedRow {
	record_id: number,
	row_index: number,
	columns: uploadedColumn[],
}

interface uploadedRowsTable {
	table_label: string,
	column_names: string[],
	table_icon: string,
	get_record_view_url: (row_id: number) => string,
	rows: uploadedRow[],
}

type uploadedRows = Readonly<Record<string, uploadedRowsTable>>

interface uploadedPicklistItem {
	picklist_value: string,
	row_index: number,
	column_index: number,
}

type uploadedPicklistItems = Readonly<Record<string, uploadedPicklistItem[]>>;

interface WBUploadedViewConstructorProps {
	wb: specify_resource,
	hot: Handsontable,
	readonly uploadResults: uploadResults,
	openStatus: (state: string) => void,
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
	uploadResultsParsed: boolean,
}

type UploadedRecordsTypes = 'table'|'picklist'
type handleCellClicked = (row_index:number, column_index: number)=>void;

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
	readonly uploadedTable: uploadedRowsTable|uploadedPicklistItems,
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

type UploadedTableProps = UploadedTableTableProps|UploadedTablePicklistProps

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

type UploadedTableHeaderProps = UploadedTableHeaderTableProps|UploadedTableHeaderPicklistProps;

interface UploadedTableRowsBaseProps {
	readonly rows: (uploadedRow|uploadedPicklistItem)[],
	readonly column_names?: string[],
	readonly get_record_view_url?: (row_id: number) => string,
	readonly type: UploadedRecordsTypes,
	readonly onCellClicked: handleCellClicked,
}

interface UploadedTableRowsTableProps extends UploadedTableRowsBaseProps{
	readonly rows: uploadedRow[],
	readonly column_names: string[],
	readonly get_record_view_url: (row_id: number) => string,
	readonly type: 'table',
}

interface UploadedTableRowsPicklistProps extends UploadedTableRowsBaseProps{
	readonly rows: uploadedPicklistItem[],
	readonly type: 'picklist',
}

type UploadedTableRowsProps = UploadedTableRowsTableProps | UploadedTableRowsPicklistProps;

interface UploadedTableRowsHeaderProps {
	readonly column_names: string[],
}

interface UploadedTableRowBaseProps {
	readonly onCellClicked: handleCellClicked,
	readonly rows: (uploadedRow|uploadedPicklistItem)[]
	readonly get_record_view_url?: (row_id: number) => string,
}

interface UploadedTableRowTableProps extends UploadedTableRowBaseProps{
	readonly rows: uploadedRow[]
	readonly get_record_view_url: (row_id: number) => string,
}

interface UploadedTableRowPicklistProps extends UploadedTableRowBaseProps{
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
