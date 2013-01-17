define([
    'jquery', 'underscore',
    'text!tmpls/othercollectiontemplate.html',
    'text!tmpls/othercollectionstemplate.html',
    'text!tmpls/recordsetheader.html',
    'text!tmpls/recordsetform.html',
    'text!tmpls/formtemplate.html',
    'text!tmpls/formtabletemplate.html',
    'text!tmpls/formdeftemplate.html',
    'text!tmpls/viewwrappertemplate.html',
    'text!tmpls/confirmdelete.html',
    'text!tmpls/gmapplugin.html',
    'text!tmpls/latlonui.html',
    'text!tmpls/partialdateui.html',
    'text!tmpls/querycbx.html',
    'text!tmpls/subviewheader.html',
    'text!tmpls/404.html',
    'text!tmpls/saveblocked.html',
    'text!tmpls/welcome.html',
    'text!tmpls/viewheader.html',
    'text!tmpls/recordsetchooser.html',
    'text!tmpls/geolocateplugin.html',
    'text!tmpls/attachmentview.html'
], function parseTemplates($, _) {
    "use strict";
    var parseTmpl = function(tmpl) { return _.template(tmpl); };
    var templates = _.chain(arguments).tail(parseTemplates.length).map(parseTmpl).value();
    var withNames = {};

    _([
        'othercollection',
        'othercollections',
        'recordsetheader',
        'recordsetform',
        'form',
        'formtable',
        'formdef',
        'viewwrapper',
        'confirmdelete',
        'gmapplugin',
        'latlonui',
        'partialdateui',
        'querycbx',
        'subviewheader',
        'fourohfour',
        'saveblocked',
        'welcome',
        'viewheader',
        'recordsetchooser',
        'geolocate',
        'attachmentview'
    ]).each(function(name, i) { withNames[name] = templates[i]; });

    return withNames;
});
