define(['jquery', 'jquery-ui', 'datamodel', 'specifyapi', 'specifyform', 'specifyplugins', 'dataobjformatters',
        'text!resources/typesearch_def.xml'],
function($, jqueryui, datamodel, api, specifyform, uiplugins, dof, typesearchesXML) {
    "use strict";
    var self = {}, typesearches = $.parseXML(typesearchesXML);

    self.populatePickList = function(control, data) {
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

        if (data) { api.getDataFromResource(data, control.attr('name')).done(onData); }
        else { onData();}
    };

    self.setupQueryCBX = function (control, data) {
        // The main querycbx control is hidden and the user interacts
        // with an autocomplete field.
        control.hide();
        var init = specifyform.parseSpecifyProperties(control.data('specify-initialize')),
        controlID = control.prop('id'),
        typesearch = $('[name="'+init.name+'"]', typesearches), // defines the querycbx
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

    self.setupUIplugin = function (control, data) {
        var init = specifyform.parseSpecifyProperties(control.data('specify-initialize'));
        var plugin = uiplugins[init.name];
        plugin && plugin(control, init, data);
    };

    self.setupControls = function (form, data) {
        form.find('.specify-field').each(function () {
            var control = $(this);
            if (control.prop('nodeName') === 'SELECT') {
                self.populatePickList(control, data);
            } else if (control.is('.specify-querycbx')) {
                self.setupQueryCBX(control, data);
            } else if (control.is('.specify-uiplugin')) {
                self.setupUIplugin(control, data);
            } else if (data) {
                var fetch = api.getDataFromResource(data, control.attr('name'));
                var fillItIn  = function (value) {
                    if (control.is('input[type="checkbox"]')) {
                        control.prop('checked', value);
                    } else {
                        control.val(value);
                    }
                };

                var dataModelField = datamodel.getDataModelField(form.data('specify-model'),
                                                                 control.attr('name'));

                if (dataModelField.is('relationship')) {
                    var relatedModel = dataModelField.attr('classname').split('.').pop();
                    fetch.pipe(function (obj) { return dof.dataObjFormat(relatedModel, obj) })
                        .done(fillItIn);
                } else fetch.done(fillItIn);
            }
        });
    };

    // This function is the main entry point for this module. It calls
    // the processView function in specifyform.js to build the forms
    // then fills them in with the given data or pointer to data.
    self.populateForm = function (viewNameOrNode, dataOrUri, isRootForm, depth) {
        if (!dataOrUri) return $('<form>');

        depth = depth || 1;

        // Build the form DOM. These could be prebuilt and persisted somewhere,
        // in which case we would just select the relavent node from the
        // preloaded html. This may be necessary for accessibility.
        var form = specifyform.processView(viewNameOrNode, depth, isRootForm),

        populate = function(data) {
            form.data('specify-uri', data.resource_uri);
            form.data('specify-object-version', data.version);
            // fill in all the fields
            self.setupControls(form, data);

            // fill in the many to one subforms
            form.find('.specify-many-to-one').each(function () {
                var node = $(this),
                viewName = node.data('specify-view-name'),
                fieldName = node.data('specify-field-name').toLowerCase(),
                // here we recurse
                subform = self.populateForm(viewName, data[fieldName], false, depth + 1);
                subform.appendTo(node.find('.specify-form-container'));
            });

            // fill in the one to manys
            form.find('.specify-one-to-many').each(function () {
                var node = $(this),
                fieldName = node.data('specify-field-name').toLowerCase(),
                fillSubform = function () {
                    // again, recursive fill
                    var subform = self.populateForm(node, this, false, depth + 1);
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

    self.pullParamsFromDl = function (dlNode) {
	var params = {};
	$(dlNode).find('dt').each(function () {
	    var dt = $(this);
	    params[dt.text()] = dt.next('dd').text();
	});
	return params;
    };

    return self;
});
