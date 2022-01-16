"use strict";

import $ from 'jquery';
import _ from 'underscore';
import Backbone from './backbone';

import specifyform from './specifyform';
import {format} from './dataobjformatters';
import viewheader from './templates/viewheader.html';
import SaveButton from './components/savebutton';
import DeleteButton from './components/deletebutton';
import formsText from './localization/forms';
import commonText from './localization/common';
import userInfo from "./userinfo";
import populateForm from "./populateform";
import reports from "./reports";
import * as navigation from "./navigation";
import {setCurrentView} from "./specifyapp";
import {setTitle} from "./components/hooks";
import {className} from './components/basic';

var NO_ADD_ANOTHER = [
    'Gift',
    'Borrow',
    'Loan',
    'ExchangeIn',
    'ExchangeOut',
    'Permit',
    'RepositoryAgreement'
];

const ResourceView = Backbone.View.extend({
    tagName: "section",
    __name__: "ResourceView",
    // triggered events = {
    //   saved(this.model, options),
    //   deleted(),
    //   addanother(newResource) when resource is saved if user selected save-and-add-another,
    //   redisplay() when the view wants its container to "reload" it,
    //   changetitle(string title)
    // }
    initialize: function(options) {
        // options = {
        //   model: specifyModel.Resource to view,
        //   el: $element to render in,
        //   recordSet: schema.models.RecordSet.Resource? resource is included in,
        //   mode: 'view' | 'edit',
        //   noAddAnother: boolean?,
        //   noHeader: boolean?
        // }
        var self = this;
        //   populateForm: ref to populateForm function
        self.populateForm = options.populateForm;
        self.model.on('change', self.setTitle, self);
        self.recordSet = options.recordSet;
        self.mode = options.mode;
        self.readOnly = self.mode === 'view';

        self.recordsetInfo = self.model.get('recordset_info');
        if (self.recordsetInfo) {
            self.prev = self.recordsetInfo.previous && self.model.constructor.fromUri(self.recordsetInfo.previous);
            self.prev && (self.prev.recordsetid = self.model.recordsetid);

            self.next = self.recordsetInfo.next && self.model.constructor.fromUri(self.recordsetInfo.next);
            self.next && (self.next.recordsetid = self.model.recordsetid);

            if (!self.readOnly) {
                var newResource = new self.model.specifyModel.Resource(); // TODO: self.model.constructor?
                newResource.recordsetid = self.model.recordsetid;
                self.newUrl = newResource.viewUrl();
            }
        }

        if (!self.readOnly && !self.model.isNew())
            self.deleteBtn = new DeleteButton({
                model: self.model,
                onDeleted: ()=>self.deleted(),
            });
    },
    render: function() {
        var self = this;
        self.$el.empty();
        self.header = self.options.noHeader ? null : $(viewheader({
            formsText,
            viewTitle: self.model.specifyModel.getLocalizedName(),
            recordsetInfo: self.recordsetInfo,
            recordsetName: self.recordSet && self.recordSet.get('name'),
            prevUrl: self.prev && self.prev.viewUrl(),
            nextUrl: self.next && self.next.viewUrl(),
            newUrl: self.newUrl,
            className
        }));

        var view = self.model.specifyModel.view || self.model.specifyModel.name;
        specifyform.buildViewByName(view, 'form', self.mode).done(function(form) {
            self.populateForm(form, self.model);
            self.$el.attr('aria-label', self.model.specifyModel.getLocalizedName());
            self.header ? form.find('.specify-form-header').replaceWith(self.header) :
                form.find('.specify-form-header').remove();

            var buttons = $(`<div class="${className.formFooter}" role="toolbar">`).appendTo(form);
            self.$el.append(form);
            self.deleteBtn && self.deleteBtn.render().$el.appendTo(buttons);
            if (!self.readOnly) {
                self.saveBtn = new SaveButton({
                    model: self.model,
                    form: self.el.querySelector('form'),
                    canAddAnother: !self.options.noAddAnother &&
                        !_(NO_ADD_ANOTHER).contains(self.model.specifyModel.name),
                    onSaved: (options)=>self.trigger('saved', self.model, options),
                }).render();
                buttons.append(`<span class="flex-1 -ml-2"></div>`)
                self.saveBtn.$el.appendTo(buttons);
            }
            self.reporterOnSave = self.$el.find(".specify-print-on-save");
            self.setTitle();
        }).fail(function(jqXHR) {
            if (jqXHR.status !== 404) return;
            jqXHR.errorHandled = true;
            self.el.setAttribute('role','alert');
            self.$el.append(`
                <h2>${formsText('missingFormDefinitionPageHeader')}</h2
                <p>${formsText('missingFormDefinitionPageContent')}</p>
            `);
        });

        ResourceView.trigger('rendered', self);
        return self;
    },
    setTitle: function () {
        var self = this;

        const resourceLabel = self.model.specifyModel.getLocalizedName();
        var title = self.model.isNew() ?
          commonText('newResourceTitle')(resourceLabel) :
          resourceLabel;

        self.setFormTitle(title);
        self.trigger('changetitle', self, title);

        format(self.model).done(function(str) {
            if (_(str).isString()) {
                $('.view-title', self.header).attr('title', str);
                self.trigger('changetitle', self, title + ': ' + str);
            }
        });
    },
    setFormTitle: function(title) {
        this.$el.is(':ui-dialog') && this.$el.dialog('option','title',title);
    },
    deleted: function() {
        this.trigger('deleted');
    }
});

_.extend(ResourceView, Backbone.Events);

function viewSaved(resource, recordSet, options) {
    if (options.addAnother) {
        showResource(options.newResource, recordSet, true);
    } else if (options.wasNew) {
        navigation.go(resource.viewUrl());
    } else {
        const reloadResource = new resource.constructor({ id: resource.id });
        reloadResource.recordsetid = resource.recordsetid;
        reloadResource.fetch().done(() => showResource(reloadResource, recordSet));
    }
}

// build and display view for resource
export function showResource(resource, recordSet, pushUrl) {
        var viewMode = userInfo.isReadOnly ? 'view' : 'edit';
        var view = new ResourceView({
            className: `${className.container} w-fit overflow-y-auto`,
            populateForm: populateForm,
            model: resource,
            recordSet: recordSet,
            mode: viewMode
        });

        view.on('saved', function(resource, options) {
            if (this.reporterOnSave && this.reporterOnSave.prop('checked')) {
                console.log('generating label or invoice');
                reports( {
                    tblId: resource.specifyModel.tableId,
                    recordToPrintId: resource.id,
                    autoSelectSingle: true,
                    done: viewSaved.bind(this, resource, recordSet, options)
                }).then(view=>view.render());
            } else {
                viewSaved(resource, recordSet, options);
            }
        }).on('deleted', function() {
            if (view.next) {
                navigation.go(view.next.viewUrl());
            } else if (view.prev) {
                navigation.go(view.prev.viewUrl());
            } else {
                view.$el.empty();
                const dialog = $(`<div>
                    ${commonText('resourceDeletedDialogHeader')}
                    <p>${commonText('resourceDeletedDialogMessage')}</p>
                </div>`).dialog({
                    title: commonText('resourceDeletedDialogTitle'),
                    buttons: [
                        {
                            text: commonText('close'),
                            click: ()=>{
                                navigation.go('/');
                                dialog.dialog('destroy');
                            }
                        }
                    ]
                });
            }
        }).on('changetitle', function(_resource, title) {
            setTitle(title);
        });
    pushUrl && navigation.push(resource.viewUrl());
    setCurrentView(view);
    }


export default ResourceView;
