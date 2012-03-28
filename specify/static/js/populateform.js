define([
    'jquery', 'jquery-ui', 'backbone', 'datamodel', 'specifyapi', 'schemalocalization',
    'specifyform', 'specifyplugins', 'dataobjformatters', 'icons',
    'text!/static/resources/typesearch_def.xml'
], function($, dummy, Backbone, datamodel, api, schemalocalization, specifyform, uiplugins, dof, icons, typesearchesXML) {
    "use strict";
    var self = {}, typesearches = $.parseXML(typesearchesXML);

    self.populatePickList = function(control, resource) {
        var model = control.parents('[data-specify-model]').attr('data-specify-model');
        var field = control.attr('name');
        var buildPicklist = function (picklistitems, value) {
            var items = {};
            if (!control.hasClass('required')) {
                $('<option>').appendTo(control);
            }
            $(picklistitems).each(function () {
                items[this.value] = this;
                $('<option>').text(this.title).attr('value', this.value).appendTo(control);
            });
            if (value === undefined) return;
            if (!items[value]) {
                if (control.hasClass('specify-required-field') || value !== '') {
                    $('<option>')
                        .attr('value', value)
                        .text(value + " (current value not in picklist)")
                        .appendTo(control);
                }
            }
            control.val(value);
        };

        if (model.toLowerCase() === 'agent' && field.toLowerCase() === 'agenttype') {
            buildPicklist([{value: 0, title: 'Organization'},
                           {value: 1, title: 'Person'},
                           {value: 2, title: 'Other'},
                           {value: 3, title: 'Group'}],
                          resource && resource.get('agenttype'));
            return;
        }

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
                var picklist = picklistResults.objects[0];
                if (picklist.tablename) {
                    $.get('/api/specify/' + picklist.tablename + '/',
                          function (picklistTable) {
                              var picklistitems = $.map(
                                  picklistTable.objects, function (item, i) {
                                      return {value: item.resource_uri,
                                              title: item.name};
                                  });
                              buildPicklist(picklistitems, value);
                          });
                } else buildPicklist(picklist.picklistitems, value);
            });
        };

        if (resource) { resource.rget(control.attr('name')).done(onData); }
        else { onData();}
    };

    self.setupQueryCBX = function (control, resource) {
        // The main querycbx control is hidden and the user interacts
        // with an autocomplete field.
        control.hide();
        var init = specifyform.parseSpecifyProperties(control.data('specify-initialize')),
        data = resource.toJSON(),
        controlID = control.prop('id'),
        typesearch = $('[name="'+init.name+'"]', typesearches), // defines the querycbx
        searchfield = typesearch.attr('searchfield').toLowerCase() + '__icontains',
        displaycols = typesearch.attr('displaycols').toLowerCase().split(','),
        format = typesearch.attr('format'),
        uri = '/api/specify/' + init.name.toLowerCase() + '/', // uri to query values
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

    self.setupUIplugin = function (control, resource) {
        var init = specifyform.parseSpecifyProperties(control.data('specify-initialize'));
        var plugin = uiplugins[init.name];
        plugin && plugin(control, init, resource.toJSON());
    };

    self.setupControls = function (form, resource) {
        form.find('.specify-field').each(function () {
            var control = $(this);
            if (control.is('.specify-combobox')) {
                self.populatePickList(control, resource);
            } else if (control.is('.specify-querycbx')) {
                self.setupQueryCBX(control, resource);
            } else if (control.is('.specify-uiplugin')) {
                self.setupUIplugin(control, resource);
            } else if (resource) {
                var fetch = resource.rget(control.attr('name'));
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

    self.makeRecordSelector = function(node, collection, contentSelector, buildContent, atTop) {
        var bottom = collection.offset;
        var top = bottom + collection.length;
        var slider = atTop ? $('<div>').prependTo(node) : $('<div>').appendTo(node);
        var request, showingSpinner;
        slider.slider({
            max: collection.totalCount - 1,
            stop: _.throttle(function(event, ui) {
                if (ui.value >= bottom && ui.value < top) return;
                request && request.abort();
                var offset = Math.max(0, ui.value - Math.floor(collection.length/2));
                request = collection.getAtOffset(offset).done(function(newCollection) {
                    request = null;
                    collection = newCollection;
                    bottom = collection.offset;
                    top = bottom + collection.length;
                    $(contentSelector, node).replaceWith(
                        buildContent(collection.at(ui.value - bottom))
                    );
                    showingSpinner = false;
                });
            }, 750),
            slide: function(event, ui) {
                $('.ui-slider-handle', this).text(ui.value + 1);
                if (ui.value >= bottom && ui.value < top) {
                    $(contentSelector, node).replaceWith(
                        buildContent(collection.at(ui.value - bottom))
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

    self.populateSubView = function(buildSubView, relType, related, sliderAtTop) {
        var result = $();
        switch (relType) {
        case 'zero-to-one':
        case 'one-to-many':
            var subview = buildSubView();
            if (subview.find('table:first').is('.specify-formtable')) {
                related.each(function(resource, count) {
                    var subview = buildSubView();
                    self.populateForm(subview, resource);
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
            if (related.length < 1) {
                result = $('<p style="text-align: center">nothing here...</p>');
                break;
            }
            self.populateForm(subview, related.at(0));
            result = $('<div>').append(subview);

            if (related.length > 1) self.makeRecordSelector(
                result, related, '.specify-view-content:first',
                function(resource) {
                    subview = buildSubView();
                    self.populateForm(subview, resource);
                    return subview.find('.specify-view-content:first');
                }, sliderAtTop
            );

            break;
        case 'many-to-one':
            if (related) {
                result = buildSubView();
                self.populateForm(result, related);
            } else {
                result = $('<p style="text-align: center">none</p>');
            }
            break;
        default:
            result = $('<p>unhandled relationship type: ' + relType + '</p>');
        }
        result.find('.specify-form-header:first').remove();
        return result;
    };

    // This function is the main entry point for this module. It calls
    // the processView function in specifyform.js to build the forms
    // then fills them in with the given data or pointer to data.
    self.populateForm = function (form, resource) {
        schemalocalization.localizeForm(form);
        if (!resource) {
            self.setupControls(form);
            return;
        }
        var viewmodel = form.data('specify-model');

        resource.fetchIfNotPopulated().done(function() {
            var data = resource.toJSON();
            form.find('.specify-view-content').data({
                'specify-uri': data.resource_uri,
                'specify-object-version': data.version});

            self.setupControls(form, resource);

            form.find('.specify-subview').each(function () {
                var node = $(this), fieldName = node.data('specify-field-name');
                var relType = datamodel.getRelatedFieldType(viewmodel, fieldName);

                var subviewButton = node.children('.specify-subview-button:first');
                if (subviewButton.length) {
                    subviewButton.prop('href',fieldName.toLowerCase());
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

                resource.rget(fieldName).done(function (related) {
                    var build = _(specifyform.buildSubView).bind(specifyform, node);
                    var result = self.populateSubView(build, relType, related);
                    node.append(result);
                });
            });
        });
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
