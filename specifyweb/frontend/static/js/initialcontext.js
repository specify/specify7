define(['jquery', 'q'], function($, Q) {
    "use strict";
    var core = Q(null);
    var final = Q.defer();
    var locked = false;


    function register(name, promise) {
        if (locked) throw new Error('initial context is locked');
        core = Q.all([
            core,
            promise.tap(() => console.log('initial context:', name))
        ]);
        return initialContext;
    }

    function lock() {
        if (locked) throw new Error('initial context already locked');
        locked = true;
        core.done(function() {
            console.log('initial context finished');
            final.resolve();
        });
        return initialContext;
    }

    function promise() {
        return final.promise;
    }

    function load(type, file, cb) {
        return register(
            file,
            Q($.get('/' + type + '/' + file))
                .then(cb));
    }

    var initialContext = {
        register: register,
        promise: promise,
        lock: lock,
        load: load.bind(null, 'context'),
        loadProperties: load.bind(null, 'properties'),
        loadResource: load.bind(null, 'static/config')
    };

    return initialContext;
});
