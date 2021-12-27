"use strict";

import $ from 'jquery';
import _ from 'underscore';
import Backbone from './backbone';

import localizeForm from './localizeform';
import specifyform from './specifyform';
import ComboBox from './combobox';
import UIField from './uifield';
import QueryCbx from './querycbx';
import uiplugins from './specifyplugins';
import uicommands from './specifycommands';
import RecordSelector from './recordselector';
import * as SubViewButton from './subviewbutton';
import FormTable from './formtable';
import IActionItemFormTable from './formtableinteractionitem';
import SubView from './subview';
import CheckBox from './checkbox';
import SpinnerUI from './spinnerui';
import { readCookie } from './cookies';
import userInfo from './userinfo';

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
        if (field == null) {
            console.error("undefined relationship:", resource.specifyModel.name, fieldName);
            return null;
        }
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
        var cmd = uicommands[control.attr('action')] || uicommands[control.attr('name')] || uicommands.CommandNotAvailable;
        var view = new cmd({ el: control, model: resource, populateForm: populateForm });
        view.render();
    };

    var populateReportOnSaver = function (resource, control) {
        var chookie =  userInfo.id + '.sp-print-on-save.' + resource.specifyModel.name + '.' + control.attr('name');
        control.attr('check-cookie', chookie);
        control.prop('checked', readCookie(chookie) === 'true' ? true : false);
    };

    export default function populateForm(form, resource) {
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
        _.each(form.find('.specify-print-on-save'), function(node) {
            populateReportOnSaver(resource, $(node));
        });
        return form;
    };


