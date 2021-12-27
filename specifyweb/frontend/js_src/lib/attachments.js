"use strict";

import $ from 'jquery';
import _ from 'underscore';

import { getIcon } from './icons';
import schema from './schema';
import * as initialContext from './initialcontext';
import commonText from './localization/common';

    var settings;
    initialContext.load('attachment_settings.json', data => settings = data);

    var thumbnailable = ['image/jpeg', 'image/gif', 'image/png', 'image/tiff', 'application/pdf'];

    function iconForMimeType(mimetype) {
        var iconName;

        if (mimetype === 'text/plain') return ['text',getIcon('text')];
        if (mimetype === 'text/html') return ['html',getIcon('html')];

        var parts = mimetype.split('/');
        var type = parts[0], subtype = parts[1];

        if (_("audio video image text".split()).contains(type)) {
            return [type,getIcon(type)];
        }

        if (type === 'application') {
            iconName = {
                'pdf': 'pdf',
                'vnd.ms-excel': 'MSExcel',
                'vnd.ms-word': 'MSWord',
                'vnd.ms-powerpoint': 'MSPowerPoint'
            }[subtype];

            if (iconName) return [iconName,icons.getIcon(iconName)];
        }

        return [commonText('unknown'), getIcon('unknown')];
    }

    function getToken(filename) {
        return settings.token_required_for_get ?
                    $.get('/attachment_gw/get_token/', { filename: filename })
                    : $.when(null);
    }

        export function systemAvailable() { return !_.isEmpty(settings); }

        export function getThumbnail(attachment, scale) {
            scale || (scale = 256);
            var style = "max-width:" + scale + "px; " + "max-height:" + scale + "px;";

            var mimetype = attachment.get('mimetype');
            if (!_(thumbnailable).contains(mimetype)) {
                const [alt, src] = iconForMimeType(mimetype);
                return $.when( $('<img>', {src, style, alt}) );
            }

            var attachmentLocation = attachment.get('attachmentlocation');

            return getToken(attachmentLocation).pipe(function(token) {
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
        export function originalURL(attachmentLocation, token, downLoadName) {
            return settings.read + "?" + $.param({
                coll: settings.collection,
                type: "O",
                filename: attachmentLocation,
                downloadname: downLoadName,
                token: token
            });
        }
        export function openOriginal(attachment) {
            var attachmentLocation = attachment.get('attachmentlocation');
            var origFilename = attachment.get('origfilename').replace(/^.*[\\\/]/, '');

            getToken(attachmentLocation).done(function(token) {
                var src = attachments.originalURL(attachmentLocation, token, attachment.get('origfilename'));
                window.open(src);
            });
        }
        export function uploadFile(file, progressCB) {
            var formData = new FormData();
            var attachmentLocation;
            var attachment;

            return $.get('/attachment_gw/get_upload_params/', {filename: file.name})
                .pipe(function(uploadParams) {
                    attachmentLocation = uploadParams.attachmentlocation;

                    formData.append('file', file);
                    formData.append('token', uploadParams.token);
                    formData.append('store', attachmentLocation);
                    formData.append('type', "O");
                    formData.append('coll', settings.collection);

                    return $.ajax({
                        url: settings.write,
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
                }).pipe(function() {
                    return new schema.models.Attachment.Resource({
                        attachmentlocation: attachmentLocation,
                        mimetype: file.type,
                        origfilename: file.name
                    });
                });
        }
