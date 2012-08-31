define([
    'jquery', 'underscore', 'backbone', 'cs!populateform', 'schema',
    'specifyapi', 'specifyform', 'dataobjformatters', 'navigation', 'templates', 'cs!savebutton',
    'cs!domain',
    'jquery-ui', 'jquery-bbq'
], function($, _, Backbone, populateForm, schema, specifyapi,
            specifyform, dataobjformat, navigation, templates, SaveButton, domain) {
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
        events: {
            'click :button[value="Delete"]': 'openDeleteDialog'
        },
        initialize: function(options) {
            var self = this;
            self.model.on('error', function(resource, jqxhr, options) {
                switch (jqxhr.status) {
                case 404:
                    self.$el.html(templates.fourohfour());
                    return;
                }
            });
        },
        destroy: function() {
            var self = this;
            $.when(self.model.destroy()).done(function() {
                self.$el.empty();
                self.$el.append('<p>Item deleted.</p>');
            });
            self.deleteDialog.dialog('close');
        },
        openDeleteDialog: function(evt) {
            evt.preventDefault();
            this.deleteDialog.dialog('open');
        },
        render: function() {
            var self = this;
            self.$el.append(populateForm(self.buildForm(), self.model));
            self.saveBtn = new SaveButton({ el: self.$(':submit'), model: self.model });
            self.saveBtn.render().on('savecomplete', function() { self.trigger('savecomplete'); });
            self.deleteBtn = self.$(':button[value="Delete"]').prop('disabled', true);
            self.model.isNew() && self.deleteBtn.hide();
            self.deleteDialog = $(templates.confirmdelete()).appendTo(self.el).dialog({
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
            _({ candelete: 'enable', deleteblocked: 'disable' }).each(function(action, event) {
                self.model.on(event, function() {
                    self.deleteBtn.prop('disabled', action === 'disable');
                    self.setDeleteBtnToolTip();
                });
            });
            self.model.businessRuleMgr.checkCanDelete().done(
                _.bind(self.setDeleteBtnToolTip, self)
            );
            return self;
        },
        setDeleteBtnToolTip: function() {
            var title = _.map(this.model.businessRuleMgr.deleteBlockers,
                              function(__, field) { return field; }).join(',');
            this.deleteBtn.attr('title', title);
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
