define(['jquery', 'loanreturncommand', 'uicommand'], function($, LoanReturnCmd, UICmd) {
    "use strict";

    return {
        ReturnLoan: LoanReturnCmd,
        CommandNotAvailable: UICmd.extend({
            __name__: "UnavailableCommand",
            events: {
                'click': 'click'
            },
            render: function() {
                this.$el.attr('value', 'Command N/A').prop('disabled', false);
                return this;
            },
            click: function(evt) {
                evt.preventDefault();
                $('<div title="Command Not Available">' +
                  'This command is currently unavailable for <i>Specify&nbsp7</i>. ' +
                  'It was probably included on this form from <i>Specify&nbsp6</i> and ' +
                  'may be supported in the future.</div>')
                    .append('<dt>Command name:</dt>')
                    .append($('<dd>').text(this.init.name))
                    .dialog({
                        modal: true,
                        close: function() { $(this).remove(); }
                    });
            }
        })
    };
});
