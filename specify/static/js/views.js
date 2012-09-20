define([
    'jquery', 'underscore', 'backbone', 'cs!populateform', 'schema',
    'specifyapi', 'specifyform', 'dataobjformatters', 'navigation', 'templates', 'cs!savebutton',
    'cs!deletebutton', 'cs!domain',
    'jquery-ui', 'jquery-bbq'
], function($, _, Backbone, populateForm, schema, specifyapi,
            specifyform, dataobjformat, navigation, templates,
            SaveButton, DeleteButton, domain) {
    "use strict";
    var views = {};
    var addDeleteLinks = '<a class="specify-add-related">Add</a><a class="specify-delete-related">Delete</a>';
    function setWindowTitle(title) { window && (window.document.title = title); }

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
                setWindowTitle(title);
            });
            return this;
        }
    });

    var MainForm = Backbone.View.extend({
        initialize: function(options) {
            var self = this;
            self.model.on('error', function(resource, jqxhr, options) {
                switch (jqxhr.status) {
                case 404:
                    self.$el.html(templates.fourohfour());
                    return;
                }
            });
            self.saveBtn = new SaveButton({ model: self.model });
            self.saveBtn.on('savecomplete', function() { self.trigger('savecomplete'); });

            if (options.deleteButton) {
                self.deleteBtn = new DeleteButton({ model: self.model });
                self.deleteBtn.on('deleted', function() {
                    self.$el.empty();
                    self.$el.append('<p>Item deleted.</p>');
                });
            }
        },
        render: function() {
            var self = this;
            self.$el.append(populateForm(self.buildForm(), self.model));
            self.saveBtn && self.saveBtn.render().$el.appendTo(self.el);
            self.deleteBtn && self.deleteBtn.render().$el.appendTo(self.el);
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
            this.model.on('change', this.setTitle, this);
            options.deleteButton = !this.model.isNew();
            MainForm.prototype.initialize.call(this, options);
        },
        buildForm: function() {
            return specifyform.buildViewByName(this.specifyModel.view);
        },
        setTitle: function () {
            var self = this;
            var title = self.specifyModel.getLocalizedName();
            self.setFormTitle(title);
            setWindowTitle(title);
            dataobjformat(self.model).done(function(str) {
                if (_(str).isString()) {
                    title += ': ' + str;
                    self.setFormTitle(title);
                    setWindowTitle(title);
                }
            });
        }
    });

    views.CollectionView = MainForm.extend({
        initialize: function(options) {
            this.model = options.parentResource;
            this.model.on('change', this.setTitle, this);
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
            setWindowTitle(title);
            dataobjformat(self.model).done(function(str) {
                if (_(str).isString()) {
                    title += ': ' + str;
                    self.setFormTitle(title);
                    setWindowTitle(title);
                }
            });
        }
    });

    views.NewResourceView = MainForm.extend({
        initialize: function(options) {
            this.specifyModel = specifyform.getModelForView(options.viewName);
            this.model = new (specifyapi.Resource.forModel(this.specifyModel))();
            var domainField = this.specifyModel.orgRelationship();
            this.parentResource = domain[domainField.name];
            this.model.set(domainField.name, this.parentResource.url());
            this.model.on('change', this.setTitle, this);
            this.on('savecomplete', function() {
                navigation.go(this.model.viewUrl())
            }, this);
            MainForm.prototype.initialize.call(this, options);
        },
        buildForm: function() {
            return specifyform.buildViewByName(this.options.viewName);
        },
        setTitle: function() {
            var self = this;
            var title = 'New ' + self.specifyModel.getLocalizedName() + ' for '
                + self.specifyModel.orgRelationship().getRelatedModel().getLocalizedName();
            self.setFormTitle(title);
            setWindowTitle(title);
            dataobjformat(self.parentResource).done(function(str) {
                if (_.isString(str)) {
                    title += ': ' + str;
                    self.setFormTitle(title);
                    setWindowTitle(title);
                }
            });
        }
    });

    views.RelatedView = MainForm.extend({
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
            setWindowTitle(title);
            dataobjformat(o.parentResource).done(function(str) {
                if (_(str).isString()) {
                    title += ': ' + str;
                    self.setFormTitle(title);
                    setWindowTitle(title);
                }
            });
        }
    });

    return views;
});
