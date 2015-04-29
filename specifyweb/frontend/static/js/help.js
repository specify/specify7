define([
    'jquery', 'underscore', 'backbone', 'jquery-ui'
], function($, _, Backbone) {
    "use strict";

    return function() {
        var dialog = $('<div title="Help System"></div>').dialog({
            modal: true,
            close: function() {
                $(this).remove();
                _.invoke(els, 'remove');
            }
        });

        var overlay = $('.ui-widget-overlay');

        var els = _($('.specify-field')).map(function(field) {
            return $('<div style="position: absolute;" class="ui-front help-target"><img src="/images/win_help.png"></div>')
                .insertAfter(overlay)
                .position({of: field})
                .click(function() { dialog.text(JSON.stringify($(field).attr())); });
        });
    };
});
