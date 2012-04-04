define(['jquery', 'underscore', 'jquery-ui'], function($, _) {
    var debug = false;

    return function(node, collection, contentSelector, buildContent, atTop) {
        var bottom = collection.offset || 0;
        var top = bottom + collection.length;
        var slider = atTop ? $('<div>').prependTo(node) : $('<div>').appendTo(node);
        var request, showingSpinner, intervalId;
        var redraw = function(offset) {
            debug && console.log('want to redraw at ' + offset);
            var resource = collection.at(offset);
            if (_(resource).isUndefined()) return;
            buildContent(resource).done(function(content) {
                var curOffset = slider.slider('value');
                if (curOffset === offset) {
                    debug && console.log('filling in at ' + offset);
                    $(contentSelector, node).replaceWith(content);
                    showingSpinner = false;
                } else {
                    debug && console.log('not filling because slider is at ' +
                                         curOffset + ' but data is for ' + offset);
                }
            });
        };
        slider.slider({
            max: (collection.totalCount || collection.length) - 1,
            stop: _.throttle(function(event, ui) {
                if (collection.at(ui.value)) return;
                request && request.abort();
                var at = ui.value - ui.value % collection.limit;
                request = collection.fetch({at: at}).done(function() {
                    debug && console.log('got collection at offset ' + at);
                    request = null;
                    redraw(slider.slider('value'));
                });
            }, 750),
            slide: function(event, ui) {
                $('.ui-slider-handle', this).text(ui.value + 1);
                if (_(collection.at(ui.value)).isUndefined()) {
                    if (showingSpinner) return;
                    var content = $(contentSelector, node);
                    var spinner = $('<img src="/static/img/icons/specify128spinner.gif">');
                    var div = $('<div>').css({height: content.height(),
                                              'text-align': 'center'}).append(spinner);
                    spinner.height(Math.min(128, 0.90*content.height()));
                    content.empty().append(div);
                    showingSpinner = true;
                } else _.defer(redraw, ui.value);
            }
        }).find('.ui-slider-handle').
            css({'min-width': '1.2em', width: 'auto', 'text-align': 'center', padding: '0 3px 0 3px'}).
            text(1);
    };
});