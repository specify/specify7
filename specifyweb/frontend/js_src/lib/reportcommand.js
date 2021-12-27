"use strict";

import $ from 'jquery';

import UICmd from './uicommand';
import reports from './reports';
import formsText from './localization/forms';

export default UICmd.extend({
    __name__: "ReportCommand",
    events: {
        'click': 'click'
    },
    initialize({populateForm}) {
        this.populateForm = populateForm;
    },
    click: function(evt) {
        evt.preventDefault();
        if (this.model.isNew() || this.model.get('id') == null) {
            $("<p>").append(formsText('reportsCanNotBePrintedDialogMessage')).dialog({
                modal: true,
                width: 500,
                title: this.$el[0].value,
                close: function() { $(this).remove(); }
            });
            return;
        };

        reports({
            tblId: this.model.specifyModel.tableId,
            recordToPrintId: this.model.get('id'),
            autoSelectSingle: true
        }).then(view=>view.render());
    }
});
