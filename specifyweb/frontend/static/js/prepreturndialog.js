"use strict";

var $ = require('jquery');
var _ = require('underscore');

var schema      = require('./schema.js');
var FieldFormat = require('./fieldformat.js');
var PrepDialog  = require('./prepdialog.js');
var userInfo    = require('./userinfo.js');

    var dialog;
    function makeDialog(el, options) {
        dialog && dialog.dialog('close');
        dialog = el.dialog(_.extend({
            modal: true,
            width: 500,
            close: function() { dialog = null; $(this).remove(); }
        }, options));
    }

module.exports =  PrepDialog.extend({
        __name__: "PrepReturnDialog",
        className: "prepreturndialog table-list-dialog",
        events: {
            'click :checkbox': 'prepCheck',
            'click a.return-remark': 'remToggle'
        },
        loanreturnprepModel: schema.getModel("loanreturnpreparation"),

        //ui elements stuff >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

        getTblHdr: function() {
            return '<tr><th>  </th>'
                + '<th>' + this.colobjModel.getField('catalognumber').getLocalizedName() + '</th>'
                + '<th>' + this.detModel.getField('taxon').getLocalizedName() + '</th>'
                + '<th>' + this.prepModel.getField('preptype').getLocalizedName() + '</th>'
                + '<th>Unresolved</th><th>Return</th><th colspan="2">Resolve</th></tr>';
        },
        getDlgTitle: function() {
            return schema.getModel("loanpreparation").getLocalizedName();
        },

        finishRender: function() {
            //this.$('table').before( '<div>Returned By: <input type="text" class="return-returnedby"> Returned Date: <input type="date" class="return-returdedDate"></div>');

            var returnSpinners = this.$(".return-amt");
            returnSpinners.spinner({
                spin: _.bind(this.returnSpin, this)
            });
            returnSpinners.width(50);
            var resolvedSpinners = this.$(".resolve-amt");
            resolvedSpinners.spinner({
                spin: _.bind(function( evt, ui ) {
                    var idx = this.$(".resolve-amt").index(evt.target);
                    if (idx >= 0) {
                        var returnSp =this.$(".return-amt")[idx];
                        var val = new Number($(ui).attr('value'));
                        var max = this.options.preps[idx].unresolved;
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
                }, this)
            });
            resolvedSpinners.width(50);
        },

        dialogEntry: function(iprep, idx) {
            var catNumCtrl =  $('<td class="return-catnum">');
            var taxCtrl = $('<td/>');
            var prepTypeCtrl =  $('<td>').attr('align', 'center');
            var entry = [
                $('<tr>').append(
                    $('<td>').append($('<input>').attr('type', 'checkbox')),
                    //$('<td>').append(FieldFormat(this.colobjModel.getField('catalognumber'), iprep.catalognumber)),
                    catNumCtrl,
                    //$('<td>').append(iprep.taxon),
                    taxCtrl,
                    //$('<td>').attr('align', 'center').append(iprep.preptype),
                    prepTypeCtrl,
                    $('<td>').attr('align', 'center').append(iprep.unresolved),
                    //not allowing typing into spinners because tricky returned-resolved interdependancy requires previous value,
                    //which seems to be unavailable in the 'change' event.
                    $('<td>').append($('<input readonly>').attr('align', 'right').attr('value', '0').attr('max', iprep.unresolved).attr('min', 0).addClass('return-amt')),
                    $('<td>').append($('<input readonly>').attr('align', 'right').attr('value', '0').attr('max', iprep.unresolved).attr('min', 0).addClass('resolve-amt')),
                $('<td>').append($('<a class="return-remark" style="display:none">').append('<span class="ui-icon ui-icon-comment">'))),
                $('<tr class="return-remark" style="display:none">').append($('<td/>'), $('<td colspan="6"><input type="text" class="return-remark" style="width:100%" placeholder="Remarks"></td>'))
            ];
            this.fillPrepRow(iprep, _.bind(this.rowDone, this, catNumCtrl, taxCtrl, prepTypeCtrl, idx));
            return entry;
        },

        fillPrepRow: function(loanprep, filled) {
            var rowdata = {};
            $.when($.get(loanprep.preparation)).then(function(prep) {
                $.when(
                    $.get(prep.collectionobject),
                    $.get(prep.preptype)
                ).done(function(co, pt) {
                    rowdata.catalognumber = co[0].catalognumber;
                    rowdata.preptype = pt[0].name;
                    var current = _.filter(co[0].determinations, function(d) {
                        return d.iscurrent;
                    });
                    $.when($.get(current[0].preferredtaxon)).done(function(tx) {
                        rowdata.taxon = tx.fullname;
                        filled(rowdata);
                    });
                });
            });
        },

        rowDone: function(catNumCtrl, taxCtrl, prepTypeCtrl, idx, rowdata) {
            catNumCtrl.append(FieldFormat(this.colobjModel.getField('catalognumber'), rowdata.catalognumber));
            taxCtrl.append(rowdata.taxon);
            prepTypeCtrl.append(rowdata.preptype);
            this.options.preps[idx].catalognumber = rowdata.catalognumber;
            this.options.preps[idx].taxon = rowdata.taxon;
            this.options.preps[idx].preptype = rowdata.preptype;
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



        //<<<<<<<<<<<<<<<<<<<< ui elements stuff

        //events >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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
            var items = this.options.model.dependentResources.loanpreparations.models;
            var itemsIdx = _.groupBy(items, 'id');
            var lrm = this.loanreturnprepModel;
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
            var self = this;
            var returns = _.filter(_.map(this.options.preps, function(prep, idx) {
                var resolved = new Number(self.$(".resolve-amt")[idx].value);
                var rem =  self.$("input.return-remark")[idx].value.trim();
                if (rem.length == 0) {
                    rem = 'NULL';
                } else {
                    rem = "'" + rem.replace(/'/g, "''") + "'";
                }
                return [ prep.loanpreparationid,
                         new Number(self.$(".return-amt")[idx].value),
                         resolved,
                         resolved == prep.unresolved ? 'true' : 'false',
                         rem
                       ];
            }), function(item) { return item[1] > 0; });
            var today = new Date();
            var todayArg = [];
            todayArg[0] = today.getFullYear(); todayArg[1] = today.getMonth() + 1; todayArg[2] = today.getDate();
            var model = this.options.model;
            this.updateModelItems(userInfo.id, todayArg.join('-'), returns);
            this.returnDone([returns.length]);
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
                var newVal = evt.target.checked ? this.options.preps[idx].unresolved : 0;
                $(this.$('.resolve-amt')[idx]).attr('value',  newVal);
                var returnSp = this.$('.return-amt')[idx];
                $(returnSp).spinner({
                    readOnly: true,
                    min: 0,
                    max: this.options.preps[idx].unresolved,
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
                    max: this.options.preps[p].unresolved,
                    spin:  _.bind(this.returnSpin, this)
                });
                $(returns[p]).attr('value', this.options.preps[p].unresolved);
                $(resolves[p]).attr('value', this.options.preps[p].unresolved);
                $(chks[p]).attr('checked', this.options.preps[p].unresolved > 0);
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
                    max: this.options.preps[p].unresolved,
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

