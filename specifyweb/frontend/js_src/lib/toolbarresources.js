"use strict";

const $ = require('jquery');
const commonText = require('./localization/common.tsx').default;

function execute() {
    $(`
<div class="table-list-dialog">
<table>
<tr><td><a href="/specify/appresources/" class="intercept-navigation">${commonText('appResources')}</a></td></tr>
<tr><td><a href="/specify/viewsets/" class="intercept-navigation">${commonText('viewSets')}</a></td></tr>
</table>
</div>
`).dialog({
    modal: true,
    title: commonText('resourcesDialogTitle'),
    close: function() { $(this).remove(); },
    buttons: {
        Cancel: function() { $(this).dialog('close'); }
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
