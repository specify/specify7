define([
    'jquery', 'underscore', 'backbone', 'localizeform', 'specifyform', 'picklist', 'uifield',
    'querycbx', 'specifyplugins', 'specifycommands', 'recordselector', 'subviewbutton',
    'formtable', 'subview', 'checkbox', 'spinnerui', 'treelevelpicklist'
], function($, _, Backbone, localizeForm, specifyform, PickList, UIField, QueryCbx, uiplugins, uicommands,
            RecordSelector, SubViewButton, FormTable, SubView, CheckBox, SpinnerUI, TreeLevelPickList) {
    "use strict";

    var MultiView = Backbone.View.extend({
        __name__: "MultiView",
        render: function() {
            var options = this.options;
            // The form has to actually be built to tell if it is a formtable.
            specifyform.buildSubView(this.$el).done(function(form) {
                var View = form.hasClass('specify-form-type-formtable') ? FormTable : RecordSelector;
                new View(options).render();
            });
            return this;
        }
    });

    var populateField = function(resource, control) {
        var viewBySelector = {
            ':checkbox': function() {return CheckBox;},
            '.specify-spinner': function() {return SpinnerUI;},
            '.specify-querycbx': function() {return QueryCbx;},
            '.specify-uiplugin': function() {
                var init = specifyform.parseSpecifyProperties(control.data('specify-initialize'));
                return uiplugins[init.name] || uiplugins.PluginNotAvailable;
            },
            '.specify-combobox': function() {
                return (control.attr('name') === 'definitionItem') ? TreeLevelPickList : PickList;
            }
        };

        var getView = _.find(viewBySelector, function(__, selector) { return control.is(selector); });
        var view = new (getView && getView() || UIField)({ el: control, model: resource });
        view.render();
    };

    var populateSubview = function(resource, node) {
        var fieldName = node.data('specify-field-name');
        var field = resource.specifyModel.getField(fieldName);
        var viewOptions = { el: node, field: field };
        return resource.rget(fieldName).done(function(related) {
            var View;
            switch (field.type) {
            case 'one-to-many':
                viewOptions.collection = related;
                View = specifyform.isSubViewButton(node) ? SubViewButton.ToMany : MultiView;
                break;
            case 'zero-to-one':
            case 'many-to-one':
                viewOptions.model = related;
                viewOptions.parentResource = resource;
                View = specifyform.isSubViewButton(node) ? SubViewButton.ToOne : SubView;
                break;
            default:
                throw new Error("unhandled relationship type: " + field.type);
            }
            return new View(viewOptions).render();
        });
    };

    var populateCommand = function(resource, control) {
        var cmd = uicommands[control.attr('action')] || uicommands.CommandNotAvailable;
        var view = new cmd({ el: control, model: resource });
        view.render();
    };

    var populateForm = function(form, resource) {
        localizeForm(form);
        _.each(form.find('.specify-field'), function(node) {
            populateField(resource, $(node));
        });
        _.each(form.find('.specify-subview'), function(node) {
            populateSubview(resource, $(node));
        });
        _.each(form.find('.specify-uicommand'), function(node) {
            populateCommand(resource, $(node));
        });
        return form;
    };

    return populateForm;
});
