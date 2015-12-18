"use strict";
var $ = require('jquery');
var Q = require('q');


    var promises = [];
    var final = Q.defer();
    var locked = false;


    function register(name, promise) {
        if (locked) throw new Error('initial context is locked');
        promises.push(
            promise.tap(() => console.log('initial context:', name))
        );
        return initialContext;
    }

    function lock() {
        if (locked) throw new Error('initial context already locked');
        locked = true;
        Q.all(promises).done(function() {
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

    module.exports = initialContext;

