"use strict";

var $        = require('jquery');
var _        = require('underscore');
var Backbone = require('./backbone.js');

var localizeForm         = require('./localizeform.js');
var specifyform          = require('./specifyform.js');
var ComboBox             = require('./combobox.js');
var UIField              = require('./uifield.js');
var QueryCbx             = require('./querycbx.js');
var uiplugins            = require('./specifyplugins.js');
var uicommands           = require('./specifycommands.js');
var RecordSelector       = require('./recordselector.js');
var SubViewButton        = require('./subviewbutton.js');
var FormTable            = require('./formtable.js');
var IActionItemFormTable = require('./formtableinteractionitem.js');
var SubView              = require('./subview.js');
var CheckBox             = require('./checkbox.js');
var SpinnerUI            = require('./spinnerui.js');

    var MultiView = Backbone.View.extend({
        __name__: "MultiView",
        render: function() {
            var options = this.options;
            var collectionName = this.options.collection && this.options.collection.__name__;
            var iActionCollections =  ["LoanPreparationDependentCollection", "GiftPreparationDependentCollection"];
            // The form has to actually be built to tell if it is a formtable.
            specifyform.buildSubView(this.$el).done(function(form) {
                var View = form.hasClass('specify-form-type-formtable')
                    ? (iActionCollections.indexOf(collectionName) >= 0 ? IActionItemFormTable : FormTable)
                    : RecordSelector;
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
                return ComboBox;
            }
        };

        var getView = _.find(viewBySelector, function(__, selector) { return control.is(selector); });
        var view = new (getView && getView() || UIField)({ el: control, model: resource, populateForm: populateForm });
        view.render();
    };

    var populateSubview = function(resource, node) {
        var fieldName = node.data('specify-field-name');
        var field = resource.specifyModel.getField(fieldName);
        var viewOptions = { el: node, field: field, populateForm: populateForm };
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

module.exports = populateForm;

