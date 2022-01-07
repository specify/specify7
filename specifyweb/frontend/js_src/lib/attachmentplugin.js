"use strict";

import $ from 'jquery';


import UIPlugin from './uiplugin';
import * as attachments from './attachments';

import formsText from './localization/forms';

export default UIPlugin.extend({
        __name__: "AttachmentsPlugin",
        events: {
            'change :file': 'fileSelected',
            'click .specify-attachment-display button': 'openOriginal'
        },
        render: function() {
            var self = this;
            if (!attachments) {
                self.$el.replaceWith(`<div>
                    ${formsText('attachmentServerUnavailable')}
                </div>`);
                return this;
            }
            var control = $('<div class="specify-attachment-container w-72 h-72">');
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
            this.$el.append('<form enctype="multipart/form-data"><input type="file" name="file"></form>');
            this.$('input').click();
        },
        fileSelected: function() {
            var files = this.$(':file').get(0).files;
            if (files.length === 0) return;
            this.startUpload(files[0]);
        },
        startUpload: function(file) {
            var self = this;

            self.progressBar = $('<div class="attachment-upload-progress">').progressbar();

            self.progressDialog = $(
                '<div>',
                { 'aria-live': 'polite' }
            )
                .appendTo(self.el)
                .append(self.progressBar)
                .dialog({ modal:true, title: formsText('attachmentUploadDialogTitle') });

            attachments.uploadFile(file, function(progressEvt) {
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
            var self = this;
            self.$el.empty().append(`<div class="specify-attachment-display
                h-full flex items-center justify-center bg-black">`);

            attachments.getThumbnail(attachment).done(function(img) {
                $('<button>', {type: 'button'})
                    .append(img)
                    .appendTo(self.$('.specify-attachment-display')
                );
            });
        },
        openOriginal: function(evt) {
            evt.preventDefault();
            this.model.rget('attachment', true).done(function(attachment) {
                attachments.openOriginal(attachment);
            });
        }
    }, { pluginsProvided: ['AttachmentPlugin'] });
