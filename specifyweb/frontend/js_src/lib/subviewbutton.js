"use strict";

var $        = require('jquery');
var Backbone = require('./backbone.js');

var icons          = require('./icons.js');
var specifyform    = require('./specifyform.js');
var navigation     = require('./navigation.js');
var RecordSelector = require('./recordselector.js');

    var Base =  Backbone.View.extend({
        __name__: "SubviewButtonBaseView",
        events: {
            'click a': 'clicked'
        },
        initialize: function(options) {
            var self = this;
            self.populateForm = options.populateForm;
            self.field = options.field;
            self.relatedModel = self.field.getRelatedModel();

            self.related = self.options.model || self.options.collection;
            self.model = self.options.parentResource || self.options.collection.parent;

            var props = specifyform.parseSpecifyProperties(self.$el.data('specify-initialize'));
            self.icon = props.icon ? icons.getIcon(props.icon) : self.relatedModel.getIcon();
        },
        render: function() {
            var self = this;
            self.readOnly = specifyform.subViewMode(self.$el) === 'view';
            self.$el.empty();

            var link = $('<a>', {title: self.field.getLocalizedName()}).appendTo(self.el);

            if (!self.$el.hasClass('specify-subview-in-table')) {
                $('<div style="display: table-row">')
                    .append($('<img>', {'class': "specify-subviewbutton-icon", src: self.icon}))
                    .append('<span class="specify-subview-button-count">')
                    .appendTo(link);

                link.button();
            } else {
                link.addClass('specify-subview-link');
            }
        },
        setCount: function (c) {
            this.$('.specify-subview-button-count, .specify-subview-link').text(c);
        },
        clicked: function(evt) {
            evt.preventDefault();
            if (this.dialog) {
                this.dialog.dialog('close');
            } else {
                this.openDialog();
            }
        }
    });

    var ToMany = Base.extend({
        __name__: "ToManySubViewButton",
        initialize: function(options) {
            Base.prototype.initialize.call(this, options);
            this.collection.on('add remove destroy', this.collectionChanged, this);
        },
        render: function() {
            Base.prototype.render.apply(this, arguments);
            this.collectionChanged();
        },
        collectionChanged: function() {
            this.setCount(this.collection.length);
            if (this.collection.length < 1 && this.dialog) this.dialog.dialog('close');
        },
        openDialog: function() {
            var self = this;
            if (self.readOnly && self.collection.length < 1) return;

            new RecordSelector({
                populateForm: this.populateForm,
                field: self.field,
                collection: self.collection,
                subformNode: self.$el,
                readOnly: self.readOnly,
                noHeader: true
            }).on('renderdone', function(recordSelector) {
                self.dialog = $('<div>').append(recordSelector.el).dialog({
                    width: 'auto',
                    title: self.field.getLocalizedName(),
                    close: function() {
                        $(this).remove(); self.dialog = null;
                        var fname = self.field.name.toLowerCase();
                        /*var changed = {};
                        changed[fname] = '';
                        self.collection.related.changed = changed;
                        self.collection.related.trigger('change', self.collection.related);
                        */
                        //instead of hacking the changed field, could use selfcollection.related.set(fname, [Some appropriate value])???;
                        //self.collection.related.set(fname, self.collection.models);
                        //but changed object is not updated and still need to force the trigger

                        //This seems to work, for loanreturnpreps anyway
                        //self.collection.related.changed[fname] = '';
                        //self.collection.related.trigger('change', self.collection.related);
                    }
                });
            }).render();
        }
    });

    var ToOne = Base.extend({
        __name__: "ToOneSubViewButton",
        initialize: function(options) {
            Base.prototype.initialize.call(this, options);
            this.model.on('change:' + this.field.name.toLowerCase(), this.resourceChanged, this);
        },
        render: function() {
            Base.prototype.render.apply(this, arguments);
            this.resourceChanged();
        },
        resourceChanged: function() {
            this.setCount(this.model.get(this.field.name) ? 1 : 0);
        },
        openDialog: function() {
            var self = this;
            if (self.readOnly && !self.related) return;

            specifyform.buildSubView(self.$el).done(function(dialogForm) {
                self.buildDialog(dialogForm);
            });
        },
        buildDialog: function(dialogForm) {
            var self = this;
            var formReadOnly = specifyform.getFormMode(dialogForm) === 'view';

            dialogForm.find('.specify-form-header:first').remove();
            var buttons = $('<div class="specify-form-buttons">').appendTo(dialogForm);

            if (!self.related) {
                if (formReadOnly) return;
                if (this.field.isDependent()) {
                    self.related = new self.relatedModel.Resource();
                    self.related.placeInSameHierarchy(self.model);
                    self.model.set(self.field.name, self.related);
                    self.resourceChanged();
                } else {
                    // TODO: same as querycbx search
                    throw new Error("not implemented");
                }
            }

            var title = (self.related.isNew() ? "New " : "") + self.relatedModel.getLocalizedName();

            if (!self.readOnly) {
                $('<input type="button" value="Remove">').appendTo(buttons).click(function() {
                    self.dialog.dialog('close');
                    self.related = null;
                    self.model.set(self.field.name, self.related);
                    self.resourceChanged();
                });
            }

            this.populateForm(dialogForm, self.related);
            var link = '<a href="' + self.related.viewUrl() + '"><span class="ui-icon ui-icon-link">link</span></a>';
            self.dialog = $('<div>').append(dialogForm).dialog({
                width: 'auto',
                title: title,
                close: function() { $(this).remove(); self.dialog = null; }
            });

            // TODO: this was copied from querycbx. should factor out somehow.
            if (!self.related.isNew() && !self.field.isDependent()) {
                self.dialog.closest('.ui-dialog').find('.ui-dialog-titlebar:first').prepend(
                    '<a href="' + self.related.viewUrl() + '"><span class="ui-icon ui-icon-link">link</span></a>');

                self.dialog.parent().delegate('.ui-dialog-title a', 'click', function(evt) {
                    evt.preventDefault();
                    navigation.go(self.related.viewUrl());
                    self.dialog.dialog('close');
                });
            }
        }
    });

module.exports =  {
        ToMany: ToMany,
        ToOne: ToOne,
        Attachments: ToMany
    };

