define([
    'jquery', 'underscore', 'schema',
    'text!/static/html/templates/relatedobjectsform.html',
    'text!/static/html/templates/recordsetform.html',
    'text!/static/resources/system.views.xml',
    'text!/static/resources/editorpanel.views.xml',
    'text!/static/resources/preferences.views.xml',
    'text!/static/resources/search.views.xml',
    'text!/static/resources/global.views.xml',
    'text!/static/resources/common.views.xml',
    'text!/static/resources/fish.views.xml'
], function specifyform($, _, schema, relatedobjectsformHtml, recordsetformHtml) {
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

    var findView = _.bind(find, this, 'view', viewsets);
    var findViewdef = _.bind(find, this, 'viewdef', viewsets);

    // helper function that pulls name value pairs out of property strings
    self.parseSpecifyProperties = function(props) {
        props = props || '';
        var result = {};
        $(props.split(';')).each(function () {
            var match = /([^=]+)=(.+)/.exec(this);
            if (!match) return;
            var key = match[1], value = match[2];
            if (key) { result[key] = value; }
        });
        return result;
    }

    function getModelFromView(view) {
        view = _(view).isString() ? findView(view) : view;
        return view.attr('class').split('.').pop();
    }

    // Return a table DOM node with <col> defined based
    // on the columnDef attr of a viewdef.
    function processColumnDef(columnDef) {
        var table = $('<table>'), colgroup = $('<colgroup>').appendTo(table);
        $(columnDef.split(',')).each(function(i) {
            if (i%2 === 0) {
                var col = $('<col>').appendTo(colgroup),
                width = /(\d+)px/.exec(this);
                width && col.attr('width', width[1]+'px');
            }
        });
        return table;
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

    self.buildSubView = function (node) {
        var view = findViewdef($(node).data('specify-viewdef'));
        if (!view.length) return;
        return buildView(view).find('.specify-form-header:first, :submit, :button[value="Delete"]').remove().end();
    };

    self.subViewIsFormTable = function (node) {
        var viewdef = $(node).data('specify-viewdef');
        if (!viewdef) return false;
        var view = findViewdef(viewdef);
        return view.length && view.attr('type') === 'formtable';
    }

    self.isSubViewButton = function (node) {
        return node.is('.specify-subview-button');
    };

    function buildView(viewdef) {
        var formNumber = formCounter++;
        var viewModel = getModelFromViewdef(viewdef),
        doingFormTable = (viewdef.attr('type') === 'formtable');

        var processCell = function(cellNode) {
            var cell = $(cellNode),
            id = cell.attr('id') ? 'specify-field-' + formNumber + '-' + cell.attr('id') : undefined,
            byType = {
                label: function() {
                    var label = $('<label>');
                    if (cell.attr('label') !== undefined)
                        label.text(cell.attr('label'));
                    var labelfor = cell.attr('labelfor');
                    labelfor && label.prop('for', 'specify-field-' + formNumber + '-' + labelfor);
                    return $('<td class="specify-form-label">').append(label);
                },
                field: function() {
                    var td = $('<td>'),
                    fieldName = cell.attr('name'),
                    byUIType = {
                        checkbox: function() {
                            var control = $('<input type=checkbox>').appendTo(td);
                            var labelOR = cell.attr('label');
                            if (doingFormTable) {
                                if (labelOR !== undefined) {
                                    control.attr('data-specify-field-label-override', labelOR);
                                }
                                return control.attr('disabled', true);
                            }
                            var label = $('<label>').appendTo(td);
                            id && label.prop('for', id);
                            labelOR && label.text(cell.attr('label'));
                            return control;
                        },
                        textarea: function () {
                            if (doingFormTable)
                                return $('<input type=text readonly>').appendTo(td);
                            var control = $('<textarea>)').appendTo(td);
                            cell.attr('rows') && control.attr('rows', cell.attr('rows'));
                            return control;
                        },
                        textareabrief: function() {
                            if (doingFormTable)
                                return $('<input type=text readonly>').appendTo(td);
                            return $('<textarea>').attr('rows', cell.attr('rows') || 1).appendTo(td);
                        },
                        combobox: function() {
                            var control = $('<select class="specify-combobox">').appendTo(td);
                            control.attr('disabled', doingFormTable);
                            return control;
                        },
                        querycbx: function() {
                            return $('<input type=text class="specify-querycbx">').appendTo(td)
                                .attr('readonly', doingFormTable);
                        },
                        text: function() {
                            return $('<input type=text>').appendTo(td).attr('readonly', doingFormTable);
                        },
                        dsptextfield: function() {
                            return $('<input type=text readonly>').appendTo(td);
                        },
                        formattedtext: function() {
                            return $('<input type=text class="specify-formattedtext">').appendTo(td)
                                .attr('readonly', doingFormTable);
                        },
                        label: function() {
                            return $('<input type=text readonly>').appendTo(td);
                        },
                        plugin: function() {
                            return $('<input type=button value="plugin" class="specify-uiplugin">')
                                .appendTo(td).attr('disabled', doingFormTable);
                        },
                        browse: function() {
                            return $('<input type=file>').appendTo(td);
                        },
                        other: function() {
                            td.text("unsupported uitype: " + cell.attr('uitype'));
                        }
                    },
                    initialize = cell.attr('initialize'),
                    isRequired = cell.attr('isrequired'),
                    control = (byUIType[cell.attr('uitype') || 'text'] || byUIType.other)();
                    if (control) {
                        control.attr('name', fieldName).addClass('specify-field');
                        id && control.prop('id', id);
                        initialize && control.attr('data-specify-initialize', initialize);
                        if (isRequired && isRequired.toLowerCase() === 'true') {
                            control.addClass('specify-required-field');
                        }
                    }
                    return td;
                },
                separator: function() {
                    var label = cell.attr('label'),
                    elem = label ? $('<h3>').text(label) : $('<hr>');
                    return $('<td>').append(elem.addClass('separator'));
                },
                subview: function() {
                    var td = $('<td class="specify-subview">'),
                    props = self.parseSpecifyProperties(cell.attr('initialize'));
                    td.attr('data-specify-field-name', cell.attr('name'));
                    var view = findView(cell.attr('viewname'));
                    if (view === undefined) {
                        return td.text('View "' + cell.attr('viewname') + '" is undefined.');
                    }
                    var subviewdef = getDefaultViewdef(view, cell.attr('defaulttype'));
                    td.attr('data-specify-viewdef', subviewdef.attr('name'));
                    if (props.btn === 'true') {
                        td.addClass('specify-subview-button');
                        id && td.prop('id', id);
                        td.attr('data-specify-initialize', cell.attr('initialize'));
                        props.align && td.addClass('align-' + props.align);
                    }
                    return td;
                },
                panel: function() {
                    var table = processColumnDef(cell.attr('coldef'));
                    cell.children('rows').children('row').each(function () {
                        var tr = $('<tr>').appendTo(table);
                        $(this).children('cell').each(function() {
                            tr.append(processCell(this));
                        });
                    });
                    return $('<td>').append(table);
                },
	        command: function() {
		    var button = $('<input type=button>').attr({
		        value: cell.attr('label'),
		        name: cell.attr('name')
		    });
		    return $('<td>').append(button);
	        },
                other: function() {
                    return $('<td>').text("unsupported cell type: " + cell.attr('type'));
                }
            },

            td = (byType[cell.attr('type')] || byType.other)(),
            colspan = cell.attr('colspan');
            if (!doingFormTable && colspan) {
                td.attr('colspan', Math.ceil(parseInt(colspan)/2));
            }
            return td;
        };

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
                bodyRow.append(processCell(this));
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
                $(this).children('cell').each(function () { processCell(this).appendTo(tr); });
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