"use strict";

var $ = require('jquery');
var _ = require('underscore');

var UIPlugin = require('./uiplugin.js');

var providers = [
    require('./latlongui.js'),
    require('./partialdateui.js'),
    require('./collectionrelonetomanyplugin.js'),
    require('./collectionrelonetooneplugin.js'),
    require('./geolocateplugin.js'),
    require('./weblinkbutton.js'),
    require('./attachmentplugin.js'),
    require('./hosttaxonplugin.js'),
    require('./passwordplugin.js'),
    require('./useragentsplugin.js'),
    require('./adminstatusplugin.js'),
    require('./googlemapsplugin.js'),
];


    var plugins = {
        PluginNotAvailable: UIPlugin.extend({
            __name__: "UnavailablePlugin",
            events: {
                'click': 'click'
            },
            render: function() {
                this.$el.attr('value', 'Plugin N/A').prop('disabled', false);
                return this;
            },
            click: function(evt) {
                evt.preventDefault();
                $('<div title="Plugin Not Available">' +
                 'This plugin is currently unavailable for <i>Specify&nbsp7</i>. ' +
                 'It was probably included on this form from <i>Specify&nbsp6</i> and ' +
                 'may be supported in the future.</div>')
                .append('<dt>Plugin name:</dt>')
                .append($('<dd>').text(this.init.name))
                .dialog({
                    modal: true,
                    close: function() { $(this).remove(); }
                });
            }
        })
    };

    _.each(providers, function(provider) {
        _.each(provider.pluginsProvided, function(pluginProvided) {
            plugins[pluginProvided] = provider;
        });
    });

module.exports =  plugins;
