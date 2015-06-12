define([
    'jquery', 'underscore', 'icons',  'schema', 'assert',
    'specify_attachments', 'idigbio_attachments',
    'text!context/attachment_settings.json!noinline'
], function($, _, icons, schema, assert, SpecifyAttachments, IDigBioAttachments,
            settingsJson) {
    "use strict";

    var settings = $.parseJSON(settingsJson);

    if (_.isEmpty(settings)) {
        console.warn("attachments unavailable");
        return null;
    }

    switch (settings.module) {
    case 'idigbio':
        return new IDigBioAttachments(settings);

    case 'specify':
    default:
        return new SpecifyAttachments(settings);
    }
});
