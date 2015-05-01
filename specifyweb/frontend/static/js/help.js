define([
    'jquery', 'underscore', 'backbone', 'jquery-ui'
], function($, _, Backbone) {
    "use strict";

    function openHelpTarget(dialog, target) {
        var data = $(target).data();
        $.get('/static/help/templates/' + data.helpKey + '.html').done(function(tmpl) {
            var content = $(_.template(tmpl)(data.helpTargetData));
            var heading = content.find('h1').remove();
            dialog.dialog('option', 'title', heading.text()).empty().append(content);
        });
    }


    return {
        makeTarget: function(options) {
            $(options.target).addClass('specify-help-target').data({
                helpKey: options.key,
                helpTargetData: options.data
            });
        },
        open: function(root) {
            var dialog = $('<div title="Help System"></div>').dialog({
                modal: true,
                close: function() {
                    $(this).remove();
                    _.invoke(els, 'remove');
                }
            });

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
