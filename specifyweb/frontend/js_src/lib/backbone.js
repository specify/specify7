"use strict";

import $ from 'jquery';
import _ from 'underscore';
import BackboneBase from 'backbone';

// https://stackoverflow.com/questions/14866014/debugging-javascript-backbone-and-marionette

    function createNamedConstructor(name, constructor) {
        var fn = new Function('constructor', 'return function ' + name + ' () {\n'
                              + '    // wrapper function created dynamically for "' + name + '"\n'
                              + '    // constructor to allow instances to be identified in the debugger\n'
                              + '    constructor.apply(this, arguments);\n'
                              + '};');
        return fn(constructor);
    }

    var originalExtend = BackboneBase.View.extend;
    var nameProp = '__name__';
    var newExtend = function(protoProps, classProps) {
        if (protoProps && protoProps.hasOwnProperty(nameProp)) {
            // BUG: check that name is a valid identifier
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

    BackboneBase.Model.extend = BackboneBase.Collection.extend = BackboneBase.Router.extend = BackboneBase.View.extend = newExtend;

BackboneBase.$ = $;
export const Backbone = BackboneBase;
