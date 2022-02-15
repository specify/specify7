"use strict";

import $ from 'jquery';
import _ from 'underscore';
import Backbone from './backbone';

import UICmd from './uicommand';
import { schema } from './schema';
import formsText from './localization/forms';
import commonText from './localization/common';

var title = commonText('transactions');

var dialog;
function makeDialog(el, options) {
    dialog && dialog.dialog('close');
    dialog = el.dialog(_.extend({
        modal: true,
        close: function() { dialog = null; $(this).remove(); }
    }, options));
}

var TransListDialog = Backbone.View.extend({
    __name__: "TransListDialog",
    events: {
        'click a': 'displayTrans'
    },
    initialize: function(options) {
        this.openloans = options.openloans;
        this.resolvedloans = options.resolvedloans;
        this.gifts = options.gifts;
        this.exchanges = options.exchanges;
    },
    render: function() {
        var open = this.openloans.length;
        var resolved = this.resolvedloans.length;
        var gifted = this.gifts.length;
        var exchanged = this.exchanges.length;

        var openLoans = open ? $('<table class="open-loans">') : null;
        var resolvedLoans = resolved ? $('<table class="resolved-loans">') : null;
        var gifts = gifted ? $('<table class="gifts">') : null;
        var exchanges = exchanged ? $('<table class="exchanges">') : null;

        openLoans && _.map(this.options.openloans.models, this.makeEntry.bind(this, openLoans, 'loan', 'loannumber'));
        resolvedLoans && _.map(this.options.resolvedloans.models, this.makeEntry.bind(this, resolvedLoans, 'loan', 'loannumber'));
        gifts && _.map(this.options.gifts.models, this.makeEntry.bind(this, gifts, 'gift', 'giftnumber'));
        exchanges && _.map(this.options.exchanges.models, this.makeEntry.bind(this, exchanges, 'exchange', 'exchangeoutnumber'));

        this.$el
            .append(`<h2>${formsText('openLoans')}</h2>`).append(openLoans || ' (none) ')
            .append(`<h2>${formsText('resolvedLoans')}</h2>`).append(resolvedLoans || ' (none) ')
            .append(`<h2>${formsText('gifts')}</h2>`).append(gifts || ' (none) ');
        exchanges && this.$el.append(`<h2>${formsText('exchanges')}</h2>`).append(exchanges);

        makeDialog(this.$el, {
            title: title,
            maxHeight: 400,
            buttons: [
                {text: commonText('cancel'), click: function() { $(this).dialog('close'); }}
            ]
        });
        return this;
    },
    makeEntry: function(table, related, display, resource) {
        resource.rget(related, true).done(function(relres){
            var a = $('<a class="select">')
                    .text(relres.get(display))
                    .attr('href', relres.viewUrl());
            var entry = $('<tr>').append(a);
            var rows = table.find('tr');
            var r = 0;
            while (r < rows.length && $(rows[r]).text() < entry.text()) r++;
            if (r >= rows.length) {
                table.append(entry);
            } else {
                entry.insertBefore($(rows[r]));
            }
        });
    },
    displayTrans: function(evt) {
        console.log(evt);
    }

});

export default UICmd.extend({
    __name__: "ShowTransCommand",
    events: {
        'click': 'click'
    },
    initialize({populateForm}) {
        this.populateForm = populateForm;
    },
    render() {
        if (this.model.isNew() || this.model.get('id') == null) {
            this.$el.hide();
        }
        return this;
    },
    click: function(evt) {
        evt.preventDefault();

        var openLoanPreps = new schema.models.LoanPreparation.LazyCollection({
            filters: {preparation_id: this.model.get('id'), isresolved: false}
        });
        var resolvedLoanPreps = new schema.models.LoanPreparation.LazyCollection({
            filters: {preparation_id: this.model.get('id'), isresolved: true}
        });
        var giftPreps = new schema.models.GiftPreparation.LazyCollection({
            filters: {preparation_id: this.model.get('id')}
        });
        var exchPreps = new schema.models.ExchangeOutPrep.LazyCollection({
            filters: {preparation_id: this.model.get('id')}
        });
        $.when(openLoanPreps.fetch(), resolvedLoanPreps.fetch(), giftPreps.fetch(), exchPreps.fetch()).done(function() {
            var trans = {openloans: openLoanPreps,
                         resolvedloans: resolvedLoanPreps,
                         gifts: giftPreps,
                         exchanges: exchPreps};
            new TransListDialog(trans).render();
        });

    }
});
