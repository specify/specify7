define([
    'jquery', 'underscore', 'backbone', 'specifyapi', 'attachments',
    'schema', 'cs!populateform', 'specifyform', 'navigation',
    'jquery-ui', 'jquery-bbq'
], function($, _, Backbone, api, attachments, schema, populateform, specifyform, navigation) {
    "use strict";

    var tablesWithAttachments = _(
        ("accession agent borrow collectingevent collectionobject conservdescription conservevent " +
         "dnasequence dnasequencingrun fieldnotebook fieldnotebookpageset fieldnotebookpage " +
         "gift loan locality permit preparation referencework repositoryagreement taxon").split(" ")
    ).map(function(table) { return schema.getModel(table); });

    var AttachmentsView = Backbone.View.extend({
        events: {
            'click .specify-attachment-thumbnail': 'openOriginal',
            'click .specify-attachment-dataobj-icon': 'openDataObj',
            'change select': 'selectChanged'
        },
        initialize: function() {
            var self = this;
            self.fetching = false;
            self.attachments = new (api.Collection.forModel('attachment'))();
        },
        index: function() {
            return this.$('.specify-attachment-cell').length;
        },
        fetchMore: function() {
            var self = this;
            self.fetching = true;
            return self.attachments.fetch({ at: self.index() }).done(function() { self.fetching = false; });
        },
        renderAvailable: function() {
            var self = this;
            while (self.index() < self.attachments.length) {
                var attachment = self.attachments.at(self.index());
                if (_.isUndefined(attachment)) return;
                self.$('.specify-attachment-cells').append(self.makeThumbnail(attachment));
            }
        },
        makeThumbnail: function(attachment) {
            var filename = attachment.get('attachmentlocation');
            var title = attachment.get('title');
            var tableId = attachment.get('tableid');

            var icon = _.isNull(tableId) ? schema.getModel('attachment').getIcon() :
                    schema.getModelById(tableId).getIcon();

            var wrapper = $('<div>');
            var dataObjIcon = $('<img>', {
                'class': "specify-attachment-dataobj-icon",
                src: icon
            }).appendTo(wrapper);

            attachments.getThumbnail(attachment, 123).done(function(img) {
                img.addClass('specify-attachment-thumbnail')
                    .attr('title', title)
                    .appendTo(wrapper);
            });
            return $('<div class="specify-attachment-cell">').append(wrapper);
        },
        fillPage: function(recurDepth) {
            // prevent infinite loop.
            if ((recurDepth || (recurDepth = 0)) > 10) return;

            var self = this;
            if (self.fetching) return;
            if (self.attachments.populated && self.index() >= self.attachments.length) return;

            var browser = self.$('.specify-attachment-browser');
            var cells = self.$('.specify-attachment-cells');

            if (browser.scrollTop() + browser.height() + 100 > cells.height()) {
                self.fetchMore().done(function () {
                    self.renderAvailable();
                    self.fillPage(recurDepth + 1);
                });
            }
        },
        setSize: function() {
            var winHeight = $(window).height();
            var offset = this.$('.specify-attachment-browser').offset().top;
            this.$('.specify-attachment-browser').height(winHeight - offset - 50);
        },
        render: function() {
            var self = this;
            self.$el.append('<h2>Attachments</h2>' +
                            '<select class="specify-attachment-type">' +
                            '<option value="all">All</option>' +
                            '<option value="unused">Unused</option>' +
                            '<optgroup label="Tables"></optgroup>' +
                            '<select>' +
                            '<div class="specify-attachment-browser"><div class="specify-attachment-cells"></div>');

            _.each(tablesWithAttachments, function(table) {
                self.$('select optgroup').append('<option value="' + table.tableId + '">' + table.getLocalizedName() + '</option>');
            });

            var resize = function() {
                self.setSize();
                self.fillPage();
            };

            $(window).resize(resize);
            self.$el.on("remove", function() { $(window).off('resize', resize); });
            _.defer(function() { self.setSize(); });

            self.$('.specify-attachment-browser').scroll(function() { self.fillPage(); });
            self.fillPage();
            return this;
        },
        openOriginal: function(evt) {
            var index = this.$('.specify-attachment-thumbnail').index(evt.currentTarget);
            attachments.openOriginal(this.attachments.at(index));
        },
        openDataObj: function(evt) {
            var self = this;
            self.dialog && self.dialog.dialog('close');

            var index = self.$('.specify-attachment-dataobj-icon').index(evt.currentTarget);
            var attachment = self.attachments.at(index);
            var tableId = attachment.get('tableid');
            if (_.isNull(tableId)) {
                // TODO: something for unused attachments.
//                self.buildDialog(attachment);
                return;
            }

            self.dialog = $('<div>').dialog({
                title: "Opening...",
                modal: true
            });


            var model = schema.getModelById(tableId);
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
        },
        selectChanged: function(evt) {
            var tableId = this.$('select').val();
            this.attachments = new (api.Collection.forModel('attachment'))();

            switch (tableId) {
            case "all":
                break;
            case "unused":
                this.attachments.queryParams.tableid__isnull = true;
                break;
            default:
                this.attachments.queryParams.tableid = tableId;
                break;
            }
            this.$('.specify-attachment-cells').empty();
            this.fillPage();
        }
    });

    return function(app) {
        app.router.route('attachments/', 'attachments', function () {
            app.setCurrentView(new AttachmentsView());
        });
    };
});
