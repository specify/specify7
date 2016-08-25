"use strict";

const $ = require('jquery');
const _ = require('underscore');
const Backbone = require('./backbone.js');
const moment = require('moment');

const schema      = require('./schema.js');
const FieldFormat = require('./fieldformat.js');
const userInfo    = require('./userinfo.js');
const s = require('./stringlocalization.js');


var dialog;
function makeDialog(el, options) {
    dialog && dialog.dialog('close');
    dialog = el.dialog(_.extend({
        modal: true,
        width: 500,
        close: function() { dialog = null; $(this).remove(); }
    }, options));
}

module.exports =  Backbone.View.extend({
    __name__: "PrepReturnDialog",
    className: "prepreturndialog table-list-dialog",
    events: {
        'click :checkbox': 'prepCheck',
        'click a.return-remark': 'remToggle'
    },
    initialize({loan, loanpreparations}) {
        this.loan = loan;

        this.prepInfos = loanpreparations.map(lp => ({
            loanpreparation: lp,
            catalognumber: '',
            taxon: '',
            loanpreparationid: lp.get('id'),
            preptype: '',
            unresolved: lp.get('quantity') - lp.get('quantityresolved'),
            preparation: lp.get('preparation')
        }));


        Object.assign(this, {
            colobjModel: schema.getModel("collectionobject"),
            detModel: schema.getModel("determination"),
            prepModel: schema.getModel("preparation"),
            loanModel: schema.getModel("loan"),
            giftModel: schema.getModel("gift"),
            exchModel: schema.getModel("exchangeout")
        });
    },
    render: function() {
        $('<table>').append(
            $('<tr>').append(
                '<th></th',
                $('<th>').text(this.colobjModel.getField('catalognumber').getLocalizedName()),
                $('<th>').text(this.detModel.getField('taxon').getLocalizedName()),
                $('<th>').text(this.prepModel.getField('preptype').getLocalizedName()),
                '<th>Unresolved</th>',
                '<th>Return</th>',
                '<th colspan="2">Resolve</th>'
            )).append(
                [].concat(...this.prepInfos.map((prepInfo, i) => [
                    this.dialogEntry(prepInfo, i),
                    this.remarksRow()
                ]))
            ).appendTo(this.el);

        this.$el.dialog({
            modal: true,
            close: function() { $(this).remove(); },
            title: schema.getModel("loanpreparation").getLocalizedName(),
            maxHeight: 700,
            width: 600,
            buttons: this.buttons()
        });

        this.$(".return-amt").spinner({
            spin: _.bind(this.returnSpin, this)
        }).width(50);

        this.$(".resolve-amt").spinner({
            spin: _.bind(this.resolveSpin, this)
        }).width(50);

        return this;
    },
    dialogEntry: function(iprep, idx) {
        const entry = $('<tr>').append(
            '<td><input type="checkbox"></td>',
            '<td class="return-catnum">',
            '<td class="return-taxon">',
            '<td class="return-prep-type" style="text-align:center">',
            `<td style="text-align:center">${iprep.unresolved}</td>`,
            //not allowing typing into spinners because tricky returned-resolved interdependancy requires previous value,
            //which seems to be unavailable in the 'change' event.
            `<td><input readonly value="0" min="0" max="${iprep.unresolved}" class="return-amt"></td>`,
            `<td><input readonly value="0" min="0" max="${iprep.unresolved}" class="resolve-amt"</td>`,
            '<td><a class="return-remark" style="display:none"><span class="ui-icon ui-icon-comment">remarks</span></a></td>'
        );

        $.when(
            iprep.loanpreparation.rget('preparation.collectionobject', true),
            iprep.loanpreparation.rget('preparation.preptype', true)
        ).then(
            (co, pt) => co.rget('determinations').pipe(dets => {
                const det = dets.filter(d => d.get('iscurrent'))[0];
                return det == null ? null : det.rget('preferredtaxon', true);
            }).then(taxon => {
                const catalognumber = co.get('catalognumber');
                const preptype = pt.get('name');
                const taxonName = taxon == null ? "" : taxon.get('fullname');

                $('.return-catnum', entry).text(FieldFormat(this.colobjModel.getField('catalognumber'), catalognumber));
                $('.return-taxon', entry).text(taxonName);
                $('.return-prep-type', entry).text(preptype);

                this.prepInfos[idx].catalognumber = catalognumber;
                this.prepInfos[idx].taxon = taxonName;
                this.prepInfos[idx].preptype = preptype;
            })
        );

        return entry;
    },
    remarksRow() {
        return $('<tr class="return-remark" style="display:none">').append(
            $('<td>'),
            $('<td colspan="6"><input type="text" class="return-remark" style="width:100%" placeholder="Remarks"></td>')
        );
    },
    getIndex: function(evt, selector) {
        return this.$(selector).index(evt.currentTarget);
    },
    getProp: function(key, fallback) {
        return s.localizeFrom('resources', key, fallback);
    },
    buttons: function() {
        var buttons = this.options.readOnly ? [] : [
            { text: this.getProp('SELECTALL'), click: _.bind(this.selectAll, this),
              title: 'Return all preparations.' },
            { text: this.getProp('DESELECTALL'), click: _.bind(this.deSelectAll, this),
              title: 'Clear all.' },
            { text: 'OK', click: _.bind(this.returnSelections, this),
              title: 'Return selected preparations' }
        ];
        buttons.push({ text: this.getProp('CANCEL'), click: function() { $(this).dialog('close'); }});
        return buttons;
    },
    remToggle: function(evt) {
        var idx = this.$('a.return-remark').index(evt.currentTarget);
        if (idx >= 0) {
            $(this.$('tr.return-remark')[idx]).toggle();
            $(this.$('input.return-remark')[idx]).attr('value', '');
        }
    },
    returnSpin: function(evt, ui) {
        var idx = this.$(".return-amt").index(evt.target);
        if (idx >= 0) {
            var resolveSp =this.$(".resolve-amt")[idx];
            var val = new Number($(ui).attr('value'));
            var prevVal = new Number($(evt.target).attr('value'));
            var delta = val - prevVal; //can this ever NOT be +-1 for a spin?
            var resolvedVal = new Number($(resolveSp).attr('value')) + delta;
            $(resolveSp).attr('value', resolvedVal);
            var chk = this.$(':checkbox')[idx];
            if (chk.checked != resolvedVal > 0) {
                chk.checked = resolvedVal > 0;
                this.updateRemarkUI(idx, chk.checked);
            }
        }
    },
    resolveSpin: function( evt, ui ) {
        var idx = this.$(".resolve-amt").index(evt.target);
        if (idx >= 0) {
            var returnSp =this.$(".return-amt")[idx];
            var val = new Number($(ui).attr('value'));
            var max = this.prepInfos[idx].unresolved;
            var chk = this.$(':checkbox')[idx];
            if (chk.checked != val > 0) {
                chk.checked = val > 0;
                this.updateRemarkUI(idx, val > 0);
            }
            var returnVal = new Number($(returnSp).attr('value'));
            if (val < returnVal) {
                returnVal = val;
            }
            $(returnSp).spinner({
                readOnly: true,
                min: 0,
                max: max - (val - returnVal),
                spin:  _.bind(this.returnSpin, this)
            });
            $(returnSp).attr('value', returnVal);
        }
    },
    returnDone: function(result) {
        this.$el.dialog('close');

        var msg = this.getProp("InteractionsTask.RET_LN", "%d preparations have been returned.").replace('%d', result[0]);

        var huh = $("<p>").append(msg);

        makeDialog(huh, {
            title: this.getProp("InteractionsTask.LN_RET_TITLE"),
            maxHeight: 400,
            buttons: [
                {text: this.getProp('CLOSE'), click: function() { $(this).dialog('close'); }}
            ]
        });
    },
    updateModelItems: function(returnedById, returnedDate, returns) {
        var items = this.loan.dependentResources.loanpreparations.models;
        var itemsIdx = _.groupBy(items, 'id');
        var lrm = schema.getModel("loanreturnpreparation");
        _.each(returns, function(ret) {
            var item = itemsIdx[ret[0]];
            if (item) {
                item = item[0];
                item.set('quantityReturned', item.get('quantityReturned') + ret[1]);
                item.set('quantityResolved', item.get('quantityResolved') + ret[2]);
                item.set('isResolved', ret[3] == 'true');
                var lrp = new lrm.Resource();
                lrp.initialize();
                lrp.set('quantityReturned', ret[1]);
                lrp.set('quantityResolved', ret[2]);
                lrp.set('returnedDate', returnedDate);
                lrp.set('receivedBy', '/api/specify/agent/' + returnedById + '/');
                if (ret[4] != 'NULL') {
                    lrp.set('remarks', ret[4].slice(1,ret[4].length-1)); //need to remove enclosing quotes for now.
                }
                item.dependentResources.loanreturnpreparations.models.push(lrp);
                item.dependentResources.loanreturnpreparations.length += 1;
                item.dependentResources.loanreturnpreparations.trigger('add');
            }
        });
    },

    returnSelections: function() {
        this.prepInfos.forEach((prepInfo, i) => {
            const resolved = parseInt(this.$(".resolve-amt")[i].value, 10);
            if (resolved < 1) return;

            const returned = parseInt(this.$(".return-amt")[i].value, 10);

            var remarks = this.$("input.return-remark")[i].value.trim();
            remarks === "" && (remarks = null);

            const lp = prepInfo.loanpreparation;
            lp.set({
                quantityreturned: lp.get('quantityreturned') + returned,
                quantityresolved: lp.get('quantityresolved') + resolved
            });

            lp.set('isresolved', lp.get('quantityresolved') >= lp.get('quantity'));

            const lrp = new schema.models.LoanReturnPreparation.Resource({
                returneddate: moment().format('YYYY-MM-DD'),
                remarks: remarks,
                loanpreparation: lp.url()
            }).set('quantityreturned', returned).set('quantityresolved', resolved);

            lp.dependentResources.loanreturnpreparations.models.push(lrp);
            lp.dependentResources.loanreturnpreparations.length += 1;
            lp.dependentResources.loanreturnpreparations.trigger('add');
        });
    },

    returnSelectionsold: function() {
        const returns = this.prepInfos.map((prep, idx) => {
            const resolved = parseInt(this.$(".resolve-amt")[idx].value, 10);
            var rem =  this.$("input.return-remark")[idx].value.trim();
            if (rem.length == 0) {
                rem = 'NULL';
            } else {
                rem = "'" + rem.replace(/'/g, "''") + "'";
            }
            return {
                loanpreparationid: prep.loanpreparationid,
                returnAmnt: parseInt(this.$(".return-amt")[idx].value, 10),
                resolvedAmnt: resolved,
                isResolved: resolved == prep.unresolved ? 'true' : 'false',
                remark: rem
            };
        }).filter(({returnAmnt}) => returnAmnt > 0);

        var today = new Date();
        var todayArg = [];
        todayArg[0] = today.getFullYear(); todayArg[1] = today.getMonth() + 1; todayArg[2] = today.getDate();
        console.log(returns);
        // this.updateModelItems(userInfo.id, todayArg.join('-'), returns);
        // this.returnDone([returns.length]);
    },

    updateRemarkUI: function(idx, show) {
        var remA = this.$('a.return-remark')[idx];
        var rem = this.$('tr.return-remark')[idx];
        if (show) {
            $(remA).removeAttr('style');
        } else {
            $(remA).attr('style', 'display: none;');
            $(rem).attr('style', 'display: none;');
            $('input', rem).attr('value', '');
        }
    },

    prepCheck: function( evt ) {
        var idx = this.$(':checkbox').index( evt.target );
        if (idx >= 0) {
            var newVal = evt.target.checked ? this.prepInfos[idx].unresolved : 0;
            $(this.$('.resolve-amt')[idx]).attr('value',  newVal);
            var returnSp = this.$('.return-amt')[idx];
            $(returnSp).spinner({
                readOnly: true,
                min: 0,
                max: this.prepInfos[idx].unresolved,
                spin:  _.bind(this.returnSpin, this)
            });
            $(returnSp).attr('value', newVal);
            this.updateRemarkUI(idx, evt.target.checked);
        }
    },

    selectAll: function(evt) {
        evt.preventDefault();
        var returns = this.$('.return-amt');
        var resolves = this.$('.resolve-amt');
        var chks = this.$(':checkbox');
        for (var p=0; p < returns.length; p++) {
            $(returns[p]).spinner({
                readOnly: true,
                min: 0,
                max: this.prepInfos[p].unresolved,
                spin:  _.bind(this.returnSpin, this)
            });
            $(returns[p]).attr('value', this.prepInfos[p].unresolved);
            $(resolves[p]).attr('value', this.prepInfos[p].unresolved);
            $(chks[p]).attr('checked', this.prepInfos[p].unresolved > 0);
            this.$('a.return-remark').removeAttr('style');
        };
    },

    deSelectAll: function(evt) {
        evt.preventDefault();
        var returns = this.$('.return-amt');
        for (var p=0; p < returns.length; p++) {
            $(returns[p]).spinner({
                readOnly: true,
                min: 0,
                max: this.prepInfos[p].unresolved,
                spin:  _.bind(this.returnSpin, this)
            });
            $(returns[p]).attr('value', 0);
        };
        this.$('.resolve-amt').attr('value', 0);
        this.$(':checkbox').attr('checked', false);
        var remrows =  this.$('tr.return-remark').not('[style^="display"]');
        remrows.attr('style', 'display: none;').attr('value', '');
        this.$('a.return-remark', remrows).attr('style', 'display: none;');
        this.$('input.return-remark', remrows).attr('value', '');
    }

    //<<<<<<<<<<<<<<<<<<<<<<< events
});

