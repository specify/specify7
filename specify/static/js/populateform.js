define([
    'jquery', 'backbone', 'datamodel', 'schemalocalization', 'specifyform', 'picklist',
    'querycbx', 'recordselector', 'specifyplugins', 'dataobjformatters', 'subviewbutton', 'formtable'
], function($, Backbone, datamodel, schemalocalization, specifyform,  setupPickList, setupQueryCbx,
            RecordSelector, uiplugins, dof, SubViewButton, FormTable) {
    "use strict";

    function setupUIplugin (control, resource) {
        var init = specifyform.parseSpecifyProperties(control.data('specify-initialize'));
        var plugin = uiplugins[init.name];
        plugin && resource.fetchIfNotPopulated().done(function () { plugin(control, init, resource); });
    };

    function setupControls (form, resource) {
        function controlChanged() {
            var control = $(this);
            resource.set(control.attr('name'), control.val());
        };

        form.find('.specify-field').each(function () {
            var control = $(this);
            if (control.is('.specify-combobox')) {
                return setupPickList(control, resource);
            } else if (control.is('.specify-querycbx')) {
                return setupQueryCbx(control, resource);
            } else if (control.is('.specify-uiplugin')) {
                return setupUIplugin(control, resource);
            } else {
                var fetch = resource.rget(control.attr('name'));
                var fillItIn = control.is('input[type="checkbox"]') ?
                    _(control.prop).bind(control, 'checked') :
                    _(control.val).bind(control);

                control.change(controlChanged);

                if (datamodel.isRelatedField(resource.specifyModel, control.attr('name'))) {
                    control.removeClass('specify-field').addClass('specify-object-formatted');
                    control.prop('readonly', true);
                    fetch.pipe(dof.dataObjFormat).done(fillItIn);
                } else fetch.done(fillItIn);
            }
        });
    };

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

        setupControls(form, resource);

        var model = resource.specifyModel;
        form.find('.specify-subview').each(function () {
            var node = $(this);
            if (specifyform.isSubViewButton(node)) {
                var subViewButton = new SubViewButton({ parentModel: model, model: resource, el: node });
                subViewButton.render();
                return;
            }

            var fieldName = node.data('specify-field-name');
            var relType = datamodel.getRelatedFieldType(model, fieldName);

            resource.rget(fieldName, true).done(function (related) {
                switch (relType) {
                case 'one-to-many':
                    var viewOptions = {
                        el: node, collection: related, resource: resource, fieldName: fieldName
                    };

                    var view = specifyform.subViewIsFormTable(node) ? new FormTable(viewOptions) :
                        new RecordSelector(viewOptions);
                    view.render();
                    return;
                case 'zero-to-one':
                case 'many-to-one':
                    if (!related) {
                        node.append('<p style="text-align: center">none</p>');
                        return;
                    }
                    node.append(populateForm(specifyform.buildSubView(node), related));
                    return;
                default:
                    node.append('<p>unhandled relationship type: ' + relType + '</p>');
                    return;
                }
            });
        });
        return form;
    };

    return populateForm;
});
