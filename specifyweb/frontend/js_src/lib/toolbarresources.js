"use strict";

const $ = require('jquery');

function execute() {
    $(`
<div class="table-list-dialog">
<table>
<tr><td><a href="/specify/appresources/" class="intercept-navigation">App Resources</a></td></tr>
<tr><td><a href="/specify/viewsets/" class="intercept-navigation">View Sets</a></td></tr>
</table>
</div>
`).dialog({
    modal: true,
    title: "Resources",
    close: function() { $(this).remove(); },
    buttons: {
        Cancel: function() { $(this).dialog('close'); }
    }
});
}


module.exports = {
    task: 'resources',
    title: 'Resources',
    icon: null,
    execute: execute,
    disabled: user => !user.isadmin
};
