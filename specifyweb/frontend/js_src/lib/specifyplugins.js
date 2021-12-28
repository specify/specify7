"use strict";

import $ from 'jquery';
import _ from 'underscore';

import UIPlugin from './uiplugin';
import formsText from './localization/forms';

var providers = [
    require('./usercollectionsplugin').default,
    require('./latlongui').default,
    require('./partialdateui').default,
    require('./collectionrelonetomanyplugin').default,
    require('./collectionrelonetooneplugin').default,
    require('./geolocateplugin').default,
    require('./weblinkbutton').default,
    require('./attachmentplugin').default,
    require('./hosttaxonplugin').default,
    require('./components/passwordplugin').default,
    require('./useragentsplugin').default,
    require('./adminstatusplugin').default,
    require('./leafletplugin').default,
    require('./paleolocationplugin').default,
];


    var plugins = {
        PluginNotAvailable: UIPlugin.extend({
            __name__: "UnavailablePlugin",
            events: {
                'click': 'click'
            },
            render: function() {
                this.el.textContent = formsText('unavailablePluginButton');
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

export default plugins;
