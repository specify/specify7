"use strict";

var $ = require('jquery');
var _ = require('underscore');

var UICmd = require('./uicommand.js');
var reports = require('./reports.js');

module.exports =  UICmd.extend({
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
            $("<p>").append("Reports/Labels cannot be printed in this context.").dialog({
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
        });
    }
});
