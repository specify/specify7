"use strict";

import $ from 'jquery';
import _ from 'underscore';

import {getModel} from './schema';
import {
  getPrepsAvailableForLoanCoIds,
  getPrepsAvailableForLoanRs,
  makeResourceViewUrl
} from './specifyapi';
import RecordSetsDialog from './recordsetsdialog';
import PrepSelectDialog from './prepselectdialog';
import * as navigation from './navigation';
import * as s from './stringlocalization';
import formsText from './localization/forms';
import {legacyNonJsxIcons} from './components/icons';
import {showDialog} from './components/modaldialog';
import commonText from './localization/common';


export default RecordSetsDialog.extend({
        __name__: "InteractionDialog",
        events: {
            'click a.rs-select': 'rsSelect',
            'click button.action-entry': 'processEntry',
            'click button.i-action-rs': 'toggleRs',
            'click button.i-action-enter': 'toggleCats',
            'keyup textarea.i-action-entry': 'catNumChange',
            'click button.i-action-noprep': 'zeroPrepLoan',
            'click button.i-action-noco': 'zeroCoPrep'
        },


        maxHeight: function() {
            return 600;
        },

        getSrchFld: function() {
            var model = this.options.close ? 'loan' : 'collectionobject';
            var fld = this.options.srchFld ? this.options.srchFld : (model == 'collectionobject' ? 'catalognumber' : 'loannumber');
            return getModel(model).getField(fld);
        },

        //l10n-able stuff>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

        dlgTitle: function() {
            var tblName = this.options.close ? 'loan' : this.options.action.table;
            var tblTitle = getModel(tblName).label;
            if (this.options.interactionresource) {
                return formsText('addItems');
            } else {
                return this.options.close ?
                  formsText('recordReturn')(tblTitle):
                  formsText('createRecord')(tblTitle);
            }
        },
        getNoPrepCaption: function() {
            return this.options.close || this.options.action.table != 'loan' || this.options.interactionresource ?
               '' :
              formsText('noPreparationsCaption');
        },
        getNoCOCaption: function() {
            return this.options.interactionresource ?
                formsText('noCollectionObjectCaption') :
                '';
        },

        //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< l10n-able stuff


        //eventhandlers and stuff >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

        toggleRs: function(_evt, duration) {
            this.toggleIt('table.rs-dlg-tbl', 'div.action-entry', '.i-action-rs span', '.i-action-enter span', duration);
        },

        toggleCats: function(_evt, duration) {
            this.toggleIt('div.action-entry', 'table.rs-dlg-tbl', '.i-action-enter span', '.i-action-rs span', duration);
        },

        toggleIcon: function(icon_selector) {
            var icon = this.$(icon_selector);
            var iconname = icon.attr('class');
            if(icon[0].classList.contains('icon-open')){
              icon[0].classList.remove('icon-open');
              icon[0].classList.add('icon-closed');
              icon[0].innerHTML = legacyNonJsxIcons.minusCircle;
            }
            else {
              icon[0].classList.remove('icon-open');
              icon[0].classList.add('icon-closed');
              icon[0].innerHTML = legacyNonJsxIcons.plusCircle;
            }
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
                this.$('button.action-entry').removeAttr("disabled");
            } else {
                this.$('button.action-entry').attr("disabled", "true");
            }
        },

        rsSelect: function(event) {
            event.preventDefault();
            var index = this.getIndex(event, 'a.rs-select');
            var recordSet =  this.options.recordSets.at(index);
            this.interactionAction(recordSet, true);
        },

        //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< eventhandlers and stuff


        //ui element stuff >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

        makeUI: function() {
            var breaker = '';
            if (this.options.recordSets._totalCount > 0) {
                this.$el.append($(`<button class="i-action-rs link" type="button">
                    <span class="icon icon-open">${legacyNonJsxIcons.minusCircle}</span>
                    ${formsText('recordSetCaption')(this.options.recordSets._totalCount)}
                </button>`));
                this.makeTable();
                breaker = '<br><br>';
            }
            this.$el.append(breaker);
            this.$el.append($(`<button class="i-action-enter link" type="button">
                <span class="icon icon-open">${legacyNonJsxIcons.minusCircle}</span>
                ${formsText('entryCaption')(this.getSrchFld().label)}
            </button>`));
            this.makeEntryUI();
            var noPrepCap = this.getNoPrepCaption();
            if (noPrepCap != "")
                this.$el.append(`
                    <br>
                    <button
                        type="button"
                        class="button i-action-noprep"
                    >
                        ${noPrepCap}
                    </button>
                    <br>
                `);
            if (this.options.interactionresource)
              this.$el.append(`
                  <br>
                  <button
                      type="button"
                      class="button i-action-noco"
                  >
                      ${this.getNoCOCaption()}
                  </button>
                  <br>
              `);
        },
        makeEntryUI: function() {
            this.$el.append(`<div class="action-entry"
                ${this.options.recordSets._totalCount > 0 ? ' style="display:none"' : ''}
            >
                <textarea class="i-action-entry w-full" rows=5 spellcheck="false"></textarea>
                <button
                    class="action-entry"
                    type="button"
                    disabled
                >${commonText('next')}</button>
            </div><br>`);
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
            slozzler.append(`<h4>${formsText('problemsFound')}</h4>`);
            if (invalidEntries && invalidEntries.length > 0) {
                slozzler.append(this.makeSnagList(formsText('invalid'), invalidEntries));
            }
            if (missing.length > 0) {
                slozzler.append(this.makeSnagList(formsText('missing'), missing));
            }
            if (prepsData.length == 0) {
                slozzler.append(`<h4>${formsText('preparationsNotFound')}</h4>`);
            } else {
                var showDlg = _.bind(this.showPrepSelectDlg, this, prepsData, action);
                var btn = $('<button/>',  {
                    html: formsText('ignoreAndContinue'),
                    click: showDlg,
                    class: "i-snag-snub",
                    type: 'button',
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

        processEntry: function(){
            this.$('div.i-action-entry-snag').remove();

            var numsCtrl = this.$('textarea.i-action-entry');
            var numEntry = numsCtrl.val();
            var formatter = this.getSrchFld().getUiFormatter();
            var nums = this.parseEntry(numEntry, formatter);

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
            this.$('button.action-entry').attr("disabled", "true");

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
            if (prepsData.length == 0) {
                if ("unassociated item" == action && this.options.interactionresource) {
                    console.info("adding uncataloged co");
                    var itemModelName = this.options.interactionresource.specifyModel.name + "preparation";
                    var itemModel = getModel(itemModelName);
                    var item = new itemModel.Resource();
                    item.initialize();
                    if (this.options.interactionresource.specifyModel.name == "Loan") {
                        item.set('quantityReturned', 0);
                        item.set('quantityResolved', 0);
                    }
                    this.options.itemcollection.add([item]);
                } else {
                    this.$('textarea.i-action-entry').parent().after(this.makeSnagDisplay(prepsData, missing, invalidEntries, action));
                }
            } else {
                this.showPrepSelectDlg(prepsData, action);
            }
        },

        showPrepSelectDlg: function(prepsData, action) {
            this.dialog.remove();
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
            const msg = s.localize("InteractionsTask.RET_LN_SV").replace('%d', result[0]);

            this.dialog?.remove();
            this.dialog = showDialog({
                header: s.localize("InteractionsTask.LN_RET_TITLE"),
                content: $("<p>").append($("<a>").text(msg)),
                onClose: () => this.dialog.remove(),
                buttons: commonText('close'),
            });
        },

        zeroPrepLoan: function() {
            this.dialog.remove();
            navigation.go(makeResourceViewUrl('loan'));
        },

        zeroCoPrep: function() {
            this.dialog.remove();
            this.availablePrepsReady(false, "unassociated item", "none", [], [], []);
        },

        interactionAction: function(selection, isRs, invalidEntries) {
            if (this.options.close) {
                this.dialog.remove();
                var doneFunc = _.bind(this.loanReturnDone, this);
                $.post('/interactions/loan_return_all/', {
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
                    getPrepsAvailableForLoanRs(selection.get('id')).then(prepsReady);
                } else {
                    var prepsReadeye = _.bind(this.availablePrepsReady, this, false, action, 'CatalogNumber', selection, invalidEntries);
                    if (selection.length > 0) {
                        getPrepsAvailableForLoanCoIds('CatalogNumber', ids).then(prepsReadeye);
                    } else {
                        prepsReadeye([]);
                    }
                }
            }
        }
    });
