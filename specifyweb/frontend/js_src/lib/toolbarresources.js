"use strict";

const $ = require('jquery');
const commonText = require('./localization/common').default;

function execute() {
    $(`<aside class="table-list-dialog">
        ${commonText('resourcesDialogHeader')}
        <nav>
            <a href="/specify/appresources/" class="intercept-navigation">${commonText('appResources')}</a>
            <br>
            <br>
            <a href="/specify/viewsets/" class="intercept-navigation">${commonText('viewSets')}</a>
        </nav>
    </aside>`).dialog({
    modal: true,
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
