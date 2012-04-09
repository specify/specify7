define([
    'jquery', 'backbone', 'datamodel', 'specifyapi', 'schemalocalization', 'specifyform', 'picklist',
    'querycbx', 'recordselector', 'specifyplugins', 'dataobjformatters', 'icons'
], function($, Backbone, datamodel, api, schemalocalization, specifyform,  setupPickList, setupQueryCbx,
            RecordSelector, uiplugins, dof, icons) {
    "use strict";

    function setupUIplugin (control, resource) {
        var init = specifyform.parseSpecifyProperties(control.data('specify-initialize'));
        var plugin = uiplugins[init.name];
        return plugin && plugin(control, init, resource);
    };

    function setupControls (form, resource) {
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
                return setupUIplugin(control, resource);
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

    var FormTable = Backbone.View.extend({
        render: function() {
            var self = this;
            self.$el.empty();
            if (self.collection.length < 1) {
                self.$el.append('<p style="text-align: center">nothing here...</p>');
                return;
            }
            var makeRow = function(resource) {
                return populateForm(specifyform.buildSubView(self.options.subViewNode), resource);
            };
            api.whenAll(self.collection.map(makeRow)).done(function(rows) {
                self.$el.append(rows[0]);
                _(rows).chain().tail().each(function(row) {
                    self.$('.specify-view-content-container:first').append($('.specify-view-content:first', row));
                });
            });
        },
    });

    // This function is the main entry point for this module. It calls
    // the processView function in specifyform.js to build the forms
    // then fills them in with the given data or pointer to data.
    function populateForm (form, resource) {
        schemalocalization.localizeForm(form);
        form.find('a.specify-edit').prop('href', resource.viewUrl());

        var submit = form.find(':submit').click(function(evt) {
            evt.preventDefault();
            resource.rsave().done(function() {
                window.location.reload(); // lame
            });
        }).prop('disabled', true);

        resource.on('change rchange', function() {
            submit.prop('disabled', false);
        });

        var model = resource.specifyModel;
        var deferreds = [setupControls(form, resource)];

        form.find('.specify-subview').each(function () {
            var node = $(this), fieldName = node.data('specify-field-name');
            var relType = datamodel.getRelatedFieldType(model, fieldName);

            var subviewButton = node.children('.specify-subview-button:first');
            if (subviewButton.length) {
                subviewButton.prop('href',fieldName.toLowerCase() + '/');
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
                return;
            }
            deferreds.push( resource.rget(fieldName).pipe(function (related) {
                return related && related.fetchIfNotPopulated().pipe(function() {
                    if (specifyform.subViewIsFormTable(node)) {
                        var formTable = new FormTable({
                            collection: related,
                            subViewNode: node
                        });
                        formTable.render();
                        node.append(formTable.el);
                        return;
                    }

                    switch (relType) {
                    case 'one-to-many':
                        var recordSelector = new RecordSelector({
                            collection: related,
                            buildContent: function (resource) {
                                return populateForm(specifyform.buildSubView(node), resource);
                            }
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
                        node.append(recordSelector.el);
                        return;
                    case 'zero-to-one':
                    case 'many-to-one':
                        if (related) return populateForm(specifyform.buildSubView(node), resource);
                        node.append('<p style="text-align: center">none</p>');
                        return;
                    default:
                        node.append('<p>unhandled relationship type: ' + relType + '</p>');
                        return;
                    }
                });
            }));
        });
        return api.whenAll(deferreds).pipe(function() { return form; });
    };

    return {
        populateForm: populateForm,
    };
});
