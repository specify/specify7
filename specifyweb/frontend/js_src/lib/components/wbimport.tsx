import React, {Component} from 'react';

import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const $ = require('jquery');
const Q = require('q');

const schema = require('../schema.js');
const navigation = require('../navigation.js');
const uniquifyWorkbenchName = require('../wbuniquifyname.js');
const userInfo = require('../userinfo.js');
const encodings = require('../encodings.js');

const PREVIEW_SIZE = 10;

type FileType = 'csv' | 'xls';

type FileTypeState = {type: 'FileTypeState',}

type ChooseCSVFileState = {type: 'ChooseCSVFileState', encoding: string,}

type ChooseXLSFileState = {type: 'ChooseXLSFileState',}

type PreviewCSVState = {type:'PreviewCSVState', preview: string[][], file: File, encoding: string, datasetName: string, hasHeader: boolean}

type PreviewXLSState = {type:'PreviewXLSState', preview: string[][], file: File, datasetName: string, hasHeader: boolean}

type LoadingFileState = {type: 'LoadingFileState', file: File, datasetName: string}

type WbImportState = FileTypeState | ChooseCSVFileState | ChooseXLSFileState | PreviewCSVState | PreviewXLSState | LoadingFileState;



type FileTypeAction = {type: 'FileTypeAction', fileType: FileType}

type EncodingAction = {type: 'EncodingAction', encoding: string}

type FileSelectedAction = {type: 'FileSelectedAction', file: File}

type GotPreviewAction = {type: 'GotPreviewAction', preview: string[][], file: File}

type ToggleHeaderAction = {type: 'ToggleHeaderAction'}

type SetDataSetNameAction  = {type: 'SetDataSetNameAction', value: string}

type DoImportAction = {type: 'DoImportAction'}

type Action = FileTypeAction | EncodingAction | FileSelectedAction | GotPreviewAction | ToggleHeaderAction | SetDataSetNameAction | DoImportAction;


type HandleAction = (action: Action) => void;


export default class WbImport extends Component<{}, WbImportState> {
    constructor(props: any) {
        super(props);
        this.state = {type: 'FileTypeState'};
    }

    generateCSVPreview(file: File, encoding: string) {
        Papa.parse(file, {
	    encoding: encoding,
	    preview: PREVIEW_SIZE,
	    complete: ({data}) => this.update({type: 'GotPreviewAction', preview: data, file: file})
        });
    }


    generateXLSPreview(file: File) {
        loadXLS(file, true, (data) => this.update({type: 'GotPreviewAction', preview: data, file: file}));
    }

    doImportCSV(file: File, name: string, hasHeader: boolean, encoding: string) {
        const doIt = () =>
            Papa.parse(file, {
	        encoding: encoding,
	        complete: ({data}) => {
                    const {rows, header} = extractHeader(data, hasHeader);
                    this.createDataset(name, header, rows);
                }
            });

        setTimeout(doIt, 0);
    }

    doImportXLS(file: File, name: string, hasHeader: boolean) {
        const doIt = () =>
            loadXLS(file, false, (data: string[][]) => {
                const {rows, header} = extractHeader(data, hasHeader);
                this.createDataset(name, header, rows);
            });

        setTimeout(doIt, 0);
    }

    createDataset(name: string, header: string[], data: string[][]) {
        uniquifyWorkbenchName(name)
            .done(
                (name: string) => {
                    const template = new schema.models.WorkbenchTemplate.Resource({
                        specifyuser: userInfo.resource_uri,
                        workbenchtemplatemappingitems: header.map(
                            (column, i) => new schema.models.WorkbenchTemplateMappingItem.Resource({
                                caption: column,
                                fieldname: column,
                                vieworder: i,
                                origimportcolumnindex: i
                            })
                        )
                    });
                    template.set('name', name);

                    const workbench = new schema.models.Workbench.Resource({
                        name: name,
                        workbenchtemplate: template,
                        specifyuser: userInfo.resource_uri,
                        srcfilepath: ""
                    });

                    const emptyRow: (string|null)[] = [null];

                    Q(workbench.save())
                        .then(
                            () => Q($.ajax('/api/workbench/rows/' + workbench.id + '/', {
                                data: JSON.stringify(data.map(row => emptyRow.concat(row))),
                                type: "PUT"
                            }))
                        ).done(() => {
                            navigation.go('/workbench/' + workbench.id + '/');
                        });
                });
    }



    update(action: Action) {
        const setState = (s: WbImportState) => { this.setState(s); };

        switch (action.type) {
            case 'FileTypeAction':
                switch (action.fileType) {
                    case 'xls':
                        setState({type: 'ChooseXLSFileState'});
                        break;
                    case 'csv':
                        setState({type: 'ChooseCSVFileState', encoding: "utf-8"});
                        break;
                    default:
                        assertExhaustive(action.fileType);
                }
                break;

            case 'EncodingAction':
                switch (this.state.type) {
                    case 'ChooseCSVFileState':
                        setState({type: 'ChooseCSVFileState', encoding: action.encoding});
                        break;

                    case 'PreviewCSVState':
                        setState({type: 'ChooseCSVFileState', encoding: action.encoding});
                        this.generateCSVPreview(this.state.file, this.state.encoding);
                        break;

                }
                break;

            case 'FileSelectedAction':
                switch (this.state.type) {
                    case 'ChooseCSVFileState':
                    case 'PreviewCSVState':
                        this.generateCSVPreview(action.file, this.state.encoding);
                        break;

                    case 'ChooseXLSFileState':
                    case 'PreviewXLSState':
                        this.generateXLSPreview(action.file);
                        break;
                }
                break;

            case 'GotPreviewAction':
                switch (this.state.type) {
                    case 'ChooseCSVFileState':
                    case 'PreviewCSVState':
                        setState({
                            type: 'PreviewCSVState',
                            preview: action.preview,
                            file: action.file,
                            datasetName: action.file.name.replace(/\.[^\.]*$/, ''),  // remove extentsion
                            encoding: this.state.encoding,
                            hasHeader: true,
                        });
                        break;

                    case 'ChooseXLSFileState':
                    case 'PreviewXLSState':
                        setState({
                            type: 'PreviewXLSState',
                            preview: action.preview,
                            file: action.file,
                            datasetName: action.file.name.replace(/\.[^\.]*$/, ''),  // remove extentsion
                            hasHeader: true,
                        });
                        break;
                }
                break;

            case 'ToggleHeaderAction':
                switch (this.state.type) {
                    case 'PreviewCSVState':
                    case 'PreviewXLSState':
                        setState({...this.state, hasHeader: !this.state.hasHeader});
                        break;
                }
                break;

            case 'SetDataSetNameAction':
                switch (this.state.type) {
                    case 'PreviewCSVState':
                    case 'PreviewXLSState':
                        setState({...this.state, datasetName: action.value});
                        break;
                }
                break;

            case 'DoImportAction':
                switch (this.state.type) {
                    case 'PreviewCSVState':
                        setState({type: 'LoadingFileState', file: this.state.file, datasetName: this.state.datasetName});
                        this.doImportCSV(this.state.file, this.state.datasetName, this.state.hasHeader, this.state.encoding);
                        break;

                    case 'PreviewXLSState':
                        setState({type: 'LoadingFileState', file: this.state.file, datasetName: this.state.datasetName});
                        this.doImportXLS(this.state.file, this.state.datasetName, this.state.hasHeader);
                        break;
                }
                break;


            default:
                assertExhaustive(action);
        }
    }

    render() {
        const update = (action: Action) => this.update(action);

        let ui;
        switch (this.state.type) {
            case 'FileTypeState':
                ui = <SelectFileType fileType={null} update={update} />;
                break;

            case 'ChooseXLSFileState':
                ui = (<>
                    <SelectFileType fileType="xls" update={update} />
                    <ChooseFile fileType="xls" update={update} />
                    </>);
                break;

            case 'ChooseCSVFileState':
                ui = (<>
                    <SelectFileType fileType="csv" update={update} />
                    <ChooseEncoding encoding={this.state.encoding} update={update} />
                    <ChooseFile fileType="csv" update={update} />
                    </>);
                break;

            case 'PreviewCSVState':
                ui = (<>
                    <SelectFileType fileType="csv" update={update} />
                    <ChooseEncoding encoding={this.state.encoding} update={update} />
                    <ChooseFile fileType="csv" update={update} />
                    <ToggleHeader hasHeader={this.state.hasHeader} update={update} />
                    <ChooseName name={this.state.datasetName} update={update} />
                    <DoImportButton update={update} />
                    <h2>Preview Dataset</h2>
                    <Preview data={this.state.preview} hasHeader={this.state.hasHeader} />
                    </>);
                break;

            case 'PreviewXLSState':
                ui = (<>
                    <SelectFileType fileType="xls" update={update} />
                    <ChooseFile fileType="xls" update={update} />
                    <ToggleHeader hasHeader={this.state.hasHeader} update={update} />
                    <ChooseName name={this.state.datasetName} update={update} />
                    <DoImportButton update={update} />
                    <h2>Preview Dataset</h2>
                    <Preview data={this.state.preview} hasHeader={this.state.hasHeader} />
                    </>);
                break;

            case 'LoadingFileState':
                ui = (<>
                    <h3>Processing...</h3>
                    <p>The data from {this.state.file.name} is being imported into the Workbench as
                      dataset {this.state.datasetName}. Do not close this page until the process is complete.
                    </p>
                    </>);
                break;

            default:
                assertExhaustive(this.state);
        }

        return (<div>
                <h2>Import Dataset</h2>
                {ui}
                </div>);
    }
}


function SelectFileType(props: {fileType: FileType | null, update: HandleAction}) {
    function selected(value: string) {
        if (value == "csv" || value == "xls") {
            props.update({type: 'FileTypeAction', fileType: value});
        }
    }

    return (<p>
            <select onChange={event => selected(event.target.value)} value={props.fileType || ""}>
            <option>Choose File Type</option>
            <option value="xls">Excel</option>
            <option value="csv">CSV</option>
            </select>
            </p>);
}


function ChooseEncoding(props: {encoding: string | null, update: HandleAction}) {
    function selected(value: string) {
        props.update({type: 'EncodingAction', encoding: value});
    }

    const options = encodings.allLabels.map((encoding: string) => <option key={encoding}>{encoding}</option>);

    return (<p>
            Character encoding:{" "}
            <select onChange={event => selected(event.target.value)} value={props.encoding || ""}>
            {options}
            </select>
            </p>);
}


function ChooseFile(props: {fileType: FileType, update: HandleAction}) {
    function changed(target: HTMLInputElement) {
        if (target.files && target.files[0]) {
            props.update({type: 'FileSelectedAction', file: target.files[0]});
        }
    }

    const exts =
        props.fileType === 'csv' ? ".csv,.tsv,.txt" :
        props.fileType === 'xls' ? ".xls,.xlsx" :
        assertExhaustive(props.fileType);

    return (<p>Choose {props.fileType} file: <input type="file" accept={exts} onChange={event => changed(event.target)}/></p>);
}


function Preview(props: {data: string[][], hasHeader: boolean}) {
    const hasHeader = props.hasHeader;
    const data = props.data;
    const {rows, header} = extractHeader(data, hasHeader);

    const headerCells = header.map((cell, i) => <th key={i}>{cell}</th>);
    const dataRows = rows.map((row, i) => <tr key={i}>{ row.map((cell, i) => <td key={i}>{cell}</td>) }</tr>);

    return <table><thead><tr className="header">{headerCells}</tr></thead><tbody>{dataRows}</tbody></table>;
}

function ChooseName(props: {name: string, update: HandleAction}) {
    return (<p>
        Name for new data set:{" "}
        <input type="text" value={props.name} onChange={event => props.update({type: 'SetDataSetNameAction', value: event.target.value})}/>
        </p>);
}

function ToggleHeader(props: {hasHeader: boolean, update: HandleAction}) {
    return (<label>First row is header:{" "}
        <input type="checkbox" onChange={()=>props.update({type: "ToggleHeaderAction"})} checked={props.hasHeader}/>
        </label>);
}

function DoImportButton(props: {update: HandleAction}) {
    return <button onClick={() => props.update({type: 'DoImportAction'})}>Import</button>;
}

function extractHeader(data: string[][], headerInData: boolean): {rows: string[][], header: string[]} {
    const header = headerInData ? data[0] : data[0].map((_1, i) => "Column " + (i+1));
    const rows = headerInData ? data.slice(1) : data;
    return {rows: rows, header: header};
}

function loadXLS(file: File, forPreview: boolean, callback: (data: string[][]) => void) {
    const reader = new FileReader();
    reader.readAsBinaryString(file);
    reader.onload = (e: ProgressEvent<FileReader>) => {

        const options: XLSX.ParsingOptions = forPreview ? {type: "binary", sheetRows: PREVIEW_SIZE} : {type: "binary"};
	const workbook = XLSX.read(e.target?.result, options);

	const first_sheet_name = workbook.SheetNames[0];
	const first_workbook = workbook.Sheets[first_sheet_name];
	const data: string[][] = XLSX.utils.sheet_to_json(first_workbook, {header: 1})
            .map(row => Array.isArray(row) ? Array.from(row, v => v || "") : []);

        callback(data);
    }
}


function assertExhaustive(x: never): never {
    throw new Error("Non-exhaustive switch. Unhandled case:" + x);
}

