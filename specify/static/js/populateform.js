define([
    'jquery', 'underscore', 'datamodel', 'schemalocalization', 'specifyform', 'picklist',
    'querycbx', 'recordselector', 'specifyplugins', 'dataobjformatters', 'subviewbutton', 'formtable', 'subview'
], function($, _, datamodel, schemalocalization, specifyform,  setupPickList, QueryCbx,
            RecordSelector, uiplugins, dataObjFormat, SubViewButton, FormTable, SubView) {
    "use strict";

    function setupUIplugin (control, resource) {
        var init = specifyform.parseSpecifyProperties(control.data('specify-initialize'));
        var plugin = uiplugins[init.name];
        plugin && resource.fetchIfNotPopulated().done(function () { plugin(control, init, resource); });
    };

    function setupControls (form, resource) {
        function controlChanged() {
            var control = $(this);
            var value = control.is(':checkbox') ? control.prop('checked') : control.val();
            resource.set(control.attr('name'), value);
        };

        form.find('.specify-field').each(function () {
            var control = $(this), field = control.attr('name');
            if (control.is('.specify-combobox')) {
                return setupPickList(control, resource);
            } else if (control.is('.specify-querycbx')) {
                (new QueryCbx({ el: control, model: resource })).render();
            } else if (control.is('.specify-uiplugin')) {
                return setupUIplugin(control, resource);
            } else {
                var fetch = function () { return resource.rget(field, true) };

                if (datamodel.isRelatedField(resource.specifyModel, field)) {
                    control.removeClass('specify-field').addClass('specify-object-formatted');
                    control.prop('readonly', true);
                    var plainFetch = fetch;
                    fetch = function() { return plainFetch().pipe(dataObjFormat); };
                }

                var setControl = control.is(':checkbox') ?
                    _(control.prop).bind(control, 'checked') :
                    _(control.val).bind(control);

                var fillItIn = function() { fetch().done(setControl); };

                fillItIn();
                resource.onChange(field, fillItIn);

                control.change(controlChanged);
            }
        });
    };

    // This function is the main entry point for this module. It calls
    // the processView function in specifyform.js to build the forms
    // then fills them in with the given data or pointer to data.
    function populateForm (form, resource) {
        schemalocalization.localizeForm(form);
        setupControls(form, resource);

        var model = resource.specifyModel;
        form.find('.specify-subview').each(function () {
            var node = $(this);
            if (specifyform.isSubViewButton(node)) {
                (new SubViewButton({ parentModel: model, model: resource, el: node })).render();
                return;
            }

            var fieldName = node.data('specify-field-name');
            var relType = datamodel.getRelatedFieldType(model, fieldName);

            resource.rget(fieldName, true).done(function (related) {
                if (!related) return;
                var View, viewOptions = { el: node, resource: resource, fieldName: fieldName };
                switch (relType) {
                case 'one-to-many':
                    View = specifyform.subViewIsFormTable(node) ? FormTable : RecordSelector;
                    viewOptions.collection = related;
                    break;
                case 'zero-to-one':
                case 'many-to-one':
                    View = SubView;
                    viewOptions.model = related
                    break;
                default:
                    node.append('<p>unhandled relationship type: ' + relType + '</p>');
                    return;
                }
                (new View(viewOptions)).render();
            });
        });
        return form;
    };

    return populateForm;
});
