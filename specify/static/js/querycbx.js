define([
    'jquery', 'specifyapi', 'specifyform', 'text!/static/resources/typesearch_def.xml'
], function ($, api, specifyform, xml) {
    var typesearches = $.parseXML(xml);

    return function (control, resource) {
        // The main querycbx control is hidden and the user interacts
        // with an autocomplete field.
        control.hide();
        var init = specifyform.parseSpecifyProperties(control.data('specify-initialize')),
        controlID = control.prop('id'),
        typesearch = $('[name="'+init.name+'"]', typesearches), // defines the querycbx
        searchfield = typesearch.attr('searchfield'),
        displaycols = typesearch.attr('displaycols').split(','),
        format = typesearch.attr('format'),
        table = $('<div class="querycbx-strct">').insertBefore(control),
        input = $('<input type=text>').appendTo(table), // autocomplete field
        link = $('<a><span class="ui-icon ui-icon-pencil">edit</span></a>');
        link.click(function(evt) {
            Backbone.history.navigate($(this).attr('href').replace('/specify/', ''), true);
            evt.preventDefault();
        });

        control.hasClass('specify-required-field') && input.addClass('specify-required-field');
        control.prop('readonly') || link.appendTo(table);

        // format the query results according to formatter in the typesearch
        var formatInterpolate = function (resource) {
            var str = format;
            _.chain(displaycols).map(function(col)  {
                return resource.get(col);
            }).each(function (val) {
                str = str.replace(/%s/, val);
            });
            return str;
        };

        // change the label to point to the autocomplete field instead of the hidden control
        if (controlID) {
            input.prop('id', controlID + '-autocomplete');
            control.parents().last().find('label[for="' + controlID + '"]').prop('for', input.prop('id'));
        }

        input.autocomplete({
            minLength: 3,
            source: function (request, response) {
                var collection = api.queryCbxSearch(init.name, searchfield, request.term);
                collection.fetch().done(function() {
                    response(collection.map(function(resource) {
                        var display = formatInterpolate(resource);
                        return { label: display, value: display, resource: resource };
                    }));
                }).fail(function() { response([]); });
            },
            select: function (event, ui) {
                control.val(ui.item.resource.url());
                resource && resource.set(control.attr('name'), control.val());
                link.attr('href', ui.item.resource.viewUrl());
            }
        }).prop('readonly', control.prop('readonly'));

        if (resource) {
            // fill in the initial value
            return resource.rget(control.attr('name')).pipe(function(related) {
                if (related) {
                    control.val(related.url());
                    link.attr('href', related.viewUrl());
                    return related.fetchIfNotPopulated().done(function() {
                        input.val(formatInterpolate(related));
                    });
                }
            });
        }
    };
});
