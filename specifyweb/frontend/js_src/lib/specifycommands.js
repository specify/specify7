"use strict";

var $ = require('jquery');

var LoanReturnCmd = require('./loanreturncommand.js');
var ReportCmd = require('./reportcommand.js');
var ShowTransCmd = require('./showtranscommand.js');
var UICmd         = require('./uicommand.js');

const formsText = require('./localization/forms.tsx').default;

module.exports =  {
    ReturnLoan: LoanReturnCmd,
    generateLabelBtn: ReportCmd,
    ShowLoansBtn: ShowTransCmd,
    CommandNotAvailable: UICmd.extend({
        __name__: "UnavailableCommand",
        events: {
            'click': 'click'
        },
        render: function() {
            this.$el.attr('value', formsText('unavailableCommandButton')).prop('disabled', false);
            return this;
        },
        click: function(evt) {
            evt.preventDefault();
            $(`<div>${formsText('unavailableCommandDialogMessage')}</div>`)
                .append(`<dt>${formsText('commandName')}</dt>`)
                .append($('<dd>').text(this.init.name))
                .dialog({
                    title: formsText('unavailableCommandDialogTitle'),
                    modal: true,
                    close: function() { $(this).remove(); }
                });
        }
    })
};

