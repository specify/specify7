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
};


function fillinData(data, fieldName, dispatch) {
    var path = $.isArray(fieldName)? fieldName : fieldName.split('.');
    if (path.length == 1) {
	// the field we want is right in the data object
        dispatch(data[path[0].toLowerCase()]);
        return;
    }
    if ($.isPlainObject(data[path[0]])) {
	// data contains an embedded object that has our field
	fillinData(data[path[0]], path.slice(1), dispatch);
	return;
    }
    // we have to fetch a subobject which contains our field
    $.get(data[path[0]], function(data) {
        fillinData(data, path.slice(1), dispatch);
    });
}

// Produce a DOM structure for the view given by viewName.
// [views] is an object mapping view names to <viewdef> DOM nodes
// [schemaLocalization] is a DOM structure
function renderView(viewName, views, schemaLocalization, uri) {

    // Return a table DOM node with <col> defined based
    // on the columnDef attr of a viewDef.
    function processColumnDef(columnDef) {
        var table = $('<table>');
        $(columnDef.split(',')).each(function(i, def) {
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
    function processView(view, data, depth, suppressHeader) {
        depth = depth || 1;
        if (!view) return $('<div>');
        var form = $('<form>').append($('<p>loading...</p>'));
        var viewModel = $(view).attr('class').split('.').pop();

        var getSchemaInfoFor = function(fieldname) {
            var path = fieldname.split('.');
            var field = path.pop();
            var model = path.pop();
            var localization = model ?
                getLocalizationForModel(model) :
                getLocalizationForModel(viewModel);

            return $(localization).children('items')
                .children('item[name="'+field+'"]');
        };

        var getLocalizedLabelFor = function (fieldname) {
            return getLocalizedStr(
                getSchemaInfoFor(fieldname).children('names'));
        };

        var buildView = function(data) {
            form.empty();

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
                            label.text(givenLabel);
                        } else if (localizedLabel) {
                            label.text(localizedLabel);
                        } else if (forCellName) {
                            label.text(forCellName);
                        }
                        return $('<td>').append(label).addClass('form-label');
                    },
                    field: function() {
                        var td = $('<td>loading...</td>');
                        var fieldName = $(cell).attr('name');
                        var uitypeDispatch = {
                            text: function(fieldData) {
                                td.append($('<input type="text" />')
                                          .attr('name', fieldName)
                                          .val(fieldData));
                            },
                            checkbox: function(fieldData) {
                                var checkbox = $('<input type="checkbox" />')
                                    .attr('name', fieldName)
                                    .val(fieldData);
                                var givenLabel = $(cell).attr('label');
                                var localizedLabel =
                                    getLocalizedLabelFor(fieldName);

                                td.append(checkbox);
                                if (givenLabel) {
                                    td.append($('<label>')
                                              .text(givenLabel)
                                             );
                                } else if (localizedLabel) {
                                    td.append($('<label>')
                                              .text(localizedLabel)
                                             );
                                }
                            },
                            textareabrief: function(fieldData) {
                                td.append($('<textarea />)')
                                          .attr({rows: $(cell).attr('rows'),
                                                 name: fieldName})
                                          .val(fieldData));
                            },
                            querycbx: function(fieldData) {
                                td.append(
                                    $('<select>').attr('name', fieldName)
                                );
                            }
                        };
                        var dispatch = uitypeDispatch[$(cell).attr('uitype')]
                            || uitypeDispatch.text;
                        fillinData(data, fieldName, function(data){ td.empty(); dispatch(data);});
                        return td;
                    },
                    separator: function() {
                        var label = $(cell).attr('label');
                        var elem = label ?
                            $('<h'+(depth+1)+'>').text(label) : $('<hr>');
                        return $('<td>').append(elem.addClass('separator'));
                    },
                    subview: function() {
                        var td = $('<td>');
                        var viewname = $(cell).attr('viewname');
                        if (!views[viewname]) return td;

                        var fieldName = $(cell).attr('name');
                        var fieldData = data[fieldName.toLowerCase()];
                        var schemaInfo = getSchemaInfoFor(fieldName);
                        switch (schemaInfo.attr('type')) {
                        case 'OneToMany':
                            var localizedName = getLocalizedStr(schemaInfo.children('names'));
                            td.append($('<h'+(depth+1)+'>').text(localizedName));
                            $(fieldData).each(function (i, data) {
                                td.append(
                                    processView(views[viewname], data, depth+1, true)
                                    .attr('name', fieldName)
                                );
                            });
                            break;
                        case 'ManyToOne':
                            td.append(
                                processView(views[viewname], fieldData, depth+1)
                                    .attr('name', fieldName)
                            );
                            break;
                        }
                        return td;
                    },
                    panel: function() {
                        var table = processColumnDef($(cell).attr('coldef'));
                        $(cell).children('rows').children('row').each(
                            function(i, row) {
                                var tr = $('<tr>').appendTo(table);
                                $(row).children('cell').each(
                                    function(i, cell) {
                                        tr.append(processCell(cell));
                                    });
                            });
                        return $('<td>').append(table);
                    },
		    command: function() {
			var button = $('<input type="submit">').attr({
			    value: $(cell).attr('label'),
			    name: $(cell).attr('name')
			});
			return $('<td>').append(button);
		    }
                };

                var process = typeDispatch[$(cell).attr('type')];
                var td = process ? process() : $('<td>');
                var colspan = $(cell).attr('colspan');
                colspan && td.attr('colspan', Math.ceil(parseInt(colspan)/2));
                return td;
            };

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
                    $(row).children('cell').each(function(i, cell) {
                        tr.append(processCell(cell));
                    });
                });

            if (!suppressHeader){
                var localizedName = getLocalizedStr(
                    getLocalizationForModel(viewModel).children('names')
                ) || $(view).attr('name');

                form.append($('<h'+depth+'>').text(localizedName));
            }
            form.append(table);
        };

        if ($.isPlainObject(data)) buildView(data);
        else $.get(data, buildView);
        return form;
    }

    return processView(views[viewName], uri);
}


// Processes the viewset DOM to create an object
// mapping viewDef names to the viewDef DOM nodes.
// Allows the views to be merrged easily.
function breakOutViews(viewset) {
    var views = {};
    $(viewset).find('viewdef').each(function(i, view) {
        views[$(view).attr('name')] = view;
    });
    return views;
}

// Main entry point.
$(function () {
    var schemaLocalization;
    var uri = "http://localhost:8000/api/specify/collectionobject/102/";

    $.get('/static/schema_localization.xml', function(data) {
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
            '/static/views.xml'
            //        'manager.botany.views.xml',
        ];

        var viewsets = {}, completed = 0;
        $(viewsetNames).each(function(i, name) {
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
                        renderView(view, views,
                                   schemaLocalization,
                                   '/api/specify/'+view.replace(' ', '').toLowerCase()+'/'+id+'/')
                    );
                }
            });
        });
    };
});
