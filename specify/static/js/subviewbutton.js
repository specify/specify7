define([
    'jquery', 'backbone', 'icons', 'specifyform', 'navigation', 'cs!deletebutton', 'recordselector', 'jquery-bbq'
], function($, Backbone, icons, specifyform, navigation, DeleteButton, RecordSelector) {

    return Backbone.View.extend({
        events: {
            'click a': 'click'
        },
        initialize: function(options) {
            var self = this;
            self.field = options.field;
            self.relatedModel = self.field.getRelatedModel();

            self.related = self.options.model;
            self.model = self.options.parentResource;

            var props = specifyform.parseSpecifyProperties(self.$el.data('specify-initialize'));
            self.icon = props.icon ? icons.getIcon(props.icon) : self.relatedModel.getIcon();

            if (self.field.type === 'one-to-many') {
                self.collection.on('add remove destroy', self.collectionChanged, self);
            } else {
                self.model.on('change:' + self.field.name.toLowerCase(), self.resourceChanged, self);
            }
        },
        render: function() {
            var self = this;
            self.$el.empty();

            var button = $('<a>').appendTo(self.el);

            button.append($('<img>', {'class': "specify-subviewbutton-icon", src: self.icon}));
            button.append('<span class="specify-subview-button-count">');
            button.button({ disabled: self.model.isNew() });

            if (self.field.type === 'one-to-many') {
                self.collectionChanged();
            } else {
                self.resourceChanged();
            }
        },
        setCount: function (c) {
            this.$('.specify-subview-button-count').text(c);
        },
        resourceChanged: function() {
            this.setCount(this.model.get(this.field.name) ? 1 : 0);
        },
        collectionChanged: function() {
            this.setCount(this.collection.length);
            if (this.collection.length < 1 && this.dialog) this.dialog.dialog('close');
        },
        click: function(evt) {
            var self = this;
            evt.preventDefault();
            self.field.type === 'one-to-many' ? self.makeToManyDialog() : self.makeToOneDialog();
        },
        makeToOneDialog: function () {
            var self = this;
            var dialogForm = specifyform.buildSubView(self.el);

            dialogForm.find('.specify-form-header:first').remove();

            if (!self.related) {
                self.related = new (self.model.constructor.forModel(self.relatedModel))();
                self.related.placeInSameHierarchy(self.model);
                self.model.setToOneField(self.field.name, self.related);
                self.resourceChanged();
            }

            $('<input type="button" value="Done">').appendTo(dialogForm).click(function() {
                dialog.dialog('close');
            });

            if (self.related.isNew()) {
                $('<input type="button" value="Remove">').appendTo(dialogForm).click(function() {
                    dialog.dialog('close');
                    self.related = null;
                    self.model.setToOneField(self.field.name, self.related, {silent: true});
                    self.resourceChanged();
                });
            } else {
                var deleteButton = new DeleteButton({ model: self.related });
                deleteButton.render().$el.appendTo(dialogForm);
                deleteButton.on('deleted', function() {
                    dialog.dialog('close');
                    self.related = null;
                    self.model.setToOneField(self.field.name, self.related, {silent: true});
                    self.resourceChanged();
                });
            }

            self.options.populateform(dialogForm, self.related);
            var dialog = $('<div>').append(dialogForm).dialog({
                width: 'auto',
                title: (self.related.isNew() ? "New " : "") + self.related.specifyModel.getLocalizedName(),
                close: function() { $(this).remove(); }
            });
        },
        makeToManyDialog: function () {
            var self = this;
            if (self.dialog) return;

            var recordSelector = new RecordSelector({
                field: self.field,
                collection: self.collection,
                populateform: self.options.populateform,
                buildSubView: function () { return specifyform.buildSubView(self.$el); },
                noHeader: true
            });
            recordSelector.render();
            if (self.collection.length < 1) recordSelector.add();

            self.dialog = $('<div>').append(recordSelector.el).dialog({
                width: 'auto',
                title: self.field.getLocalizedName(),
                close: function() { $(this).remove(); self.dialog = null; }
            });

        }
    });
});
