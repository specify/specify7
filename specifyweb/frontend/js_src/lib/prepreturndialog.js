"use strict";

const $ = require('jquery');
const _ = require('underscore');
const Backbone = require('./backbone.js');
const moment = require('moment');

const schema      = require('./schema.js');
const fieldFormat = require('./fieldformat.js');
const userInfo    = require('./userinfo.js');
const s = require('./stringlocalization.js');

function formatCatNo(catNo) {
    const field = schema.models.CollectionObject.getField('catalognumber');
    return fieldFormat(field, catNo);
}

function localize(key, fallback) {
    return s.localizeFrom('resources', key, fallback);
};

const PrepReturnRow = Backbone.View.extend({
    __name__: "PrepReturnRow",
    tagName: 'tr',
    events: {
        'change .return-amt': 'returnAmountChanged',
        'change .resolve-amt': 'resolveAmountChanged',
        'change :checkbox': 'checkChanged',
        'click a.return-remark': 'toggleRemarks'
    },
    initialize({ loanpreparation }) {
        this.loanpreparation = loanpreparation;
        this.unresolved = loanpreparation.get('quantity') - loanpreparation.get('quantityresolved');
    },
    render() {
        const lp = this.loanpreparation;
        const unresolved = this.unresolved;

        this.$el.append(
            '<td><input type="checkbox"></td>',
            '<td class="return-catnum">',
            '<td class="return-taxon">',
            '<td class="return-prep-type" style="text-align:center">',
            `<td style="text-align:center">${unresolved}</td>`,
            `<td><input type="number" value="0" min="0" max="${unresolved}" class="return-amt"></td>`,
            `<td><input type="number" value="0" min="0" max="${unresolved}" class="resolve-amt"></td>`,
            '<td><a class="return-remark" style="display:none"><span class="ui-icon ui-icon-comment">remarks</span></a></td>'
        );

        $.when(
            lp.rget('preparation.collectionobject', true),
            lp.rget('preparation.preptype', true)
        ).then(
            (co, pt) => co.rget('determinations').pipe(dets => {
                const det = dets.filter(d => d.get('iscurrent'))[0];
                return det == null ? null : det.rget('preferredtaxon', true);
            }).then(taxon => {
                const catalognumber = co.get('catalognumber');
                const preptype = pt.get('name');
                const taxonName = taxon == null ? "" : taxon.get('fullname');

                this.$('.return-catnum').text(formatCatNo(catalognumber));
                this.$('.return-taxon').text(taxonName);
                this.$('.return-prep-type').text(preptype);
            })
        );

        return this;
    },
    returnAmountChanged(evt) {
        const returnUI = this.$(".return-amt");
        const resolveUI = this.$(".resolve-amt");
        // make return <= unresolved
        returnUI.val(Math.min(returnUI.val(), this.unresolved));
        // make resolved >= returned
        resolveUI.val(Math.max(resolveUI.val(), returnUI.val()));
        this.updateCheckbox();
        this.showHideRemarks();
    },
    resolveAmountChanged(evt) {
        const returnUI = this.$(".return-amt");
        const resolveUI = this.$(".resolve-amt");
        // make resolve <= unresolved
        resolveUI.val(Math.min(resolveUI.val(), this.unresolved));
        // make returned <= resolved
        returnUI.val(Math.min(returnUI.val(), $(evt.currentTarget).val()));
        this.updateCheckbox();
        this.showHideRemarks();
    },
    checkChanged(evt) {
        const value = this.$(':checkbox').prop('checked') ? this.unresolved : 0;
        this.$(".return-amt").val(value);
        this.$(".resolve-amt").val(value);
        this.showHideRemarks();
    },
    updateCheckbox() {
        this.$(':checkbox').prop('checked', this.$(".resolve-amt").val() > 0);
    },
    showHideRemarks() {
        const action = this.$(".resolve-amt").val() > 0 ? "show" : "hide";
        this.$(".return-remark")[action]();
        action == 'hide' && this.$el.closest('tr').next().hide();
    },
    toggleRemarks() {
        this.$el.closest('tr').next().toggle();
    },
    doResolve() {
        const lp = this.loanpreparation;

        const resolved = parseInt(this.$(".resolve-amt").val(), 10);
        if (resolved < 1) return;

        const returned = parseInt(this.$(".return-amt").val(), 10);

        var remarks = this.$el.closest('tr').next().find("input").val().trim();
        remarks === "" && (remarks = null);

        lp.set({
            quantityreturned: lp.get('quantityreturned') + returned,
            quantityresolved: lp.get('quantityresolved') + resolved
        });

        lp.set('isresolved', lp.get('quantityresolved') >= lp.get('quantity'));

        const lrp = new schema.models.LoanReturnPreparation.Resource({
            returneddate: moment().format('YYYY-MM-DD'),
            remarks: remarks,
            loanpreparation: lp.url(),
            quantityresolved: resolved,
            quantityreturned: returned
        });

        lp.dependentResources.loanreturnpreparations.models.push(lrp);
        lp.dependentResources.loanreturnpreparations.length += 1;
        lp.dependentResources.loanreturnpreparations.trigger('add');
    }
});

const remarksRow = `<tr class="return-remark" style="display:none">
<td></td>
<td colspan="6"><input type="text" class="return-remark" style="width:100%" placeholder="Remarks"></td>
</tr>`;

module.exports =  Backbone.View.extend({
    __name__: "PrepReturnDialog",
    className: "prepreturndialog table-list-dialog",
    initialize({loanpreparations}) {
        this.loanpreparations = loanpreparations;
    },
    render: function() {
        this.prepReturnRows = this.loanpreparations.map(lp => new PrepReturnRow({ loanpreparation: lp }));

        $('<table>').append(
            $('<tr>').append(
                '<th></th>',
                $('<th>').text(schema.models.CollectionObject.getField('catalognumber').getLocalizedName()),
                $('<th>').text(schema.models.Determination.getField('taxon').getLocalizedName()),
                $('<th>').text(schema.models.Preparation.getField('preptype').getLocalizedName()),
                '<th>Unresolved</th>',
                '<th>Return</th>',
                '<th colspan="2">Resolve</th>'
            )
        ).append(
            [].concat(...this.prepReturnRows.map(row => [row.render().$el, remarksRow]))
        ).appendTo(this.el);

        const buttons = (this.options.readOnly ? [] : [
            {
                text: localize('SELECTALL'),
                click: _.bind(this.selectAll, this),
                title: 'Return all preparations.'
            },
            {
                text: localize('DESELECTALL'),
                click: _.bind(this.deSelectAll, this),
                title: 'Clear all.'
            },
            {
                text: 'OK',
                click: _.bind(this.returnSelections, this),
                title: 'Return selected preparations.'
            }
        ]).concat({
            text: localize('CANCEL'),
            click: function() { $(this).dialog('close'); }
        });

        this.$el.dialog({
            modal: true,
            close: function() { $(this).remove(); },
            title: schema.getModel("loanpreparation").getLocalizedName(),
            maxHeight: 700,
            width: 600,
            buttons: buttons
        });
        return this;
    },
    returnSelections: function() {
        this.prepReturnRows.forEach(row => row.doResolve());
        this.$el.dialog('close');
    },
    selectAll: function() {
        this.$(':checkbox').prop('checked', true).change();
    },
    deSelectAll: function() {
        this.$(':checkbox').prop('checked', false).change();
    }
});

