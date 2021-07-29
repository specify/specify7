"use strict";

const $ = require('jquery');
const commonText = require('./localization/common').default;

function execute() {
    $(`<div>
        ${commonText('resourcesDialogHeader')}
        <nav>
            <a href="/specify/appresources/" class="intercept-navigation">${commonText('appResources')}</a>
            <br>
            <br>
            <a href="/specify/viewsets/" class="intercept-navigation">${commonText('viewSets')}</a>
        </nav>
    </div>`).dialog({
    modal: true,
    dialogClass: 'table-list-dialog',
    title: commonText('resourcesDialogTitle'),
    close: function() { $(this).remove(); },
    buttons: {
        [commonText('cancel')]: function() { $(this).dialog('close'); }
    }
});
}


module.exports = {
    task: 'resources',
    title: commonText('resources'),
    icon: null,
    execute: execute,
    disabled: user => !user.isadmin
};
