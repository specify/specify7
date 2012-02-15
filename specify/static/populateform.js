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

    function populatePickList(control, data) {
        var pickListName = control.data('specify-picklist');
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

    function setupQueryCBX(control, data) {
        control.hide();
        var input = $('<input type="text">').insertAfter(control);
        input.autocomplete({
            minLength: 3,
            source: function(request, response) {
                var jqxhr = $.get('/api/specify/locality/', {'localityname__icontains': request.term});
                jqxhr.success(function(data) {
                    response(
                        data.objects.map(function(locality) {
                            return {label: locality.localityname, value: locality.localityname};
                        })
                    );
                });
                jqxhr.error(function() { response([]); });
            },
        });

        $.get(data[control.attr('name')], function(itemdata) {
            input.val(itemdata.localityname);
        });
    }

    specify.populateForm = function (viewName, dataOrUri, depth, isOneToMany) {
        depth = depth || 1;

        var form = specify.processView(viewName, depth, isOneToMany);

        var populate = function(data) {
            form.find('.specify-field').each(function (i, node) {
                var control = $(node);
                if (node.nodeName == 'SELECT') {
                    populatePickList(control, data);
                } else if (control.is('.specify-querycbx')) {
                    setupQueryCBX(control, data);
                }
                else {
                    fillinData(data, control.attr('name'), function(value) {
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

} (window.specify = window.specify || {}, jQuery));
