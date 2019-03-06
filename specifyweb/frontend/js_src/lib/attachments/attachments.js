"use strict";

var $ = require('jquery');
var _ = require('underscore');

var icons          = require('./../icons.js');
var schema         = require('./../schema.js');
var assert         = require('./../assert.js');
var settings       = require('./../attachmentsettings.js');


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

function getToken(filename) {
    return settings.PRIVATE.token_required_for_get ?
                $.get('/attachment_gw/get_token/', { filename: filename })
                : $.when(null);
}

var attachments = {
    servername: 'PRIVATE',

    getSetting: function(key) {
        return settings[this.servername][key];
    },

    systemAvailable: function() { return !_.isEmpty(settings); },

    getThumbnail: function(attachment, scale) {
        scale || (scale = 256);
        var style = "max-width:" + scale + "px; " + "max-height:" + scale + "px;";

        var mimetype = attachment.get('mimetype');
        if (!_(thumbnailable).contains(mimetype)) {
            var src = iconForMimeType(mimetype);
            return $.when( $('<img>', {src: src, style: style}) );
        }

        var attachmentLocation = attachment.get('attachmentlocation');

        return getToken(attachmentLocation).pipe(token => {
            var src = this.getSetting('read') + "?" + $.param({
                coll: this.getSetting('collection'),
                type: "T",
                filename: attachmentLocation,
                token: token,
                scale: scale
            });

            return $('<img>', {src: src, style: style});
        });
    },
    originalURL: function(attachmentLocation, token, downLoadName) {
        return this.getSetting('read') + "?" + $.param({
            coll: this.getSetting('collection'),
            type: "O",
            filename: attachmentLocation,
            downloadname: downLoadName,
            token: token
        });
    },
    openOriginal: function(attachment) {
        var attachmentLocation = attachment.get('attachmentlocation');
        var origFilename = attachment.get('origfilename').replace(/^.*[\\\/]/, '');

        getToken(attachmentLocation).done(function(token) {
            var src = attachments.originalURL(attachmentLocation, token, attachment.get('origfilename'));
            window.open(src);
        });
    },
    uploadFile: function(file, progressCB) {
        var formData = new FormData();
        var attachmentLocation;
        var attachment;

        return $.get('/attachment_gw/get_upload_params/', {filename: file.name})
        .pipe(uploadParams => {
            attachmentLocation = uploadParams.attachmentlocation;

            formData.append('file', file);
            formData.append('token', uploadParams.token);
            formData.append('store', attachmentLocation);
            formData.append('type', "O");
            formData.append('coll', this.getSetting('collection'));

            return $.ajax({
                url: this.getSetting('write'),
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                xhr: function() {
                    var xhr = $.ajaxSettings.xhr();
                    xhr.upload && xhr.upload.addEventListener('progress', progressCB);
                    return xhr;
                }
            });
        }).pipe(() => {
            return new schema.models.Attachment.Resource({
                attachmentlocation: attachmentLocation,
                mimetype: file.type,
                origfilename: file.name,
                servername: this.servername
            });
        });
    }
};

module.exports = attachments;
