define([
    'jquery', 'underscore', 'specifyapi', 'uiplugin', 'jquery-ui'
], function($, _, api, UIPlugin) {
    "use strict";

    return UIPlugin.extend({
        render: function() {
            var self = this;
            var control = $('<div class="specify-attachment-container">');
            self.$el.replaceWith(control);
            self.setElement(control);

            if (self.model.isNew()) {
                self.addAttachment();
            } else {
                self.model.rget('attachment', true).done(function(attachment) {
                    self.displayAttachment(attachment);
                });
            }
            return this;
        },
        addAttachment: function() {
            var self = this;
            var form = '<form enctype="multipart/form-data"><input type="file" name="file"></form>';

            self.gotAttachment = false;

            self.dialog = $('<div>', {title: 'Upload'}).append(form).appendTo(self.el).dialog({
                modal:true,
                buttons: {
                    'Ok': function() { self.startUpload(); }
                },
                close: function() {
                    $(this).remove();
                    self.dialog = null;
                    if (!self.gotAttachment) self.model.destroy();
                }
            });

        },
        startUpload: function() {
            var self = this;
            var files = $(':file', self.dialog).get(0).files;
            var formData = new FormData(self.dialog.find('form').get(0));

            if (files.length > 0) {
                self.gotAttachment = true;

                self.progressBar = $('<div class="attachment-upload-progress">').progressbar();

                self.progressDialog = $('<div>', {title: 'Uploading'})
                    .appendTo(self.el)
                    .append(self.progressBar)
                    .dialog({
                        modal:true
                    });

                var jqxhr = $.ajax({
                    url: '/upload_attachment/',
                    type: 'POST',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function(data) { self.uploadComplete(data); },
                    xhr: function() {
                        var xhr = $.ajaxSettings.xhr();
                        if (xhr.upload) {
                            xhr.upload.addEventListener('progress', function(evt) {
                                self.uploadProgress(evt);
                            });
                        }
                        return xhr;
                    }
                });
            }
            self.dialog.dialog('close');
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
        uploadComplete: function(data) {
            var self = this;
            var attachment = new (api.Resource.forModel('attachment'))({ id: data });
            attachment.fetchIfNotPopulated().done(function() {
                self.model.set('attachment', attachment);
                self.model.save();
                self.displayAttachment(attachment);
                self.progressDialog.dialog('close');
            });
        },
        displayAttachment: function(attachment) {
            var self = this;

            $('<div class="specify-attachment-display">').appendTo(self.el);
            var src = '/static/attachments/' + attachment.get('attachmentlocation');

            if (/^image/.exec(attachment.get('mimetype'))) {
                $('<img>', {src: src, style: 'vertical-align: middle; max-width:500px; max-height:500px;'})
                    .appendTo(self.$('.specify-attachment-display'));
            }
            $('<a>', {href: src, 'class': 'specify-attachment-original'})
                .text('Original').appendTo(self.el).click(function(evt) {
                    evt.preventDefault();
                    window.open(src);
                });
        }
    });
});