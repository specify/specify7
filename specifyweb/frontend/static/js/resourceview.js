define([
    'jquery', 'underscore', 'backbone', 'populateform',
    'specifyform', 'dataobjformatters', 'navigation', 'templates',
    'savebutton', 'deletebutton',
    'jquery-ui', 'jquery-bbq'
], function($, _, Backbone, populateForm,
            specifyform, dataobjformatters, navigation, templates,
            SaveButton, DeleteButton) {
    "use strict";

    return Backbone.View.extend({
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
            //   noHeader: boolean?
            // }
            var self = this;
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
                    addAnother: self.model.isNew()
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
            self.header = self.options.noHeader ? null : $(templates.viewheader({
                viewTitle: self.model.specifyModel.getLocalizedName(),
                recordsetInfo: self.recordsetInfo,
                recordsetName: self.recordSet && self.recordSet.get('name'),
                prevUrl: self.prev && self.prev.viewUrl(),
                nextUrl: self.next && self.next.viewUrl(),
                newUrl: self.newUrl
            }));
            specifyform.buildViewByName(self.model.specifyModel.view, 'form', self.mode).done(function(form) {
                populateForm(form, self.model);
                self.header ? form.find('.specify-form-header').replaceWith(self.header) :
                    form.find('.specify-form-header').remove();
                self.$el.append(form);
                self.saveBtn && self.saveBtn.render().$el.appendTo(self.el);
                self.deleteBtn && self.deleteBtn.render().$el.appendTo(self.el);
                self.setTitle();
            });
            return self;
        },
        setTitle: function () {
            var self = this;
            var title = (self.model.isNew() ? 'New ' : '') +
                self.model.specifyModel.getLocalizedName();

            self.setFormTitle(title);
            self.trigger('changetitle', self, title);

            dataobjformatters.format(self.model).done(function(str) {
                if (_(str).isString()) {
                    title += ': ' + str;
                    self.setFormTitle(title);
                    self.trigger('changetitle', title);
                }
            });
        },
        setFormTitle: function(title) {
            this.header && this.header.find('.view-title').text(title);
        },
        saved: function(options) {
            this.trigger('saved', this.model, options);
        },
        deleted: function() {
            this.trigger('deleted');
        }
    });
});
