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

    function buildView(view) {
        var viewdef = $($.parseXML(view.viewdef)).find('viewdef');
        var definition = view.viewdefDefinition ?
            $($.parseXML(view.viewdefDefinition)).find('viewdef')
            : viewdef;

        var formNumber = formCounter++;
        var doingFormTable = viewdef.attr('type') === 'formtable';
        var processCell = _.bind(specifyformcells, null, formNumber, doingFormTable);

        var wrapper = $(templates.viewwrapper({ viewModel: getModelFromViewdef(definition) }));

        (doingFormTable ? buildFormTable : buildForm)(formNumber, definition, processCell).appendTo(wrapper);
        return wrapper;
    }

    function getSubViewDef(node) {
        node = $(node);
        var subview = findView(node.data('specify-viewname'));
        return getDefaultViewdef(subview, node.data('specify-viewtype'));
    }

    function getView(viewName, type, mode) {
        return $.getJSON('/context/view.json', {
            view: viewName,
            type: type || 'form',
            mode: mode || 'edit'
        });
    }

    var specifyform = {
        parseSpecifyProperties: parseSpecifyProperties,

        getModelForView: function(viewName) {
            return schema.getModel(getModelFromView(viewName));
        },

        buildViewByName: function (viewName) {
            return getView(viewName).pipe(buildView);
        },

        buildSubView: function (node) {
            return getView(
                node.data('specify-viewname'),
                specifyform.subViewIsFormTable(node) ? 'formtable' : 'form'
            ).pipe(function(view) {
                return buildView(view).find('.specify-form-header:first, :submit, :button[value="Delete"]').remove().end();
            });
        },

        subViewIsFormTable: function (node) {
            return node.data('specify-viewtype') === 'table';
        },

        isSubViewButton: function (node) {
            return node.is('.specify-subview-button');
        }
    };

    return specifyform;
});
