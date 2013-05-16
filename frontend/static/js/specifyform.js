define([
    'jquery', 'underscore', 'schema', 'specifyformcells', 'parsespecifyproperties',
    'processcolumndef', 'templates'
], function specifyform(
    $, _, schema, specifyformcells, parseSpecifyProperties,
    processColumnDef, templates
) {
    "use strict";
    var formCounter = 0;

    function getModelFromViewdef(viewdef) {
        return viewdef.attr('class').split('.').pop();
    }

    function getColumnDef(viewdef) {
        return viewdef.find('columnDef[os="lnx"]').first().text() || viewdef.find('columnDef').first().text();
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

    function buildView(view, defaultType, mode) {
        defaultType || (defaultType = 'form');
        mode || (mode = 'edit');
        var altviews = _.filter(view.altviews, function(av) { return av.mode == mode; });
        altviews.length > 0 || (altviews = view.altviews);

        var viewdefs = {};
        _.each(view.viewdefs, function(xml, name) {
            viewdefs[name] = $($.parseXML(xml)).find('viewdef');
        });

        var viewdef;
        var altview = _.find(altviews, function(av) {
            viewdef = viewdefs[av.viewdef];
            return viewdef.attr('type') === defaultType;
        });

        if (!altview) {
            altview = _.first(altviews);
            viewdef = viewdefs[altview.viewdef];
        }

        var definition = viewdef.find('definition').text();
        var actual_viewdef = definition ? viewdefs[definition] : viewdef;

        var formNumber = formCounter++;
        var doingFormTable = viewdef.attr('type') === 'formtable';
        var processCell = _.bind(specifyformcells, null, formNumber, doingFormTable,
                                 mode === 'search' ? 'search' : altview.mode);

        var wrapper = $(templates.viewwrapper({ viewModel: getModelFromViewdef(actual_viewdef) }));

        (doingFormTable ? buildFormTable : buildForm)(formNumber, actual_viewdef, processCell).appendTo(wrapper);
        wrapper.addClass('specify-form-type-' + viewdef.attr('type'));
        wrapper.attr('data-specify-altview-mode', altview.mode);
        wrapper.attr('data-specify-form-mode', mode === 'view' ? 'view' : altview.mode);
        return wrapper;
    }

    function getView(name) {
        return $.getJSON('/context/view.json', {name: name});
    }

    var specifyform = {
        parseSpecifyProperties: parseSpecifyProperties,
        getView: getView,

        buildViewByName: function (viewName, defaultType, mode) {
            if (viewName === "ObjectAttachment") {
                return $.when($(templates.attachmentview()));
            }
            return getView(viewName).pipe(function(view) { return buildView(view, defaultType, mode); });
        },

        buildSubView: function (node) {
            var defaultType = node.data('specify-viewtype') === 'table' ? 'formtable' : 'form';
            var viewName = node.data('specify-viewname');
            var mode = node.data('specify-viewmode');
            var buildView = specifyform.buildViewByName(viewName, defaultType, mode);

            return buildView.pipe(function(form) {
                form.find('.specify-form-header:first, :submit, :button[value="Delete"]').remove();
                return form;
            });
        },

        isSubViewButton: function (node) {
            return node.is('.specify-subview-button');
        },

        subViewMode: function (node) {
            return node.data('specify-viewmode');
        },

        getFormMode: function (node) {
            return node.data('specify-form-mode');
        }
    };

    return specifyform;
});
