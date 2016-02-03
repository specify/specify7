"use strict";

var $        = require('jquery');
var _ = require('underscore');
var Backbone = require('./backbone.js');
var Bacon    = require('baconjs');
var Papa = require('papaparse');

var schema           = require('./schema.js');
var wbimport         = require('./templates/wbimport.html');
var WBTemplateEditor = require('./wbtemplateeditor.js');
var navigation       = require('./navigation.js');
var app              = require('./specifyapp.js');
var uniquifyWorkbenchName = require('./wbuniquifyname.js');
const userInfo = require('./userinfo.js');

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

    function cloneTemplate(template) {
        var cloned = template.clone();
        // Sp6 doesn't record the original column number so we can't
        // reuse column permutations.
        var fixColumns = cloned.rget('workbenchtemplatemappingitems').pipe(function(wbtmis) {
            wbtmis.each(wbtmi => wbtmi.set('origimportcolumnindex', wbtmi.get('vieworder')));
            return cloned;
        });
        return Bacon.fromPromise(fixColumns);
    }

    function makeFormData(template, file, workbenchName, header) {
        var formData = new FormData();
        formData.append('file', file);
        formData.append('workbenchName', workbenchName);
        formData.append('hasHeader', header);
        formData.append('template', JSON.stringify(template.toJSON()));
        return formData;
    }

    function doImport(formData) {
        return Bacon.fromPromise(
            $.ajax({
                url: '/api/workbench/import/',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false
            }));
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

    var WBImportView = Backbone.View.extend({
        __name__: "WBImportView",
        className: 'workbench-import-view',
        initialize: function(options) {
            this.templates = options.templates;
        },
        render: function() {
            this.$el.append(wbimport());

            var fileSelected = this.$(':file').asEventStream('change')
                    .map(event => event.currentTarget.files[0])
                    .filter(file => file != null);

            fileSelected.onValue(__ => this.$(':hidden').show());

            var workbenchName = makeWorkbenchName(ValueProperty(this.$(':text')), fileSelected);

            workbenchName.onValue(wbName => this.$(':text').val(wbName));

            var hasHeader = CheckedProperty(this.$(':checkbox'));

            var previews = fileSelected.flatMap(
                file => Bacon.fromCallback(
                    callback => Papa.parse(file, {
                        preview: 10,
                        complete: callback
                    })))
                    .map(parse => parse.data);

            Preview(this.$('table'), previews, hasHeader);

            var columns = Bacon.combineWith(
                previews, hasHeader,
                (preview, header) =>
                    header ? preview[0] : preview[0].map((__, i) => "Column " + (i + 1)));

            var matchingTemplates = columns.map(
                cols => this.templates.filter(
                    template => _.all(
                        mappingItems(template),
                        (wbtmi, i) => wbtmi.get('caption') === cols[i])));

            matchingTemplates.onValue(templates => this.$('select optgroup').empty().append(
                templates.map((template, i) => $('<option>').text(template.get('name')).attr('value', i)[0])));

            var templateSelected = Bacon.combineWith(
                matchingTemplates, this.$('select').asEventStream('change').startWith(null),
                (templates, __) => {
                    const val = this.$('select').val();
                    return val === 'new' ? 'new' : templates[parseInt(val, 10)];
                });

            templateSelected.onValue(
                t => this.$('button').button('option', 'label', t === 'new' ? 'Create Mapping' : 'Import'));

            var buttonClicks = this.$('button').button().asEventStream('click');

            var cloneOrMakeTemplate = templateSelected
                    .sampledBy(buttonClicks)
                    .flatMap(val => val === 'new' ? Bacon.once('make') : cloneTemplate(val));

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
                fileSelected, workbenchName, hasHeader,
                makeFormData
            )
                .flatMap(doImport)
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

