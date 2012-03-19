define([
    'jquery', 'jquery-ui', 'datamodel', 'specifyapi', 'schemalocalization',
    'specifyform', 'specifyplugins', 'dataobjformatters', 'icons',
    'text!resources/typesearch_def.xml'
], function($, dummy, datamodel, api, schemalocalization, specifyform, uiplugins, dof, icons, typesearchesXML) {
    "use strict";
    var self = {}, typesearches = $.parseXML(typesearchesXML);

    self.populatePickList = function(control, data) {
        var model = control.parents('[data-specify-model]').attr('data-specify-model');
        var field = control.attr('name');
        var pickListName = schemalocalization.getPickListForField(field, model);
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
        input = $('<input type=text>').appendTo(table), // autocomplete field
        link = $('<a><span class="ui-icon ui-icon-pencil">edit</span></a>');

        control.prop('readonly') || link.appendTo(table);

        // format the query results according to formatter in the typesearch
        var formatInterpolate = function (obj) {
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
        }).prop('readonly', control.prop('readonly'));

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
            if (control.is('.specify-combobox')) {
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

                if (datamodel.isRelatedField(form.data('specify-model'), control.attr('name'))) {
                    control.removeClass('specify-field').addClass('specify-object-formatted');
                    var relatedModel =
                        datamodel.getRelatedModelForField(form.data('specify-model'), control.attr('name'));
                    fetch.pipe(function (obj) { return dof.dataObjFormat(relatedModel, obj) })
                        .done(fillItIn);
                } else fetch.done(fillItIn);
            }
        });
    };

    self.makeRecordSelector = function(node, data, contentSelector, buildContent) {
        var bottom = data.meta.offset;
        var top = bottom + data.meta.limit;
        var url = data.meta.next;
        var request, showingSpinner;
        $('<div>').appendTo(node).slider({
            max: data.meta.total_count - 1,
            stop: _.throttle(function(event, ui) {
                if (ui.value >= bottom && ui.value < top) return;
                request && request.abort();
                var offset = Math.max(0, ui.value - Math.floor(data.meta.limit/2));
                request = $.get(url, {offset: offset}, function(newData) {
                    request = null;
                    data = newData;
                    bottom = data.meta.offset;
                    top = bottom + data.meta.limit;
                    $(contentSelector, node).replaceWith(
                        buildContent(data.objects[ui.value - bottom])
                    );
                    showingSpinner = false;
                });
            }, 750),
            slide: function(event, ui) {
                $('.ui-slider-handle', this).text(ui.value + 1);
                if (ui.value >= bottom && ui.value < top) {
                    $(contentSelector, node).replaceWith(
                        buildContent(data.objects[ui.value - bottom])
                    );
                    showingSpinner = false;
                } else if (!showingSpinner) {
                    var content = $(contentSelector, node);
                    var spinner = $('<img src="/static/img/icons/specify128spinner.gif">');
                    var div = $('<div>').css({height: content.height(),
                                              'text-align': 'center'}).append(spinner);
                    spinner.height(Math.min(128, 0.90*content.height()));
                    content.empty().append(div);
                    showingSpinner = true;
                }
            }
        }).find('.ui-slider-handle').
            css({'min-width': '1.2em', width: 'auto', 'text-align': 'center', padding: '0 3px 0 3px'}).
            text(1);
    };

    // This function is the main entry point for this module. It calls
    // the processView function in specifyform.js to build the forms
    // then fills them in with the given data or pointer to data.
    self.populateForm = function (form, dataOrUri) {
        schemalocalization.localizeForm(form);
        if (!dataOrUri) {
            self.setupControls(form);
            return form;
        }
        var viewmodel = form.data('specify-model');

        var populate = function(data) {
            form.find('.specify-view-content').data({
                'specify-uri': data.resource_uri,
                'specify-object-version': data.version});

            self.setupControls(form, data);

            form.find('.specify-subview').each(function () {
                var node = $(this), fieldName = node.data('specify-field-name');
                var relType = datamodel.getRelatedFieldType(viewmodel, fieldName);

                var subviewButton = node.children('.specify-subview-button:first');
                if (subviewButton.length) {
                    subviewButton.prop('href', api.getViewRelatedURL(data, fieldName));
                    var props = specifyform.parseSpecifyProperties(subviewButton.data('specify-initialize'));
                    var icon = props.icon ? icons.getIcon(props.icon) :
                        icons.getIcon(datamodel.getRelatedModelForField(viewmodel, fieldName));
                    subviewButton.append($('<img>', {src: icon}));
                    $('<span class="specify-subview-button-count">').appendTo(subviewButton).hide();
                    subviewButton.button();
                    if (relType === 'one-to-many') {
                        api.getRelatedObjectCount(data, fieldName).done(function(count) {
                            $('.specify-subview-button-count', subviewButton).text(count).show();
                        });
                    }
                    return;
                }

                var doIt = function(data) {
                    var result = $();
                    switch (relType) {
                    case 'one-to-many':
                        if (!_(data).has('meta')) {
                            data = {
                                objects: data,
                                meta: {offset: 0, limit: data.length, total_count: data.length, next: null}
                            };
                        }
                        var subview = specifyform.buildSubView(node);
                        if (subview.find('table:first').is('.specify-formtable')) {
                            $(data.objects).each(function(count) {
                                var subview = specifyform.buildSubView(node);
                                self.populateForm(subview, this);
                                if (count === 0) {
                                    result = subview;
                                } else {
                                    $('.specify-view-content-container:first', result).append(
                                        $('.specify-view-content:first', subview)
                                    );
                                }
                            });
                            break;
                        }
                        if (data.objects.length < 1) {
                            result = $('<p style="text-align: center">nothing here...</p>');
                            break;
                        }
                        self.populateForm(subview, data.objects[0]);
                        result = $('<div>').append(subview);

                        if (data.objects.length > 1) self.makeRecordSelector(
                            result, data, '.specify-view-content:first',
                            function(object) {
                                subview = specifyform.buildSubView(node);
                                self.populateForm(subview, object);
                                return subview.find('.specify-view-content:first');
                            }
                        );

                        break;
                    case 'many-to-one':
                        if (data) {
                            result = specifyform.buildSubView(node);
                            self.populateForm(result, data);
                        };
                        break;
                    default:
                        result = $('unhandled relationship type: ' + relType);
                    }
                    result.find('.specify-form-header:first').remove();
                    node.append(result);
                };

                var fieldData = data[fieldName.toLowerCase()];
                if (_.isString(fieldData)) {
                    $.get(fieldData, doIt);
                } else {
                    doIt(fieldData);
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
