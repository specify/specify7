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
    specify.fillinData = fillinData;

    specify.populatePickList = function(control, data) {
        var pickListName = control.data('specify-picklist');
        if (!pickListName) { return; }
        var pickListUri = "/api/specify/picklist/?name=" + pickListName,
        picklistJQXHR = $.get(pickListUri), // begin fetching the picklist
        onData = function (value) {
            value = value || '';
            // When the selected value is available from fillinData
            // add a success callback to the picklist fetch that
            // will fill in the options and select the current value.
            picklistJQXHR.success(function (picklistResults) {
                var picklist = picklistResults.objects[0], items = {},
                buildPicklist = function () {
                    if (!control.hasClass('required')) {
                        $('<option>').appendTo(control);
                    }
                    $(picklist.picklistitems).each(function () {
                        items[this.value] = this;
                        $('<option>').text(this.title).attr('value', this.value).appendTo(control);
                    });
                    if (value === undefined) return;
                    if (!items[value]) {
                        if (control.hasClass('required') || value !== '') {
                            $('<option>')
                                .attr('value', value)
                                .text(value + " (current value not in picklist)")
                                .appendTo(control);
                        }
                    }
                    control.val(value);
                };
                if (picklist.tablename) {
                    $.get('/api/specify/' + picklist.tablename + '/',
                          function (picklistTable) {
                              picklist.picklistitems = $.map(
                                  picklistTable.objects, function (item, i) {
                                      return {value: item.resource_uri,
                                              title: item.name};
                                  });
                              buildPicklist();
                          });
                } else buildPicklist();
            });
        };

        if (data) { fillinData(data, control.attr('name'), onData); }
        else { onData();}
    };

    // helper function that pulls name value pairs out of property strings
    function parseSpecifyProperties(props) {
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
    specify.parseSpecifyProperties = parseSpecifyProperties;

    specify.setupQueryCBX = function (control, data) {
        // The main querycbx control is hidden and the user interacts
        // with an autocomplete field.
        control.hide();
        var init = parseSpecifyProperties(control.data('specify-initialize')),
        controlID = control.prop('id'),
        typesearch = typesearches.find('[name="'+init.name+'"]'), // defines the querycbx
        searchfield = typesearch.attr('searchfield').toLowerCase() + '__icontains',
        displaycols = typesearch.attr('displaycols').toLowerCase().split(','),
        format = typesearch.attr('format'),
        uri = '/api/specify/' + init.name.toLowerCase() + '/', // uri to query values
        table = $('<div class="querycbx-strct">').insertBefore(control),
        input = $('<input type="text">').appendTo(table), // autocomplete field
        link = $('<a href="#">[i]</a>').appendTo(table),

        // format the query results according to formatter in the typesearch
        formatInterpolate = function (obj) {
            var str = format,
            vals = displaycols.map(function (col)  { return obj[col]; });
            $(vals).each(function () { str = str.replace(/%s/, this); });
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
                link.attr('href', ui.item.uri.replace(/api\/specify/, 'specify/view'));
            }
        });

        if (data) {
            // fill in the initial value
            var related = data[control.attr('name').toLowerCase()];
            if (related) {
                control.val(related);
                link.attr('href', related.replace(/api\/specify/, 'specify/view'));
                $.get(related, function (obj) {
                    input.val(formatInterpolate(obj));
                });
            }
        }
    };

    specify.setupUIplugin = function (control, data) {
        var init = parseSpecifyProperties(control.data('specify-initialize'));
        var plugin = specify.uiPlugins[init.name];
        plugin && plugin(control, init, data);
    };

    specify.setupControls = function (form, data) {
        form.find('.specify-field').each(function () {
            var control = $(this);
            if (control.prop('nodeName') === 'SELECT') {
                specify.populatePickList(control, data);
            } else if (control.is('.specify-querycbx')) {
                specify.setupQueryCBX(control, data);
            } else if (control.is('.specify-uiplugin')) {
                specify.setupUIplugin(control, data);
            } else if (data) {
                fillinData(data, control.attr('name'), function (value) {
                    if (control.is('input[type="checkbox"]')) {
                        control.prop('checked', value);
                    } else {
                        control.val(value);
                    }
                });
            }
        });
    };

    // This function is the main entry point for this module. It calls
    // the processView function in specifyform.js to build the forms
    // then fills them in with the given data or pointer to data.
    specify.populateForm = function (viewNameOrNode, dataOrUri, isRootForm, depth) {
        if (!dataOrUri) return $('<form>');

        depth = depth || 1;

        // Build the form DOM. These could be prebuilt and persisted somewhere,
        // in which case we would just select the relavent node from the
        // preloaded html. This may be necessary for accessibility.
        var form = specify.processView(viewNameOrNode, depth, isRootForm),

        populate = function(data) {
            form.data('specify-uri', data.resource_uri);
            form.data('specify-object-version', data.version);
            // fill in all the fields
            specify.setupControls(form, data);

            // fill in the many to one subforms
            form.find('.specify-many-to-one').each(function () {
                var node = $(this),
                viewName = node.data('specify-view-name'),
                fieldName = node.data('specify-field-name').toLowerCase(),
                // here we recurse
                subform = specify.populateForm(viewName, data[fieldName], false, depth + 1);
                subform.appendTo(node.find('.specify-form-container'));
            });

            // fill in the one to manys
            form.find('.specify-one-to-many').each(function () {
                var node = $(this),
                fieldName = node.data('specify-field-name').toLowerCase(),
                fillSubform = function () {
                    // again, recursive fill
                    var subform = specify.populateForm(node, this, false, depth + 1);
                    subform.appendTo(node.find('.specify-form-container'));
                    subform.children('input[value="Delete"]').click(deleteRelated);
                };
                // Have to add a subform for each instance. Not exactly sure how this
                // would be handled with prebuilt forms.
                if ($.isArray(data[fieldName])) {
                    $(data[fieldName]).each(fillSubform);
                } else {
                    $.get(data[fieldName], function (data) {
                        $(data.objects).each(fillSubform);
                    });
                }
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

    function deleteRelated() {
        var button = $(this),
        form = button.parent();
        $.ajax(form.data('specify-uri'), {
            type: 'DELETE',
            headers: {'If-Match': form.data('specify-object-version')},
            success: function () { form.remove(); }
        });
    }

    specify.pullParamsFromDl = function (dlNode) {
	var params = {};
	$(dlNode).find('dt').each(function () {
	    var dt = $(this);
	    params[dt.text()] = dt.next('dd').text();
	});
	return params;
    };


    specify.addInitializer(function () {
        return $.get('/static/resources/typesearch_def.xml', function (data) { typesearches = $(data); });
    });

} (window.specify = window.specify || {}, jQuery));
