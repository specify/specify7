define([
    'jquery', 'underscore', 'backbone', 'jquery-ui'
], function($, _, Backbone) {
    "use strict";

    function openHelpTarget(dialog, target) {
        var data = $(target).data();
        loadHelpText(dialog, data.helpTemplate, data.helpTargetData);
    }

    function loadHelpText(dialog, template, data) {
        $.get('/static/help/templates/' + template).done(function(tmpl) {
            var content = $(_.template(tmpl)(data));
            var title = content.attr('title');
            dialog.dialog('option', 'title', title).empty().append(content);
        });
    }


    return {
        makeTarget: function(options) {
            $(options.target).addClass('specify-help-target').data({
                helpTemplate: options.template,
                helpTargetData: options.data
            });
        },
        open: function(root) {
            var dialog = $('<div>').dialog({
                modal: true,
                close: function() {
                    $(this).remove();
                    _.invoke(els, 'remove');
                }
            });
            loadHelpText(dialog, "welcome.html");

            var overlay = $('.ui-widget-overlay');

            var els = _($('.specify-help-target', root)).map(function(target) {
                return $('<div style="position: absolute;" class="ui-front help-target"><img src="/images/win_help.png"></div>')
                    .insertAfter(overlay)
                    .position({of: target})
                    .click(openHelpTarget.bind(null, dialog, target));
            });
        }
    };
});
