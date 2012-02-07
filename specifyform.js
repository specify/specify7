var language = "en";

// Given a DOM containing alternative localizations,
// return the one for the language selected above,
// or failing that, for "en", or failing that,
// just return the first one.

var getLocalizedStr = function(alternatives) {
    var str = $(alternatives)
        .children('str[language="'+language+'"]');
    if (str.length < 1) {
        str = $(alternatives)
            .children('str[language="en"]');
    }
    if (str.length < 1) {
        str = $(alternatives).children('str').first();
    }
    return str.children('text').text().replace(/\\n/g, "\n");
}


// Produce a DOM structure for the view given by viewName.
// [views] is an object mapping view names to <viewdef> DOM nodes
// [schemaLocalization] is a DOM structure
function renderView(viewName, views, schemaLocalization) {

    // Return a table DOM node with <col> defined based
    // on the columnDef attr of a viewDef.
    function processColumnDef(columnDef) {
        var table = $('<table>');
        $.each(
            columnDef.split(','),
            function(i, def) {
                if (i%2==0) {
                    var col = $('<col>').appendTo(table);
                    var width = /(\d+)px/.exec(def);
                    width && col.attr('width', width[1]+'px');
                }
            });
        return table;
    }

    // Search the schema_localization DOM for the given modelName.
    function getLocalizationForModel(modelName) {
        return $(schemaLocalization)
            .find('container[name="'+modelName.toLowerCase()+'"]').first();
    }

    // Return a <div> DOM node containing the processed view.
    // Subviews result in recursive calls where depth is
    // incremented each time
    function processView(view, depth) {
        if (!view) return $('<div>');
        depth = depth || 1;

        var viewModel = $(view).attr('class').split('.').pop();

        var getLocalizedLabelFor = function (fieldname) {
            var path = fieldname.split('.');
            var field = path.pop();
            var model = path.pop();
            var localization = model ?
                getLocalizationForModel(model) :
                getLocalizationForModel(viewModel);

            return getLocalizedStr(
                $(localization).children('items')
                    .children('item[name="'+field+'"]')
                    .children('names')
            );
        }

        var processCell = function(cell) {
            var typeDispatch = {
                label: function() {
                    var givenLabel = $(cell).attr('label');
                    var labelfor = $(cell).attr('labelfor');
                    var forCellName = $(view)
                        .find('cell[id="'+labelfor+'"]')
                        .first().attr('name');
                    var localizedLabel = getLocalizedLabelFor(forCellName);
                    var label = $('<label>');
                    if (givenLabel) {
                        label.text(givenLabel)
                    } else if (localizedLabel) {
                        label.text(localizedLabel);
                    } else if (forCellName) {
                        label.text(forCellName);
                    }
                    return $('<td>').append(label).addClass('form-label');
                },
                field: function() {
                    var fieldName = $(cell).attr('name');
                    var uitypeDispatch = {
                        text: function() {
                            return $('<td>')
                                .append($('<input type="text" />')
                                        .attr('name', fieldName));
                        },
                        checkbox: function() {
                            var checkbox = $('<input type="checkbox" />')
                                .attr('name', fieldName);
                            var givenLabel = $(cell).attr('label');
                            var localizedLabel =
                                getLocalizedLabelFor(fieldName);

                            var td = $('<td>').append(checkbox);
                            if (givenLabel) {
                                td.append($('<label>')
                                          .text(givenLabel)
                                         );
                            } else if (localizedLabel) {
                                td.append($('<label>')
                                          .text(localizedLabel)
                                         );
                            }
                            return td;
                        },
                        textareabrief: function() {
                            return $('<td>')
                                .append($('<textarea />)')
                                        .attr({rows: $(cell).attr('rows'),
                                               name: fieldName}));
                        },
                        querycbx: function() {
                            return $('<td>').append(
                                $('<select>').attr('name', fieldName)
                            );
                        }
                    };
                    var dispatch = uitypeDispatch[$(cell).attr('uitype')]
                        || uitypeDispatch.text;
                    return dispatch();
                },
                separator: function() {
                    var label = $(cell).attr('label');
                    var elem = label ?
                        $('<h'+(depth+1)+'>').text(label) : $('<hr>');
                    return $('<td>').append(elem.addClass('separator'));
                },
                subview: function() {
                    var viewname = $(cell).attr('viewname');
                    var td = $('<td>');
                    views[viewname] &&
                        td.append(processView(views[viewname], depth+1));
                    return td;
                },
                panel: function() {
                    var table = processColumnDef($(cell).attr('coldef'));
                    $.each($(cell).children('rows').children('row'),
                           function(i, row) {
                               var tr = $('<tr>').appendTo(table);
                               $.each($(row).children('cell'),
                                      function(i, cell) {
                                          tr.append(processCell(cell));
                                      });
                           });
                    return $('<td>').append(table);
                }
            };

            var process = typeDispatch[$(cell).attr('type')];
            var td = process ? process() : $('<td>');
            var colspan = $(cell).attr('colspan');
            colspan && td.attr('colspan', Math.ceil(parseInt(colspan)/2));
            return td;
        }

        var table = processColumnDef(
            $(view).find('columnDef').first().text()
        );

        // Iterate over the rows and cells of the view
        // processing each in turn and appending them
        // to the generated <table>.
        $.each(
            $(view).children('rows').children('row'),
            function(i, row) {
                var tr = $('<tr>').appendTo(table);
                $.each($(row).children('cell'), function(i, cell) {
                    tr.append(processCell(cell));
                });
            });

        var localizedName = getLocalizedStr(
            getLocalizationForModel(viewModel).children('names')
        ) || $(view).attr('name');

        return $('<div>').
            append($('<h'+depth+'>').
                   text(localizedName)).
            append(table);
    }

    return processView(views[viewName]);
}


// Processes the viewset DOM to create an object
// mapping viewDef names to the viewDef DOM nodes.
// Allows the views to be merrged easily.
function breakOutViews(viewset) {
    var views = {};
    $.each($(viewset).find('viewdef'), function(i, view) {
        views[$(view).attr('name')] = view;
    });
    return views;
}

// Main entry point.
$(function () {
    var schemaLocalization;

    $.get('schema_localization.xml', function(data) {
        schemaLocalization = data;
        loadViews();
    });

    // Load all views and merge them such that
    // those listed first are overriden by
    // the ones listed later.
    var loadViews = function() {
        var viewsetNames = [
            //        'system.views.xml',
            //        'editorpanel.views.xml',
            //        'preferences.views.xml',
            //        'global.views.xml',
            //        'search.views.xml',
            'views.xml',
            //        'manager.botany.views.xml',
        ];

        var viewsets = {}, completed = 0;
        $.each(viewsetNames, function(i, name) {
            $.get(name, function(viewset) {
                completed++;
                viewsets[name] = viewset;
                if (completed == viewsetNames.length) {
                    var orderedViews = $.merge(
                        [{}], viewsetNames.map(function(name) {
                            return breakOutViews(viewsets[name]);
                        }));
                    var views = $.extend.apply($, orderedViews);
                    $('body').append(
                        renderView('Collection Object', views,
                                   schemaLocalization)
                    );
                }
            });
        });
    }
});
