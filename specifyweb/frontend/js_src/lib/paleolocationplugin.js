"use strict";

const $ = require('jquery');

const UIPlugin = require('./uiplugin.js');
const template = require('./templates/pmapplugin.html');
const Q = require('q');

module.exports = UIPlugin.extend({
    __name__: "PaleolocationMapPlugin",
    events: {
        'click': 'click'
    },
    render: function () {
        this.$el.attr('value', 'Paleo Map').prop('disabled', false);
        return this;
    },
    click: function (evt) {
        evt.preventDefault();
        this.paleoRefData().done(function (data) {
            data ? this.openPaleoMap(data) : this.paleoRequired();
        }.bind(this));
    },
    paleoRequired: function () {
        $('<div title="Geography Required">' +
            '<p><span class="ui-icon ui-icon-alert" style="display: inline-block;"></span>' +
            'The Paleo Map plugin requires that the locality have geographic coordinates and that the paleo ' +
            'context have a geographic age with at least a start time or and end time populated.' +
            '</p></div>'
        ).dialog({
            close: function () {
                $(this).remove();
            }
        });
    },
    openPaleoMap: function (data) {
        if (data == null) {
            const form = this.model.specifyModel.getLocalizedName();
            $('<div title="No coordinates"><p>' + form + ' must have coordinates and paleo context to be mapped.</p></div>')
                .dialog({
                    close: function () {
                        $(this).remove();
                    }
                });
        } else {
            $('<div>').append(template(data)).dialog({
                width: 800,
                height: 600,
                title: form,
                close: function () {
                    $(this).remove();
                }
            }).css({overflow: 'hidden'});
        }
    },
    paleoRefData: function () {

        let lat, lng, start_ma, end_ma;

        if (this.model.name == 'Locality') {
            // retrieve the geographic coordinates relative to the locality table
            lat = this.model.specifyModel.get('latitude1');
            lng = this.model.specifyModel.get('longitude1');
        } else if (this.model.specifyModel.name == 'CollectingCvent') {
            // ...relative to the collectingevent table
            lat = Q(this.model.specifyModel.rget('locality.latitude1', true));
            lng = Q(this.model.specifyModel.rget('locality.longitude1', true));
        } else if (this.model.specifyModel.name == 'CollectionCbject') {
            // ...relative to the collectionobject table
            lat = Q(this.model.specifyModel.rget('collectingevent.locality.latitude1', true));
            lng = Q(this.model.specifyModel.rget('collectingevent.locality.longitude1', true));
        } else {
            $('<div title="Incorrect Form"><p>This plugin cannot be used on this form. Try moving it to the locality, ' +
                'collecting event or collection object forms.</p></div>')
                .dialog({
                    close: function () {
                        $(this).remove();
                    }
                });
        }

        // Because the paleo context is related directly to each of the possible forms in the same way
        // we can treat the retrieval of the age in the same all for all forms.
        start_ma = Q(this.model.rget('paleocontext.geologictimeperiod.startperiod', true));
        end_ma = Q(this.model.rget('paleocontext.geologictimeperiod.endperiod', true));
        let ma;

        return Q.all([lat, lng, start_ma, end_ma]).spread((lat, lng, start_ma, end_ma) => {
            if (lat == null) return null;
            if (lng == null) return null;
            // calculate the mid-point of the age if possible
            if (start_ma == null && end_ma == null) {
                return null;
            } else if (start_ma == null) {
                ma = end_ma;
            } else if (end_ma == null) {
                ma = start_ma;
            } else {
                ma = ((start_ma + end_ma) / 2);
            }

            return {lat: lat, lng: lng, ma: ma};
        });
    }
}, {pluginsProvided: ['PaleoMap']});

