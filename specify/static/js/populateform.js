define([
    'jquery', 'jquery-ui', 'backbone', 'datamodel', 'specifyapi', 'schemalocalization',
    'specifyform', 'specifyplugins', 'dataobjformatters', 'icons',
    'text!/static/resources/typesearch_def.xml'
], function($, dummy, Backbone, datamodel, api, schemalocalization, specifyform, uiplugins, dof, icons, typesearchesXML) {
    "use strict";
    var self = {}, typesearches = $.parseXML(typesearchesXML);
    var debug = false;

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
        var pickListUri = "/api/specify/picklist/?name=" + pickListName;
        var deferreds = [
            $.get(pickListUri).pipe(function(data) {
                var picklist = data.objects[0];
                if (picklist.tablename) {
                    return $.get('/api/specify/' + picklist.tablename + '/').pipe(
                        function (picklistTable) {
                            return _(picklistTable.objects).map(function (item, i) {
                                return {value: item.resource_uri, title: item.name};
                            });
                        });
                } else return data.objects[0].picklistitems;
            })];
        deferreds.push(resource ? resource.rget(control.attr('name')) : null);
        return $.when.apply($, deferreds).done(buildPicklist);
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
                return $.get(related, function (obj) {
                    input.val(formatInterpolate(obj));
                });
            }
        }
    };

    self.setupUIplugin = function (control, resource) {
        var init = specifyform.parseSpecifyProperties(control.data('specify-initialize'));
        var plugin = uiplugins[init.name];
        return plugin && plugin(control, init, resource.toJSON());
    };

    self.setupControls = function (form, resource) {
        var deferreds = form.find('.specify-field').map(function () {
            var control = $(this);
            if (control.is('.specify-combobox')) {
                return self.populatePickList(control, resource);
            } else if (control.is('.specify-querycbx')) {
                return self.setupQueryCBX(control, resource);
            } else if (control.is('.specify-uiplugin')) {
                return self.setupUIplugin(control, resource);
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
                    return fetch.pipe(function (obj) {
                        return dof.dataObjFormat(relatedModel, obj);
                    }).done(fillItIn);
                } else return fetch.done(fillItIn);
            }
        });
        return whenAll(deferreds);
    };

    self.makeRecordSelector = function(node, collection, contentSelector, buildContent, atTop) {
        var bottom = collection.offset;
        var top = bottom + collection.length;
        var slider = atTop ? $('<div>').prependTo(node) : $('<div>').appendTo(node);
        var request, showingSpinner, intervalId;
        var redraw = function(offset) {
            debug && console.log('want to redraw at ' + offset);
            if (offset < bottom || offset > top-1) return false;
            buildContent(collection.at(offset - bottom)).done(function(content) {
                var curOffset = slider.slider('value');
                if (curOffset === offset) {
                    debug && console.log('filling in at ' + offset);
                    $(contentSelector, node).replaceWith(content);
                    showingSpinner = false;
                } else {
                    debug && console.log('not filling because slider is at ' +
                                         curOffset + ' but data is for ' + offset);
                }
            });
            return true;
        };
        slider.slider({
            max: collection.totalCount - 1,
            stop: _.throttle(function(event, ui) {
                if (ui.value >= bottom && ui.value < top) return;
                request && request.abort();
                var offset = Math.max(0, ui.value - Math.floor(collection.length/2));
                request = collection.getAtOffset(offset).done(function(newCollection) {
                    debug && console.log('got collection at offset ' + offset);
                    request = null;
                    collection = newCollection;
                    bottom = collection.offset;
                    top = bottom + collection.length;
                    redraw(slider.slider('value'));
                });
            }, 750),
            slide: function(event, ui) {
                $('.ui-slider-handle', this).text(ui.value + 1);
                if (!redraw(ui.value)) {
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

    function whenAll(deferreds) {
        return $.when.apply($, deferreds).pipe(function() { return _(arguments).toArray(); });
    }

    self.populateSubView = function(buildSubView, relType, related, sliderAtTop) {
        var populateSubView = function(resource) { return self.populateForm(buildSubView(), resource); };
        switch (relType) {
        case 'zero-to-one':
        case 'one-to-many':
            if (buildSubView().find('table:first').is('.specify-formtable')) {
                return whenAll(related.map(populateSubView)).pipe(function(subviews) {
                    var result;
                    _(subviews).each(function(subview, count) {
                        if (count === 0) {
                            result = subview;
                        } else {
                            $('.specify-view-content-container:first', result).append(
                                $('.specify-view-content:first', subview)
                            );
                        }
                    });
                    result.find('.specify-form-header:first').remove();
                    return result;
                });
            }
            if (related.length < 1) {
                return $.when('<p style="text-align: center">nothing here...</p>');
            }

            return populateSubView(related.at(0)).pipe(function(subview) {
                var result = $('<div>').append(subview);
                result.find('.specify-form-header:first').remove();

                if (related.length > 1) self.makeRecordSelector(
                    result, related, '.specify-view-content:first',
                    function(resource) {
                         return populateSubView(resource).pipe(function(subview) {
                            return subview.find('.specify-view-content:first');
                         });
                    }, sliderAtTop
                );
                return result;
            });
        case 'many-to-one':
            return related ? populateSubView(related).find('.specify-form-header:first').remove() :
                $.when('<p style="text-align: center">none</p>');
        default:
            return $.when('<p>unhandled relationship type: ' + relType + '</p>');
        }
    };

    // This function is the main entry point for this module. It calls
    // the processView function in specifyform.js to build the forms
    // then fills them in with the given data or pointer to data.
    self.populateForm = function (form, resource) {
        schemalocalization.localizeForm(form);
        if (!resource) {
            return self.setupControls(form).pipe(function() { return form; });
        }
        var viewmodel = form.data('specify-model');

        return resource.fetchIfNotPopulated().pipe(function() {
            var data = resource.toJSON();
            var subDeferreds = [];
            form.find('.specify-view-content').data({
                'specify-uri': data.resource_uri,
                'specify-object-version': data.version});

            subDeferreds.push(self.setupControls(form, resource));

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
                    relType === 'one-to-many' && subDeferreds.push(
                        api.getRelatedObjectCount(data, fieldName).done(function(count) {
                            $('.specify-subview-button-count', subviewButton).text(count).show();
                        })
                    );
                } else {
                    subDeferreds.push(
                        resource.rget(fieldName).pipe(function (related) {
                            var build = _(specifyform.buildSubView).bind(specifyform, node);
                            return self.populateSubView(build, relType, related).done(function(result) {
                                node.append(result);
                            });
                        })
                    );
                }
            });
            return whenAll(subDeferreds).pipe(function() { return form; });
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
