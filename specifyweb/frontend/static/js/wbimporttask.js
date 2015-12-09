define([
    'jquery', 'backbone', 'q', 'bacon', 'schema', 'templates', 'wbtemplateeditor', 'navigation'
], function($, Backbone, Q, Bacon, schema, templates, WBTemplateEditor, navigation) {
    "use strict";

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

    var WBImportView = Backbone.View.extend({
        __name__: "WBImportView",
        className: 'workbench-import-view',
        initialize: function(options) {
            this.templates = options.templates;
        },
        render: function() {
            this.$el.append(templates.wbimport());
            this.$('select optgroup').append(this.templates.map(function(template, i) {
                return $('<option>')
                    .text(template.get('name'))
                    .attr('value', i)[0];
            }));

            var templateSelected = ValueProperty(this.$('select'));

            var buttonClicks = this.$('button').button().asEventStream('click');

            templateSelected.onValue(
                t => this.$('button').button('option', 'label', t === 'new' ? 'Create Mapping' : 'Import'));

            var fileSelected = this.$(':file').asEventStream('change')
                    .map(event => event.currentTarget.files[0])
                    .filter(file => file != null);

            fileSelected.onValue(__ => this.$(':hidden').show());

            var workbenchName = Bacon.combineWith(
                ValueProperty(this.$(':text')), fileSelected,
                (enteredValue, file) => enteredValue === '' ? file.name : enteredValue);

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

            var cloneOrMakeTemplate = templateSelected
                    .sampledBy(buttonClicks)
                    .flatMap(val => val === 'new' ? Bacon.once('make') :
                             cloneTemplate(this.templates.at(parseInt(val, 10))));

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


    return function(app) {
        app.router.route('workbench-import/', 'workbench-import', function() {
            app.setTitle("Import Workbench");
            var templates = new schema.models.WorkbenchTemplate.LazyCollection();
            templates.fetch({ limit: 500 }).done(function() {
                app.setCurrentView(new WBImportView({ templates: templates }));
            });
        });
    };
});
