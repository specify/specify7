"use strict";

var $                = require('jquery');
var _                = require('underscore');
var Backbone         = require('./backbone.js');

var specifyform       = require('./specifyform.js');
var dataobjformatters = require('./dataobjformatters.js');
var viewheader        = require('./templates/viewheader.html');
var SaveButton        = require('./savebutton.js');
var DeleteButton      = require('./deletebutton.js');
const formsText = require('./localization/forms').default;
const commonText = require('./localization/common').default;

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

        if (!self.readOnly) {
            self.saveBtn = new SaveButton({
                model: self.model,
                addAnother: self.model.isNew() &&
                    !self.options.noAddAnother &&
                    !_(NO_ADD_ANOTHER).contains(self.model.specifyModel.name)
            });

            self.saveBtn.on('savecomplete', self.saved, self);
        }

        if (!self.readOnly && !self.model.isNew()) {
            self.deleteBtn = new DeleteButton({ model: self.model });
            self.deleteBtn.on('deleted', self.deleted, self);
        }
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
            newUrl: self.newUrl
        }));

        var view = self.model.specifyModel.view || self.model.specifyModel.name;
        specifyform.buildViewByName(view, 'form', self.mode).done(function(form) {
            self.populateForm(form, self.model);
            self.$el.attr('aria-label', self.model.specifyModel.getLocalizedName());
            self.header ? form.find('.specify-form-header').replaceWith(self.header) :
                form.find('.specify-form-header').remove();

            var buttons = $('<div class="specify-form-buttons">').appendTo(form);
            self.$el.append(form);
            self.saveBtn && self.saveBtn.render().$el.appendTo(buttons);
            self.deleteBtn && self.deleteBtn.render().$el.appendTo(buttons);
            self.reporterOnSave = self.$el.find(".specify-print-on-save");
            self.setTitle();
        }).fail(function(jqXHR) {
            if (jqXHR.status !== 404) return;
            jqXHR.errorHandled = true;
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

        dataobjformatters.format(self.model).done(function(str) {
            if (_(str).isString()) {
                $('.view-title', self.header).attr('title', str);
                self.trigger('changetitle', self, title + ': ' + str);
            }
        });
    },
    setFormTitle: function(title) {
        this.$el.is(':ui-dialog') && this.$el.dialog('option','title',title);
    },
    saved: function(options) {
        this.trigger('saved', this.model, options);
    },
    deleted: function() {
        this.trigger('deleted');
    }
});

_.extend(ResourceView, Backbone.Events);

module.exports = ResourceView;
