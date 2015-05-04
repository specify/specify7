define([
    'jquery', 'underscore', 'backbone', 'jquery-ui'
], function($, _, Backbone) {
    "use strict";

    function openHelpTarget(dialog, data) {
        loadHelpText(dialog, data.template, data.data);
        if(data.highlight) {
            var el = data.highlight[0], style = data.highlight[1];
            var oldCss = $(el).css('background-color');
            $(el).css('background-color', 'red');
            _.delay(function() { $(el).css('background-color', oldCss); }, 2000);
        }

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
            $(options.target).addClass('specify-help-target').data('help-options', options);
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
                var data = $(target).data('help-options');
                var position = _({of: target}).extend(data.position);
                var marker = $('<div style="position: absolute;" class="ui-front help-target"><img src="/images/win_help.png"></div>')
                    .insertAfter(overlay)
                    .position(position)
                    .click(openHelpTarget.bind(null, dialog, data));
                return marker;
            });
        }
    };
});
