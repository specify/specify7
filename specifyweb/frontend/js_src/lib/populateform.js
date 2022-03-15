"use strict";

import $ from 'jquery';
import _ from 'underscore';
import Backbone from './backbone';

import localizeForm from './localizeform';
import specifyform from './specifyform';
import * as SubViewButton from './subviewbutton';
import FormTable from './formtable';
import IActionItemFormTable from './formtableinteractionitem';
import SubView from './subview';
import {
    RecordSelectorView,
    subFormNodeToProps
} from './components/recordselectorutils';

// TODO: rewrite to React
var MultiView = Backbone.View.extend({
        __name__: "MultiView",
        render: function() {
            var options = this.options;
            var collectionName = this.options.collection && this.options.collection.__name__;
            var iActionCollections =  ["LoanPreparationDependentCollection", "GiftPreparationDependentCollection"];
            // The form has to actually be built to tell if it is a formtable.
            specifyform.buildSubView(this.$el).then(function(form) {
                var View = form?.[0].classList.contains('specify-form-type-formtable') === true
                    ? new (iActionCollections.indexOf(collectionName) >= 0 ? IActionItemFormTable : FormTable)(options)
                    : new (RecordSelectorView)({...options, ...subFormNodeToProps(options.el)});
                View.render();
            });
            return this;
        }
    });
;

    var populateSubview = function(resource, node) {
        var fieldName = node.data('specify-field-name');
        var field = resource.specifyModel.getField(fieldName);
        if (field == null) {
            console.error("undefined relationship:", resource.specifyModel.name, fieldName);
            return null;
        }
        var viewOptions = { el: node[0], field: field, populateForm: populateForm };
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

    export default function populateForm(form, resource) {
        localizeForm(form);
        _.each(form.find('.specify-subview'), function(node) {
            populateSubview(resource, $(node));
        });
        return form;
    };


