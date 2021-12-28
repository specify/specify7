"use strict";

import $ from 'jquery';

import UICmd from './uicommand';
import formsText from './localization/forms';

export {default as ReturnLoan} from './loanreturncommand';
export {default as generateLabelBtn} from './reportcommand';
export {default as ShowLoansBtn} from './showtranscommand';

export const CommandNotAvailable = UICmd.extend({
        __name__: "UnavailableCommand",
        events: {
            'click': 'click'
        },
        render: function() {
            this.el.textContent = formsText('unavailableCommandButton');
            this.el.disabled = false;
            return this;
        },
        click: function(evt) {
            evt.preventDefault();
            $(`<div>
                ${formsText('unavailableCommandDialogHeader')}
                <p>${formsText('unavailableCommandDialogMessage')}</p>
            </div>`)
                .append(`<dt>${formsText('commandName')}</dt>`)
                .append($('<dd>').text(this.init.name))
                .dialog({
                    title: formsText('unavailableCommandDialogTitle'),
                    modal: true,
                    close: function() { $(this).remove(); }
                });
        }
    });

