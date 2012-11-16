define([
    'jquery', 'underscore', 'backbone', 'cs!populateform', 'specifyapi',
    'specifyform', 'dataobjformatters', 'navigation', 'templates',
    'cs!savebutton', 'cs!deletebutton',
    'jquery-ui', 'jquery-bbq'
], function($, _, Backbone, populateForm, specifyapi,
            specifyform, dataobjformat, navigation, templates,
            SaveButton, DeleteButton) {
    "use strict";

    function setWindowTitle(title) { window && (window.document.title = title); }

    return Backbone.View.extend({
        events: {
            'click .recordset-prev, .recordset-next': 'nav'
        },
        initialize: function(options) {
            var self = this;
            self.model.on('change', self.setTitle, self);
            self.recordSet = options.recordSet;
            self.mode = options.mode;
            self.readOnly = self.mode === 'view';

            self.recordsetInfo = self.model.get('recordset_info');
            if (self.recordsetInfo) {
                self.prev = self.recordsetInfo.previous && specifyapi.Resource.fromUri(self.recordsetInfo.previous);
                self.prev && (self.prev.recordsetid = self.model.recordsetid);

                self.next = self.recordsetInfo.next && specifyapi.Resource.fromUri(self.recordsetInfo.next);
                self.next && (self.next.recordsetid = self.model.recordsetid);
            }

            self.model.on('error', function(resource, jqxhr, options) {
                switch (jqxhr.status) {
                case 404:
                    self.$el.html(templates.fourohfour());
                    return;
                }
            });

            if (!self.readOnly) {
                self.saveBtn = new SaveButton({
                    model: self.model,
                    addAnother: self.model.isNew() && self.recordSet });

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
            self.header = $(templates.viewheader({
                viewTitle: self.model.specifyModel.getLocalizedName(),
                recordsetInfo: self.recordsetInfo,
                recordsetName: self.recordSet && self.recordSet.get('name'),
                prevUrl: self.prev && self.prev.viewUrl(),
                nextUrl: self.next && self.next.viewUrl()
            }));
            specifyform.buildViewByName(self.model.specifyModel.view, 'form', self.mode).done(function(form) {
                populateForm(form, self.model);
                form.find('.specify-form-header').replaceWith(self.header);
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
            setWindowTitle(title);
            dataobjformat(self.model).done(function(str) {
                if (_(str).isString()) {
                    title += ': ' + str;
                    self.setFormTitle(title);
                    setWindowTitle(title);
                }
            });
        },
        setFormTitle: function(title) {
            this.header.find('.view-title').text(title);
        },
        nav: function(evt) {
            evt.preventDefault();
            navigation.go($(evt.currentTarget).prop('href'));
        },
        saved: function(options) {
            var self = this;
            if (options.addAnother) {
                self.trigger('addanother', options.newResource);
            } else if (options.wasNew) {
                navigation.go(self.model.viewUrl());
            } else {
                self.trigger('redisplay');
            }
        },
        deleted: function() {
            var self = this;
            if (self.next) {
                navigation.go(self.next.viewUrl());
            } else if (self.prev) {
                navigation.go(self.prev.viewUrl());
            } else {
                self.$el.empty();
                self.$el.append('<p>Item deleted.</p>');
            }
        }
    });
});
