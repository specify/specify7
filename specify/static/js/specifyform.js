define([
    'jquery', 'underscore', 'schema', 'specifyformcells', 'parsespecifyproperties', 'processcolumndef',
    'text!/static/html/templates/relatedobjectsform.html',
    'text!/static/html/templates/recordsetform.html',
    'text!/static/html/templates/formtemplate.html',
    'text!/static/html/templates/formtabletemplate.html',
    'text!/static/html/templates/viewwrappertemplate.html',
    'text!/static/resources/system.views.xml',
    'text!/static/resources/editorpanel.views.xml',
    'text!/static/resources/preferences.views.xml',
    'text!/static/resources/search.views.xml',
    'text!/static/resources/global.views.xml',
    'text!/static/resources/common.views.xml',
    'text!/static/resources/fish.views.xml'
], function specifyform($, _, schema, specifyformcells, parseSpecifyProperties, processColumnDef,
                        relatedobjectsformHtml, recordsetformHtml, formtemplateHtml, formtabletemplateHtml, viewwrappertemplateHtml) {
    "use strict";
    var self = {}, formCounter = 0;
    var viewsets = _.chain(arguments).tail(specifyform.length).map($.parseXML).value().reverse();
    var relatedObjectsFormTmpl = _.template(relatedobjectsformHtml);
    var recordSetFormTmpl = _.template(recordsetformHtml);
    var formTmpl = _.template(formtemplateHtml);
    var formtableTmpl = _.template(formtabletemplateHtml);
    var viewWrapperTmpl = _.template(viewwrappertemplateHtml);

    self.parseSpecifyProperties = parseSpecifyProperties;

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


    function buildFormTable(formNumber, formViewdef, processCell) {
        var formTableCells = formViewdef.find('cell[type="field"], cell[type="subview"]');
        var table = $(formtableTmpl({ formNumber: formNumber }));
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
        var colDef = viewdef.find('columnDef[os="lnx"]').first().text() ||
            viewdef.find('columnDef').first().text();
        var rows = viewdef.children('rows').children('row');
        var cells = function(row) { return $(row).children('cell'); };
        var table = processColumnDef(colDef);

       _(rows).each(function (row) {
           var tr = $('<tr>').appendTo(table);
           _(cells(row)).chain().map(processCell).each(function (processedCell) {
               tr.append(processedCell);
           });
       });

        return $(formTmpl({ formNumber: formNumber })).find('form').append(table).end();
    }

    function buildView(viewdef) {
        var formNumber = formCounter++;
        var doingFormTable = (viewdef.attr('type') === 'formtable');
        var processCell = _.bind(specifyformcells, null, formNumber, doingFormTable);

        var wrapper = $(viewWrapperTmpl({ viewModel: getModelFromViewdef(viewdef) }));

        if (doingFormTable) {
            var formViewdef = findViewdef(viewdef.find('definition').text());
            wrapper.append(buildFormTable(formNumber, formViewdef, processCell));
        } else {
            wrapper.append(buildForm(formNumber, viewdef, processCell));
        }
        return wrapper;
    };

    return self;
});