"use strict";

var $         = require('jquery');
var _         = require('underscore');
var Backbone  = require('./backbone.js');

var attachments  = require('./attachments.js');
var router       = require('./router.js');
var app          = require('./specifyapp.js');
var schema       = require('./schema.js');
var populateform = require('./populateform.js');
var specifyform  = require('./specifyform.js');
var navigation   = require('./navigation.js');
var whenAll      = require('./whenall.js');


    var AttachmentsView = Backbone.View.extend({
        __name__: "AttachmentsView",
        events: {
            'click .specify-attachment-thumbnail': 'openOriginal',
            'click .specify-attachment-dataobj-icon': 'openDataObj',
            'change select': 'selectChanged'
        },
        initialize: function() {
            var collections = this.attachmentCollections = {
                all: new schema.models.Attachment.LazyCollection({ domainfilter: true })
                // TODO:
                // So-called "unused" attachments now might be used in reports.

                // unused: new AttachmentModel.LazyCollection({
                //     filters: { tableid__isnull: true },
                //     domainfilter: true
                // })
            };

            var tablesWithAttachments = _( // TODO: get these from server or something
                ("accession agent borrow collectingevent collectionobject conservdescription conservevent " +
                 "dnasequence dnasequencingrun fieldnotebook fieldnotebookpageset fieldnotebookpage " +
                 "gift loan locality permit preparation referencework repositoryagreement taxon").split(" ")
            ).map(function(table) { return schema.getModel(table); });

            _.each(tablesWithAttachments, function(table) {
                collections[table.tableId] = new schema.models.Attachment.LazyCollection({
                    filters: { tableid: table.tableId },
                    domainfilter: true
                });
            });

            _.each(collections, function(collection) {
                collection.filters.orderby = "-timestampcreated"; // TODO: not really a filter
            });

            this.attachments = collections.all;
        },
        index: function() {
            return this.$('.specify-attachment-cell').length;
        },
        makeThumbnail: function() {
            var wrapper = $('<div>');
            var cell = $('<div class="specify-attachment-cell">').append(wrapper);

            var attachment = this.attachments.at(this.index());
            var filename = attachment.get('attachmentlocation');
            var tableId = attachment.get('tableid');
            var title = attachment.get('title');

            var model = tableId != null && schema.getModelById(tableId);
            var icon = model ? (model.system ? "/images/system.png" : model.getIcon()) :
                schema.getModel('attachment').getIcon();

            var dataObjIcon = $('<img>', {
                'class': "specify-attachment-dataobj-icon",
                src: icon
            }).appendTo(wrapper);

            attachments.getThumbnail(attachment, 123).done(function(img) {
                img.addClass('specify-attachment-thumbnail')
                    .attr('title', title)
                    .appendTo(wrapper);
            });

            return cell;
        },
        fillPage: function() {
            var browser = this.$('.specify-attachment-browser');
            var cells = this.$('.specify-attachment-cells');

            if (browser.scrollTop() + browser.height() + 200 > cells.height()) {
                while (this.index() < this.attachments.length) {
                    this.$('.specify-attachment-cells').append(
                        this.makeThumbnail());
                }

                var _this = this;
                this.attachments.isComplete() || this.attachments._fetch || this.attachments.fetch().done(function() {
                    _this.fillPage();
                });
            }
        },
        setSize: function() {
            var winHeight = $(window).height();
            var offset = this.$('.specify-attachment-browser').offset().top;
            this.$('.specify-attachment-browser').height(winHeight - offset - 50);
        },
        getCounts: function() {
            return whenAll(_.map(this.attachmentCollections, function(collection) {
                return collection.getTotalCount();
            }));
        },
        render: function() {
            var self = this;
            self.$el.append('<h2>Attachments</h2>' +
                            '<select class="specify-attachment-type"></select>' +
                            '<div class="specify-attachment-browser"><div class="specify-attachment-cells"></div>');

            var resize = function() {
                self.setSize();
                self.fillPage();
            };

            $(window).resize(resize);
            self.$el.on("remove", function() { $(window).off('resize', resize); });
            _.defer(function() { self.setSize(); });
            self.$('.specify-attachment-browser').scroll(function() { self.fillPage(); });

            self.getCounts().done(function(counts) {
                var cols = self.attachmentCollections;
                var tables = $('<optgroup label="Tables"></optgroup>');

                var i = 0;
                _.each(self.attachmentCollections, function(collection, key) {
                    var count = counts[i++];
                    var name = key === 'all' ? "All" : key === 'unused' ? "Unused" :
                            schema.getModelById(parseInt(key)).getLocalizedName();

                    var parent = _(['all', 'unused']).contains(key) ? self.$('select') : tables;

                    (count > 0) && parent.append('<option value="' + key + '">' + name + ' - ' + count + '</option>');
                });

                self.$('select').append(tables);

                self.fillPage();
            });

            return this;
        },
        openOriginal: function(evt) {
            var index = this.$('.specify-attachment-thumbnail').index(evt.currentTarget);
            var attachment = this.attachments.at(index);
            attachments.openOriginal(attachment);
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
            var tableId = attachment.get('tableid');
            if (_.isNull(tableId)) {
                // TODO: something for unused attachments.
                //                self.buildDialog(attachment);
                return;
            }

            var model = schema.getModelById(tableId);
            attachment.rget(model.name.toLowerCase() + 'attachments', true).pipe(function(dataObjs) {
                return dataObjs && dataObjs.length > 0 ? dataObjs.at(0).rget(model.name.toLowerCase()) : null;
            }).done(function(dataObj) {
                dataObj ? self.buildDialog(dataObj) : self.dialog.dialog('close');
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
                    position: { my: "top", at: "top+20", of: self.$('.specify-attachment-browser') },
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
            this.attachments = this.attachmentCollections[this.$('select').val()];
            this.$('.specify-attachment-cells').empty();
            this.fillPage();
        }
    });

module.exports =  function() {
        router.route('attachments/', 'attachments', function () {
            app.setCurrentView(new AttachmentsView());
            app.setTitle('Attachments');
        });
    };

