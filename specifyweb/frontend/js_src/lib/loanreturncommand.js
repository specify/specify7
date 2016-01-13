"use strict";

var $ = require('jquery');
var _ = require('underscore');

var UICmd            = require('./uicommand.js');
var schema           = require('./schema.js');
var PrepReturnDialog = require('./prepreturndialog.js');

module.exports =  UICmd.extend({
        __name__: "LoanReturnCommand",
        events: {
            'click': 'click'
        },
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
            if (!this.model.isNew() && loanId) {
                var model = this.model;
                var lps = _.filter(_.map(this.model.dependentResources.loanpreparations.models, function(lp) {
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
                if (lps.length > 0) {
                    new PrepReturnDialog({ preps: lps, model: model }).render();
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

