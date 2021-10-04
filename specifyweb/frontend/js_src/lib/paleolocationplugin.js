"use strict";

const $ = require('jquery');

const UIPlugin = require('./uiplugin.js');
const template = require('./templates/pmapplugin.html');
const Q = require('q');
const formsText = require('./localization/forms').default;

module.exports = UIPlugin.extend({
    __name__: "PaleolocationMapPlugin",
    events: {
        'click': 'click'
    },
    render: function () {
        this.$el.attr('value', formsText('paleoMap')).prop('disabled', false);
        return this;
    },
    click: function (evt) {
        evt.preventDefault();
        this.paleoRefData().done(function (data) {
            data ? this.openPaleoMap(data) : this.paleoRequired();
        }.bind(this));
    },
    paleoRequired: function () {
        $(`<div>
            ${formsText('paleoRequiresGeographyDialogHeader')}
            <p>${formsText('paleoRequiresGeographyDialogMessage')}</p>
        </div>`).dialog({
            title: formsText('paleoRequiresGeographyDialogTitle'),
            close: function () {
                $(this).remove();
            }
        });
    },
    openPaleoMap: function (data) {
        const form = this.model.specifyModel.getLocalizedName();
        if (data == null) {
            $(`<div>
                ${formsText('noCoordinatesDialogHeader')(form)}
                <p>${formsText('noCoordinatesDialogMessage')(form)}</p>
            </div>`).dialog({
                title: formsText('noCoordinatesDialogTitle'),
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

        if (this.model.specifyModel.name == 'Locality') {
            // retrieve the geographic coordinates relative to the locality table
            lat = this.model.get('latitude1');
            lng = this.model.get('longitude1');
        } else if (this.model.specifyModel.name == 'CollectingEvent') {
            // ...relative to the collectingevent table
            lat = Q(this.model.rget('locality.latitude1', true));
            lng = Q(this.model.rget('locality.longitude1', true));
        } else if (this.model.specifyModel.name == 'CollectionObject') {
            // ...relative to the collectionobject table
            lat = Q(this.model.rget('collectingevent.locality.latitude1', true));
            lng = Q(this.model.rget('collectingevent.locality.longitude1', true));
        } else {
            $(`<div>
                ${formsText('unsupportedFormDialogHeader')}
                <p>${formsText('unsupportedFormDialogMessage')}</p>
            </div>`).dialog({
                title: formsText('unsupportedFormDialogTitle'),
                close: function () {
                    $(this).remove();
                }
            });
        }

        // Because the paleo context is related directly to each of the possible forms in the same way
        // we can treat the retrieval of the age in the same all for all forms.
        start_ma = Q(this.model.rget('paleocontext.chronosstrat.startperiod', true));
        end_ma = Q(this.model.rget('paleocontext.chronosstrat.endperiod', true));
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

