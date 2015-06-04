define([
    'jquery', 'underscore', 'icons',  'schema', 'assert',
], function($, _, icons, schema, assert) {
    "use strict";

    var thumbnailable = ['image/jpeg', 'image/gif', 'image/png', 'image/tiff', 'application/pdf'];

    function iconForMimeType(mimetype) {
        var iconName;

        if (mimetype === 'text/plain') return icons.getIcon('text');
        if (mimetype === 'text/html') return icons.getIcon('html');

        var parts = mimetype.split('/');
        var type = parts[0], subtype = parts[1];

        if (_("audio video image text".split()).contains(type)) {
            return icons.getIcon(type);
        }

        if (type === 'application') {
            iconName = {
                'pdf': 'pdf',
                'vnd.ms-excel': 'MSExcel',
                'vnd.ms-word': 'MSWord',
                'vnd.ms-powerpoint': 'MSPowerPoint'
            }[subtype];

            if (iconName) return icons.getIcon(iconName);
        }

        return icons.getIcon('unknown');
    }


    var attachments = {
        getThumbnail: function(attachment, scale) {
            scale || (scale = 256);
            var style = "max-width:" + scale + "px; " + "max-height:" + scale + "px;";

            var mimetype = attachment.get('mimetype');
            if (!_(thumbnailable).contains(mimetype)) {
                var src = iconForMimeType(mimetype);
                return $.when( $('<img>', {src: src, style: style}) );
            }

            var attachmentLocation = attachment.get('attachmentlocation');

            return $.when($('<img>', {src: attachments.originalURL(attachmentLocation), style: style}));
        },
        originalURL: function(attachmentLocation, token, downLoadName) {
            return "http://beta-media.idigbio.org/lookup/images/" + attachmentLocation;
        },
        openOriginal: function(attachment) {
            var attachmentLocation = attachment.get('attachmentlocation');
            var src = attachments.originalURL(attachmentLocation, token, attachment.get('origfilename'));
            window.open(src);
        },
        uploadFile: function(file, progressCB) {
            var formData = new FormData();
            var attachment;

            // return $.get('/attachment_gw/get_upload_params/', {filename: file.name})
            //     .pipe(function(uploadParams) {
            //         attachmentLocation = uploadParams.attachmentlocation;

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
});
