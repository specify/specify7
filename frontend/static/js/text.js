define(['textbase'], function(textbase) {
    var text = {};
    for (var prop in textbase) {
        text[prop] = textbase[prop];
    }

    text.load = function(name, req, onLoad, config) {
        var els = name.split('!');
        if (els.length > 1 && els[els.length-1] === 'noinline' && config.inlineText) {
            els.pop();
            var fixedOnLoad = function() {
                config.inlineText = true;
                onLoad.apply(this, arguments);
            };
            config.inlineText = false;
            textbase.load(els.join('!'), req, fixedOnLoad, config);
        } else {
            textbase.load.apply(this, arguments);
        }
    };

    return text;
});
