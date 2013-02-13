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
            self.dialog = $('<div>', {title: 'Upload'}).append(form).appendTo(self.el).dialog({
                modal:true,
                buttons: {
                    'Ok': function() { self.startUpload(); }
                },
                close: function() { $(this).remove(); self.dialog = null; }
            });

        },
        startUpload: function() {
            var self = this;
            var files = $(':file', self.dialog).get(0).files;
            if (files.length < 1) {
                self.model.destroy();
                self.dialog.dialog('close');
            } else {
                var formData = new FormData(self.dialog.find('form').get(0));
                $.ajax({
                    url: '/upload_attachment/',
                    type: 'POST',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function(data) { self.uploadComplete(data); }
                });
            }
        },
        uploadComplete: function(data) {
            var self = this;
            var attachment = new (api.Resource.forModel('attachment'))({ id: data });
            attachment.fetchIfNotPopulated().done(function() {
                self.model.set('attachment', attachment);
                self.model.save();
                self.displayAttachment(attachment);
                self.dialog.dialog('close');
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