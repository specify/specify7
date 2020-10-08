"use strict";
require('../css/wbimport.css');

const $ = require('jquery');
const _ = require('underscore');
const Backbone = require('./backbone.js');
const Bacon = require('baconjs');
const Papa = require('papaparse');
const Q = require('q');
const xlsx = require('xlsx');

const schema = require('./schema.js');
const wbimport = require('./templates/wbimport.html');
const navigation = require('./navigation.js');
const app = require('./specifyapp.js');
const uniquifyWorkbenchName = require('./wbuniquifyname.js');
const userInfo = require('./userinfo.js');
const encodings = require('./encodings.js');

function Preview($table, previews, hasHeader) {
    Bacon.combineWith(
        previews, hasHeader,
        (preview, header) =>
            preview.map(
                (row, i) => $('<tr>')
                    .addClass(header && i===0 ? 'header' : '')
                    .append(row.map(cell => $('<td>').text(cell)[0]))[0]
            ))
        .onValue(trs => $table.empty().append(trs));
}

function ValueProperty($el) {
    return $el.asEventStream('change')
        .map(event => $el.val())
        .toProperty($el.val());
}

function CheckedProperty($el) {
    return $el.asEventStream('change')
        .map(event => $el.prop('checked'))
        .toProperty($el.prop('checked'));
}

function QfromCallback(func) {
    const defer = Q.defer();
    func(result => defer.resolve(result));
    return defer.promise;
}

function doImport(template, file, workbenchName, header, encoding) {
    const dialog = $('<div><div class="progress-bar"></div></div>').dialog({
        title: 'Importing',
        modal: true,
        open: function(evt, ui) { $('.ui-dialog-titlebar-close', ui.dialog).hide(); },
        close: function() {$(this).remove();}
    });
    $('.progress-bar', dialog).progressbar({value: false});

    template.set('name', workbenchName);
    const workbench = new schema.models.Workbench.Resource({
        name: workbenchName,
        workbenchtemplate: template,
        specifyuser: userInfo.resource_uri,
        srcfilepath: file.name
    });


    const file_extension = file.name.split('.').pop();
    let parseQ;
	if(file_extension === 'xls' || file_extension === 'xlsx')
		parseQ = QfromCallback(
			callback => callback(readXLSX(file))
		);
	else
		parseQ = QfromCallback(
			callback => Papa.parse(file, {
				encoding: encoding,
				complete: parse => callback(parse.data)})
		);

    return parseQ.then(
        rows => header ? rows.slice(1) : rows
    ).then(
        rows => rows.map(row => [null, null].concat(row))
    ).then(
        rows => Q(workbench.save()).then(() => rows)
    ).then(
        data => Q($.ajax('/api/workbench/rows/' + workbench.id + '/', {
            data: JSON.stringify(data),
            type: "PUT"
        }))
    ).tap(
        () => dialog.dialog('close')
    ).then(
        () => workbench
    );
}


function makeWorkbenchName(input, fileSelected) {
    const selectedFileName = fileSelected.map(
        file => file.name.replace(/\.[^\.]*$/, ''));  // remove extentsion
    return Bacon.combineWith(
        input, selectedFileName,
        (entered, selected) => entered === '' ? selected : entered)
        .flatMap(name => Bacon.fromPromise(uniquifyWorkbenchName(name)));
}


function createTemplate(columns) {
    return new schema.models.WorkbenchTemplate.Resource({
        specifyuser: userInfo.resource_uri,
        workbenchtemplatemappingitems: makeMappingItems(columns)
    });
}

function makeMappingItems(columns) {
    return columns.map(
        (column, i) => new schema.models.WorkbenchTemplateMappingItem.Resource({
            caption: column,
            fieldname: column,
            vieworder: i,
            origimportcolumnindex: i
        })
    );
}

function readXLSX(file, preview_size=0){

	return new Promise((resolve, reject)=>{

		const reader = new FileReader();
		reader.readAsBinaryString(file);
		reader.onload = e=>{

			const raw_file_data = e.target.result;  // read file contents

			const read_config = {
				type: 'binary',
			};
			if(preview_size !== 0)
				read_config.sheetRows = preview_size;

			const workbook = xlsx.read(raw_file_data, read_config);  // parse file contents

			const first_sheet_name = workbook.SheetNames[0];
			const first_workbook = workbook.Sheets[first_sheet_name];  // get the first sheet data
			let data = xlsx.utils.sheet_to_json(first_workbook, {header: 1});

			if(data.length>0){  // make each row have the same number of cells
				const header_row = data[0];
				const number_of_headers = header_row.length;
				const empty_row = header_row.map(()=>"");
				data = data.map(line=>{
					const cells_to_add = number_of_headers-line.length;
					if(cells_to_add>0)
						return [...line, ...empty_row.slice(0,cells_to_add)];
					return line;
				});
			}
			resolve(data);
		};

	});

}

const WBImportView = Backbone.View.extend({
    __name__: "WBImportView",
    className: 'workbench-import-view',
    initialize: function(options) {
        this.templates = options.templates;
    },
    render: function() {
        this.$el.append(wbimport({
            encodings: encodings.allLabels,
            nameChars: schema.models.Workbench.getField('name').length
        }));

        const fileSelected = this.$(':file').asEventStream('change')
              .map(event => event.currentTarget.files[0])
              .filter(file => file != null);

        fileSelected.onValue(() => this.$(':hidden').show());

        const workbenchName = makeWorkbenchName(ValueProperty(this.$(':text')), fileSelected);

        workbenchName.onValue(wbName => this.$(':text').val(wbName));

        const encodingSelected = ValueProperty(this.$('select.encoding'));

        const hasHeader = CheckedProperty(this.$(':checkbox'));

		const previews = Bacon.combineAsArray(fileSelected, encodingSelected)
			.flatMap(
				([file, encoding]) => Bacon.fromCallback(
					callback => {

						const file_extension = file.name.split('.').pop();
						const preview_size = 10;

						if(file_extension === 'xls' || file_extension === 'xlsx')
							readXLSX(file, preview_size).then(data=>callback({data: data}));

						else
							Papa.parse(file, {
								encoding: encoding,
								preview: preview_size,
								complete: callback
							});
					}
				))
			.map(parse => parse.data);

        Preview(this.$('table'), previews, hasHeader);

        const columns = Bacon.combineWith(
            previews, hasHeader,
            (preview, header) =>
                header ? preview[0] : preview[0].map((__, i) => "Column " + (i + 1)));


        const buttonClicks = this.$('button').button().asEventStream('click');

        const createdTemplate = columns.sampledBy(buttonClicks).map(createTemplate);

        Bacon.combineWith(createdTemplate, fileSelected, workbenchName, hasHeader, encodingSelected,
                          doImport
        )
            .flatMap(q => Bacon.fromPromise(q))
            .onValue(wb => navigation.go('/workbench/' + wb.id + '/'));

        return this;
    }
});


module.exports = function() {
    app.setTitle("Import Dataset");
    const templates = new schema.models.WorkbenchTemplate.LazyCollection({
        filters: { specifyuser: userInfo.id }
    });
    templates.fetch({ limit: 500 }).done(function() {
        app.setCurrentView(new WBImportView({ templates: templates }));
    });
};

