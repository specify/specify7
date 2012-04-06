define([
    'jquery', 'backbone', 'datamodel', 'specifyapi', 'schemalocalization', 'specifyform', 'picklist',
    'querycbx', 'recordselector', 'specifyplugins', 'dataobjformatters', 'icons'
], function($, Backbone, datamodel, api, schemalocalization, specifyform,  setupPickList, setupQueryCbx,
            RecordSelector, uiplugins, dof, icons) {
    "use strict";
    var self = {};

    self.setupUIplugin = function (control, resource) {
        var init = specifyform.parseSpecifyProperties(control.data('specify-initialize'));
        var plugin = uiplugins[init.name];
        return plugin && plugin(control, init, resource);
    };

    self.setupControls = function (form, resource) {
        function controlChanged() {
            var control = $(this);
            resource.set(control.attr('name'), control.val());
        };

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

                control.change(controlChanged);

                if (datamodel.isRelatedField(resource.specifyModel, control.attr('name'))) {
                    control.removeClass('specify-field').addClass('specify-object-formatted');
                    control.prop('readonly', true);
                    return fetch.pipe(dof.dataObjFormat).done(fillItIn);
                } else return fetch.done(fillItIn);
            }
        });
        return api.whenAll(deferreds);
    };

    self.populateSubView = function(node, relType, related, resource, fieldName) {
        var buildSubView = _(specifyform.buildSubView).bind(specifyform, node);
        function makeSub(resource) { return self.populateForm(buildSubView(), resource); };

        switch (relType) {
        case 'one-to-many':
            if (buildSubView().find('table:first').is('.specify-formtable')) {
                if (related.length < 1) {
                    return $.when('<p style="text-align: center">nothing here...</p>');
                }

                return api.whenAll(related.map(makeSub)).pipe(function(subviews) {
                    var result = _.first(subviews);
                    result.find('.specify-form-header:first, :submit').remove();
                    _(subviews).chain().tail().each(function(subview) {
                        $('.specify-view-content-container:first', result).append(
                            $('.specify-view-content:first', subview)
                        );
                    });
                    return result;
                });
            }

            var recordSelector = new RecordSelector({
                collection: related,
                buildContent: function(resource) {
                    return makeSub(resource).pipe(function(subview) {
                        subview.find('.specify-form-header:first, :submit').remove();
                        return subview;
                    });
                },
            });
            node.find('.specify-subview-header:first .specify-delete-related').click(function() {
                recordSelector.getShowing().destroy();
            });
            node.find('.specify-subview-header:first .specify-add-related').click(function() {
                var newResource = new (related.model)();
                var osn = datamodel.getFieldOtherSideName(resource.specifyModel, fieldName);
                newResource.set(osn, resource.url());
                related.add(newResource);
            });
            recordSelector.render();
            return $.when(recordSelector.el);
        case 'zero-to-one':
        case 'many-to-one':
            if (related)
                return makeSub(related).pipe(function(subview) {
                    subview.find('.specify-form-header:first, :submit').remove();
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
        form.find('a.specify-edit').prop('href', resource.viewUrl());

        var submit = $('<input type="submit">').appendTo(form).click(function(evt) {
            evt.preventDefault();
            resource.rsave().done(function() {
                window.location.reload(); // lame
            });
        }).prop('disabled', true);

        resource.on('change rchange', function() {
            submit.prop('disabled', false);
        });

        return resource.fetchIfNotPopulated().pipe(function() {
            var model = resource.specifyModel;
            var deferreds = [self.setupControls(form, resource)];

            form.find('.specify-subview').each(function () {
                var node = $(this), fieldName = node.data('specify-field-name');
                var relType = datamodel.getRelatedFieldType(model, fieldName);

                var subviewButton = node.children('.specify-subview-button:first');
                if (subviewButton.length) {
                    subviewButton.prop('href',fieldName.toLowerCase());
                    var props = specifyform.parseSpecifyProperties(subviewButton.data('specify-initialize'));
                    var icon = props.icon ? icons.getIcon(props.icon) :
                        icons.getIcon(datamodel.getRelatedModelForField(model, fieldName));
                    subviewButton.append($('<img>', {src: icon}));
                    $('<span class="specify-subview-button-count">').appendTo(subviewButton).hide();
                    subviewButton.button();
                    relType === 'one-to-many' && deferreds.push(
                        resource.getRelatedObjectCount(fieldName).done(function(count) {
                            $('.specify-subview-button-count', subviewButton).text(count).show();
                        })
                    );
                } else {
                    deferreds.push(
                        resource.rget(fieldName).pipe(function (related) {
                            if (!related) return related;
                            return related.fetchIfNotPopulated().pipe(function() {
                                self.populateSubView(node, relType, related, resource, fieldName).done(function(result) {
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
