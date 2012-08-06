define([
    'jquery', 'underscore', 'schema', 'schemalocalization', 'specifyform', 'picklist', 'specifyapi', 'uifield',
    'querycbx', 'recordselector', 'specifyplugins', 'subviewbutton', 'formtable', 'subview', 'checkbox'
], function($, _, schema, schemalocalization, specifyform,  PickList, api, UiField,
            QueryCbx, RecordSelector, uiplugins, SubViewButton, FormTable, SubView, CheckBox) {
    "use strict";

    function pluginFor(control) {
        var init = specifyform.parseSpecifyProperties(control.data('specify-initialize'));
        return uiplugins[init.name];
    };

    function populateForm (form, resource) {
        schemalocalization.localizeForm(form);

        form.find('.specify-field').each(function () {
            var control = $(this);
            var viewOptions = { el: control, model: resource };
            var View =
                control.is('.specify-combobox') ? PickList :
                (control.is('.specify-querycbx') ? QueryCbx :
                 (control.is(':checkbox') ? CheckBox :
                  (control.is('.specify-uiplugin') ? pluginFor(control) :
                   UiField)));
            View && new View(viewOptions).render();
        });

        var model = resource.specifyModel;
        form.find('.specify-subview').each(function () {
            var node = $(this);
            if (specifyform.isSubViewButton(node)) {
                (new SubViewButton({ parentModel: model, model: resource, el: node })).render();
                return;
            }

            var fieldName = node.data('specify-field-name');
            var field = model.getField(fieldName);

            resource.rget(fieldName, true).done(function (related) {
                var View, viewOptions = { el: node,
                                          resource: resource,
                                          fieldName: fieldName,
                                          populateform: populateForm };
                switch (field.type) {
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
                    node.append('<p>unhandled relationship type: ' + feild.type + '</p>');
                    return;
                }
                (new View(viewOptions)).render();
            });
        });
        return form;
    };

    return populateForm;
});
