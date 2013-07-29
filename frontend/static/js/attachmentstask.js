define([
    'jquery', 'underscore', 'backbone', 'specifyapi', 'attachments',
    'schema', 'cs!populateform', 'specifyform', 'navigation',
    'jquery-ui', 'jquery-bbq'
], function($, _, Backbone, api, attachments, schema, populateform, specifyform, navigation) {
    "use strict";

    var win = $(window);
    var doc = $(document);

    var AttachmentsView = Backbone.View.extend({
        events: {
            'click .specify-attachment-thumbnail': 'openOriginal',
            'click .specify-attachment-dataobj-icon': 'openDataObj'
        },
        initialize: function() {
            var self = this;
            self.fetching = false;
            self.attachments = new (api.Collection.forModel('attachment'))();
            self.index = 0;
        },
        fetchMore: function() {
            var self = this;
            self.fetching = true;
            return self.attachments.fetch({ at: self.index }).done(function() { self.fetching = false; });
        },
        renderAvailable: function() {
            var self = this;
            while (self.index < self.attachments.length) {
                var attachment = self.attachments.at(self.index);
                if (_.isUndefined(attachment)) return;
                self.$('.specify-attachment-cells').append(self.makeThumbnail(attachment));
                self.index++;
            }
        },
        makeThumbnail: function(attachment) {
            var filename = attachment.get('attachmentlocation');
            var title = attachment.get('title');
            var tableId = attachment.get('tableid');

            var cell = $('<div class="specify-attachment-cell">');
            var dataObjIcon = $('<img>', {
                'class': "specify-attachment-dataobj-icon",
                src: schema.getModelById(tableId).getIcon()
            }).appendTo(cell);

            attachments.getThumbnail(attachment, 123).done(function(img) {
                img.addClass('specify-attachment-thumbnail')
                    .attr('title', title)
                    .appendTo(cell);
            });
            return cell;
        },
        fillPage: function() {
            var self = this;
            if (self.fetching) return;
            if (self.attachments.populated && self.index >= self.attachments.length) return;

            var browser = self.$('.specify-attachment-browser');
            var cells = self.$('.specify-attachment-cells');

            if (browser.scrollTop() + browser.height() + 100 > cells.height()) {
                self.fetchMore().done(function () {
                    self.renderAvailable();
                    self.fillPage();
                });
            }
        },
        setSize: function() {
            var winHeight = win.height();
            var offset = this.$('.specify-attachment-browser').offset().top;
            this.$('.specify-attachment-browser').height(winHeight - offset - 50);
        },
        render: function() {
            var self = this;
            self.$el.append(
                '<h2>Attachments</h2>' +
                '<div class="specify-attachment-browser"><div class="specify-attachment-cells"></div>');

            var resize = function() {
                self.setSize();
                self.fillPage();
            };

            win.resize(resize);
            self.$el.on("remove", function() { win.off('resize', resize); });
            _.defer(function() { self.setSize(); });

            self.$('.specify-attachment-browser').scroll(function() { self.fillPage(); });
            self.fillPage();
        },
        openOriginal: function(evt) {
            var index = this.$('.specify-attachment-thumbnail').index(evt.currentTarget);
            attachments.openOriginal(this.attachments.at(index));
        },
        openDataObj: function(evt) {
            var self = this;
            self.dialog && self.dialog.dialog('close');

            self.dialog = $('<div>').dialog({
                title: "Opening...",
                modal: true
            });

            var index = self.$('.specify-attachment-dataobj-icon').index(evt.currentTarget);
            var attachment = self.attachments.at(index);
            var model = schema.getModelById(attachment.get('tableid'));
            attachment.rget(model.name.toLowerCase() + 'attachments', true).pipe(function(dataObjs) {
                return dataObjs.at(0).rget(model.name.toLowerCase());
            }).done(function(dataObj) {
                self.buildDialog(dataObj);
            });
        },
        buildDialog: function(resource) {
            var self = this;
            specifyform.buildViewByName(resource.specifyModel.view, null, 'view').done(function(dialogForm) {
                dialogForm.find('.specify-form-header:first').remove();

                populateform(dialogForm, resource);

                self.dialog.dialog('close');
                var dialog = self.dialog = $('<div>').append(dialogForm).dialog({
                        width: 'auto',
                        title:  resource.specifyModel.getLocalizedName(),
                        close: function() { $(this).remove(); self.dialog = null; }
                    });

                if (!resource.isNew()) {
                    dialog.closest('.ui-dialog').find('.ui-dialog-titlebar:first').prepend(
                        '<a href="' + resource.viewUrl() + '"><span class="ui-icon ui-icon-link">link</span></a>');

                    dialog.parent().delegate('.ui-dialog-title a', 'click', function(evt) {
                        evt.preventDefault();
                        navigation.go(resource.viewUrl());
                        dialog.dialog('close');
                    });
                }
            });
        }
    });

    return function(app) {
        app.router.route('attachments/', 'attachments', function () {
            app.setCurrentView(new AttachmentsView());
        });
    };
});
