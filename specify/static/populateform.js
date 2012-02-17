(function (specify, $, undefined) {
    "use strict";
    var typesearches;

    // Some fields referrence data in related objects. E.g. Collectors
    // referrences agent.lastName and agent.firstName. So we may have to
    // traverse the object tree to get the values we need. It is also
    // possible the related object is not included and has to be fetched,
    // so we will have to wait for the fetch to occur. Thus, this function.
    // The top level data is in [data], and the field we need is named
    // by [fieldName]. When the value is available (usually immediately)
    // [dispatch] is called with the value as the argument.
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
        if (!pickListName) { return; }
        var pickListUri = "/api/specify/picklist/?name=" + pickListName,
        picklistJQXHR = $.get(pickListUri); // begin fetching the picklist

        fillinData(data, control.attr('name'), function (value) {
            // When the selected value is available from fillinData
            // add a success callback to the picklist fetch that
            // will fill in the options and select the current value.
            picklistJQXHR.success(function (picklistResults) {
                var picklist = picklistResults.objects[0], items = {};
                $(picklist.items).each(function () {
                    items[this.value] = this;
                    $('<option>').text(this.value).appendTo(control);
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

    // helper function that pulls name value pairs out of property strings
    function parseSpecifyProperties(props) {
        var result = {};
        $(props.split(';')).each(function () {
            var match = /([^=]+)=(.+)/.exec(this),
            key = match[1], value = match[2];
            if (key && value) { result[key] = value; }
        });
        return result;
    }

    function setupQueryCBX(control, data) {
        // The main querycbx control is hidden and the user interacts
        // with an autocomplete field.
        control.hide();
        var init = parseSpecifyProperties(control.data('specify-initialize')),
        typesearch = typesearches.find('[name="'+init.name+'"]'), // defines the querycbx
        searchfield = typesearch.attr('searchfield').toLowerCase() + '__icontains',
        displaycols = typesearch.attr('displaycols').toLowerCase().split(','),
        format = typesearch.attr('format'),
        uri = '/api/specify/' + init.name.toLowerCase() + '/', // uri to query values
        input = $('<input type="text">').insertBefore(control), // autocomplete field

        // format the query results according to formatter in the typesearch
        formatInterpolate = function (obj) {
            var str = format,
            vals = displaycols.map(function (col)  { return obj[col]; });
            $(vals).each(function () { str = str.replace(/%s/, this); });
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
            }
        });

        // fill in the initial value
        var related = data[control.attr('name').toLowerCase()];
        if (related) {
            control.val(related);
            $.get(related, function (obj) {
                input.val(formatInterpolate(obj));
            });
        }
    }

    // This function is the main entry point for this module. It calls
    // the processView function in specifyform.js to build the forms
    // then fills them in with the given data or pointer to data.
    specify.populateForm = function (viewName, dataOrUri, depth, isOneToMany) {
        depth = depth || 1;

        // Build the form DOM. These could be prebuilt and persisted somewhere,
        // in which case we would just select the relavent node from the
        // preloaded html. This may be necessary for accessibility.
        var form = specify.processView(viewName, depth, isOneToMany),

        populate = function(data) {
            form.data('specify-uri', data.resource_uri);
            // fill in all the fields
            form.find('.specify-field').each(function () {
                var control = $(this);
                if (control.prop('nodeName') === 'SELECT') {
                    populatePickList(control, data);
                } else if (control.is('.specify-querycbx')) {
                    setupQueryCBX(control, data);
                } else {
                    fillinData(data, control.attr('name'), function (value) {
                        if (control.is('input[type="checkbox"]')) {
                            control.prop('checked', value);
                        } else {
                            control.val(value);
                        }
                    });
                }
            });

            // fill in the many to one subforms
            form.find('.specify-many-to-one').each(function () {
                var container = $(this),
                viewName = container.data('specify-view-name'),
                fieldName = container.data('specify-field-name').toLowerCase(),
                // here we recurse
                subform = specify.populateForm(viewName, data[fieldName], depth + 1);
                subform.appendTo(container);
            });

            // fill in the on to manys
            form.find('.specify-one-to-many').each(function () {
                var container = $(this),
                viewName = container.data('specify-view-name'),
                fieldName = container.data('specify-field-name').toLowerCase();
                // Have to add a subform for each instance. Not exactly sure how this
                // would be handled with prebuilt forms.
                $(data[fieldName]).each(function () {
                    // again, recursive fill
                    var subform = specify.populateForm(viewName, this, depth + 1, true);
                    subform.appendTo(container);
                });
            });
        };

        if ($.isPlainObject(dataOrUri)) {
            // data is here
            populate(dataOrUri);
        } else {
            // gotta go get it
            $.get(dataOrUri, populate);
        }
        return form;
    };

    // typesearches define how the querycbx's work.
    specify.loadTypeSearches = function () {
        return $.get('/static/typesearch_def.xml', function (data) { typesearches = $(data); });
    };

} (window.specify = window.specify || {}, jQuery));


// Main entry point.
$(function () {
    "use strict";
    var uri = "/api/specify/"+view+"/"+id+"/";

    $.when(specify.loadViews(), specify.loadTypeSearches())
        .then(function () {
            $('body').append(specify.populateForm(window.view, uri));
        });
});
