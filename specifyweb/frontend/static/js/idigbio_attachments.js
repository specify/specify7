define([
    'jquery', 'underscore', 'icons',  'schema', 'assert',
], function($, _, icons, schema, assert) {
    "use strict";

    var thumbnailable = ['image/jpeg', 'image/gif', 'image/png', 'image/tiff', 'application/pdf'];

    return function(options) {
        var settings = options.settings;
        var iconForMimeType = options.iconForMimeType;

        var attachments = {
            getThumbnail: function(attachment, scale) {
                scale || (scale = 256);
                var style = "max-width:" + scale + "px; " + "max-height:" + scale + "px;";
                var src;

                var mimetype = attachment.get('mimetype');
                if (!_(thumbnailable).contains(mimetype)) {
                    src = iconForMimeType(mimetype);
                } else {
                    var attachmentLocation = attachment.get('attachmentlocation');
                    src = settings.idigbioURL + '/lookup/images/' + attachmentLocation + "?size=thumbnail";
                }
                return $.when( $('<img>', {src: src, style: style}) );
            },
            originalURL: function(attachmentLocation, token, downLoadName) {
                return settings.idigbioURL + '/lookup/images/' + attachmentLocation + "?size=webview";
            },
            openOriginal: function(attachment) {
                var attachmentLocation = attachment.get('attachmentlocation');
                var src = attachments.originalURL(attachmentLocation);
                window.open(src);
            },
            uploadFile: function(file, progressCB) {
                var formData = new FormData();
                formData.append('file', file);

                return $.ajax({
                    url: '/attachment_gw/upload/',
                    type: 'POST',
                    data: formData,
                    processData: false,
                    contentType: false,
                    xhr: function() {
                        var xhr = $.ajaxSettings.xhr();
                        xhr.upload && xhr.upload.addEventListener('progress', progressCB);
                        return xhr;
                    }
                }).pipe(function(response) {
                    var data = JSON.parse(response);
                    return new schema.models.Attachment.Resource({
                        attachmentlocation: data.file_md5,
                        mimetype: file.type,
                        origfilename: file.name
                    });
                });
            }
        };

        return attachments;
    };
});
