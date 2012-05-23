define([
    'jquery', 'underscore', 'backbone', 'populateform', 'schema', 'schemalocalization',
    'specifyapi', 'specifyform', 'dataobjformatters', 'navigation',
    'text!/static/html/templates/confirmdelete.html',
    'text!/static/html/templates/404.html',
    'jquery-ui', 'jquery-bbq'
], function($, _, Backbone, populateForm, schema, schemalocalization, specifyapi, specifyform, dataobjformat, navigation,
            confirmdelete, notfoundtemplate) {
    "use strict";
    var views = {};
    var addDeleteLinks = '<a class="specify-add-related">Add</a><a class="specify-delete-related">Delete</a>';


    views.RecordSetView = Backbone.View.extend({
        render: function() {
            var self = this;
            self.model.rget('recordsetitems').done(function(items) {
                var specifyModel = schema.getModelById(self.model.get('dbtableid'));
                var form = specifyform.recordSetForm(specifyModel);
                self.$el.append(populateForm(form, self.model));
                var formHeader = form.find('.specify-form-header:first');
                $('<img>', {src: specifyModel.getIcon()}).prependTo(formHeader);
                var title = formHeader.find('span').text();
                title += ': ' + self.model.get('name');
                formHeader.find('span').text(title);
                window.document.title = title;
            });
            return this;
        }
    });

    var MainForm = Backbone.View.extend({
        events: {
            'click :submit': 'submit',
            'click :button[value="Delete"]': 'openDeleteDialog'
        },
        initialize: function(options) {
            var self = this;
            self.model.on('saverequired', function() {
                self.$(':submit').prop('disabled', false);
            });
            self.model.on('error', function(resource, jqxhr, options) {
                switch (jqxhr.status) {
                case 404:
                    self.$el.html(notfoundtemplate);
                    return;
                }
            });
        },
        submit: function(evt) {
            var self = this;
            evt.preventDefault();
            self.$(':submit').prop('disabled', true);
            self.model.rsave().done(function() { self.trigger('savecomplete'); });
        },
        destroy: function() {
            this.deleteDialog.dialog('close');
            this.model.destroy();
            this.undelegateEvents();
            this.$el.empty();
        },
        openDeleteDialog: function(evt) {
            evt.preventDefault();
            this.deleteDialog.dialog('open');
        },
        render: function() {
            var self = this;
            self.$el.append(populateForm(self.buildForm(), self.model));
            self.$(':submit').prop('disabled', true);
            if (self.model.isNew()) self.$(':button[value="Delete"]').hide();
            self.deleteDialog = $(confirmdelete).appendTo(self.el).dialog({
                resizable: false, modal: true, autoOpen: false, buttons: {
                    'Delete': _.bind(self.destroy, self),
                    'Cancel': function() { $(this).dialog('close'); }
                }
            });
            self.deleteDialog.parent('.ui-dialog').appendTo(self.el);
            self.deleteDialog.on('remove', function() {
                $(this).detach();
            });
            self.setTitle();
            return self;
        },
        setFormTitle: function(title) {
            this.$('.specify-form-header span').text(title);
        },
        setTitle: function() {}
    });

    views.ResourceView = MainForm.extend({
        initialize: function(options) {
            this.specifyModel = schema.getModel(options.modelName);
            this.model = new (specifyapi.Resource.forModel(this.specifyModel))({ id: options.resourceId });
            this.model.on('change', _.bind(this.setTitle, this));
            MainForm.prototype.initialize.call(this, options);
        },
        buildForm: function() {
            return specifyform.buildViewByName(this.specifyModel.view);
        },
        setTitle: function () {
            var self = this;
            var title = self.specifyModel.getLocalizedName();
            self.setFormTitle(title);
            window.document.title = title;
            dataobjformat(self.model).done(function(str) {
                if (_(str).isString()) {
                    title += ': ' + str;
                    self.setFormTitle(title);
                    window.document.title = title;
                }
            });
        }
    });

    views.ToManyView = MainForm.extend({
        initialize: function(options) {
            this.model = options.parentResource;
            this.model.on('change', _.bind(this.setTitle, this));
            MainForm.prototype.initialize.call(this, options);
        },
        buildForm: function() {
            var o = this.options;
            var form = specifyform.relatedObjectsForm(o.parentModel.name, o.relatedField.name, o.viewdef);
            form.find('.specify-form-header:first')
                .append(addDeleteLinks)
                .find('.specify-add-related')
                .attr('href', $.param.querystring(window.location.pathname + 'new/', {viewdef: o.viewdef}))
                .click(function() { navigation.go($(this).attr('href')); return false; });
            return form;
        },
        setTitle: function () {
            var self = this, o = this.options;
            var title = o.relatedField.getLocalizedName() + ' for ' + o.parentModel.getLocalizedName();
            self.setFormTitle(title);
            window.document.title = title;
            dataobjformat(self.model).done(function(str) {
                if (_(str).isString()) {
                    title += ': ' + str;
                    self.setFormTitle(title);
                    window.document.title = title;
                }
            });
        }
    });

    views.ToOneView = MainForm.extend({
        initialize: function(options) {
            options.parentResource.on('change', _.bind(this.setTitle, this));
            MainForm.prototype.initialize.call(this, options);
        },
        buildForm: function() {
            var viewdef = this.options.viewdef;
            return viewdef ? specifyform.buildViewByViewDefName(viewdef) :
                specifyform.buildViewByName(this.model.specifyModel.view);
        },
        setTitle: function () {
            var self = this, o = this.options;
            var title = !o.adding ? o.relatedField.getLocalizedName() : 'New ' + (
                o.relatedField.type === "one-to-many" ? this.model.specifyModel.getLocalizedName() :
                    o.relatedField.getLocalizedName());
            title += ' for ' + o.parentModel.getLocalizedName();
            self.setFormTitle(title);
            window.document.title = title;
            dataobjformat(o.parentResource).done(function(str) {
                if (_(str).isString()) {
                    title += ': ' + str;
                    self.setFormTitle(title);
                    window.document.title = title;
                }
            });
        }
    });

    return views;
});
