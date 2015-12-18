"use strict";

var _      = require('underscore');
var schema = require('./schema.js');
var api    = require('./specifyapi.js');

    var interactionBusinessRules = {
        previousReturned: [],
        previousResolved: [],
        getTotalLoaned: function(loanreturnprep) {
            if (typeof this.totalLoaned == 'undefined') {
                if (loanreturnprep.collection) {
                    this.totalLoaned = loanreturnprep.collection.related.get('quantity');
                }
            }
            return this.totalLoaned;
        },
        getTotalResolved: function(loanreturnprep) {
            //probably could just check preparation since its quantities are updated while loanreturnprep subview is open
            //But for now, iterate other returns
            return loanreturnprep.collection ? _.reduce(loanreturnprep.collection.models, function(sum, m) {
                return m.cid != loanreturnprep.cid ? sum + m.get('quantityresolved') : sum;
            }, 0) : loanreturnprep.get('quantityresolved');
        },

        checkPrepAvailability: function(interactionprep) {
            if (interactionprep && interactionprep.get('preparation')) {
                //return interactionprep.get('preparation').get('CountAmt');
                var prepuri = interactionprep.get('preparation');
                var pmod = schema.getModel('preparation');
                var prepId = pmod.Resource.fromUri(prepuri).id;
                var iprepId = interactionprep.isNew() ? undefined : interactionprep.get('id');
                var iprepName =  interactionprep.isNew() ? undefined : interactionprep.specifyModel.name;
                api.getPrepAvailability(prepId, iprepId, iprepName).done(function(available) {
                    if (typeof available != 'undefined' && Number(available[0])  < interactionprep.get('quantity')) {
                        interactionprep.set('quantity', Number(available[0]));
                    }
                });
            }
        },

        updateLoanPrep: function(loanreturnprep, collection) {
            if (collection && collection.related.specifyModel.name == 'LoanPreparation') {
                var sums = _.reduce(collection.models, function(memo, lrp) {
                    memo.returned += lrp.get('quantityreturned');
                    memo.resolved += lrp.get('quantityresolved');
                    return memo;
                }, {returned: 0, resolved: 0});
                var loanprep = collection.related;
                loanprep.set('quantityreturned', sums.returned);
                loanprep.set('quantityresolved', sums.resolved);
                loanprep.set('isresolved', sums.resolved == loanprep.get('quantity'));
            }
        }
    };

module.exports = interactionBusinessRules;

