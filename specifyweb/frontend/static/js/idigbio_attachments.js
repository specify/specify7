define([
    'jquery', 'underscore', 'icons',  'schema', 'assert',
    'specify_attachments'
], function($, _, icons, schema, assert, SpecifyAttachments) {
    "use strict";

    function IDigBioAttachments(settings) {
        this.settings = settings;
    }

    IDigBioAttachments.prototype = _(new SpecifyAttachments()).extend({
        getThumbnail: function(attachment, scale) {
            scale || (scale = 256);
            var style = "max-width:" + scale + "px; " + "max-height:" + scale + "px;";
            var src;

            var mimetype = attachment.get('mimetype');
            if (!_(this.thumbnailable).contains(mimetype)) {
                src = this.iconForMimeType(mimetype);
            } else {
                var attachmentLocation = attachment.get('attachmentlocation');
                src = this.settings.idigbioURL + '/lookup/images/' + attachmentLocation + "?size=thumbnail";
            }
            return $.when( $('<img>', {src: src, style: style}) );
        },
        originalURL: function(attachmentLocation, token, downLoadName) {
            return this.settings.idigbioURL + '/lookup/images/' + attachmentLocation + "?size=webview";
        },
        openOriginal: function(attachment) {
            var attachmentLocation = attachment.get('attachmentlocation');
            var src = this.originalURL(attachmentLocation);
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
                return new schema.models.Attachment.Resource({
                    attachmentlocation: response.file_md5,
                    mimetype: file.type,
                    origfilename: file.name
                });
            });
        }
    });

    return IDigBioAttachments;
});
