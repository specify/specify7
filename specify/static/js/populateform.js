define([
    'jquery', 'backbone', 'datamodel', 'specifyapi', 'schemalocalization', 'specifyform', 'picklist',
    'querycbx', 'recordselector', 'specifyplugins', 'dataobjformatters', 'icons'
], function($, Backbone, datamodel, api, schemalocalization, specifyform,  setupPickList, setupQueryCbx,
            makeRecordSelector, uiplugins, dof, icons) {
    "use strict";
    var self = {};

    self.setupUIplugin = function (control, resource) {
        var init = specifyform.parseSpecifyProperties(control.data('specify-initialize'));
        var plugin = uiplugins[init.name];
        return plugin && plugin(control, init, resource);
    };

    self.setupControls = function (form, resource) {
        var deferreds = form.find('.specify-field').map(function () {
            var control = $(this);
            if (control.is('.specify-combobox')) {
                return setupPickList(control, resource);
            } else if (control.is('.specify-querycbx')) {
                return setupQueryCbx(control, resource);
            } else if (control.is('.specify-uiplugin')) {
                return self.setupUIplugin(control, resource);
            } else if (resource) {
                var fetch = resource.rget(control.attr('name'));
                var fillItIn = control.is('input[type="checkbox"]') ?
                    _(control.prop).bind(control, 'checked') :
                    _(control.val).bind(control);

                if (datamodel.isRelatedField(resource.specifyModel, control.attr('name'))) {
                    control.removeClass('specify-field').addClass('specify-object-formatted');
                    return fetch.pipe(dof.dataObjFormat).done(fillItIn);
                } else return fetch.done(fillItIn);
            }
        });
        return api.whenAll(deferreds);
    };

    self.populateSubView = function(buildSubView, relType, related, sliderAtTop) {
        var makeSub = function(resource) { return self.populateForm(buildSubView(), resource); };
        switch (relType) {
        case 'one-to-many':
            if (related.length < 1) {
                return $.when('<p style="text-align: center">nothing here...</p>');
            }

            if (buildSubView().find('table:first').is('.specify-formtable')) {
                return api.whenAll(related.map(makeSub)).pipe(function(subviews) {
                    var result = _.first(subviews);
                    result.find('.specify-form-header:first').remove();
                    _(subviews).chain().tail().each(function(subview) {
                        $('.specify-view-content-container:first', result).append(
                            $('.specify-view-content:first', subview)
                        );
                    });
                    return result;
                });
            }

            return makeSub(related.at(0)).pipe(function(subview) {
                var result = $('<div>').append(subview);
                result.find('.specify-form-header:first').remove();

                if (related.length > 1) makeRecordSelector(
                    result, related, '.specify-view-content:first',
                    function(resource) {
                         return makeSub(resource).pipe(function(subview) {
                            return subview.find('.specify-view-content:first');
                         });
                    }, sliderAtTop
                );
                return result;
            });
        case 'zero-to-one':
        case 'many-to-one':
            if (related)
                return makeSub(related).pipe(function(subview) {
                    subview.find('.specify-form-header:first').remove();
                    return subview;
                });
            else
                return $.when('<p style="text-align: center">none</p>');
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
            var deferreds = [];
            form.find('.specify-view-content').data({
                'specify-uri': data.resource_uri,
                'specify-object-version': data.version});

            deferreds.push(self.setupControls(form, resource));

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
                    relType === 'one-to-many' && deferreds.push(
                        api.getRelatedObjectCount(data, fieldName).done(function(count) {
                            $('.specify-subview-button-count', subviewButton).text(count).show();
                        })
                    );
                } else {
                    deferreds.push(
                        resource.rget(fieldName).pipe(function (related) {
                            if (!related) return related;
                            return related.fetchIfNotPopulated().pipe(function() {
                                var build = _(specifyform.buildSubView).bind(specifyform, node);
                                self.populateSubView(build, relType, related).done(function(result) {
                                    node.append(result);
                                });
                            });
                        })
                    );
                }
            });
            return api.whenAll(deferreds).pipe(function() { return form; });
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
