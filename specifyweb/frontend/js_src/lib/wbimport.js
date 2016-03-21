"use strict";
require('../css/wbimport.css');

var $        = require('jquery');
var _ = require('underscore');
var Backbone = require('./backbone.js');
var Bacon    = require('baconjs');
var Papa = require('papaparse');
const Q = require('q');

var schema           = require('./schema.js');
var wbimport         = require('./templates/wbimport.html');
var WBTemplateEditor = require('./wbtemplateeditor.js');
var navigation       = require('./navigation.js');
var app              = require('./specifyapp.js');
var uniquifyWorkbenchName = require('./wbuniquifyname.js');
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

    const permuteRowQ = Q(template.rget('workbenchtemplatemappingitems'))
              .then(wbtmis => wbtmis.sortBy(wbtmi => wbtmi.get('vieworder')))
              .then(wbtmis => wbtmis.map(wbtmiColumn))
              .then(permutation => row => permutation.map(i => row[i]));

    const parseQ = QfromCallback(
        callback => Papa.parse(file, {
            encoding: encoding,
            complete: parse => callback(parse.data)})
    );

    return Q.all([permuteRowQ, parseQ]).spread(
        (permuteRow, rows) => rows.map(permuteRow)
    ).then(
        rows => header ? rows.slice(1) : rows
    ).then(
        rows => rows.map(row => [null].concat(row))
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

function mappingItems(template) {
    return template.dependentResources['workbenchtemplatemappingitems'].sortBy(
        wbtmi => wbtmi.get('vieworder'));
}

function makeWorkbenchName(input, fileSelected) {
    const selectedFileName = fileSelected.map(
        file => file.name.replace(/\.[^\.]*$/, ''));  // remove extentsion
    return Bacon.combineWith(
        input, selectedFileName,
        (entered, selected) => entered === '' ? selected : entered)
        .flatMap(name => Bacon.fromPromise(uniquifyWorkbenchName(name)));
}

function wbtmiColumn(wbtmi) {
    const origcol = wbtmi.get('origimportcolumnindex');
    return origcol === -1 ? wbtmi.get('vieworder') : origcol;
}

function wbtmiMatches(header) {
    return wbtmi => wbtmi.get('caption') === header[wbtmiColumn(wbtmi)];
}

function MatchTemplates(templates, columns) {
    return columns.map(
        cols => templates.filter(
            template => _.all(mappingItems(template), wbtmiMatches(cols))));
}

    var WBImportView = Backbone.View.extend({
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

            var fileSelected = this.$(':file').asEventStream('change')
                    .map(event => event.currentTarget.files[0])
                    .filter(file => file != null);

            fileSelected.onValue(() => this.$(':hidden').show());

            var workbenchName = makeWorkbenchName(ValueProperty(this.$(':text')), fileSelected);

            workbenchName.onValue(wbName => this.$(':text').val(wbName));

            var encodingSelected = ValueProperty(this.$('select.encoding'));

            var hasHeader = CheckedProperty(this.$(':checkbox'));

            var previews = Bacon.combineAsArray(fileSelected, encodingSelected)
                    .flatMap(
                        ([file, encoding]) => Bacon.fromCallback(
                            callback => Papa.parse(file, {
                                encoding: encoding,
                                preview: 10,
                                complete: callback
                            })))
                    .map(parse => parse.data);

            Preview(this.$('table'), previews, hasHeader);

            var columns = Bacon.combineWith(
                previews, hasHeader,
                (preview, header) =>
                    header ? preview[0] : preview[0].map((__, i) => "Column " + (i + 1)));

            var matchingTemplates = MatchTemplates(this.templates, columns);

            matchingTemplates.onValue(templates => this.$('select.template optgroup').empty().append(
                templates.map((template, i) => $('<option>').text(template.get('name')).attr('value', i)[0])));

            var templateSelected = Bacon.combineWith(
                matchingTemplates, this.$('select.template').asEventStream('change').startWith(null),
                (templates, __) => {
                    const val = this.$('select.template').val();
                    return val === 'new' ? 'new' : templates[parseInt(val, 10)];
                });

            templateSelected.onValue(
                t => this.$('button').button('option', 'label', t === 'new' ? 'Create Mapping' : 'Import'));

            var buttonClicks = this.$('button').button().asEventStream('click');

            var cloneOrMakeTemplate = templateSelected
                    .sampledBy(buttonClicks)
                    .map(val => val === 'new' ? 'make' : val.clone());

            var createdTemplate = columns
                    .sampledBy(cloneOrMakeTemplate.filter(t => t === 'make'))
                    .flatMap(
                        columns => Bacon.fromCallback(
                            callback => new WBTemplateEditor({ columns: columns })
                                .render()
                                .on('closed created', callback)))
                    .filter(template => template != null);

            var clonedTemplate = cloneOrMakeTemplate.filter(t => t !== 'make');

            Bacon.combineWith(
                Bacon.mergeAll(createdTemplate, clonedTemplate).first(),
                fileSelected, workbenchName, hasHeader, encodingSelected,
                doImport
            )
                .flatMap(q => Bacon.fromPromise(q))
                .onValue(wb => navigation.go('/workbench/' + wb.id + '/'));

            return this;
        }
    });


module.exports = function() {
    app.setTitle("Import Workbench");
    var templates = new schema.models.WorkbenchTemplate.LazyCollection({
        filters: { specifyuser: userInfo.id }
    });
    templates.fetch({ limit: 500 }).done(function() {
        app.setCurrentView(new WBImportView({ templates: templates }));
    });
};

