(function (specify, $, undefined) {
    var typesearches;

    function fillinData(data, fieldName, dispatch) {
        var path = $.isArray(fieldName) ? fieldName : fieldName.split('.');
        if (path.length === 1) {
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
        $.get(data[path[0]], function (data) {
            fillinData(data, path.slice(1), dispatch);
        });
    }

    function populatePickList(control, data) {
        var pickListName = control.data('specify-picklist');
        if (!pickListName) return;
        var pickListUri = "/api/specify/picklist/?name=" + pickListName;
        var picklistJQXHR = $.get(pickListUri);
        fillinData(data, control.attr('name'), function (value) {
            picklistJQXHR.success(function (picklistResults) {
                var picklist = picklistResults.objects[0];
                var items = {};
                $(picklist.items).each(function (i, item) {
                    items[item.value] = item;
                    $('<option>').text(item.value).appendTo(control);
                });
                if (!items[value]) {
                    $('<option>')
                        .attr('value', value)
                        .text(value + " (current value not in picklist)")
                        .appendTo(control);
                }
                control.val(value);
            });
        });
    }

    function parseSpecifyProperties(props) {
        var result = {};
        $(props.split(';')).each(function (i, item) {
            var match = /([^=]+)=(.+)/.exec(item);
            var key = match[1], value = match[2];
            key && value && (result[key] = value);
        });
        return result;
    }


    function setupQueryCBX(control, data) {
        control.hide();
        var init = parseSpecifyProperties(control.data('specify-initialize'));
        var typesearch = typesearches.find('[name="'+init.name+'"]');
        var searchfield = typesearch.attr('searchfield').toLowerCase() + '__icontains';
        var displaycols = typesearch.attr('displaycols').toLowerCase().split(',');
        var format = typesearch.attr('format');
        var uri = '/api/specify/' + init.name.toLowerCase() + '/';
        var input = $('<input type="text">').insertBefore(control);

        var formatInterpolate = function (obj) {
            var str = format;
            var vals = displaycols.map(function (col)  { return obj[col]; });
            $(vals).each(function (i, val) { str = str.replace(/%s/, val); });
            return str;
        };

        input.autocomplete({
            minLength: 3,
            source: function (request, response) {
                var query = {};
                query[searchfield] = request.term;
                var jqxhr = $.get(uri, query);
                jqxhr.success(function (data) {
                    response(
                        data.objects.map(function (obj) {
                            var display = formatInterpolate(obj);
                            return {label: display, value: display, uri: obj.resource_uri};
                        })
                    );
                });
                jqxhr.error(function () { response([]); });
            },
            select: function (event, ui) {
                control.val(ui.item.uri);
            },
        });

        var related = data[control.attr('name').toLowerCase()];

        if (related) {
            control.val(related);
            $.get(related, function (obj) {
                input.val(formatInterpolate(obj));
            });
        }
    }

    specify.populateForm = function (viewName, dataOrUri, depth, isOneToMany) {
        depth = depth || 1;

        var form = specify.processView(viewName, depth, isOneToMany);

        var populate = function(data) {
            form.data('specify-uri', data.resource_uri);
            form.find('.specify-field').each(function (i, node) {
                var control = $(node);
                if (node.nodeName == 'SELECT') {
                    populatePickList(control, data);
                } else if (control.is('.specify-querycbx')) {
                    setupQueryCBX(control, data);
                } else {
                    fillinData(data, control.attr('name'), function (value) {
                        if (control.is('input[type="checkbox"]'))
                            control.prop('checked', value);
                        else
                            control.val(value);
                    });
                }
            });

            form.find('.specify-many-to-one').each(function (i, node) {
                var container = $(node);
                var viewName = container.data('specify-view-name');
                var fieldName = container.data('specify-field-name').toLowerCase();
                var subform = specify.populateForm(viewName, data[fieldName], depth + 1);
                subform.appendTo(container);
            });

            form.find('.specify-one-to-many').each(function (i, node) {
                var container = $(node);
                var viewName = container.data('specify-view-name');
                var fieldName = container.data('specify-field-name').toLowerCase();
                $(data[fieldName]).each(function (i, data) {
                    var subform = specify.populateForm(viewName, data, depth + 1, true);
                    subform.appendTo(container);
                });
            });
        };

        if ($.isPlainObject(dataOrUri))
            populate(dataOrUri)
        else
            $.get(dataOrUri, populate);

        return form;
    }

    specify.loadTypeSearches = function () {
        return $.get('/static/typesearch_def.xml', function (data) { typesearches = $(data); });
    };

} (window.specify = window.specify || {}, jQuery));


// Main entry point.
$(function () {
    var uri = "/api/specify/"+view+"/"+id+"/";

    $.when(specify.loadViews(), specify.loadTypeSearches())
        .then(function () {
            $('body').append(specify.populateForm(view, uri));
        });
});
