define([
    'jquery', 'underscore', 'schema', 'specifyformfields', 'specifyformcells', 'parsespecifyproperties', 'processcolumndef',
    'text!/static/html/templates/relatedobjectsform.html',
    'text!/static/html/templates/recordsetform.html',
    'text!/static/resources/system.views.xml',
    'text!/static/resources/editorpanel.views.xml',
    'text!/static/resources/preferences.views.xml',
    'text!/static/resources/search.views.xml',
    'text!/static/resources/global.views.xml',
    'text!/static/resources/common.views.xml',
    'text!/static/resources/fish.views.xml'
], function specifyform($, _, schema, processField, processCell, parseSpecifyProperties, processColumnDef,
                        relatedobjectsformHtml, recordsetformHtml) {
    "use strict";
    var self = {}, formCounter = 0;
    var viewsets = _.chain(arguments).tail(specifyform.length).map($.parseXML).value().reverse();
    var relatedObjectsFormTmpl = _.template(relatedobjectsformHtml);
    var recordSetFormTmpl = _.template(recordsetformHtml);

    self.relatedObjectsForm = function(modelName, fieldName, viewdef) {
        if (!viewdef) {
            var related = schema.getModel(modelName).getField(fieldName).getRelatedModel();
            if (!related.view) throw new Error('no default view for ' + related.name);
            viewdef = getDefaultViewdef(findView(related.view)).attr('name');
        }
        return $(relatedObjectsFormTmpl({
            model: modelName, field: fieldName, viewdef: viewdef
        }));
    };

    self.recordSetForm = function(model) {
        var viewdef = getDefaultViewdef(findView(model.view)).attr('name');
        return $(recordSetFormTmpl({ viewdef: viewdef }));
    };

    function find(selector, sets, name) {
        name = name.toLowerCase();
        var result = $();
        _.find(sets, function(set) {
            result = $(selector, set).filter(function() {
                return $(this).attr('name').toLowerCase() === name;
            });
            return result.length;
        });
        return result;
    }

    var findView = self.findView = _.bind(find, this, 'view', viewsets);
    var findViewdef = _.bind(find, this, 'viewdef', viewsets);

    // helper function that pulls name value pairs out of property strings
    self.parseSpecifyProperties = parseSpecifyProperties;

    function getModelFromView(view) {
        view = _(view).isString() ? findView(view) : view;
        return view.attr('class').split('.').pop();
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
    self.getDefaultViewdef = getDefaultViewdef;

    function getModelFromViewdef(viewdef) {
        return viewdef.attr('class').split('.').pop();
    }

    // Return a <form> DOM node containing the processed view.
    self.buildViewByName = function (viewName) {
        var view = findView(viewName);
        if (view.length === 0) {
            return $('<p>').text('View "' + viewName + '" not found!');
        }
        return buildView(getDefaultViewdef(view));
    };

    self.buildViewByViewDefName = function (viewDefName) {
        var view = findViewdef(viewDefName);
        return view.length ? buildView(view) : undefined;
    };

    self.getSubViewDef = function (node) {
        node = $(node);
        if (node.data('specify-viewdef'))
            return findViewdef(node.data('specify-viewdef'));

        var subview = self.findView(node.data('specify-viewname'));
        var viewdef = self.getDefaultViewdef(subview, node.data('specify-viewtype'));
        return findViewdef(viewdef.attr('name'));
    }

    self.buildSubView = function (node) {
        var view = self.getSubViewDef(node);
        if (!view.length) return;
        return buildView(view).find('.specify-form-header:first, :submit, :button[value="Delete"]').remove().end();
    };

    self.subViewIsFormTable = function (node) {
        var view = self.getSubViewDef(node);
        return view.length && view.attr('type') === 'formtable';
    }

    self.isSubViewButton = function (node) {
        return node.is('.specify-subview-button');
    };


    function buildView(viewdef) {
        var formNumber = formCounter++;
        var viewModel = getModelFromViewdef(viewdef),
        doingFormTable = (viewdef.attr('type') === 'formtable');

        var outerDiv = $('<div>').attr('data-specify-model', viewModel);
        $('<h2 class="specify-form-header">').appendTo(outerDiv);

        if (doingFormTable) {
            var formViewdef = findViewdef(viewdef.find('definition').text());
            var formTableCells = formViewdef.find('cell[type="field"], cell[type="subview"]');
            var headerRow = $('<tr><th></th></tr>'), bodyRow = $('<tr class="specify-view-content">');
            bodyRow.prop('id', 'specify-view-' + formNumber);
            bodyRow.append('<td><a class="specify-edit"><span class="ui-icon ui-icon-pencil">edit</span></a></td>');
            formTableCells.each(function () {
                var label = $('<label>', {'for': 'specify-field-' + formNumber + '-' + $(this).attr('id')});
                headerRow.append($('<th>').append(label));
                bodyRow.append(processCell(formNumber, doingFormTable, this));
            });

            table = $('<table class="specify-formtable">');
            table.append($('<thead>').append(headerRow));
            table.append($('<tbody class="specify-view-content-container">').append(bodyRow));
            outerDiv.append(table);
        } else {
            var colDef = viewdef.find('columnDef[os="lnx"]').first().text() ||
                viewdef.find('columnDef').first().text();
            var table = processColumnDef(colDef);

            viewdef.children('rows').children('row').each(function () {
                var tr = $('<tr>').appendTo(table);
                $(this).children('cell').each(function () { processCell(formNumber, doingFormTable, this).appendTo(tr); });
            });

            var form = $('<form class="specify-view-content">').append(table);
            form.prop('id', 'specify-view-' + formNumber);
            outerDiv.append($('<div class="specify-view-content-container">').append(form));
            outerDiv.append('<input type="submit">').append('<input type="button" value="Delete">');
        }
        return outerDiv;
    };

    return self;
});