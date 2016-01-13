"use strict";

var $        = require('jquery');
var _        = require('underscore');
var Backbone = require('backbone');

    // http://stackoverflow.com/questions/14866014/debugging-javascript-backbone-and-marionette

    function createNamedConstructor(name, constructor) {
        var fn = new Function('constructor', 'return function ' + name + ' () {\n'
                              + '    // wrapper function created dynamically for "' + name
                              + '    // constructor to allow instances to be identified in the debugger\n'
                              + '    constructor.apply(this, arguments);\n'
                              + '};');
        return fn(constructor);
    }

    var originalExtend = Backbone.View.extend;
    var nameProp = '__name__';
    var newExtend = function(protoProps, classProps) {
        if (protoProps && protoProps.hasOwnProperty(nameProp)) {
            // TODO: check that name is a valid identifier
            var name = protoProps[nameProp];
            // wrap constructor from protoProps if supplied or 'this' (thi function we are extending)
            var constructor = protoProps.hasOwnProperty('constructor') ? protoProps.constructor : this;
            protoProps = _.extend(protoProps, {
                constructor: createNamedConstructor(name, constructor)
            });
        } else {
            console.warn("Creating backbone subclass without __name__ property.");
        }
        return originalExtend.call(this, protoProps, classProps);
    };

    Backbone.Model.extend = Backbone.Collection.extend = Backbone.Router.extend = Backbone.View.extend = newExtend;

Backbone.$ = $;
module.exports = Backbone;
