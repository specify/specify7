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
        },
        render: function() {
            var self = this;
            self.$el.empty();

            var fieldName = self.field.name.toLowerCase();
            var props = specifyform.parseSpecifyProperties(self.$el.data('specify-initialize'));
            var icon = props.icon ? icons.getIcon(props.icon) : self.relatedModel.getIcon();
            var button = $('<a>').appendTo(self.el);
            if (self.field.type === 'one-to-many') {
                self.model.rget(self.field.name).done(function(collection) {
                    self.collection = collection;
                    collection.getTotalCount().done(function(count) {
                        var value = _.isUndefined(count) ? 'N/A' : count.toString();
                        self.setCount(value);
                    });
                    collection.on('add remove destroy', _.bind(self.collectionChanged, self));
                });
            } else {
                self.model.rget(self.field.name).done(function(related) {
                    self.$('.specify-subview-button-count').text(related ? 1 : 0);
                });
            }
            button.append($('<img>', {'class': "specify-subviewbutton-icon", src: icon}));
            button.append('<span class="specify-subview-button-count">');
            button.button({ disabled: self.model.isNew() });
        },
        setCount: function (c) {
            this.$('.specify-subview-button-count').text(c);
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

            self.model.rget(self.field.name).done(function(resource) {
                if (!resource) {
                    resource = new (self.model.constructor.forModel(self.relatedModel))();
                    resource.placeInSameHierarchy(self.model);
                    self.model.setToOneField(self.field.name, resource);
                    self.$('.specify-subview-button-count').text(1);
                }

                $('<input type="button" value="Done">').appendTo(dialogForm).click(function() {
                    dialog.dialog('close');
                });

                if (resource.isNew()) {
                    $('<input type="button" value="Remove">').appendTo(dialogForm).click(function() {
                        dialog.dialog('close');
                        self.model.setToOneField(self.field.name, null, {silent: true});
                        self.$('.specify-subview-button-count').text(0);
                    });
                } else {
                    var deleteButton = new DeleteButton({ model: resource });
                    deleteButton.render().$el.appendTo(dialogForm);
                    deleteButton.on('deleted', function() {
                        dialog.dialog('close');
                        self.model.setToOneField(self.field.name, null, {silent: true});
                        self.$('.specify-subview-button-count').text(0);
                    });
                }

                self.options.populateform(dialogForm, resource);
                var dialog = $('<div>').append(dialogForm).dialog({
                    width: 'auto',
                    title: (resource.isNew() ? "New " : "") + resource.specifyModel.getLocalizedName(),
                    close: function() { $(this).remove(); }
                });
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
