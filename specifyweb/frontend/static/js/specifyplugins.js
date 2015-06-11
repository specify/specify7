define([
    'jquery', 'underscore', 'uiplugin',
    // plugin providers
    'latlongui',
    'partialdateui',
    'collectionrelonetomanyplugin',
    'collectionrelonetooneplugin',
    'geolocateplugin',
    'weblinkbutton',
    'attachmentplugin',
    'hosttaxonplugin',
    'passwordplugin',
    'useragentsplugin',
    'adminstatusplugin',
    'googlemapsplugin'
], function specifyPlugins($, _, UIPlugin) {
    "use strict";

    var providers = _.tail(arguments, specifyPlugins.length);

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

    return plugins;
});
