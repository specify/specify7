"use strict";
import {schema} from './schema';
import {interactionBusinessRules} from './interactionbusinessrules';

export const businessRuleDefs = Object.freeze({
        Accession: {
            uniqueIn: {
                accessionnumber: 'division'
            }
        },
        AccessionAgent: {
            uniqueIn: {
                role: [{field: 'accession', otherfields: ['agent']}, {field: 'repositoryagreement', otherfields: ['agent']}],
                agent: [{field: 'accession', otherfields: ['role']}, {field: 'repositoryagreement', otherfields: ['role']}]
            }
        },
        Appraisal: {
            uniqueIn: {
                appraisalnumber: 'accession'
            }
        },
        Author: {
            uniqueIn: {
                agent: 'referencework'
            }
        },
        BorrowAgent: {
            uniqueIn: {
                role: {field: 'borrow', otherfields: ['agent']},
                agent: {field: 'borrow', otherfields: ['role']}
            }
        },
        BorrowMaterial: {
            customChecks: {
                quantityreturned: function(borrowmaterial) {
                    var returned = borrowmaterial.get('quantityreturned');
                    var newval;
                    if (returned > borrowmaterial.get('quantity')) {
                        /*return {
                         valid: false,
                         reason: 'value must be < ' + borrowmaterial.get('quantity')
                         };*/
                        newval = borrowmaterial.get('quantity');
                    }
                    if (returned > borrowmaterial.get('quantityresolved')) {
                        /*return {
                         valid: false,
                         reason: 'quantity returned must be less than or equal to quantity resolved'
                         };*/
                        newval = borrowmaterial.get('quantityresolved');
                    }
                    newval && borrowmaterial.set('quantityreturned', newval);
                },
                quantityresolved: function(borrowmaterial) {
                    var resolved = borrowmaterial.get('quantityresolved');
                    var newval;
                    if (resolved > borrowmaterial.get('quantity')) {
                        /*return {
                         valid: false,
                         reason: 'value must be < ' + borrowmaterial.get('quantity')
                         };*/
                        newval = borrowmaterial.get('quantity');
                    }
                    if (resolved < borrowmaterial.get('quantityreturned')) {
                        /*return {
                         valid: false,
                         reason: 'quantity resolved must be greater than or equal to quantity returned'
                         };*/
                        newval = borrowmaterial.get('quantityreturned');
                    }
                    newval && borrowmaterial.set('quantityresolved', newval);
                }
            }
        },
        Collection: {
            uniqueIn: {
                name: 'discipline'
            }
        },
        CollectingEvent: {
        },
        CollectionObject: {
            uniqueIn: {
                catalognumber: 'collection'
            },
            customInit: function(collectionObject) {
                var ceField = collectionObject.specifyModel.getField('collectingevent');
                if (ceField.isDependent() && collectionObject.get('collectingevent') == null) {
                    collectionObject.set('collectingevent', new schema.models.CollectingEvent.Resource());
                }
            }
        },
        Collector: {
            uniqueIn: {
                agent: 'collectingevent'
            }
        },
        Determination: {
            onRemoved: function(det, detCollection) {
                // Example usage:
                // if (detCollection.related.specifyModel.name == 'CollectionObject') {
                //     var collectionobject = detCollection.related;
                //     console.log("removed determination", det, "from collection object", collectionobject);
                // }
            },
            onAdded: function(det, detCollection) {
                // Example usage:
                // if (detCollection.related.specifyModel.name == 'CollectionObject') {
                //     var collectionobject = detCollection.related;
                //     console.log("added determination", det, "to collection object", collectionobject);
                // }
            },
            customInit: function(determination) {
                if (determination.isNew()) {
                    const setCurrent = function() {
                        determination.set('iscurrent', true);
                        if (determination.collection != null) {
                            determination.collection.each(function(other) {
                                if (other.cid !== determination.cid) {
                                    other.set('iscurrent', false);
                                }
                            });
                        }
                    };
                    if (determination.collection != null) setCurrent();
                    determination.on('add', setCurrent);
                }
            },
            customChecks: {
                taxon: determination => determination.rget('taxon', true).then(
                    taxon => taxon == null ?
                        { valid: true, action() { determination.set('preferredtaxon', null); }}
                    : (function recur(taxon) {
                        return taxon.get('acceptedtaxon') != null ?
                            taxon.rget('acceptedtaxon', true).then(recur)
                            : { valid: true, action() { determination.set('preferredtaxon', taxon); }};
                    })(taxon)),

                iscurrent: function(determination) {
                    if (determination.get('iscurrent') && (determination.collection != null)) {
                        determination.collection.each(function(other) {
                            if (other.cid !== determination.cid) {
                                other.set('iscurrent', false);
                            }
                        });
                    }
                    if (determination.collection != null && !determination.collection.any(c => c.get('iscurrent'))) {
                        determination.set('iscurrent', true);
                    }
                    return {valid: true};
                }
            }
        },
        Discipline: {
            uniqueIn: {
                name: 'division'
            }
        },
        Division: {
            uniqueIn: {
                name: 'institution'
            }
        },
        Gift: {
            uniqueIn: {
                giftnumber: 'discipline'
            }
        },
        GiftAgent: {
            uniqueIn: {
                role: {field: 'gift', otherfields: ['agent']},
                agent: {field: 'gift', otherfields: ['role']}
            }
        },
        GiftPreparation: {
            customChecks: {
                quantity: function(iprep) {
                    interactionBusinessRules.checkPrepAvailability(iprep);
                }
            }
        },
        Institution: {
            unique: ['name']
        },
        Loan: {
            uniqueIn: {
                loannumber: 'discipline'
            }
        },
        LoanAgent: {
            uniqueIn: {
                role: {field: 'loan', otherfields: ['agent']},
                agent: {field: 'loan', otherfields: ['role']}
            }
        },
        /* might be able to use something like this to check when form is loaded after add-items or create-new for invalid amounts due to
         changes in other sessions */
        LoanPreparation: {
            customChecks:  {
                quantity: function(iprep) {
                    interactionBusinessRules.checkPrepAvailability(iprep);
                }
            }

        },
        LoanReturnPreparation: {
            onRemoved: function(loanreturnprep, collection) {
                interactionBusinessRules.updateLoanPrep(loanreturnprep, collection);
            },
            customInit: function(loanreturnprep) {
                interactionBusinessRules.totalLoaned = undefined;
                interactionBusinessRules.totalResolved = undefined;
                interactionBusinessRules.returned = undefined;
                interactionBusinessRules.resolved = undefined;
                loanreturnprep.get('quantityreturned') == null && loanreturnprep.set('quantityreturned', 0);
                loanreturnprep.get('quantityresolved') == null && loanreturnprep.set('quantityresolved', 0);
            },
            customChecks: {
                quantityreturned: function(loanreturnprep) {
                    var returned = loanreturnprep.get('quantityreturned');
                    var previousReturned = interactionBusinessRules.previousReturned[loanreturnprep.cid]
                            ? interactionBusinessRules.previousReturned[loanreturnprep.cid]
                            : 0;
                    if (returned != previousReturned) {
                        var delta = returned - previousReturned;
                        var resolved = loanreturnprep.get('quantityresolved');
                        var totalLoaned = interactionBusinessRules.getTotalLoaned(loanreturnprep);
                        var totalResolved = interactionBusinessRules.getTotalResolved(loanreturnprep);
                        var max = totalLoaned - totalResolved;
                        if (delta + resolved > max) {
                            loanreturnprep.set('quantityreturned', previousReturned);
                        } else {
                            resolved = loanreturnprep.get('quantityresolved') + delta;
                            interactionBusinessRules.previousResolved[loanreturnprep.cid] = resolved;
                            loanreturnprep.set('quantityresolved', resolved);
                        }
                        interactionBusinessRules.previousReturned[loanreturnprep.cid] = loanreturnprep.get('quantityreturned');
                        interactionBusinessRules.updateLoanPrep(loanreturnprep, loanreturnprep.collection);
                    }
                },
                quantityresolved: function(loanreturnprep) {
                    var resolved = loanreturnprep.get('quantityresolved');
                    var previousResolved = interactionBusinessRules.previousResolved[loanreturnprep.cid]
                            ? interactionBusinessRules.previousResolved[loanreturnprep.cid]
                            : 0;
                    if (resolved != previousResolved) {
                        var returned = loanreturnprep.get('quantityreturned');
                        var totalLoaned = interactionBusinessRules.getTotalLoaned(loanreturnprep);
                        var totalResolved = interactionBusinessRules.getTotalResolved(loanreturnprep);
                        var max = totalLoaned - totalResolved;
                        if (resolved > max) {
                            loanreturnprep.set('quantityresolved', previousResolved);
                        }
                        if (resolved < returned) {
                            interactionBusinessRules.previousReturned[loanreturnprep.cid] = resolved;
                            loanreturnprep.set('quantityreturned', resolved);
                        }
                        interactionBusinessRules.previousResolved[loanreturnprep.cid] = loanreturnprep.get('quantityresolved');
                        interactionBusinessRules.updateLoanPrep(loanreturnprep, loanreturnprep.collection);
                    }
                }
            }
        },
        Permit: {
            unique: ['permitnumber']
        },
        Picklist: {
            uniqueIn: {
                name: 'collection'
            }
        },
        PrepType: {
            uniqueIn: {
                name: 'collection'
            }
        },
        RepositoryAgreement: {
            uniqueIn: {
                repositoryagreementnumber: 'division',
                role: {field: 'borrow', otherfields: ['agent']},
                agent: {field: 'borrow', otherfields: ['role']}
            }
        }
    });
