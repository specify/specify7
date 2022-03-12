"use strict";

import $ from 'jquery';
import _ from 'underscore';

import {getModel, schema} from './schema';
import * as navigation from './navigation';
import {getInteractionsForPrepIds} from './specifyapi';
import {showResource, ViewResource} from './components/resourceview';
import PrepDialog from './prepdialog';
import formsText from './localization/forms';
import commonText from './localization/common';
import {legacyNonJsxIcons} from './components/icons';
import {fieldFormat} from "./uiparse";
import specifyform from './specifyform';
import {f} from './wbplanviewhelper';

export default PrepDialog.extend({
        __name__: "PrepSelectDialog",
        events: {
            'click button.prepselect-unavailable': 'prepInteractions',
            'click :checkbox': 'prepCheck',
            'change .prepselect-amt': 'spun',
        },
        availabilityDblChk: false,

        processInteractionsPreps: function() {
            if (!this.availabilityDblChk) {
                if (this.options.interactionresource) {
                    var pmod = schema.models.Preparation;
                    var idxpreps = _.groupBy(this.options.preps, function(prep) {
                        return (new pmod.Resource({id: prep.preparationid})).url();
                    });
                    var items = this.options.itemcollection.models;
                     _.each(items, function(prep) {
                         if (prep.isNew()) {
                             var idxprep = idxpreps[prep.get('preparation')];
                             if (idxprep) {
                                 var resolved = prep.get('quantityresolved');
                                 if (_.isNull(resolved) || typeof resolved == 'undefined') resolved = 0;
                                 idxprep[0].available -= prep.get('quantity') - resolved;
                             }
                         }
                    });
                }
                this.availabilityDblChk = true;
            }
        },

        //ui elements stuff >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

        getTblHdr: function() {
            return `<thead>
                <tr>
                    <td></td>
                    <th scope="col">${this.colobjModel.getField('catalognumber').label}</th>
                    <th scope="col">${this.detModel.getField('taxon').label}</th>
                    <th scope="col">${this.prepModel.getField('preptype').label}</th>
                    <th scope="col">${this.getProp('InteractionsTask.Selected', 'Selected')}</th>
                    <th scope="col">${this.getProp('InteractionsTask.Available', 'Available')}</th>
                    <th scope="col">${this.getProp('InteractionsTask.Unavailable', 'Unavailable')}</th>
                </tr>
            </thead>`;
        },

        dialogEntry: function(iprep) {
            this.processInteractionsPreps();
            var unavailable = $('<td>').attr('align', 'center');
            var unavailableCnt = iprep.countamt - iprep.available;
            //if unavailable items, link to related interactions
            if (unavailableCnt != 0) {
                unavailable.append($('<button>',{type: 'button', class: 'link'}).text(unavailableCnt).addClass('prepselect-unavailable'));
            } else {
                unavailable.append(unavailableCnt).addClass('prepselect-unavailable');
            }
            var entry = $('<tr>').append(
                $('<td>').append($('<input>').attr('type', 'checkbox').attr('title',formsText('selectAll')).attr('aria-label',formsText('selectAll'))),
                $('<td>').append(fieldFormat(this.colobjModel.getLiteralField('catalognumber'), undefined, iprep.catalognumber)),
                $('<td>').append(iprep.taxon),
                $('<td>').attr('align', 'center').append(iprep.preptype),
                $('<td>').append($('<input type="number">')
                    .attr('class', 'specify-field')
                    .attr('value', '0')
                    .attr('title',formsText('selectedAmount'))
                    .attr('aria-label',formsText('selectedAmount'))
                    .attr('max', iprep.available)
                    .attr('min', 0)
                    .addClass('prepselect-amt')),
                $('<td>').attr('align', 'center').append(iprep.available).addClass('prepselect-available'),
                unavailable);
            return [entry];
        },

        buttons: function() {
            var buttons = this.options.readOnly ? [] : [
                { text: this.getProp('SELECTALL'), click: _.bind(this.selectAll, this),
                  title: formsText('selectAllAvailablePreparations') },
                { text: this.getProp('DESELECTALL'), click: _.bind(this.deSelectAll, this),
                  title: commonText('clearAll') },
                { text: commonText('apply'), click: _.bind(this.makeInteraction, this),
                  title: this.options.interactionresource ? formsText('addItems') : formsText('createRecord')(this.getTextForObjToCreate()) }
            ];
            buttons.push({ text: this.getProp('CANCEL'), click: function() { $(this).dialog('close'); }});
            return buttons;
        },

        getTextForObjToCreate: function() {
            //need to be nicer
            return this.options.action.attr('action');
        },

        prepInteractionAnchor: function(model, interaction) {
            return $('<a/>', {
                html: model.label + ": " + interaction.visibleKey,
                click: _.bind(this.prepIactionDlg, this, model, interaction.key)
            });
        },

        getPrepInteractions: function(loans, gifts, exchs) {
            var result =  $('<div class="prep-i-actions">');
            var pAnch = _.bind(this.prepInteractionAnchor, this);
            var lm = this.loanModel, gm = this.giftModel, em = this.exchModel;
            _.each(loans, function(item) {
                result.append($('<tr>').append('<td>').append(pAnch(lm, item)));
            });
            _.each(gifts, function(item) {
                result.append($('<tr>').append('<td>').append(pAnch(gm, item)));
            });
            _.each(exchs, function(item) {
                result.append($('<tr>').append('<td>').append(pAnch(em, item)));
            });
            return result;
        },

        //<<<<<<<<<<<<<<<<<<<< ui elements stuff

        //events >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

    spun({target}) {
        const row = target.closest('tr');
        const checkbox = row.querySelector('input[type="checkbox"]');
        checkbox.checked = Number.parseInt(target.value) > 0;
    },

        prepCheck({target}) {
            const row = target.closest('tr');
            const index = Array.from(row.parentElement.children).indexOf(row);
            const input = row.querySelector('.prepselect-amt');
            const available = Math.max(0,this.options.preps[index].available);
            input.value = target.checked ? available : 0;
        },

        prepInteractions: function(evt) {
            if (evt.currentTarget.nextSibling != null) {
                $(evt.currentTarget.nextSibling).remove();
            } else {
                var idx = this.$(".prepselect-unavailable").index(evt.currentTarget);
                var prepId = this.options.preps[idx].preparationid;
                var parsePrepUse = function(p) {
                    if (p) {
                        return _.map(p.split(','), function(o){
                            var s = o.split('>|<');
                            return {key: s[0], visibleKey: s[1]};
                        });
                    } else {
                        return null;
                    }
                };
                var prepias = _.bind(this.getPrepInteractions, this);
                var over = _.bind(function(result){
                    var loans = parsePrepUse(result[0][1]);
                    var gifts = parsePrepUse(result[0][2]);
                    var exchs = parsePrepUse(result[0][3]);
                    var count = ((loans != null) ? loans.length : 0)
                            + ((gifts != null) ? gifts.length : 0)
                            + ((exchs != null) ? exchs.length : 0);
                    if (count > 1) {
                        var pias = prepias(loans, gifts, exchs);
                        $(evt.currentTarget).after(pias);
                    } else {
                        var single =  loans != null ? loans : gifts != null ? gifts : exchs;
                        var m =  loans != null ? this.loanModel : gifts != null ? this.giftModel : this.exchModel;
                        _.bind(this.prepIactionDlg, this)(m, single[0].key);
                    }
                }, this);
                getInteractionsForPrepIds(prepId).then(over);
            }
        },

        selectAll: function() {
            var amounts = this.$(':input.prepselect-amt');
            var chks = this.$(':checkbox');
            for (var p=0; p < amounts.length; p++) {
                amounts[p].value = this.options.preps[p].available ;
                chks[p].checked = (this.options.preps[p].available  > 0);
            };
        },

        deSelectAll: function() {
            //this.$(':input.prepselect-amt').attr('value', 0);
            //this.$(':checkbox').attr('checked', false);
            var amounts = this.$(':input.prepselect-amt');
            for (var p=0; p < amounts.length; p++) {
                amounts[p].value = 0;
            }
            this.$(':checkbox').attr('checked',  false);
        },

        //<<<<<<<<<<<<<<<<<<<<<<< events


        prepIactionDlg: function(model, key) {
            var irec = new model.LazyCollection({
                filters: { id: key }
            });
            var _self = this;
            irec.fetch().done(function() {
                this.dialog = $('<div>', {'class': 'querycbx-dialog-display'});

                var resourceModel = irec.models[0];

                const view = new ViewResource({
                    buildView: async ()=> specifyform.buildViewByName(resourceModel.specifyModel.view, 'form', 'view'),
                    el: this.dialog,
                    resource: resourceModel,
                    canAddAnother: true,
                    onSaved: f.void,
                    onClose: ()=>view.remove(),
                }).render();

                var _this = _self;
                this.dialog.dialog({
                    position: { my: "left top", at: "left+20 top+20", of: $('main') },
                    width: 'auto',
                    close: function() { $(this).remove(); _this.dialog = null; },
                    modal: true
                }).parent().delegate('.ui-dialog-title a', 'click', function(evt) {
                    evt.preventDefault();
                    navigation.go(resourceModel.viewUrl());
                    _this.dialog.dialog('close');
                });

                $('<a>', { href: resourceModel.viewUrl(), title: formsText('linkInline'), ariaLabel: formsText('linkInline'), })
                    .addClass('intercept-navigation')
                    .append(legacyNonJsxIcons.link)
                    .prependTo(this.dialog.closest('.ui-dialog').find('.ui-dialog-titlebar:first'));
            });
        },

        makeInteractionPrep: function(baseTbl, itemModel, iprep, amt) {
            var result = new itemModel.Resource();
            result.initialize();
            var pmod = schema.models.Preparation;
            var purl = (new pmod.Resource({id: iprep.preparationid})).url();
            result.set('preparation', purl);
            result.set('quantity', Number(amt));
            if (baseTbl == 'loan') {
                result.set('quantityReturned', 0);
                result.set('quantityResolved', 0);
            }
            return result;
        },

        processPrep: function(baseTbl, itemModel, iprep, amt) {
            var prep;
            //could combine loan preps for the same prep here...
            /*if (this.options.interactionresource) {
                prep =  _.filter(this.getPreps(this.options.interactionresource), function(prep) {
                    return prep.getpreparationId() == iprep.preparationid;
                });
            }*/
            if (!prep) {
                prep = this.makeInteractionPrep(baseTbl, itemModel, iprep, amt);
            }
            return prep;
        },

        makeInteraction: function() {
            //console.info('creating obj for ' + this.options.action.attr('action'));
            var baseTbl = this.options.action.table;
            var interaction;
            if (this.options.interactionresource) {
                interaction = this.options.interactionresource;
            } else {
                var baseModel = getModel(baseTbl);
                interaction = new baseModel.Resource();
                interaction.initialize();
            }
            var itemModelName = baseTbl + 'preparation';
            var itemModel = getModel(itemModelName);
            var items = [];
            var amounts = this.$(':input.prepselect-amt');

            for (var p=0; p < this.options.preps.length; p++) {
                var amt = amounts[p].value;
                if ('0' != amt && '' != amt) {
                    items[items.length] = this.processPrep(baseTbl, itemModel, this.options.preps[p], amt);
                }
            }

            this.$el.dialog('close');
            if (this.options.interactionresource) {
                this.options.itemcollection.add(items);
            } else {
                interaction.set(itemModelName + 's', items);
                interaction.set('isclosed', false);
                showResource(interaction, null, true);
            }
        }
    });
