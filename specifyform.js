var language = "en";

function renderView(viewName, views, schemaLocalization) {

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

    function processView(view, depth) {
        if (!view) return $('<div>');
        depth = depth || 1;

        var modelName = $(view).attr('class').split('.').pop();
        var localization = $(schemaLocalization)
            .find('container[format="'+modelName+'"]').first();

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
            return str.length ?
                $(str).children('text').first().text() : null;
        }

        var processCell = function(cell) {
            var typeDispatch = {
                label: function() {
                    var givenLabel = $(cell).attr('label');
                    var labelfor = $(cell).attr('labelfor');
                    var forCellName = $(view)
                        .find('cell[id="'+labelfor+'"]')
                        .first().attr('name');

                    var localizedLabel = getLocalizedStr(
                        $(localization).children('items')
                            .children('desc[name="'+forCellName+'"]')
                            .children('names'));

                    var label = $('<label>');
                    if (localizedLabel) {
                        label.text(localizedLabel);
                    } else if (givenLabel) {
                        label.text(givenLabel)
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
                            var localizedLabel = getLocalizedStr(
                                $(localization).children('items')
                                    .children('desc[name="'+fieldName+'"]')
                                    .children('names'));

                            var td = $('<td>');
                            if (localizedLabel) {
                                td.append($('<label>')
                                          .text(localizedLabel)
                                         );
                            } else if (givenLabel) {
                                td.append($('<label>')
                                          .text(givenLabel)
                                         );
                            }
                            return td.append(checkbox)
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
                    var subview = $(views)
                        .find('viewdef[name="'+viewname+'"]').first();
                    var td = $('<td>');
                    if (subview.length)
                        td.append(processView(subview, depth+1));
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

        $.each(
            $(view).children('rows').children('row'),
            function(i, row) {
                var tr = $('<tr>').appendTo(table);
                $.each($(row).children('cell'), function(i, cell) {
                    tr.append(processCell(cell));
                });
            });

        var localizedName =
            getLocalizedStr($(localization).children('names'))
            || $(view).attr('name');

        return $('<div>').
            append($('<h'+depth+'>').
                   text(localizedName)).
            append(table);
    }

    var view = $(views).find('viewdef[name="'+viewName+'"]').first();
    return processView(view);
}

$(function () {
    $.get('schema_localization.xml', function(schemaLocalization) {
        $.get('views.xml', function(views) {
            $('body').append(
                renderView('Collection Object', views, schemaLocalization)
            );
        });
    });
});
