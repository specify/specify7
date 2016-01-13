"use strict";

var $        = require('jquery');
var _        = require('underscore');

var schema           = require('./schema.js');
var api              = require('./specifyapi.js');
var RecordSetsDialog = require('./recordsetsdialog.js');
var PrepSelectDialog = require('./prepselectdialog.js');
var navigation       = require('./navigation.js');
var s                = require('./stringlocalization.js');

    var dialog;
    function makeDialog(el, options) {
        dialog && dialog.dialog('close');
        dialog = el.dialog(_.extend({
            modal: true,
            width: 500,
            close: function() { dialog = null; $(this).remove(); }
        }, options));
    }

module.exports = RecordSetsDialog.extend({
        __name__: "InteractionDialog",
        className: "interactiondialog recordsetsdialog",
        openIcon: "ui-icon ui-icon-radio-off",
        closeIcon: "ui-icon ui-icon-radio-on",
        events: {
            'click a.rs-select': 'rsSelect',
            'click button[type=action-entry]': 'processEntry',
            'click a.i-action-rs': 'toggleRs',
            'click a.i-action-enter': 'toggleCats',
            'keyup textarea.i-action-entry': 'catNumChange',
            'click input.i-action-noprep': 'zeroPrepLoan'
        },


        maxHeight: function() {
            return 600;
        },

        getSrchFld: function() {
            var model = this.options.close ? 'loan' : 'collectionobject';
            var fld = this.options.srchFld ? this.options.srchFld : (model == 'collectionobject' ? 'catalognumber' : 'loannumber');
            return schema.getModel(model).getField(fld);
        },

        //l10n-able stuff>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

        dlgTitle: function() {
            var tblName = this.options.close ? 'loan' : this.options.action.table;
            var tblTitle = schema.getModel(tblName).getLocalizedName();
            if (this.options.interactionresource) {
                return "Add Items";
            } else {
                return this.options.close ? tblTitle + " Return" : "Create " + tblTitle;
            }
        },
        getInvalidEntrySnagTxt: function() {
            return "Invalid:";
        },
        getMissingEntrySnagTxt: function() {
            return "Missing:";
        },
        getNoAvailablePrepsSnagTxt: function() {
            return "No preparations were found.";
        },
        getSnagDisplayHdr: function() {
            return "There are problems with the entry:";
        },
        getSnagSnubTxt: function() {
            return "Ignore and continue";
        },
        getRSCaption: function() {
            var rsCount = this.options.recordSets._totalCount;
            return "By choosing a recordset ("
                + (rsCount == 0 ? "none" : rsCount)
                + " available)";
        },
        getEntryCaption: function() {
            return "By entering " + this.getSrchFld().getLocalizedName() + "s";
        },
        getNoPrepCaption: function() {
            if (this.options.close || this.options.action.table != 'loan' || this.options.interactionresource) {
                return "";
            } else {
                return "Without preparations";
            }
        },

        //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< l10n-able stuff


        //eventhandlers and stuff >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

        toggleRs: function(evt, duration) {
            this.toggleIt('table.rs-dlg-tbl', 'div[type=action-entry]', '.i-action-rs span', '.i-action-enter span', duration);
        },

        toggleCats: function(evt, duration) {
            this.toggleIt('div[type=action-entry]', 'table.rs-dlg-tbl', '.i-action-enter span', '.i-action-rs span', duration);
        },

        toggleIcon: function(icon_selector) {
            var icon = this.$(icon_selector);
            var iconname = icon.attr('class');
            if (iconname == this.openIcon) {
                iconname = this.closeIcon;
            } else {
                iconname = this.openIcon;
            }
            icon.attr('class', iconname);
        },

        toggleIt: function(sel, otherSel, iconSel, otherIconSel, duration) {
            var ctrl = this.$(sel);
            if (ctrl.is(':hidden')) {
                var otherCtrl = this.$(otherSel + ':visible');
                if (otherCtrl.length > 0) {
                    this.toggleIcon(otherIconSel);
                    otherCtrl.toggle(typeof duration != 'undefined' ? duration : 250);
                }
            }
            this.toggleIcon(iconSel);
            ctrl.toggle(typeof duration != 'undefined' ? duration : 250);
        },

        catNumChange: function(evt) {
            this.$('button[type=i-snag-snub]').remove();
            var entry = evt.currentTarget;
            if (entry.value) {
                this.$('button[type=action-entry]').removeAttr("disabled");
            } else {
                this.$('button[type=action-entry]').attr("disabled", "true");
            }
        },

        rsSelect: function(evt) {
            var index = this.getIndex(evt, 'a.rs-select');
            var recordSet =  this.options.recordSets.at(index);
            this.interactionAction(recordSet, true);
        },

        //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< eventhandlers and stuff


        //ui element stuff >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

        makeEntryLink: function(recordSet) {
            return $('<a>').addClass("rs-select").text(recordSet.get('name'));
        },
        makeUI: function() {
            var breaker = '';
            if (this.options.recordSets._totalCount > 0) {
                this.$el.append($('<a class="i-action-rs"><span class="' + this.openIcon + '"/>' + this.getRSCaption() + '</a>'));
                this.makeTable();
                breaker = '<br><br>';
            }
            this.$el.append(breaker);
            this.$el.append($('<a class="i-action-enter"><span class="' + this.openIcon + '"/>' + this.getEntryCaption() + '</a>'));
            this.makeEntryUI();
            var noPrepCap = this.getNoPrepCaption();
            if (noPrepCap != "") {
                this.$el.append('<br><input type="button" class="i-action-noprep" value="' + noPrepCap + '"</><br>');
            }
        },
        touchUpUI: function() {
           if (this.options.recordSets._totalCount > 0) {
               this.toggleIcon('.i-action-rs span');
           }
        },
        makeEntryUI: function() {
            var html = '<div type="action-entry"'
                    + (this.options.recordSets._totalCount > 0 ? ' style="display:none"' : '')
                    + '><textarea class="i-action-entry" style="width:100%"'
                    + 'rows=5 spellcheck="false"></textarea><button disabled="true" type="action-entry">OK</button></div><br>';
            this.$el.append(html);
        },

        makeSnagList: function(hdr, snags) {
            var result = $('<div/>', {
                "class": "i-snag-list"
            });
            result.append($('<a/>', {
                "class":"i-action-ent-snag",
                html: hdr
            }));
            result.append($('<p/>', {
                html: snags.join()
            }));
            return result;
        },

        makeSnagDisplay: function(prepsData, missing, invalidEntries, action) {
            var slozzler = $('<div class="i-action-entry-snag">');
            slozzler.append('<h4>' + this.getSnagDisplayHdr() + '</h4>');
            if (invalidEntries.length > 0) {
                slozzler.append(this.makeSnagList(this.getInvalidEntrySnagTxt(), invalidEntries));
            }
            if (missing.length > 0) {
                slozzler.append(this.makeSnagList(this.getMissingEntrySnagTxt(), missing));
            }
            if (prepsData.length == 0) {
                slozzler.append('<h4>' + this.getNoAvailablePrepsSnagTxt() + '</h4>');
            } else {
                var showDlg = _.bind(this.showPrepSelectDlg, this, prepsData, action);
                var btn = $('<button/>',  {
                    html: this.getSnagSnubTxt(),
                    click: showDlg,
                    "type": "i-snag-snub"
                });
                slozzler.append(btn);
            }
            slozzler.append('<br>');
            return slozzler;
        },

        //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< ui element stuff

        parseEntry: function(entry, formatter) {
            var spaces = formatter ?
                    _.pluck(formatter.fields, "value").join('').indexOf(' ') >= 0 :
                    true; //guess that invoice numbers will have spaces.
            var commas = formatter ?
                    _.pluck(formatter.fields, "value").join('').indexOf(',') >= 0 :
                    false; //hope that invoice numbers will not have commas.
            var splitters = '\n|,| ';
            if (spaces || commas) {
                if (spaces && commas) {
                    splitters = '\n';
                } else if (spaces) {
                    splitters = '\n|,';
                }
            }
            var splittable = entry.replace(new RegExp(splitters, "g"), '\t');
            return _.filter(
                _.map(splittable.split('\t'), function(item) {
                    return item.trim();
                }),
                function(item) {
                    return item != '';
                });
        },

        processEntry: function(evt){
            this.$('div.i-action-entry-snag').remove();

            var numsCtrl = this.$('textarea.i-action-entry');
            var numEntry = numsCtrl.attr('value');
            var formatter = this.getSrchFld().getUIFormatter();
            var nums = this.parseEntry(numEntry, formatter);

            var model = this.options.close ? 'loan' : 'collectionobject';

            var validEntries = _.filter(nums, function(item) {
                return formatter ? formatter.parse(item) != null : true;
            });

            var invalidEntries = [];
            if (validEntries.length != nums.length) {
                invalidEntries = _.filter(nums, function(item) {
                    return formatter ? formatter.parse(item) == null : false;
                });
            }

            var canonicalizized = _.map(validEntries, function(entry) {
                var zized = formatter ? formatter.canonicalize([entry]) : entry;
                return {entry: entry, zized: zized};
            });
            canonicalizized = _.sortBy(canonicalizized, function(z) { return z.zized; });

            this.interactionAction(canonicalizized, false, invalidEntries);
        },


        availablePrepsReady: function(isRs, action, idFld, entries, invalidEntries, prepsData) {
            this.$('button[type=action-entry]').attr("disabled", "true");

            var missing = [];
            if (!isRs) {
                if (idFld.toLowerCase() == 'catalognumber') {
                    for (var i = 0, j = 0; i < entries.length && j < prepsData.length; i++) {
                        if (entries[i].zized != prepsData[j][0]) {
                            missing.push(entries[i].entry);
                        } else {
                            var val = prepsData[j][0];
                            while (++j < prepsData.length && prepsData[j][0] == val);
                        }
                    }
                    if (i < entries.length) {
                        missing = missing.concat(_.pluck(entries, 'entry').slice(i));
                    }
                }
            }
            if (prepsData.length == 0 || missing.length > 0 || (!isRs && invalidEntries.length > 0)) {
                this.$('textarea.i-action-entry').after(this.makeSnagDisplay(prepsData, missing, invalidEntries, action));
                return;
            } else {
                this.showPrepSelectDlg(prepsData, action);
            }
        },

        showPrepSelectDlg: function(prepsData, action) {
            this.$el.dialog('close');
            var ipreps = _.map(prepsData, function(iprepData) {
                return {catalognumber: iprepData[0],
                        taxon: iprepData[1],
                        preparationid: iprepData[2],
                        preptype: iprepData[3],
                        countamt: iprepData[4],
                        loaned: iprepData[5],
                        gifted: iprepData[6],
                        exchanged: iprepData[7],
                        available: iprepData[8]
                       };
            });
            new PrepSelectDialog({preps: ipreps,
                                  action: action,
                                  interactionresource: this.options.interactionresource,
                                  itemcollection: this.options.itemcollection
                                 }).render();
        },

        loanReturnDone: function(result) {
            var msg = s.localize("InteractionsTask.RET_LN_SV").replace('%d', result[0]);

            var huh = $("<p>").append($("<a>").text(msg));

            makeDialog(huh, {
                title: s.localize("InteractionsTask.LN_RET_TITLE"),
                maxHeight: 400,
                buttons: [
                    {text: s.localize('CLOSE'), click: function() { $(this).dialog('close'); }}
                ]
            });
        },

        zeroPrepLoan: function() {
            this.$el.dialog('close');
            var model = schema.getModel('loan');
            navigation.go(new model.Resource().viewUrl());
        },

        interactionAction: function(selection, isRs, invalidEntries) {
            if (this.options.close) {
                this.$el.dialog('close');
                var doneFunc = _.bind(this.loanReturnDone, this);
                $.post('/api/loan_return_all/', {
                    // returnedById: "", // get this from a form maybe
                    // returnedDate: "", // ditto
                    recordSetId: isRs ? selection.get('id') : undefined,
                    loanNumbers: isRs ? undefined : JSON.stringify(_.pluck(selection, 'zized'))
                }).done(doneFunc);

            } else {
                var ids = isRs ? selection : JSON.stringify(_.pluck(selection, 'zized'));
                var action = this.options.action;
                if (isRs) {
                    var prepsReady = _.bind(this.availablePrepsReady, this, true, action, 'CatalogNumber', selection, invalidEntries);
                    api.getPrepsAvailableForLoanRs(selection.get('id')).done(prepsReady);
                } else {
                    var prepsReadeye = _.bind(this.availablePrepsReady, this, false, action, 'CatalogNumber', selection, invalidEntries);
                    if (selection.length > 0) {
                        api.getPrepsAvailableForLoanCoIds('CatalogNumber', ids).done(prepsReadeye);
                    } else {
                        prepsReadeye([]);
                    }
                }
            }
        }
    });
