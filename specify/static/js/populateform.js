define([
    'jquery', 'underscore', 'schema', 'schemalocalization', 'specifyform', 'picklist', 'specifyapi', 'uiformat',
    'querycbx', 'recordselector', 'specifyplugins', 'dataobjformatters', 'subviewbutton', 'formtable', 'subview'
], function($, _, schema, schemalocalization, specifyform,  setupPickList, api, uiformat,
            QueryCbx, RecordSelector, uiplugins, dataObjFormat, SubViewButton, FormTable, SubView) {
    "use strict";

    function setupUIplugin (control, resource) {
        var init = specifyform.parseSpecifyProperties(control.data('specify-initialize'));
        var plugin = uiplugins[init.name];
        plugin && resource.fetchIfNotPopulated().done(function () { plugin(control, init, resource); });
    };

    function setupRegularField (resource, control) {
        function controlChanged() {
            var control = $(this);
            var value = control.is(':checkbox') ? control.prop('checked') : control.val();
            resource.set(control.attr('name'), value);
        };

        var fieldName = control.attr('name');
        var field = resource.specifyModel.getField(fieldName);
        if (!field) return;

        var fetch;
        if (field.isRelationship) {
            control.removeClass('specify-field').addClass('specify-object-formatted');
            control.prop('readonly', true);
            fetch = function() { return resource.rget(fieldName).pipe(dataObjFormat); };
        } else fetch = function () { return uiformat(resource, fieldName); };

        var setControl = control.is(':checkbox') ?
            _(control.prop).bind(control, 'checked') : _(control.val).bind(control);

        var fillItIn = function() { fetch().done(setControl); };

        fillItIn();
        resource.onChange(fieldName, fillItIn);

        control.change(controlChanged);
    }

    // This function is the main entry point for this module. It calls
    // the processView function in specifyform.js to build the forms
    // then fills them in with the given data or pointer to data.
    function populateForm (form, resource) {
        schemalocalization.localizeForm(form);

        form.find('.specify-field').each(function () {
            var control = $(this);
            if      (control.is('.specify-combobox')) setupPickList(control, resource);
            else if (control.is('.specify-querycbx')) (new QueryCbx({ el: control, model: resource })).render();
            else if (control.is('.specify-uiplugin')) setupUIplugin(control, resource);
            else setupRegularField(resource, control);
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
                var View, viewOptions = { el: node, resource: resource, fieldName: fieldName };
                switch (field.type) {
                case 'one-to-many':
                    View = specifyform.subViewIsFormTable(node) ? FormTable : RecordSelector;
                    viewOptions.collection = related ||
                        new (api.Collection.forModel(field.getRelatedModel()))();
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
