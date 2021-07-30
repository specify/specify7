"use strict";

import $ from 'jquery';
import commonText from './localization/common';

function execute() {
    $(`<div class="table-list-dialog">
        ${commonText('resourcesDialogHeader')}
        <table>
            <tr><td><a href="/specify/appresources/" class="intercept-navigation">${commonText('appResources')}</a></td></tr>
            <tr><td><a href="/specify/viewsets/" class="intercept-navigation">${commonText('viewSets')}</a></td></tr>
        </table>
    </div>`).dialog({
    modal: true,
    title: commonText('resourcesDialogTitle'),
    close: function() { $(this).remove(); },
    buttons: {
        [commonText('cancel')]: function() { $(this).dialog('close'); }
    }
});
}


export default {
    task: 'resources',
    title: commonText('resources'),
    icon: null,
    execute: execute,
    disabled: user => !user.isadmin
};
