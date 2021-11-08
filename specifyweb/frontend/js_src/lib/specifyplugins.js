"use strict";

var $ = require('jquery');
var _ = require('underscore');

var UIPlugin = require('./uiplugin.js');
const formsText = require('./localization/forms').default;

var providers = [
    require('./usercollectionsplugin.js'),
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
    require('./leafletplugin.js'),
    require('./paleolocationplugin.js'),
];


    var plugins = {
        PluginNotAvailable: UIPlugin.extend({
            __name__: "UnavailablePlugin",
            events: {
                'click': 'click'
            },
            render: function() {
                this.el.innerText = formsText('unavailablePluginButton');
                this.el.disabled = false;
                return this;
            },
            click: function(evt) {
                evt.preventDefault();
                $(`<div>
                    ${formsText('unavailablePluginDialogHeader')}
                    <p>${formsText('unavailablePluginDialogMessage')}</p>
                </div>`)
                .append(`<dt>${formsText('pluginName')}</dt>`)
                .append($('<dd>').text(this.init.name))
                .dialog({
                    title: formsText('unavailablePluginDialogTitle'),
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
