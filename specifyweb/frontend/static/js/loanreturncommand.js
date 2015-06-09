define([
    'require', 'jquery', 'underscore', 'uicommand', 'specifyapi', 'schema'
], function(require, $, _, UICmd, api, schema) {
    "use strict";

    return UICmd.extend({
        __name__: "LoanReturnCommand",
        events: {
            'click': 'click'
        },
        useAPI: false,
        prepModel: schema.getModel("preparation"),
        coModel: schema.getModel("collectionobject"),
        
        render: function() {
            if (this.model.specifyModel.name !== "Loan") {
                throw new Error("loanreturncommand can only be used with loan resources");
            }
            return this;
        },
        click: function(evt) {
            evt.preventDefault();
            var loanId = this.model.get('id');
            if (loanId) {
                var model = this.model;
                var lps;
                if (this.useAPI || !model.populated) {
                    api.getUnresolvedPrepsForLoan(loanId).done(function(lps) {
                        lps = _.map(lps, function(lp) {
                            return  {catalognumber: lp[0],
                                     taxon: lp[1],
                                     loanpreparationid: lp[2],
                                     preptype: lp[3],
                                     unresolved: lp[4]
                                    };
                        });
                    });
                } else {
                    lps = _.filter(_.map(this.model.dependentResources.loanpreparations.models, function(lp) {
                        return  {
                            catalognumber: '',
                            taxon: '',
                            loanpreparationid: lp.get('id'),
                            preptype: '',
                            unresolved: lp.get('quantity') - lp.get('quantityresolved'),
                            preparation: lp.get('preparation')
                        };
                    }), function(lp) {
                        return lp.unresolved > 0;
                    });
                }
                if (lps.length > 0) {
                    require(['prepreturndialog'], function (PrepReturnDialog) {
                        new PrepReturnDialog({ preps: lps, model: model }).render();
                    });
                } else {
                    $("<p>").append("There no unresolved preparations for this loan.").dialog({
                        modal: true,
                        width: 500,
                        title: this.$el[0].value,
                        close: function() { $(this).remove(); }
                    });
                }
            } else {
                    $("<p>").append("Preparations cannot be returned in this context.").dialog({
                        modal: true,
                        width: 500,
                        title: this.$el[0].value,
                        close: function() { $(this).remove(); }
                    });
            }
        }

    });
});
