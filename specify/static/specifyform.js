define(['jquery', 'underscore', 'datamodel',
        'text!resources/system.views.xml',
        'text!resources/editorpanel.views.xml',
        'text!resources/preferences.views.xml',
        'text!resources/search.views.xml',
        'text!resources/global.views.xml',
        'text!resources/common.views.xml',
        'text!resources/fish.views.xml'],

function specifyform($, _, datamodel) {
    "use strict";
    var self = {}, formCounter = 0,
    viewsets = _.chain(arguments).tail(specifyform.length).map($.parseXML).value(),
    views = _.extend.apply({}, _.map(viewsets, breakOutViews)),
    viewdefs = _.extend.apply({}, _.map(viewsets, breakOutViewdefs));

    // Processes the viewset DOM to create an object
    // mapping viewdef names to the viewdef DOM nodes.
    // Allows the views to be merged easily.
    function breakOutViews(viewset) {
        var views = {};
        $('view', viewset).each(function () {
            var view = $(this);
            views[view.attr('name').toLowerCase()] = view;
        });
        return views;
    }

    function breakOutViewdefs(viewset) {
        var viewdefs = {};
        $('viewdef', viewset).each(function () {
            var viewdef = $(this);
            viewdefs[viewdef.attr('name').toLowerCase()] = viewdef;
        });
        return viewdefs;
    }

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
        if (!view.jquery) view = views[view.toLowerCase()];
        return view.attr('class').split('.').pop();
    }

    // Return a table DOM node with <col> defined based
    // on the columnDef attr of a viewdef.
    function processColumnDef(columnDef) {
        var table = $('<table>'),
        colgroup = $('<colgroup>').appendTo(table);
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
                var vd = viewdefs[$(this).attr('viewdef').toLowerCase()];
                if (vd.attr('type') === 'formtable') viewdef = vd;
            });
            if (viewdef) return viewdef;
        }
        var defaultView = view.find('altview[default="true"]').first().attr('viewdef') ||
            view.find('altview').first().attr('viewdef');
        return viewdefs[defaultView.toLowerCase()];
    }

    function getModelFromViewdef(viewdef) {
        return viewdef.attr('class').split('.').pop();
    }

    // Return a <form> DOM node containing the processed view.
    self.buildViewByName = function (viewName) {
        if (!views[viewName.toLowerCase()]) {
            return $('<p>').text('View "' + viewName + '" not found!');
        }
        return buildView(getDefaultViewdef(views[viewName.toLowerCase()]));
    };

    self.buildViewByViewDefName = function (viewDefName) {
        return buildView(viewdefs[viewDefName.toLowerCase()]);
    };

    self.buildSubView = function (node) {
        return buildView(viewdefs[$(node).data('specify-viewdef').toLowerCase()]);
    };

    self.buildViewForModel = function (modelName) {
        return self.buildViewByName(datamodel.getViewForModel(modelName));
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
                            return $('<input type=text>').appendTo(td).attr('readonly', doingFormTable);
                        },
                        label: function() {
                            return $('<input type=text readonly>').appendTo(td);
                        },
                        plugin: function() {
                            return $('<input type=button value="plugin" class="specify-uiplugin">')
                                .appendTo(td).attr('disabled', doingFormTable);
                        },
                        other: function() {
                            td.text("unsupported uitype: " + cell.attr('uitype'));
                        }
                    },
                    initialize = cell.attr('initialize'),
                    control = (byUIType[cell.attr('uitype')] || byUIType.other)();
                    if (control) {
                        control.attr('name', fieldName).addClass('specify-field');
                        id && control.prop('id', id);
                        initialize && control.attr('data-specify-initialize', initialize);
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
                    if (props.btn === 'true') {
                        var button = $('<a href="#" class="specify-subview-button">');
                        id && button.prop('id', id);
                        button.attr({'data-specify-initialize': cell.attr('initialize'),
                                     disabled: doingFormTable});
                        props.align && td.addClass('align-' + props.align);
                        return td.append(button);
                    }
                    td.append('<h3 class="specify-subview-header">');
                    var view = views[cell.attr('viewname').toLowerCase()];
                    if (view === undefined) {
                        return td.text('View "' + cell.attr('viewname') + '" is undefined.');
                    }
                    var subviewdef = getDefaultViewdef(view, cell.attr('defaulttype'));
                    return td.attr('data-specify-viewdef', subviewdef.attr('name'));
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
        $('<h2 class="specify-form-header">').appendTo(outerDiv)
            .append($('<a href="new/' + viewModel + '/">Add</a>'));

        if (doingFormTable) {
            var formViewdef = viewdefs[viewdef.find('definition').text().toLowerCase()];
            var formTableCells = formViewdef.find('cell[type="field"], cell[type="subview"]');
            var headerRow = $('<tr>'), bodyRow = $('<tr class="specify-view-content">');
            bodyRow.prop('id', 'specify-view-' + formNumber);

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
        }
        return outerDiv;
    };

    return self;
});