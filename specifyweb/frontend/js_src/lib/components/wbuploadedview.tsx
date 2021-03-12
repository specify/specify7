/*
*
* Workbench Upload Results UI
*
* */

'use strict';

import Handsontable                       from 'handsontable';
import '../../css/wbuploaded.css';
import React                              from 'react';
import createBackboneView                 from './reactbackboneextend';
import { ModalDialog }                    from './modaldialog';
import { Action, generateReducer, State } from '../statemanagement';
import fetchDataModel                     from '../wbplanviewmodelfetcher';
import dataModelStorage                   from '../wbplanviewmodel';
import { Dataset }                        from './wbplanview';
import {
  parseUploadResults,
  UploadedPicklistItem,
  UploadedPicklistItems,
  UploadedRow,
  UploadedRows,
  UploadedRowsTable,
  UploadResults,
}                                         from '../wbuploadedparser';

interface WBUploadedViewConstructorProps {
  dataset: Dataset,
  hot: Handsontable,
  removeCallback: () => void,
}

interface WBUploadedViewDataParseProps {
  readonly handleClose: () => void,
  readonly hot: Handsontable,
  readonly dataset: Dataset,
}

interface WBUploadedViewComponentProps {
  readonly handleClose: () => void,
  readonly uploadedRows: UploadedRows,
  readonly uploadedPicklistItems: UploadedPicklistItems,
  readonly hot: Handsontable,
}

type UploadedRecordsTypes = 'table' | 'picklist'
type HandleCellClicked = (rowIndex: number, columnIndex: number) => void;

interface UploadedTableRowBaseProps {
  readonly onCellClicked: HandleCellClicked,
  readonly getRecordViewUrl?: (rowId: number) => string,
}

type RecordsVisibilityState = Readonly<Record<string, boolean>>;

interface WBUploadedState extends State<'WBUploadedState'> {
  readonly tableRecordsVisibilityState: RecordsVisibilityState,
  readonly picklistRecordsVisibilityState: RecordsVisibilityState,
  readonly props: WBUploadedViewComponentProps,
}

interface CreateRecordSetAction extends Action<'CreateRecordSetAction'> {
  readonly tableName: string,
}

interface CreateDataSetAction extends Action<'CreateDataSetAction'> {
  readonly tableName: string,
}

interface ToggleTableRecordsVisibilityAction
  extends Action<'ToggleTableRecordsVisibilityAction'> {
  readonly tableName: string,
  readonly destination:
    'tableRecordsVisibilityState'
    | 'picklistRecordsVisibilityState';
}

interface CellClickedAction extends Action<'CellClickedAction'> {
  readonly rowIndex: number,
  readonly columnIndex: number,
}

type WBUploadedActions =
  CreateRecordSetAction
  | CreateDataSetAction
  | ToggleTableRecordsVisibilityAction
  | CellClickedAction;


let ranks: Record<string, string[]>;
const fetchDataModelPromise: Promise<void> = fetchDataModel();

function UploadedTableRowsHeaderProps({
  columnNames,
}: {
  readonly columnNames: string[],
}): JSX.Element {
  return <thead>
  <tr>{
    columnNames.map(columnName =>
      <th key={columnName}>{columnName}</th>,
    )
  }</tr>
  </thead>;
}


function CellLink({
  getRecordViewUrl,
  recordId,
  children,
}: {
  getRecordViewUrl: (recordId: number) => string,
  recordId?: number,
  children: JSX.Element | React.ReactText
}): JSX.Element {
  return typeof recordId === 'undefined' ?
    <>{children}</> :
    <a target="_blank" href={getRecordViewUrl(recordId)}>
      {children}
    </a>;
}

function UploadedTableRow({
  rows,
  onCellClicked: handleCellClicked,
  getRecordViewUrl,
}: UploadedTableRowBaseProps & {
  readonly rows: UploadedRow[]
  readonly getRecordViewUrl: (rowId: number) => string,
}): JSX.Element {
  return <tbody>
  {rows.map(({recordId, rowIndex, columns}, index) =>
    <tr key={index}>
      {
        recordId >= 0 &&
        <td key='viewRecord'>
          <a target="_blank" href={getRecordViewUrl(recordId)}>
            &#128065;  {/* a fancy eye emoji */}
          </a>
        </td>
      }
      {columns.map(({
          columnIndex,
          cellValue,
          rowIndex: cellRowIndex,
          recordId,
          spanSize,
          matched,
        }, index) =>
          <td
            key={index}
            className={
              `wb-upload-results-cell ${
                matched ?
                  'wb-upload-results-cell-matched' :
                  ''
              }
              `}
            rowSpan={spanSize}
            onClick={() => handleCellClicked(
              rowIndex < 0 ?
                cellRowIndex ?? -1 :
                rowIndex,
              columnIndex,
            )}
            title={`${['Uploaded', 'Matched'][matched ? 1 : 0]} record`}
          >
            <CellLink
              getRecordViewUrl={getRecordViewUrl}
              recordId={recordId}
            >
              {
                typeof cellValue === 'undefined' ?
                  'Uploaded' :
                  cellValue
              }
            </CellLink>
          </td>,
      )}
    </tr>,
  )}
  </tbody>;
}

function UploadedPicklistRow({
  rows,
  onCellClicked: handleCellClicked,
}: UploadedTableRowBaseProps & {
  readonly rows: UploadedPicklistItem[]
}): JSX.Element {
  return <tbody>{
    rows.map((
      {
        rowIndex,
        columnIndex,
        picklistValue: value,
      },
      index,
      ) =>
        <tr key={index}>
          <td
            className="wb-upload-results-cell"
            onClick={() => handleCellClicked(rowIndex, columnIndex)}
          >{value}</td>
        </tr>,
    )
  }</tbody>;
}

function UploadedTableRows({
  type,
  rows,
  columnNames,
  getRecordViewUrl,
  onCellClicked: handleCellClicked,
  tableIsTree,
}: {
  readonly rows: (UploadedRow | UploadedPicklistItem)[],
  readonly columnNames?: string[],
  readonly getRecordViewUrl?: (rowId: number) => string,
  readonly type: UploadedRecordsTypes,
  readonly onCellClicked: HandleCellClicked,
  readonly tableIsTree: boolean,
} & ({
  readonly rows: UploadedRow[],
  readonly columnNames: string[],
  readonly getRecordViewUrl: (rowId: number) => string,
  readonly type: 'table',
} | {
  readonly rows: UploadedPicklistItem[],
  readonly type: 'picklist',
})): JSX.Element {
  return <div className="wb-upload-results-rows-container">
    <table
      className={
        `wb-upload-results-rows ${
          tableIsTree ?
            'wb-upload-results-rows-tree' :
            ''
        }`
      }>
      <UploadedTableRowsHeaderProps
        columnNames={
          type === 'table' && columnNames ?
            [
              ...(
                rows.length !== 0 &&
                'recordId' in rows[0] &&
                rows[0].recordId >= 0 ?
                  [''] :
                  []
              ),
              ...columnNames,
            ] :
            ['Picklist value']
        }
      />
      {
        type === 'table' && getRecordViewUrl ?
          <UploadedTableRow
            //@ts-ignore
            rows={rows}
            onCellClicked={handleCellClicked}
            getRecordViewUrl={getRecordViewUrl}
          /> :
          <UploadedPicklistRow
            //@ts-ignore
            rows={rows}
            onCellClicked={handleCellClicked}
          />
      }
    </table>
  </div>;
}

function UploadedTableHeader({
  tableIcon,
  tableName,
  label,
  rowsCount,
  tableIsCollapsed,
  onCreateRecordSet: handleCreateRecordSet,
  onCreateDataSet: handleCreateDataSet,
  onToggleTableRecordsVisibility: handleToggleTableRecordsVisibility,
}: {
  readonly tableIcon?: string,
  readonly tableName?: string,
  readonly label: string,
  readonly rowsCount: number,
  readonly tableIsCollapsed: boolean,
  readonly onCreateRecordSet?: () => void,
  readonly onCreateDataSet?: () => void,
  readonly onToggleTableRecordsVisibility: () => void,
  readonly type: UploadedRecordsTypes,
} & ({
  readonly tableIcon: string,
  readonly tableName: string,
  readonly label: string,
  readonly rowsCount: number,
  readonly tableIsCollapsed: boolean,
  readonly onCreateRecordSet: () => void,
  readonly onCreateDataSet: () => void,
  readonly onToggleTableRecordsVisibility: () => void,
  readonly type: UploadedRecordsTypes,
} | {
  readonly label: string,
  readonly rowsCount: number,
  readonly tableIsCollapsed: boolean,
  readonly onToggleTableRecordsVisibility: () => void,
  readonly type: UploadedRecordsTypes,
})): JSX.Element {
  return <div className="wb-upload-results-header" onClick={(event) => {
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
      {
        tableIcon &&
        <img
          className="wb-upload-results-table-icon"
          src={tableIcon}
          alt={tableName}
        />
      }
      <div className="wb-upload-results-table-label">{label}</div>
      <div
        className="wb-upload-results-table-rows-count"
      >- {rowsCount}</div>
    </div>
    <div className="wb-upload-results-controls">
      {
        /* TODO: enable these buttons */
        rowsCount === -1 &&
        <>
          <button onClick={handleCreateRecordSet}>Record Set</button>
          <button onClick={handleCreateDataSet}>Data Set</button>
        </>
      }
    </div>
  </div>;
}

function UploadedTable({
  uploadedTable,
  type,
  tableName,
  tableIsCollapsed,
  onCreateRecordSet: handleCreateRecordSet,
  onCreateDataSet: handleCreateDataSet,
  onToggleTableRecordsVisibility: handleToggleTableRecordsVisibility,
  onCellClicked: handleCellClicked,
}: {
  readonly tableName: string,
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
})): JSX.Element {
  return <div className='wb-upload-results-table'>
    {/*@ts-ignore*/}
    <UploadedTableHeader
      type={type}
      tableName={tableName}
      tableIsCollapsed={tableIsCollapsed}
      onCreateRecordSet={handleCreateRecordSet}
      onCreateDataSet={handleCreateDataSet}
      onToggleTableRecordsVisibility={handleToggleTableRecordsVisibility}
      {...(
        type === 'table' ?
          {
            tableIcon: uploadedTable.tableIcon,
            label: uploadedTable.tableLabel,
            rowsCount: uploadedTable.rowsCount ?? uploadedTable.rows.length,
          } :
          {
            label: tableName,
            rowsCount: Object.keys(uploadedTable).length,
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
          tableIsTree={typeof uploadedTable.rowsCount !== 'undefined'}
          {...(
            type === 'table' ?
              {
                rows: uploadedTable.rows,
                columnNames: uploadedTable.columnNames,
                getRecordViewUrl: uploadedTable.getRecordViewUrl,
              } :
              {
                rows: uploadedTable,
              }
          )}
        />
    }
  </div>;
}

function UploadedRecords({
  uploadedRecords,
  tableRecordsVisibilityState,
  type,
  onCreateRecordSet: handleCreateRecordSet,
  onCreateDataSet: handleCreateDataSet,
  onToggleTableRecordsVisibility: handleToggleTableRecordsVisibility,
  onCellClicked: handleCellClicked,
}: {
  readonly onToggleTableRecordsVisibility: (tableName: string) => void,
  readonly tableRecordsVisibilityState: RecordsVisibilityState,
  readonly onCellClicked: HandleCellClicked,
  readonly onCreateRecordSet?: (tableName: string) => void,
  readonly onCreateDataSet?: (tableName: string) => void,
} & ({
  readonly uploadedRecords: UploadedRows,
  readonly onCreateRecordSet: (tableName: string) => void,
  readonly onCreateDataSet: (tableName: string) => void,
  readonly type: 'table',
} | {
  readonly uploadedRecords: UploadedPicklistItems,
  readonly type: 'picklist',
})): JSX.Element {
  return <>{
    Object.entries(uploadedRecords).map(([tableName, tableData]) =>
      //@ts-ignore
      <UploadedTable
        uploadedTable={tableData}
        tableName={tableName}
        key={tableName}
        type={type}
        tableIsCollapsed={tableRecordsVisibilityState[tableName]}
        onCreateRecordSet={
          handleCreateRecordSet &&
          handleCreateRecordSet.bind(null, tableName)
        }
        onCreateDataSet={
          handleCreateDataSet &&
          handleCreateDataSet.bind(null, tableName)
        }
        onToggleTableRecordsVisibility={
          handleToggleTableRecordsVisibility.bind(null, tableName)
        }
        onCellClicked={handleCellClicked}
      />,
    )
  }</>;
}

const reducer = generateReducer<WBUploadedState, WBUploadedActions>({

  'CreateRecordSetAction': ({state}) => {
    alert('TEST: Create record set');
    return state;
  },
  'CreateDataSetAction': ({state}) => {
    alert('TEST: Create data set');
    return state;
  },
  'ToggleTableRecordsVisibilityAction': ({state, action}) => (
    {
      ...state,
      [action.destination]: Object.fromEntries(
        Object.entries(state[action.destination]).map(([
          tableName,
          isCollapsed,
        ]) => [
          tableName,
          isCollapsed !== (
            tableName === action.tableName
          ),
        ]),
      ),
    }
  ),
  'CellClickedAction': ({state, action: {rowIndex, columnIndex}}) => {
    if (
      rowIndex >= 0 &&
      columnIndex >= 0
    )
      state.props.hot.selectCell(rowIndex, columnIndex);
    return state;
  },

});

const generateInitialVisibilityState = <T, >(
  sourceDictionary: Record<string, T>,
) =>
  Object.fromEntries(Object.keys(sourceDictionary).map(keyName => [
    keyName,
    true,
  ]));

const getInitialWBUploadedViewState = (
  props: WBUploadedViewComponentProps,
): WBUploadedState => (
  {
    type: 'WBUploadedState',
    tableRecordsVisibilityState:
      generateInitialVisibilityState(props.uploadedRows),
    picklistRecordsVisibilityState:
      generateInitialVisibilityState(props.uploadedPicklistItems),
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
          'No records were uploaded / all records were matched to' +
          'database records'
        }
      </>
      <UploadedRecords
        type='table'
        uploadedRecords={props.uploadedRows}
        tableRecordsVisibilityState={state.tableRecordsVisibilityState}
        onCreateRecordSet={(tableName: string) => dispatch({
          type: 'CreateRecordSetAction',
          tableName,
        })}
        onCreateDataSet={(tableName: string) => dispatch({
          type: 'CreateDataSetAction',
          tableName,
        })}
        onCellClicked={(rowIndex: number, columnIndex: number) =>
          dispatch({
            type: 'CellClickedAction',
            rowIndex,
            columnIndex,
          })
        }
        onToggleTableRecordsVisibility={(tableName: string) =>
          dispatch({
            type: 'ToggleTableRecordsVisibilityAction',
            destination: 'tableRecordsVisibilityState',
            tableName,
          })
        }
      />
      <UploadedRecords
        type='picklist'
        uploadedRecords={props.uploadedPicklistItems}
        tableRecordsVisibilityState={state.picklistRecordsVisibilityState}
        onCellClicked={(rowIndex: number, columnIndex: number) =>
          dispatch({
            type: 'CellClickedAction',
            rowIndex,
            columnIndex,
          })
        }
        onToggleTableRecordsVisibility={(tableName: string) =>
          dispatch({
            type: 'ToggleTableRecordsVisibilityAction',
            destination: 'picklistRecordsVisibilityState',
            tableName,
          })
        }
      />
    </div>
  </ModalDialog>;
}

function WBUploadedViewDataParser(props: WBUploadedViewDataParseProps) {

  const [treeRanks, setTreeRanks] =
    React.useState<Record<string, string[]> | undefined>(ranks);
  const [uploadedRows, setUploadedRows] =
    React.useState<UploadedRows | undefined>(undefined);
  const [uploadedPicklistItems, setUploadedPicklistItems] =
    React.useState<UploadedPicklistItems | undefined>(undefined);
  const [uploadResults, setUploadResults] =
    React.useState<UploadResults | undefined>(undefined);

  React.useEffect(() =>  // fetch upload results
      void (
        fetch(
          `/api/workbench/upload_results/${props.dataset.id}/`,
        ).then(response =>
          response.json() as Promise<UploadResults>,
        ).then(setUploadResults)
      ),
    [],
  );

  React.useEffect(() =>  // fetch tree ranks
      void (
        fetchDataModelPromise.then(() =>
          setTreeRanks(
            Object.fromEntries(
              Object.entries(
                dataModelStorage.ranks,
              ).map(([tableName, tableRanks]) => [
                  tableName,
                  [
                    dataModelStorage.rootRanks[tableName],
                    ...Object.keys(tableRanks),
                  ],
                ],
              ),
            ),
          ),
        ).catch(() => {
          throw new Error('Failure fetching tree ranks');
        })
      ),
    [],
  );

  React.useEffect(() => { // parse uploaded data
    if (
      typeof uploadResults === 'undefined' ||
      typeof treeRanks === 'undefined'
    )
      return;

    const [uploadedRows, uploadedPicklistItems] = parseUploadResults(
      uploadResults,
      props.dataset.columns,
      props.dataset.rows,
      treeRanks,
      props.dataset.uploadplan,
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
  moduleName: 'WBUploadedView',
  title: 'Upload Results',
  className: 'wb-uploaded',
  initialize(self, {
    dataset,
    hot,
    removeCallback,
  }) {
    self.dataset = dataset;
    self.hot = hot;
    self.removeCallback = removeCallback;
  },
  remove: (self) =>
    self.removeCallback(),
  Component: WBUploadedViewDataParser,
  getComponentProps: (self) => (
    {
      handleClose: self.remove.bind(self),
      hot: self.hot,
      dataset: self.dataset,
    }
  ),
});
