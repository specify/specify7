define([
    'jquery', 'underscore', 'icons',
    'text!context/attachment_settings.json!noinline'
], function($, _, icons, settingsJson) {
    "use strict";

    var settings = $.parseJSON(settingsJson);

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

            var getToken = settings.token_required_for_get ?
                    $.get('/attachment_gw/get_token/', { filename: attachmentLocation })
                    : $.when(null);

            return getToken.pipe(function(token) {
                var src = settings.read + "?" + $.param({
                    coll: settings.collection,
                    type: "T",
                    filename: attachmentLocation,
                    token: token,
                    scale: scale
                });

                return $('<img>', {src: src, style: style});
            });
        }
    };

    return attachments;
});
