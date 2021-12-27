"use strict";

import $ from 'jquery';

import UICmd from './uicommand';
import PrepReturnDialog from './prepreturndialog';
import formsText from './localization/forms';

export default UICmd.extend({
    __name__: "LoanReturnCommand",
    events: {
        'click': 'click'
    },
    initialize({populateForm}) {
        this.populateForm = populateForm;
    },
    render: function() {
        if (this.model.specifyModel.name !== "Loan") {
            throw new Error("loanreturncommand can only be used with loan resources");
        }
        return this;
    },
    click: function(evt) {
        evt.preventDefault();
        if (this.model.isNew() || this.model.get('id') == null) {
            $("<p>").append(formsText('preparationsCanNotBeReturned')).dialog({
                modal: true,
                width: 500,
                title: this.$el[0].value,
                close: function() { $(this).remove(); }
            });
            return;
        };

        this.model.rget('loanpreparations', true)
            .pipe(lps => lps.filter(lp => lp.get('quantity') - lp.get('quantityresolved') > 0))
            .done(lps => {
                if (lps.length > 0) {
                    new PrepReturnDialog({ populateForm: this.populateForm, loanpreparations: lps }).render();
                } else {
                    $("<p>").append(formsText('noUnresolvedPreparations')).dialog({
                        modal: true,
                        width: 500,
                        title: this.$el[0].value,
                        close: function() { $(this).remove(); }
                    });
                }
            });
    }
});

