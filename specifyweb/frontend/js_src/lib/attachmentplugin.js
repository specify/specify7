"use strict";

var $ = require('jquery');
var _ = require('underscore');


var api         = require('./specifyapi.js');
var UIPlugin    = require('./uiplugin.js');
var settings = require('./attachmentsettings.js');


const serverPlugins = [
    require('./attachments/attachments.js'),
    require('./attachments/publicimageassets.js'),
];


module.exports =  UIPlugin.extend({
        __name__: "AttachmentsPlugin",
        events: {
            'change :file': 'fileSelected',
            'click .specify-attachment-display a': 'openOriginal'
        },
        render: function() {
            var self = this;
            if (serverPlugins.find(plugin => plugin.servername === 'DEFAULT') == null) {
                self.$el.replaceWith('<div>Attachment server unavailable.</div>');
                return this;
            }
            var control = $('<div class="specify-attachment-container">');
            self.$el.replaceWith(control);
            self.setElement(control);
            if (self.model && self.model.get('attachment')) {
                self.model.rget('attachment', true).done(function(attachment) {
                    self.displayAttachment(attachment);
                });
            } else {
                self.addAttachment();
            }
            return this;
        },
        addAttachment: function() {
            this.$el.append(
                $('<form enctype="multipart/form-data">').append(
                    'Attachment Server: ',
                    $('<select selected="Default" id="attachmentserver">').append(
                        Object.keys(settings).map(
                            server => $('<option>', {value: server})
                                .text(settings[server]['caption'])
                        )
                    ),
                    '<input type="file" name="file">'
                )
            );
         },
        fileSelected: function(evt) {
            var files = this.$(':file').get(0).files;
            if (files.length === 0) return;

            this.startUpload(files[0]);
        },
        startUpload: function(file) {
            var self = this;

            self.progressBar = $('<div class="attachment-upload-progress">').progressbar();

            self.progressDialog = $('<div>', {title: 'Uploading'})
                .appendTo(self.el)
                .append(self.progressBar)
                .dialog({ modal:true });

            var sel = this.$('#attachmentserver').get(0);
            var selected = sel.options[sel.selectedIndex];
            var plugin = serverPlugins.find(plugin => plugin.servername === selected.value);
            if (plugin == null) {
                console.error("no attachment plugin for server type:", selected.value);
                return;
            }

            plugin.uploadFile(file, function(progressEvt) {
                self.uploadProgress(progressEvt);
            }).done(function(attachment) {
                self.uploadComplete(attachment);
            });
        },
        uploadProgress: function (evt) {
            var self = this;
            if (evt.lengthComputable) {
                self.progressBar.progressbar('option', {
                    value: evt.loaded,
                    max: evt.total
                });
            } else {
                self.progressBar.progressbar('option', 'value', false);
            }
        },
        uploadComplete: function(attachment) {
            var self = this;
            self.trigger('uploadcomplete', attachment);
            self.model && self.model.set('attachment', attachment);
            self.displayAttachment(attachment);
            self.progressDialog.dialog('close');
        },
        displayAttachment: function(attachment) {
            this.$el.empty().append('<div class="specify-attachment-display">');

            const attachmentstorageconfig = attachment.get('attachmentstorageconfig') || 'DEFAULT';
            const plugin = serverPlugins.find(
                plugin => plugin.servername === attachmentstorageconfig
            );

            plugin.getThumbnail(attachment).done(img => {
                $('<a>').append(img).appendTo(this.$('.specify-attachment-display'));
            });
        },
        openOriginal: function(evt) {
            evt.preventDefault();
            this.model.rget('attachment', true).done(function(attachment) {
                const plugin = serverPlugins.find(
                    plugin => plugin.servername === attachment.get('attachmentstorageconfig')
                );
                plugin.openOriginal(attachment);
            });
        }
    }, { pluginsProvided: ['AttachmentPlugin'] });
