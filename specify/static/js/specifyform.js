define([
    'jquery', 'underscore', 'schema', 'specifyformcells', 'parsespecifyproperties',
    'processcolumndef', 'viewsets', 'templates'
], function specifyform(
    $, _, schema, specifyformcells, parseSpecifyProperties,
    processColumnDef, viewsets, templates
) {
    "use strict";
    var formCounter = 0;
    var findView = viewsets.findView;
    var findViewdef = viewsets.findViewdef;

    function getModelFromView(view) {
        view = _(view).isString() ? findView(view) : view;
        return view.attr('class').split('.').pop();
    }

    function getModelFromViewdef(viewdef) {
        return viewdef.attr('class').split('.').pop();
    }

    function getColumnDef(viewdef) {
        return viewdef.find('columnDef[os="lnx"]').first().text() || viewdef.find('columnDef').first().text();
    }

    function getDefaultViewdef(view, defaulttype) {
        if (defaulttype === 'table') {
            var viewdef;
            view.find('altview').each(function() {
                var vd = findViewdef($(this).attr('viewdef'));
                if (vd.attr('type') === 'formtable') viewdef = vd;
            });
            if (viewdef) return viewdef;
        }
        var defaultView = view.find('altview[default="true"]').first().attr('viewdef') ||
            view.find('altview').first().attr('viewdef');
        return findViewdef(defaultView);
    }

    function buildFormTable(formNumber, formViewdef, processCell) {
        var formTableCells = formViewdef.find('cell[type="field"], cell[type="subview"]');
        var table = $(templates.formtable({ formNumber: formNumber }));
        var headerRow = table.find('thead tr');
        var bodyRow = table.find('tbody tr');

        _(formTableCells).each(function (cell) {
            var label = $('<label>', {'for': 'specify-field-' + formNumber + '-' + $(cell).attr('id')});
            headerRow.append($('<th>').append(label));
            bodyRow.append(processCell(cell));
        });

        return table;
    }

    function buildForm(formNumber, viewdef, processCell) {
        var rows = viewdef.children('rows').children('row');
        var cellsIn = function(row) { return $(row).children('cell'); };
        var table = processColumnDef(getColumnDef(viewdef));

        _(rows).each(function (row) {
            var tr = $('<tr>').appendTo(table);
            var appendToTr = function(cell) { tr.append(cell); };
            _(cellsIn(row)).chain().map(processCell).each(appendToTr);
        });

        return $(templates.form({ formNumber: formNumber })).find('form').append(table).end();
    }

    function buildView(viewdef, formTableAsForm) {
        var formNumber = formCounter++;
        var doingFormTable = (viewdef.attr('type') === 'formtable');
        var processCell = _.bind(specifyformcells, null, formNumber, doingFormTable && !formTableAsForm);

        var wrapper = $(templates.viewwrapper({ viewModel: getModelFromViewdef(viewdef) }));

        if (doingFormTable) {
            var formViewdef = findViewdef(viewdef.find('definition').text());
            var build = formTableAsForm ? buildForm : buildFormTable;
            build(formNumber, formViewdef, processCell).appendTo(wrapper);
        } else {
            buildForm(formNumber, viewdef, processCell).appendTo(wrapper);
        }
        return wrapper;
    }

    var specifyform = {
        parseSpecifyProperties: parseSpecifyProperties,

        getModelForView: function(viewName) {
            return schema.getModel(getModelFromView(viewName));
        },

        relatedObjectsForm: function(modelName, fieldName, viewdef) {
            if (!viewdef) {
                var related = schema.getModel(modelName).getField(fieldName).getRelatedModel();
                if (!related.view) throw new Error('no default view for ' + related.name);
                viewdef = getDefaultViewdef(findView(related.view)).attr('name');
            }
            return $(templates.relatedobjectsform({
                model: modelName, field: fieldName, viewdef: viewdef
            }));
        },

        recordSetForm: function(model) {
            var viewdef = getDefaultViewdef(findView(model.view)).attr('name');
            return $(templates.recordsetform({ viewdef: viewdef }));
        },

        buildViewByName: function (viewName) {
            var view = findView(viewName);
            if (view.length === 0) {
                return $('<p>').text('View "' + viewName + '" not found!');
            }
            return buildView(getDefaultViewdef(view));
        },

        buildViewByViewDefName: function (viewDefName) {
            var view = findViewdef(viewDefName);
            return view.length ? buildView(view) : undefined;
        },

        getSubViewDef: function (node) {
            node = $(node);
            if (node.data('specify-viewdef'))
                return findViewdef(node.data('specify-viewdef'));

            var subview = findView(node.data('specify-viewname'));
            var viewdef = getDefaultViewdef(subview, node.data('specify-viewtype'));
            return findViewdef(viewdef.attr('name'));
        },

        buildSubView: function (node, formTableAsForm) {
            var view = specifyform.getSubViewDef(node);
            if (!view.length) return;
            return buildView(view, formTableAsForm)
                .find('.specify-form-header:first, :submit, :button[value="Delete"]').remove().end();
        },

        subViewIsFormTable: function (node) {
            var view = specifyform.getSubViewDef(node);
            return view.length && view.attr('type') === 'formtable';
        },

        isSubViewButton: function (node) {
            return node.is('.specify-subview-button');
        }
    };

    return specifyform;
});
