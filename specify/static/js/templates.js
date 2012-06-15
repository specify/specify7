define([
    'jquery', 'underscore',
    'text!tmpls/relatedobjectsform.html',
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
    'text!tmpls/404.html'
], function parseTemplates($, _) {
    "use strict";
    var parseTmpl = function(tmpl) { return _.template(tmpl); };
    var templates = _.chain(arguments).tail(parseTemplates.length).map(parseTmpl).value();
    var withNames = {};

    _([
        'relatedobjectsform',
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
        'fourohfour'
    ]).each(function(name, i) { withNames[name] = templates[i]; });

    return withNames;
});