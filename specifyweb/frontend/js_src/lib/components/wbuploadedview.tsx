/*
*
* Workbench Upload Results UI
*
* */

'use strict';

//@ts-ignore
import Handsontable                                                                from 'handsontable';
import '../../css/wbuploaded.css';
import React                                                                       from 'react';
import icons                                                                       from '../icons';
import createBackboneView, { ReactBackboneExtendBaseProps }                        from './reactbackboneextend';
import { ModalDialog }                                                             from './modaldialog';
import { Action, generate_reducer, named_component, State }                        from './statemanagement';
import fetch_data_model, { DataModelFetcherReturn }                                from './wbplanviewmodelfetcher';
import schema                                                                      from '../schema';
import domain                                                                      from '../domain';
import { specify_resource }                                                        from './wbplanview';
import { DomainTreeDefinitionItems, Domain as domain_type, Schema as schema_type } from './legacy_types';


interface UploadResults {
	readonly tables: Readonly<Record<string, {
		readonly record_id: number,
		readonly row_index: number,
		readonly columns: Readonly<Record<number, string>>
	}[]>>,
	readonly picklists: UploadedPicklistItems,
}

interface UploadedColumn {
	readonly column_index: number,
	readonly row_index?: number,
	readonly record_id?: number,
	readonly cell_value: string,
	span_size?: number,
}

interface UploadedRow {
	readonly record_id: number,
	readonly row_index: number,
	readonly columns: UploadedColumn[],
}

interface UploadedTreeRank {
	readonly parent_id: number,
	readonly rank_id: number,
	readonly node_name: string,
	readonly children: number[]
	readonly row_index: number,
	readonly columns: UploadedColumn[],
}

interface UploadedTreeRankProcessed extends Omit<UploadedTreeRank, 'children'> {
	readonly children: Readonly<Record<number, UploadedTreeRankProcessed>>
}

interface UploadedTreeRankSpacedOut extends Partial<Omit<UploadedTreeRank, 'children'>> {
	readonly children: Readonly<Record<number, UploadedTreeRankSpacedOut | undefined>>,
}


interface UploadedRowsTable {
	readonly table_label: string,
	readonly column_names: string[],
	readonly table_icon: string,
	readonly get_record_view_url: (row_id: number) => string,
	readonly rows: UploadedRow[],
	readonly rows_count?: number,
}

type UploadedRows = Readonly<Record<string, UploadedRowsTable>>

interface UploadedPicklistItem {
	readonly picklist_value: string,
	readonly row_index: number,
	readonly column_index: number,
}

type UploadedPicklistItems = Readonly<Record<string, UploadedPicklistItem[]>>;

interface WBUploadedViewConstructorProps {
	wb: specify_resource,
	hot: Handsontable,
	readonly uploadResults: UploadResults,
	openStatus: (state: string) => void,
	removeCallback: () => void,
}

interface WBUploadedViewBaseProps {
	uploadedRows: UploadedRows,
	uploadedPicklistItems: UploadedPicklistItems,
}

interface WBUploadedViewComponentProps extends Readonly<WBUploadedViewBaseProps> {
	readonly handleClose: () => void,
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


type DataModelRank = Readonly<Record<string, number>>;
type DataModelRanks = Readonly<Record<string, DataModelRank>>;

let ranks: DataModelRanks;
const fetch_data_model_promise: Promise<DataModelFetcherReturn> | undefined = fetch_data_model();

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
			{columns.map(({column_index, cell_value, row_index: cell_row_index, record_id, span_size}, index) =>
				<td
					key={index}
					className="wb-upload-results-cell"
					rowSpan={span_size}
					onClick={() => handleCellClicked(
						row_index < 0 ?
							cell_row_index ?? -1 :
							row_index,
						column_index,
					)}
				>
					{
						typeof record_id === 'undefined' ?
							cell_value :
							<a target="_blank" href={get_record_view_url(record_id)}>
								{cell_value}
							</a>
					}
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
					'\u25BC' :
					'\u25B2'
			}
			<img className="wb-upload-results-table-icon" src={table_icon} alt={table_name} />
			<div className="wb-upload-results-table-label">{label}</div>
			<div className="wb-upload-results-table-rows-count">- {rows_count}</div>
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

const parseUploadedRanks = (uploadedRows: UploadedRows, ranks: DataModelRanks) =>
	new Promise<UploadedRows>(resolve =>

		Promise.all(
			Object.entries(uploadedRows).map(([table_name, table_data]) =>
				new Promise<[string, UploadedRowsTable]>(resolve => {

						const rank_ids: number[] = [];

						typeof ranks[table_name.toLowerCase()] === 'undefined' ?

							resolve([table_name, table_data]) :

							Promise.all(
								table_data.rows.map(({record_id, ...row}) =>
									new Promise<[number, UploadedTreeRank]>(resolve => {

										let fetch_object: DomainTreeDefinitionItems;

										(
											fetch_object = new (
												schema as any
											).models[table_name].LazyCollection(
												{filters: {id: record_id}},
											)
										).fetch({limit: 1}).done(() =>
											resolve(
												[
													record_id,
													{
														...row,
														rank_id:
															rank_ids.push(fetch_object.models[0].attributes.rankid) &&
															fetch_object.models[0].attributes.rankid,
														parent_id: parseInt((
															/\d+/.exec(fetch_object.models[0].attributes.parent) || []
														)[0]),
														node_name: fetch_object.models[0].attributes.name,
														children: [],
													},
												],
											),
										);
									}),
								),
							).then(rows => {

								const unique_rank_ids = [...new Set(rank_ids)].sort();
								const filtered_ranks = Object.fromEntries(
									Object.entries(ranks[table_name.toLowerCase()]).filter(([, rank_id]) =>
										unique_rank_ids.indexOf(rank_id) !== -1,
									),
								);
								const column_names = unique_rank_ids.map(rank_id =>
									Object.keys(ranks[table_name.toLowerCase()])[Object.values(ranks[table_name.toLowerCase()]).indexOf(rank_id)],
								);

								const rows_object: Record<number, UploadedTreeRank | undefined> = Object.fromEntries(rows);

								// find children for each rank
								rows.forEach(([node_id, rank_data]) =>
									!isNaN(rank_data.parent_id) &&
									rows_object[rank_data.parent_id]?.children.push(node_id),
								);

								const tree: Record<number, UploadedTreeRankProcessed | undefined> = {};

								const get_min_node = () =>
									rows.reduce((
										[min_rank, min_node_id],
										[node_id, rank_data],
										) =>
											(
												typeof rows_object[node_id] !== 'undefined' &&
												(
													min_rank === -1 ||
													rank_data.rank_id < min_rank
												)
											) ?
												[rank_data.rank_id, node_id] :
												[min_rank, min_node_id],
										[-1, -1],
									)[1];
								let min_node_id: number;

								function join_children(node_id: number): UploadedTreeRankProcessed | undefined {

									if (typeof rows_object[node_id] === 'undefined')
										return undefined;

									const result = {
										...rows_object[node_id],
										children: Object.fromEntries(
											(
												rows_object[node_id]?.children || []
											).map(child_id => [
												child_id,
												join_children(child_id),
											]),
										),
									};

									rows_object[node_id] = undefined;

									//@ts-ignore
									return result;
								}

								while ((
									min_node_id = get_min_node()
								) !== -1)
									tree[min_node_id] = join_children(min_node_id);


								type spaced_out_tree = Record<number, UploadedTreeRankSpacedOut | undefined>;
								const space_out_node = (
									uploadedTreeRank: UploadedTreeRankSpacedOut, levels: number,
								): UploadedTreeRankSpacedOut =>
									levels <= 1 ?
										uploadedTreeRank :
										{
											children: {
												0: space_out_node(uploadedTreeRank, levels - 1),
											},
										};

								const space_out_tree = (tree: spaced_out_tree, parent_rank_id = NaN): spaced_out_tree =>
									Object.fromEntries(
										Object.entries(tree).filter(([, node_data]) =>
											typeof node_data !== 'undefined',
										).map(([node_id, node_data]) => [
											parseInt(node_id),
											{
												...node_data,
												...space_out_node(
													{
														children: space_out_tree(node_data!.children, node_data!.rank_id),
													},
													Object.values(filtered_ranks).indexOf(node_data!.rank_id || 0) -
													Object.values(filtered_ranks).indexOf(parent_rank_id || 0),
												),
											},
										]),
									);

								const spaced_out_tree: spaced_out_tree = space_out_tree(tree);


								const find_cell_index = (name: string, columns: UploadedColumn[]): number =>
									columns.find(({cell_value}: UploadedColumn) => cell_value === name)?.column_index || -1;

								const empty_cell = (column_index: number): UploadedColumn => (
									{
										column_index: column_index,
										cell_value: '',
									}
								);

								const compile_rows = (spaced_out_tree: spaced_out_tree, parent_columns: UploadedColumn[] = []): UploadedRow[] =>
									Object.entries(spaced_out_tree).flatMap((
										[node_id, node_data],
										index,
									) => {

										if (typeof node_data === 'undefined')
											return [];

										const columns: UploadedColumn[] = [
											...(
												index === 0 ?
													parent_columns :
													Array<UploadedColumn>(parent_columns.length).fill(empty_cell(-1))
											),
											{
												column_index: find_cell_index(
													node_data.node_name || '',
													node_data.columns || [],
												),
												row_index: node_data.row_index,
												record_id: parseInt(node_id),
												cell_value: node_data.node_name || '',
											},
										];

										if (Object.keys(node_data.children).length === 0)
											return [
												{
													row_index: -1,
													record_id: -1,
													columns: [
														...columns,
														...Array<UploadedColumn>(column_names.length - columns.length).fill(empty_cell(-2)),
													],
												},
											];
										else
											return compile_rows(node_data.children, columns);

									});

								const final_rows: UploadedRow[] = compile_rows(spaced_out_tree);

								function join_rows(final_rows: UploadedRow[]) {
									if (final_rows.length === 0)
										return [];
									const span_size: number[] = Array<number>(final_rows[0].columns.length).fill(0);
									return final_rows.reverse().map(row => (
										{
											...row,
											columns: row.columns.reduce<UploadedColumn[]>((new_columns, column, index) => {
												if (column.column_index === -1)
													span_size[index]++;
												else {
													if (span_size[index] !== 0) {
														column.span_size = span_size[index];
														span_size[index] = 0;
													}
													new_columns.push(column);
												}
												return new_columns;
											}, []),
										}
									)).reverse();
								}

								const joined_rows: UploadedRow[] = join_rows(final_rows);

								resolve([
									table_name,
									{
										...table_data,
										rows: joined_rows,
										column_names,
										rows_count: Object.keys(table_data.rows).length,
									},
								]);
							});
					},
				),
			),
		).then(parsed_ranks =>
			resolve(
				Object.fromEntries(parsed_ranks),
			),
		),
	);

function WBUploadedViewDataParser(props: WBUploadedViewComponentProps) {

	const [tree_ranks, setTreeRanks] = React.useState<DataModelRanks | undefined>(ranks);
	const [uploadedRows, setUploadedRows] = React.useState<UploadedRows>(props.uploadedRows);

	React.useEffect(() => { // parse upload structure for tree ranks
		if (typeof tree_ranks === 'undefined')
			return;

		parseUploadedRanks(uploadedRows, tree_ranks).then(setUploadedRows);

	}, [tree_ranks]);

	React.useEffect(() => {  // fetch tree ranks if not fetched yet
		if (typeof tree_ranks !== 'undefined' || typeof fetch_data_model_promise === 'undefined')
			return;

		fetch_data_model_promise.then(({ranks: fetched_ranks}) =>
			Promise.all<[string, DataModelRank]>(
				Object.keys(fetched_ranks).map(table_name =>
					new Promise(resolve =>
						(
							domain as domain_type
						).getTreeDef(table_name).done(tree_definition =>
							tree_definition.rget('treedefitems').done(treeDefItems =>
								treeDefItems.fetch({limit: 0}).done(() =>
									resolve(
										[
											table_name,
											Object.fromEntries(
												Object.values(treeDefItems.models).map(
													(
														{
															attributes: {
																name: rank_name,
																rankid: rank_id,
															},
														},
													) =>
														[rank_name, rank_id],
												),
											),
										],
									),
								),
							),
						),
					),
				),
			).then(fetched_ranks =>
				setTreeRanks((
					ranks = Object.fromEntries(fetched_ranks)
				)),
			),
		).catch(() => {
			throw new Error('Error occurred while fetching tree ranks');
		});

	}, [fetch_data_model_promise]);

	return <WBUploadedView
		{...props}
		uploadedRows={uploadedRows}
	/>;

}

let column_indexes: number[];
const parseUploadResults = ({tables}: UploadResults, headers: string[]) =>
	Object.fromEntries(
		Object.entries(tables).map(([table_name, table_records]) =>
			[
				table_name,
				{
					table_label: (
						schema as unknown as schema_type
					).models[table_name].getLocalizedName(),
					column_names: (
						column_indexes = [ // save list of column indexes to `column_indexes`
							...new Set(  // make the list unique
								table_records.flatMap(({columns}) =>
									Object.keys(columns).map(column_index =>
										parseInt(column_index),
									),  // get column indexes
								),
							),
						]
					).map(column_index =>  // map column indexes to column headers
						headers[column_index],
					),
					table_icon: icons.getIcon(table_name),
					get_record_view_url: (row_id: number) => `/specify/view/${table_name}/${row_id}/`,
					rows: table_records.map(({record_id, row_index, columns}) => (
						{
							record_id,
							row_index,
							columns: column_indexes.map(column_index =>
								(
									{
										column_index,
										cell_value: columns[column_index] ?? '',
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
	WBUploadedViewConstructorProps & WBUploadedViewBaseProps & ReactBackboneExtendBaseProps,
	WBUploadedViewComponentProps>({
	module_name: 'WBUploadedView',
	class_name: 'wb-uploaded',
	initialize(self, props) {
		self.wb = props.wb;
		self.hot = props.hot;
		self.uploadedRows = parseUploadResults(props.uploadResults, props.hot.getColHeader() as string[]);
		self.uploadedPicklistItems = props.uploadResults.picklists;
		self.openStatus = props.openStatus;
		self.removeCallback = props.removeCallback;
	},
	remove: (self) =>
		self.removeCallback(),
	Component: WBUploadedViewDataParser,
	get_component_props: (self) => (
		{
			uploadedRows: self.uploadedRows,
			uploadedPicklistItems: self.uploadedPicklistItems,
			handleClose: self.remove.bind(self),
			hot: self.hot,
		}
	),
});
