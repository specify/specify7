/*
*
* Workbench Upload Results UI
*
* */

'use strict';

import Handsontable                                         from 'handsontable';
import '../../css/wbuploaded.css';
import React                                                from 'react';
import createBackboneView                                   from './reactbackboneextend';
import { ModalDialog }                                      from './modaldialog';
import { Action, generate_reducer, named_component, State } from '../statemanagement';
import fetch_data_model                                     from '../wbplanviewmodelfetcher';
import data_model_storage                                   from '../wbplanviewmodel';
import { Dataset }                                          from './wbplanview';
import {
	parseUploadResults, UploadedPicklistItem,
	UploadedPicklistItems,
	UploadedRow,
	UploadedRows, UploadedRowsTable,
	UploadResults,
}                                                           from '../wbuploadedparser';

interface WBUploadedViewConstructorProps {
	dataset: Dataset,
	hot: Handsontable,
	removeCallback: () => void,
	getHeaderNameFromHTML: (header_name:string) => string,
}

interface WBUploadedViewDataParseProps {
	readonly handleClose: () => void,
	readonly hot: Handsontable,
	readonly dataset: Dataset,
	readonly getHeaderNameFromHTML: (header_name:string)=>string,
}

interface WBUploadedViewComponentProps {
	readonly handleClose: () => void,
	readonly uploadedRows: UploadedRows,
	readonly uploadedPicklistItems: UploadedPicklistItems,
	readonly hot: Handsontable,
}

type UploadedRecordsTypes = 'table' | 'picklist'
type HandleCellClicked = (row_index: number, column_index: number) => void;

interface UploadedTableRowBaseProps {
	readonly onCellClicked: HandleCellClicked,
	readonly get_record_view_url?: (row_id: number) => string,
}

type RecordsVisibilityState = Readonly<Record<string, boolean>>;

interface WBUploadedState extends State<'WBUploadedState'> {
	readonly tableRecordsVisibilityState: RecordsVisibilityState,
	readonly picklistRecordsVisibilityState: RecordsVisibilityState,
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


let ranks: Record<string, string[]>;
const fetch_data_model_promise: Promise<void> = fetch_data_model();

const UploadedTableRowsHeaderProps = named_component(({
	column_names,
}: {
	readonly column_names: string[],
}) => <thead>
<tr>
	{
		column_names.map(column_name =>
			<th key={column_name}>{column_name}</th>,
		)
	}
</tr>
</thead>, 'UploadedTableRowsHeaderProps');


const CellLink = named_component(({
		get_record_view_url,
		record_id,
		children,
	}: {
		get_record_view_url: (record_id: number) => string,
		record_id?: number,
		children: JSX.Element | React.ReactText
	}) => typeof record_id === 'undefined' ?
	<>{children}</> :
	<a target="_blank" href={get_record_view_url(record_id)}>
		{children}
	</a>, 'CellLink',
);

const UploadedTableRow = named_component(({
	rows,
	onCellClicked: handleCellClicked,
	get_record_view_url,
}: UploadedTableRowBaseProps & {
	readonly rows: UploadedRow[]
	readonly get_record_view_url: (row_id: number) => string,
}) =>
	<tbody>
	{rows.map(({record_id, row_index, columns}, index) =>
		<tr key={index}>
			{
				record_id >= 0 &&
				<td key='view_record'>
					<a target="_blank" href={get_record_view_url(record_id)}>
						{record_id}
					</a>
				</td>
			}
			{columns.map(({
					column_index,
					cell_value,
					row_index: cell_row_index,
					record_id,
					span_size,
					matched,
				}, index) =>
					<td
						key={index}
						className={`wb-upload-results-cell ${matched ? 'wb-upload-results-cell-matched' : ''}`}
						rowSpan={span_size}
						onClick={() => handleCellClicked(
							row_index < 0 ?
								cell_row_index ?? -1 :
								row_index,
							column_index,
						)}
						title={`${['Uploaded', 'Matched'][matched ? 1 : 0]} record`}
					>
						<CellLink get_record_view_url={get_record_view_url} record_id={record_id}>
							{
								typeof cell_value === 'undefined' ?
									'Uploaded' :
									cell_value
							}
						</CellLink>
					</td>,
			)}
		</tr>,
	)}
	</tbody>, 'UploadedTableRow');

const UploadedPicklistRow = named_component(({
	rows,
	onCellClicked: handleCellClicked,
}: UploadedTableRowBaseProps & {
	readonly rows: UploadedPicklistItem[]
}) =>
	<tbody>
	{rows.map(({row_index, column_index, picklist_value: value}, index) =>
		<tr key={index}>
			<td className="wb-upload-results-cell"
				onClick={() => handleCellClicked(row_index, column_index)}>{value}</td>
		</tr>,
	)}
	</tbody>, 'UploadedPicklistRow');

const UploadedTableRows = named_component(({
	type,
	rows,
	column_names,
	get_record_view_url,
	onCellClicked: handleCellClicked,
	tableIsTree,
}: {
	readonly rows: (UploadedRow | UploadedPicklistItem)[],
	readonly column_names?: string[],
	readonly get_record_view_url?: (row_id: number) => string,
	readonly type: UploadedRecordsTypes,
	readonly onCellClicked: HandleCellClicked,
	readonly tableIsTree: boolean,
} & ({
	readonly rows: UploadedRow[],
	readonly column_names: string[],
	readonly get_record_view_url: (row_id: number) => string,
	readonly type: 'table',
} | {
	readonly rows: UploadedPicklistItem[],
	readonly type: 'picklist',
})) => <div className="wb-upload-results-rows-container">
	<table className={`wb-upload-results-rows ${tableIsTree ? 'wb-upload-results-rows-tree' : ''}`}>
		<UploadedTableRowsHeaderProps
			column_names={
				type === 'table' && column_names ?
					[
						...(
							rows.length !== 0 &&
							'record_id' in rows[0] &&
							rows[0].record_id >= 0 ?
								['View Record'] :
								[]
						),
						...column_names,
					] :
					['Picklist value']
			}
		/>
		{
			type === 'table' && get_record_view_url ?
				<UploadedTableRow
					//@ts-ignore
					rows={rows}
					onCellClicked={handleCellClicked}
					get_record_view_url={get_record_view_url}
				/> :
				<UploadedPicklistRow
					//@ts-ignore
					rows={rows}
					onCellClicked={handleCellClicked}
				/>
		}
	</table>
</div>, 'UploadedTableRows');

const UploadedTableHeader = named_component(({
	table_icon,
	table_name,
	label,
	rows_count,
	tableIsCollapsed,
	onCreateRecordSet: handleCreateRecordSet,
	onCreateDataSet: handleCreateDataSet,
	onToggleTableRecordsVisibility: handleToggleTableRecordsVisibility,
}: {
	readonly table_icon?: string,
	readonly table_name?: string,
	readonly label: string,
	readonly rows_count: number,
	readonly tableIsCollapsed: boolean,
	readonly onCreateRecordSet?: () => void,
	readonly onCreateDataSet?: () => void,
	readonly onToggleTableRecordsVisibility: () => void,
	readonly type: UploadedRecordsTypes,
} & ({
	readonly table_icon: string,
	readonly table_name: string,
	readonly label: string,
	readonly rows_count: number,
	readonly tableIsCollapsed: boolean,
	readonly onCreateRecordSet: () => void,
	readonly onCreateDataSet: () => void,
	readonly onToggleTableRecordsVisibility: () => void,
	readonly type: UploadedRecordsTypes,
} | {
	readonly label: string,
	readonly rows_count: number,
	readonly tableIsCollapsed: boolean,
	readonly onToggleTableRecordsVisibility: () => void,
	readonly type: UploadedRecordsTypes,
})) =>
	<div className="wb-upload-results-header" onClick={(event) => {
		if ((
			event.target as HTMLElement
		).tagName === 'BUTTON')
			return;
		handleToggleTableRecordsVisibility();
	}}>
		<div className="wb-upload-results-table-name">
			{
				tableIsCollapsed ?
					'\u25B2' :
					'\u25BC'
			}
			<img className="wb-upload-results-table-icon" src={table_icon} alt={table_name} />
			<div className="wb-upload-results-table-label">{label}</div>
			<div className="wb-upload-results-table-rows-count">- {rows_count}</div>
		</div>
		<div className="wb-upload-results-controls">
			{
				/* TODO: enable these buttons */
				rows_count === -1 &&
				<>
					<button onClick={handleCreateRecordSet}>Record Set</button>
					<button onClick={handleCreateDataSet}>Data Set</button>
				</>
			}
		</div>
	</div>, 'UploadedTable');

const UploadedTable = named_component(({
	uploadedTable,
	type,
	table_name,
	tableIsCollapsed,
	onCreateRecordSet: handleCreateRecordSet,
	onCreateDataSet: handleCreateDataSet,
	onToggleTableRecordsVisibility: handleToggleTableRecordsVisibility,
	onCellClicked: handleCellClicked,
}: {
	readonly table_name: string,
	readonly tableIsCollapsed: boolean,
	readonly onToggleTableRecordsVisibility: () => void,
	readonly onCellClicked: HandleCellClicked,
	readonly onCreateRecordSet?: () => void,
	readonly onCreateDataSet?: () => void,
} & ({
	readonly uploadedTable: UploadedRowsTable,
	readonly onCreateRecordSet: () => void,
	readonly onCreateDataSet: () => void,
	readonly type: 'table',
} | {
	readonly type: 'picklist',
	readonly uploadedTable: UploadedPicklistItems,
})) => <div className='wb-upload-results-table'>
	{/*@ts-ignore*/}
	<UploadedTableHeader
		type={type}
		table_name={table_name}
		tableIsCollapsed={tableIsCollapsed}
		onCreateRecordSet={handleCreateRecordSet}
		onCreateDataSet={handleCreateDataSet}
		onToggleTableRecordsVisibility={handleToggleTableRecordsVisibility}
		{...(
			type === 'table' ?
				{
					table_icon: uploadedTable.table_icon,
					label: uploadedTable.table_label,
					rows_count: uploadedTable.rows_count || uploadedTable.rows.length,
				} :
				{
					label: table_name,
					rows_count: Object.keys(uploadedTable).length,
				}
		)}
	/>
	{
		tableIsCollapsed ?
			undefined :
			//@ts-ignore
			<UploadedTableRows
				type={type}
				onCellClicked={handleCellClicked}
				tableIsTree={typeof uploadedTable.rows_count !== 'undefined'}
				{...(
					type === 'table' ?
						{
							rows: uploadedTable.rows,
							column_names: uploadedTable.column_names,
							get_record_view_url: uploadedTable.get_record_view_url,
						} :
						{
							rows: uploadedTable,
						}
				)}
			/>
	}
</div>, 'UploadedTable');

const UploadedRecords = named_component(({
	uploadedRecords,
	tableRecordsVisibilityState,
	type,
	onCreateRecordSet: handleCreateRecordSet,
	onCreateDataSet: handleCreateDataSet,
	onToggleTableRecordsVisibility: handleToggleTableRecordsVisibility,
	onCellClicked: handleCellClicked,
}: {
	readonly onToggleTableRecordsVisibility: (table_name: string) => void,
	readonly tableRecordsVisibilityState: RecordsVisibilityState,
	readonly onCellClicked: HandleCellClicked,
	readonly onCreateRecordSet?: (table_name: string) => void,
	readonly onCreateDataSet?: (table_name: string) => void,
} & ({
	readonly uploadedRecords: UploadedRows,
	readonly onCreateRecordSet: (table_name: string) => void,
	readonly onCreateDataSet: (table_name: string) => void,
	readonly type: 'table',
} | {
	readonly uploadedRecords: UploadedPicklistItems,
	readonly type: 'picklist',
})) => <>{
	Object.entries(uploadedRecords).map(([table_name, table_data]) =>
		//@ts-ignore
		<UploadedTable
			uploadedTable={table_data}
			table_name={table_name}
			key={table_name}
			type={type}
			tableIsCollapsed={tableRecordsVisibilityState[table_name]}
			onCreateRecordSet={handleCreateRecordSet && handleCreateRecordSet.bind(null, table_name)}
			onCreateDataSet={handleCreateDataSet && handleCreateDataSet.bind(null, table_name)}
			onToggleTableRecordsVisibility={handleToggleTableRecordsVisibility.bind(null, table_name)}
			onCellClicked={handleCellClicked}
		/>,
	)
}</>, 'UploadedRecords');

const reducer = generate_reducer<WBUploadedState, WBUploadedActions>({

	'CreateRecordSetAction': (state) => {
		alert('TEST: Create record set');
		return state;
	},
	'CreateDataSetAction': (state) => {
		alert('TEST: Create data set');
		return state;
	},
	'ToggleTableRecordsVisibilityAction': (state, action) => (
		{
			...state,
			tableRecordsVisibilityState: Object.fromEntries(
				Object.entries(state.tableRecordsVisibilityState).map(([table_name, is_collapsed]) => [
					table_name,
					is_collapsed !== (
						table_name === action.table_name
					),
				]),
			),
		}
	),
	'CellClickedAction': (state, {row_index, column_index}) => {
		if (
			row_index >= 0 &&
			column_index >= 0
		)
			state.props.hot.selectCell(row_index, column_index);
		return state;
	},

});

const generate_initial_visibility_state = <T, >(source_dictionary: Record<string, T>) =>
	Object.fromEntries(Object.keys(source_dictionary).map(key_name => [
		key_name,
		true,
	]));

const getInitialWBUploadedViewState = (props: WBUploadedViewComponentProps): WBUploadedState => (
	{
		type: 'WBUploadedState',
		tableRecordsVisibilityState: generate_initial_visibility_state(props.uploadedRows),
		picklistRecordsVisibilityState: generate_initial_visibility_state(props.uploadedPicklistItems),
		props,
	}
);

function WBUploadedView(props: WBUploadedViewComponentProps) {

	const [state, dispatch] = React.useReducer(
		reducer,
		props,
		getInitialWBUploadedViewState,
	);

	return <ModalDialog
		onCloseCallback={props.handleClose}
		properties={{
			title: 'View Upload Results',
			width: 600,
			modal: false,
		}}
	>
		<div className="wb-upload-results">
			<>
				{
					Object.keys(props.uploadedRows).length === 0 &&
					Object.keys(props.uploadedPicklistItems).length === 0 &&
					'No records were uploaded / all records were matched to database records'
				}
			</>
			<UploadedRecords
				type='table'
				uploadedRecords={props.uploadedRows}
				tableRecordsVisibilityState={state.tableRecordsVisibilityState}
				onCreateRecordSet={(table_name: string) => dispatch({type: 'CreateRecordSetAction', table_name})}
				onCreateDataSet={(table_name: string) => dispatch({type: 'CreateDataSetAction', table_name})}
				onCellClicked={(row_index: number, column_index: number) =>
					dispatch({type: 'CellClickedAction', row_index, column_index})
				}
				onToggleTableRecordsVisibility={(table_name: string) =>
					dispatch({type: 'ToggleTableRecordsVisibilityAction', table_name})
				}
			/>
			<UploadedRecords
				type='picklist'
				uploadedRecords={props.uploadedPicklistItems}
				tableRecordsVisibilityState={state.picklistRecordsVisibilityState}
				onCellClicked={(row_index: number, column_index: number) =>
					dispatch({type: 'CellClickedAction', row_index, column_index})
				}
				onToggleTableRecordsVisibility={(table_name: string) =>
					dispatch({type: 'ToggleTableRecordsVisibilityAction', table_name})
				}
			/>
		</div>
	</ModalDialog>;
}

function WBUploadedViewDataParser(props: WBUploadedViewDataParseProps) {

	const [treeRanks, setTreeRanks] = React.useState<Record<string, string[]> | undefined>(ranks);
	const [uploadedRows, setUploadedRows] = React.useState<UploadedRows | undefined>(undefined);
	const [uploadedPicklistItems, setUploadedPicklistItems] = React.useState<UploadedPicklistItems | undefined>(undefined);
	const [uploadResults, setUploadResults] = React.useState<UploadResults | undefined>(undefined);

	React.useEffect(() =>  // fetch upload results
			void (
				fetch(`/api/workbench/upload_results/${props.dataset.id}/`).then(response =>
					response.json() as Promise<UploadResults>,
				).then(setUploadResults)
			),
		[],
	);

	React.useEffect(() =>  // fetch tree ranks
			void (
				fetch_data_model_promise.then(() =>
					setTreeRanks(
						Object.fromEntries(
							Object.entries(data_model_storage.ranks).map(([table_name, table_ranks]) =>
								[table_name, [data_model_storage.root_ranks[table_name], ...Object.keys(table_ranks)]],
							),
						),
					),
				).catch(() => {
					throw new Error('Failure fetching tree ranks');
				})
			),
		[]
	);

	React.useEffect(() => { // parse uploaded data
		if (typeof uploadResults === 'undefined' || typeof treeRanks === 'undefined')
			return;

		const [uploadedRows, uploadedPicklistItems] = parseUploadResults(
			uploadResults,
			props.hot,
			treeRanks,
			props.dataset.uploadplan,
			props.getHeaderNameFromHTML
		);

		setUploadedRows(uploadedRows);
		setUploadedPicklistItems(uploadedPicklistItems);

	}, [treeRanks, uploadResults]);

	return (
		typeof uploadedRows !== 'undefined' &&
		typeof uploadedPicklistItems !== 'undefined'
	) ?
		<WBUploadedView
			handleClose={props.handleClose}
			uploadedRows={uploadedRows}
			uploadedPicklistItems={uploadedPicklistItems}
			hot={props.hot}
		/> :
		null;

}

export default createBackboneView<WBUploadedViewConstructorProps,
	WBUploadedViewConstructorProps,
	WBUploadedViewDataParseProps>({
	module_name: 'WBUploadedView',
	class_name: 'wb-uploaded',
	initialize(self, {
		dataset,
		hot,
		removeCallback,
		getHeaderNameFromHTML
	}) {
		self.dataset = dataset;
		self.hot = hot;
		self.removeCallback = removeCallback;
		self.getHeaderNameFromHTML = getHeaderNameFromHTML;
	},
	remove: (self) =>
		self.removeCallback(),
	Component: WBUploadedViewDataParser,
	get_component_props: (self) => (
		{
			handleClose: self.remove.bind(self),
			hot: self.hot,
			dataset: self.dataset,
			getHeaderNameFromHTML: self.getHeaderNameFromHTML,
		}
	),
});
