"use strict";

var $ = require('jquery');
var _ = require('underscore');

var schema       = require('./schema.js');
var navigation   = require('./navigation.js');
var populateForm = require('./populateform.js');
var api          = require('./specifyapi.js');
var ResourceView = require('./resourceview.js');
var FieldFormat  = require('./fieldformat.js');
var PrepDialog   = require('./prepdialog.js');
var app          = require('./specifyapp.js');

module.exports =  PrepDialog.extend({
        __name__: "PrepSelectDialog",
        className: "prepselectdialog table-list-dialog",
        events: {
            'click a.prepselect-unavailable': 'prepInteractions',
            'click :checkbox': 'prepCheck',
            'keydown .prepselect-amt': 'prepselectKeyDown'
        },
        availabilityDblChk: false,

        processInteractionsPreps: function() {
            if (!this.availabilityDblChk) {
                if (this.options.interactionresource) {
                    var pmod = schema.getModel('preparation');
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
            return '<tr><th>  </th>'
                + '<th>' + this.colobjModel.getField('catalognumber').getLocalizedName() + '</th>'
                + '<th>' + this.detModel.getField('taxon').getLocalizedName() + '</th>'
                + '<th>' + this.prepModel.getField('preptype').getLocalizedName() + '</th>'
                + '<th>' + this.getProp('InteractionsTask.Selected', 'Selected') + '</th>'
                + '<th>' + this.getProp('InteractionsTask.Available', 'Available') + '</th>'
                + '<th>' + this.getProp('InteractionsTask.Unavailable', 'Unavailable') + '</th></tr>';
        },
        getDlgTitle: function() {
            return "Preparations";
        },
        finishRender: function() {
            var spinners = this.$(".prepselect-amt");
            spinners.spinner({
                change: _.bind(function( evt ) {
                    var idx = this.$(".prepselect-amt").index(evt.currentTarget);
                    if (idx >= 0) {
                        var val = new Number($(evt.currentTarget).attr('value'));
                        var max = this.options.preps[idx].available;
                        var min = 0;
                        if (val > new Number(max)) {
                            $(evt.currentTarget).attr('value', max);
                        } else if (isNaN(val) || val < min) {
                            $(evt.currentTarget).attr('value',  min);
                        }
                        this.$(':checkbox')[idx].checked = new Number($(evt.currentTarget).attr('value')) > 0;
                    }
                }, this),
                spin: _.bind(function( evt, ui ) {
                    var idx = this.$(".prepselect-amt").index(evt.target);
                    if (idx >= 0) {
                        var val = new Number($(ui).attr('value'));
                        this.$(':checkbox')[idx].checked = val > 0;
                    }
                }, this)
            });
            spinners.width(50);
        },

        dialogEntry: function(iprep) {
            this.processInteractionsPreps();
            var unavailable = $('<td>').attr('align', 'center');
            var unavailableCnt = iprep.countamt - iprep.available;
            //if unavailable items, link to related interactions
            if (unavailableCnt != 0) {
                unavailable.append($('<a>').text(unavailableCnt).addClass('prepselect-unavailable'));
            } else {
                unavailable.append(unavailableCnt).addClass('prepselect-unavailable');
            }
            var entry = $('<tr>').append(
                $('<td>').append($('<input>').attr('type', 'checkbox')),
                $('<td>').append(FieldFormat(this.colobjModel.getField('catalognumber'), iprep.catalognumber)),
                $('<td>').append(iprep.taxon),
                $('<td>').attr('align', 'center').append(iprep.preptype),
                $('<td>').append($('<input>').attr('align', 'right').attr('value', '0').attr('max', iprep.available).attr('min', 0).addClass('prepselect-amt')),
                $('<td>').attr('align', 'center').append(iprep.available).addClass('prepselect-available'),
                unavailable);
            return [entry];
        },

        buttons: function() {
            var buttons = this.options.readOnly ? [] : [
                { text: this.getProp('SELECTALL'), click: _.bind(this.selectAll, this),
                  title: 'Select all available preparations.' },
                { text: this.getProp('DESELECTALL'), click: _.bind(this.deSelectAll, this),
                  title: 'Clear all.' },
                { text: 'OK', click: _.bind(this.makeInteraction, this),
                  title: this.options.interactionresource ? 'Add items' : 'Create ' + this.getTextForObjToCreate() }
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
                html: model.getLocalizedName() + ": " + interaction.visibleKey,
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

        prepselectKeyDown: function( evt, a, b) {
            if (isNaN(String.fromCharCode(evt.which))) {
                evt.preventDefault();
            }
        },

        prepCheck: function( evt ) {
            var idx = this.$(':checkbox').index( evt.target );
            var available = this.options.preps[idx].available;
            if (available <= 0) {
                evt.preventDefault();
            } else {
                if (evt.target.checked) {
                    $(this.$('.prepselect-amt')[idx]).attr('value', this.options.preps[idx].available);
                } else {
                    $(this.$('.prepselect-amt')[idx]).attr('value', 0);
                }
            }
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
                api.getInteractionsForPrepIds(prepId).done(over);
            }
        },

        selectAll: function() {
            var amounts = this.$(':input.prepselect-amt');
            var chks = this.$(':checkbox');
            for (var p=0; p < amounts.length; p++) {
                $(amounts[p]).attr('value', this.options.preps[p].available );
                $(chks[p]).attr('checked', this.options.preps[p].available  > 0);
            };
        },

        deSelectAll: function() {
            this.$(':input.prepselect-amt').attr('value', 0);
            this.$(':checkbox').attr('checked', false);
        },

        //<<<<<<<<<<<<<<<<<<<<<<< events


        prepIactionDlg: function(model, key) {
            var irec = new model.LazyCollection({
                filters: { id: key }
            });
            var _self = this;
            irec.fetch().done(function(arg) {
                this.dialog = $('<div>', {'class': 'querycbx-dialog-display'});

                var resourceModel = new model.Resource(arg.objects[0]);

                new ResourceView({
                    populateForm: populateForm,
                    el: this.dialog,
                    model: resourceModel,
                    mode: 'view',
                    noHeader: false
                }).render();

                var _this = _self;
                this.dialog.dialog({
                    position: { my: "left top", at: "left+20 top+20", of: $('#content') },
                    width: 'auto',
                    close: function() { $(this).remove(); _this.dialog = null; },
                    modal: true
                }).parent().delegate('.ui-dialog-title a', 'click', function(evt) {
                    evt.preventDefault();
                    navigation.go(resourceModel.viewUrl());
                    _this.dialog.dialog('close');
                });

                $('<a>', { href: resourceModel.viewUrl() })
                    .addClass('intercept-navigation')
                    .append('<span class="ui-icon ui-icon-link">link</span>')
                    .prependTo(this.dialog.closest('.ui-dialog').find('.ui-dialog-titlebar:first'));
            });
        },

        makeInteractionPrep: function(baseTbl, itemModel, iprep, amt) {
            var result = new itemModel.Resource();
            result.initialize();
            var pmod = schema.getModel('preparation');
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
                var baseModel = schema.getModel(baseTbl);
                interaction = new baseModel.Resource();
                interaction.initialize();
            }
            var itemModelName = baseTbl + 'preparation';
            var itemModel = schema.getModel(itemModelName);
            var items = [];
            var amounts = this.$(':input.prepselect-amt');

            for (var p=0; p < this.options.preps.length; p++) {
                var amt = $(amounts[p]).attr('value');
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
                app.showResource(interaction, null, true);
            }
        }
    });
