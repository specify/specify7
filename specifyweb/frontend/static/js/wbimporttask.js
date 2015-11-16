define([
    'jquery', 'backbone', 'q', 'schema', 'templates', 'wbtemplateeditor_new', 'navigation'
], function($, Backbone, Q, schema, templates, WBTemplateEditor, navigation) {
    "use strict";

    var WBImportView = Backbone.View.extend({
        __name__: "WBImportView",
        className: 'workbench-import-view',
        events: {
            'change :file': 'fileSelected',
            'click button': 'nextStep',
            'change select': 'templateSelected',
            'change :checkbox': 'hasHeaderChanged'
        },
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
            this.$('button').button();
            return this;
        },
        fileSelected: function() {
            var files = this.$(':file').get(0).files;
            if (files.length < 1) return;

            this.$(':text').val() === '' && this.$(':text').val(files[0].name);

            Papa.parse(files[0], {
                preview: 10,
                complete: this.gotPreview.bind(this)
            });
        },
        gotPreview: function(parse) {
            this.preview = parse.data;
            this.$(':hidden').show();
            this.$('table').append(
                this.preview.map(function(row) {
                    return $('<tr>').append(row.map(function(cell) {
                        return $('<td>').text(cell)[0];
                    }))[0];
                })
            );
        },
        hasHeader: function() {
            return this.$(':checkbox').prop('checked');
        },
        hasHeaderChanged: function() {
            var action = this.hasHeader() ? 'addClass' : 'removeClass';
            this.$('table tr:first-child')[action]('header');
        },
        templateSelected: function() {
            var selected = this.$('select').val();
            if (selected === 'new') {
                this.template = null;
                this.$('button').button('option', 'label', 'Create Mapping');
            } else {
                this.template = this.templates.at(parseInt(selected, 10)).clone();
                this.$('button').button('option', 'label', 'Import');
            }
        },
        nextStep: function() {
            if (this.template != null) {
                this.doImport();
            } else {
                new WBTemplateEditor({ columns: this.hasHeader() ? this.preview[0] : null }).render();
            }
        },
        doImport: function() {
            var formData = new FormData();
            formData.append('file', this.$(':file').get(0).files[0]);
            formData.append('workbenchName', this.$(':text').val());
            formData.append('hasHeader', this.hasHeader());
            formData.append('template', JSON.stringify(this.template.toJSON()));
            $.ajax({
                url: '/api/workbench/import/',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false
            }).done(function(wb) {
                navigation.go('/workbench/' + wb.id + '/');
            });
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
