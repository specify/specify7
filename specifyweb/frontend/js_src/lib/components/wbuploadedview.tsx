/*
*
* Workbench Upload Results UI
*
* */

'use strict';

import '../../css/wbuploaded.css';
import React                                 from 'react';
//@ts-ignore
import Handsontable                          from 'handsontable';
import icons                                 from '../icons';
import createBackboneView                    from './reactbackboneextend';
import { ModalDialog }                       from './modaldialog';
import { generate_reducer, named_component } from './statemanagement';

const UploadedTableRowsHeaderProps = named_component(({
	column_names,
}: UploadedTableRowsHeaderProps) => <thead>
<tr>
	{
		column_names.map(column_name =>
			<th key={column_name}>{column_name}</th>,
		)
	}
</tr>
</thead>, 'UploadedTableRowsHeaderProps');


const UploadedTableRow = named_component(({
	rows,
	onCellClicked: handleCellClicked,
	get_record_view_url,
}: UploadedTableRowTableProps) =>
	<tbody>
	{rows.map(({record_id, row_index, columns}, index) =>
		<tr key={index}>
			<td>
				{/* eslint-disable-next-line react/jsx-no-target-blank */}
				<a target="_blank" href={get_record_view_url(record_id)}>
					{record_id}
				</a>
			</td>
			{columns.map(({column_index, cell_value}) =>
				<td
					key={column_index}
					className="wb-upload-results-cell"
					onClick={()=>handleCellClicked(row_index,column_index)}
				>
					{cell_value}
				</td>,
			)}
		</tr>,
	)}
	</tbody>, 'UploadedTableRow');

const UploadedPicklistRow = named_component(({
	rows,
	onCellClicked: handleCellClicked,
}: UploadedTableRowPicklistProps) =>
	<tbody>
	{rows.map(({row_index, column_index, picklist_value:value}, index) =>
		<tr key={index}>
			<td className="wb-upload-results-cell" onClick={()=>handleCellClicked(row_index,column_index)}>{value}</td>
		</tr>,
	)}
	</tbody>, 'UploadedPicklistRow');

const UploadedTableRows = named_component(({
	type,
	rows,
	column_names,
	get_record_view_url,
	onCellClicked: handleCellClicked,
}: UploadedTableRowsProps) => <div className="wb-upload-results-rows-container">
	<table className="wb-upload-results-rows">
		<UploadedTableRowsHeaderProps
			column_names={
				type === 'table' && column_names ?
					['View Record', ...column_names] :
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
	onCreateRecordSet: handleCreateRecordSet,
	onCreateDataSet: handleCreateDataSet,
	onToggleTableRecordsVisibility: handleToggleTableRecordsVisibility,
}: UploadedTableHeaderProps) =>
	<div className="wb-upload-results-header" onClick={(event) => {
		if ((
			event.target as HTMLElement
		).tagName === 'BUTTON')
			return;
		handleToggleTableRecordsVisibility();
	}}>
		<div className="wb-upload-results-table-name">
			<img className="wb-upload-results-table-icon" src={table_icon} alt={table_name} />
			<div className="wb-upload-results-table-label">{label}</div>
			<div className="wb-upload-results-table-rows-count">{rows_count}</div>
		</div>
		<div className="wb-upload-results-controls">
			<button onClick={handleCreateRecordSet}>Record Set</button>
			<button onClick={handleCreateDataSet}>Data Set</button>
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
}: UploadedTableProps) => <div className='wb-upload-results-table'>
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
					rows_count: uploadedTable.rows.length,
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
					{...(
						type === 'table' ?
							{
								rows: uploadedTable.rows,
								column_names: uploadedTable.column_names,
								get_record_view_url: uploadedTable.get_record_view_url
							} :
							{
								rows: uploadedTable
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
}: UploadedRecordsProps) => <>{
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
	'CellClickedAction': (state, {row_index, column_index})=>{
		state.props.hot.selectCell(row_index, column_index);
		return state;
	}

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
	</ModalDialog>;
}

let column_indexes: number[];
const parseUploadResults = ({tables}: uploadResults, headers: string[]) =>
	Object.fromEntries(
		Object.entries(tables).map(([table_name, table_records]) =>
			[
				table_name,
				{
					table_label: table_name,
					column_names: (
						column_indexes = [ // save list of column indexes to `column_indexes`
							...new Set(  // make the list unique
								table_records.map(({columns}) =>
									Object.keys(columns).map(column_index =>
										parseInt(column_index),
									),  // get column indexes
								).flat(),
							),
						]
					).map(column_index =>  // map column indexes to column headers
						headers[column_index],
					),
					table_icon: icons.getIcon(table_name),
					get_record_view_url: (row_id: number) => `/specify/view/${table_name}/${row_id}/`,
					rows: table_records.map(({record_id, row_index, columns}) => (
						{
							record_id: record_id,
							row_index: row_index,
							columns: column_indexes.map(column_index =>
								(
									{
										column_index: column_index,
										cell_value: typeof columns[column_index] === 'undefined' ?
											'' :
											columns[column_index],
									}
								),
							),
						}
					)),
				},
			],
		),
	);

export default createBackboneView<WBUploadedViewConstructorProps,
	WBUploadedViewBackboneProps,
	WBUploadedViewComponentProps>({
	module_name: 'WBUploadedView',
	class_name: 'wb-uploaded',
	initialize(self, props) {
		self.wb = props.wb;
		self.hot = props.hot;
		self.uploadResultsParsed = false;
		self.uploadedRows = parseUploadResults(props.uploadResults, props.hot.getColHeader() as string[]);
		self.uploadedPicklistItems = props.uploadResults.picklists;
		self.openStatus = props.openStatus;
	},
	Component: WBUploadedView,
	get_component_props: (self) => (
		{
			uploadedRows: self.uploadedRows,
			uploadedPicklistItems: self.uploadedPicklistItems,
			handleClose: self.remove.bind(self),
			hot: self.hot
		}
	),
});
