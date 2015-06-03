define([
    'require', 'jquery', 'underscore', 'uicommand', 'specifyapi'
], function(require, $, _, UICmd, api) {
    "use strict";

    return UICmd.extend({
	__name__: "LoanReturnCommand",
	events: {
	    'click': 'click'
	},
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
		api.getUnresolvedPrepsForLoan(loanId).done(function(lps) {
		    var lpreps = _.map(lps, function(lp) {
			return  {catalognumber: lp[0],
				 taxon: lp[1],
				 loanpreparationid: lp[2],
				 preptype: lp[3],
				 unresolved: lp[4]
				};
		    });
		    require(['prepreturndialog'], function (PrepReturnDialog) {
			new PrepReturnDialog({ preps: lpreps }).render();
		    });
		});
	    }
	}
    });
});
