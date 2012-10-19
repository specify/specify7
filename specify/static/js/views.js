define([
    'jquery', 'underscore', 'backbone', 'cs!populateform', 'schema',
    'specifyapi', 'specifyform', 'dataobjformatters', 'navigation', 'templates', 'cs!savebutton',
    'cs!deletebutton', 'cs!domain', 'recordselector',
    'jquery-ui', 'jquery-bbq'
], function($, _, Backbone, populateForm, schema, specifyapi,
            specifyform, dataobjformat, navigation, templates,
            SaveButton, DeleteButton, domain, RecordSelector) {
    "use strict";
    var views = {};
    var addDeleteLinks = '<a class="specify-add-related">Add</a><a class="specify-delete-related">Delete</a>';
    function setWindowTitle(title) { window && (window.document.title = title); }

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
            self.saveBtn = new SaveButton(_.extend(
                { model: self.model },
                options.saveButtonOptions));

            self.saveBtn.on('savecomplete', function() {
                var args = ['savecomplete'].concat(_(arguments).toArray());
                self.trigger.apply(self, args);
            });

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
            self.$el.empty();
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

    var RecordSetItemSelector = RecordSelector.extend({
        initialize: function(options) {
            var self = this;
            self.recordSet = options.recordSet;
            self.specifyModel = schema.getModelById(self.collection.parent.get('dbtableid'));

            _.extend(options, {
                noHeader: true,
                sliderAtTop: true,
                urlParam: 'index',
                buildSubView: function() {
                    var view = specifyform.buildViewByName(self.specifyModel.view);
                    view.find('.specify-form-header:first').remove();
                    return view;
                },
                populateform: function(form, recordSetItem) {
                    return populateForm(form, recordSetItem.item);
                }
            });
            RecordSelector.prototype.initialize.call(this, options);
        },
        add: function() {
            navigation.go(this.recordSet.viewUrl() + "new/");
        },
        delete: function() {
            this.makeDeleteDialog();
        },
        doDestroy: function() {
            var self = this;
            var recordSetItem = self.currentResource();
            recordSetItem.item.destroy().done(function() {
                self.collection.remove(recordSetItem);
            });
        }
    });

    views.RecordSetView = Backbone.View.extend({
        initialize: function(options) {
            var self = this;
            self.recordSet = options.recordSet;
            self.specifyModel = schema.getModelById(self.recordSet.get('dbtableid'));
        },
        render: function() {
            var self = this;
            self.$el.empty();
            var header = $(templates.recordsetheader()).appendTo(self.el);
            header.find('img').attr('src', self.specifyModel.getIcon());
            var title = self.recordSet.specifyModel.getLocalizedName() + ': ' + self.recordSet.get('name');
            header.find('span').text(title);
            setWindowTitle(title);

            self.recordSet.rget('recordsetitems', true).done(function(items) {
                var recordSelector = new RecordSetItemSelector({ recordSet: self.recordSet, collection: items });
                recordSelector.render();
                self.$el.append(recordSelector.el);
            });
            return this;
        }
    });

    views.AddToRecordSetView = MainForm.extend({
        initialize: function(options) {
            var self = this;
            self.recordSet = options.recordSet;
            self.specifyModel = schema.getModelById(self.recordSet.get('dbtableid'));
            self.model = new (specifyapi.Resource.forModel(self.specifyModel))();
            self.model.recordSetId = self.recordSet.id;

            var domainField = self.specifyModel.orgRelationship();
            var parentResource = domain[domainField.name];
            self.model.set(domainField.name, parentResource.url());

            self.on('savecomplete', function(options) {
                if (options.addAnother) {
                    self.trigger('refresh');
                } else {
                    var url = $.param.querystring(self.recordSet.viewUrl(), {index: "end"});
                    navigation.go(url);
                }
            }, self);

            options.saveButtonOptions = { addAnother: true };
            MainForm.prototype.initialize.call(this, options);
        },
        buildForm: function() {
            return specifyform.buildViewByName(this.specifyModel.view);
        },
        setTitle: function() {
            var self = this;
            var title = 'Adding new ' + self.specifyModel.getLocalizedName() + ' to "'
                + self.recordSet.get('name') + '"';
            self.setFormTitle(title);
            setWindowTitle(title);
        }
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
            this.on('savecomplete', function(options) {
                if (options.addAnother) {
                    _.defer(_.bind(window.open, window, this.model.viewUrl()));
                    this.trigger('refresh');
                } else {
                    navigation.go(this.model.viewUrl());
                }
            }, this);
            options.saveButtonOptions = { addAnother: true };
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
