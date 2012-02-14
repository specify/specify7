(function (specify, $, undefined) {

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

    function getparam(node, paramName) {
        var classes = $(node).attr('class');
        if (!classes) return "";
        var re = new RegExp(paramName + ':([^\\\s]+)');

        var value = "";
        $(classes.split(/\s+/)).each(function (i, className) {
            var match = re.exec(className);
            if (match) value = match[1];
        });
        return value;
    }

    function populatePickList(control, data) {
        var pickListName = getparam(control, 'specify-picklist');
        if (!pickListName) return;
        var pickListUri = "/api/specify/picklist/?name=" + pickListName;
        var picklistJQXHR = $.get(pickListUri);
        fillinData(data, control.attr('name'), function(value) {
            picklistJQXHR.success(function (picklistResults) {
                var picklist = picklistResults.objects[0];
                var items = {};
                $(picklist.items).each(function(i, item) {
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

    specify.populateForm = function (viewName, dataOrUri, views, schemaLocalization, depth, isOneToMany) {
        depth = depth || 1;

        var form = specify.processView(viewName, views, schemaLocalization, depth, isOneToMany);

        var populate = function(data) {
            form.find('.specify-field').each(function (i, node) {
                var control = $(node);
                if (node.nodeName == 'SELECT') {
                    populatePickList(control, data);
                } else {
                    fillinData(data, control.attr('name'), function(value) {
                        control.val(value);
                    });
                }
            });

            form.find('.specify-many-to-one').each(function (i, node) {
                var viewName = getparam(node, 'specify-view-name');
                var fieldName = getparam(node, 'specify-field-name');
                var subform = specify.populateForm(getparam(node, 'specify-view-name'),
                                                   data[fieldName.toLowerCase()],
                                                   views, schemaLocalization,
                                                   depth + 1);
                subform.appendTo(node);
            });

            form.find('.specify-one-to-many').each(function (i, node) {
                var viewName = getparam(node, 'specify-view-name');
                var fieldName = getparam(node, 'specify-field-name');
                $(data[fieldName.toLowerCase()]).each(function (i, data) {
                    var subform = specify.populateForm(getparam(node, 'specify-view-name'),
                                                       data, views, schemaLocalization,
                                                       depth + 1, true);
                    subform.appendTo(node);
                });
            });
        };

        if ($.isPlainObject(dataOrUri))
            populate(dataOrUri)
        else
            $.get(dataOrUri, populate);

        return form;
    }

} (window.specify = window.specify || {}, jQuery));
