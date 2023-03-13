import _ from 'underscore';

import {idFromUrl} from './resource';
import {getPrepAvailability} from '../Interactions/helpers';
import {tables} from './tables';

export const interactionBusinessRules = {
        previousReturned: [],
        previousResolved: [],
        getTotalLoaned(loanreturnprep) {
            if (this.totalLoaned === undefined && loanreturnprep.collection) {
                    this.totalLoaned = loanreturnprep.collection.related.get('quantity');
                }
            return this.totalLoaned;
        },
        getTotalResolved(loanreturnprep) {
            /*
             * Probably could just check preparation since its quantities are updated while loanreturnprep subview is open
             * But for now, iterate other returns
             */
            return loanreturnprep.collection ? _.reduce(loanreturnprep.collection.models, (sum, m) => m.cid == loanreturnprep.cid ? sum : sum + m.get('quantityresolved'), 0) : loanreturnprep.get('quantityresolved');
        },

        checkPrepAvailability(interactionprep) {
            if (interactionprep && interactionprep.get('preparation')) {
                // Return interactionprep.get('preparation').get('CountAmt');
                const prepuri = interactionprep.get('preparation');
                const pmod = tables.Preparation;
                const prepId = idFromUrl(prepuri);
                const iprepId = interactionprep.isNew() ? undefined : interactionprep.get('id');
                const iprepName =  interactionprep.isNew() ? undefined : interactionprep.specifyTable.name;
                getPrepAvailability(prepId, iprepId, iprepName).then((available) => {
                    if (available !== undefined && Number(available[0])  < interactionprep.get('quantity')) {
                        interactionprep.set('quantity', Number(available[0]));
                    }
                });
            }
        },

        updateLoanPrep(loanreturnprep, collection) {
            if (collection && collection.related.specifyTable.name == 'LoanPreparation') {
                const sums = _.reduce(collection.models, (memo, lrp) => {
                    memo.returned += lrp.get('quantityreturned');
                    memo.resolved += lrp.get('quantityresolved');
                    return memo;
                }, {returned: 0, resolved: 0});
                const loanprep = collection.related;
                loanprep.set('quantityreturned', sums.returned);
                loanprep.set('quantityresolved', sums.resolved);
                loanprep.set('isresolved', sums.resolved == loanprep.get('quantity'));
            }
        }
    };

