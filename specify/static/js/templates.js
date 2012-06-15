define([
    'jquery', 'underscore',
    'text!/static/html/templates/relatedobjectsform.html',
    'text!/static/html/templates/recordsetform.html',
    'text!/static/html/templates/formtemplate.html',
    'text!/static/html/templates/formtabletemplate.html',
    'text!/static/html/templates/viewwrappertemplate.html'
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
        'viewwrapper'
    ]).each(function(name, i) { withNames[name] = templates[i]; });

    return withNames;
});