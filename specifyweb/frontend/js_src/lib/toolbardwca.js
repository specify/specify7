"use strict";

const $ = require('jquery');
const Q = require('q');
const chooseTmpl = require('./templates/chooseDwCADef.html');
const commonText = require('./localization/common').default;

const title = commonText('makeDwca');

var dialog = null;

function execute() {
    if (dialog) return;

    function next(evt) {
        evt.preventDefault();
        checkForResources({
            definition: $('input.dwca-definition', this).val().trim(),
            metadata: $('input.dwca-metadata', this).val().trim()
        });
    }

    dialog = $(chooseTmpl({commonText})).dialog({
        modal: true,
        title: commonText('chooseDwcaDialogTitle'),
        close: function() { $(this).remove(); dialog = null; },
        buttons: [
            {text: commonText('start'), click: next},
            {text: commonText('cancel'), click: function() { $(this).dialog('close'); }}
        ]}
    );

    $('input.dwca-definition', dialog).focus();
    $('form', dialog).submit(next);
}


function liftGetResource(name, error) {
    return Q($.get('/context/app.resource', {name: name})
             .fail(jqxhr => jqxhr.errorHandled = jqxhr.status === 404))
        .fail(jqxhr => {
            if (jqxhr.status === 404) throw error;
        });
}

const definitionNotFound = {};
const metadataNotFound = {};

function checkForResources({definition, metadata}) {
    if (definition === '') return;

    const fetch = Q.all([
        liftGetResource(definition, definitionNotFound),
        metadata === '' ? null : liftGetResource(metadata, metadataNotFound)
    ]);

    fetch.done(
        ([dwcaResource, metadataResource]) => {
            startExport(definition, metadata === '' ? null : metadata);
        },
        error => {
            if (error === definitionNotFound) {
                $('p.error', dialog).text(commonText('definitionResourceNotFound')(definition));
            } else if (error === metadataNotFound) {
                $('p.error', dialog).text(commonText('metadataResourceNotFound')(metadata));
            } else {
                throw error;
            }
        }
    );
}

function startExport(definition, metadata) {
    const params = {definition: definition};
    if (metadata != null) params.metadata = metadata;

    $.post('/export/make_dwca/', params).done(() => {
        dialog.dialog('close');
        dialog = $(`<div>
            ${commonText('dwcaExportStartedDialogHeader')}
            <p>${commonText('dwcaExportStartedDialogMessage')}</p>
        </div>`).dialog({
            modal: true,
            title: commonText('dwcaExportStartedDialogTitle'),
            close: function() { $(this).remove(); dialog = null; },
            buttons: [
                {text: commonText('close'), click: function() { $(this).dialog('close'); }}
            ]});
    });
}

module.exports = {
    task: 'makedwca',
    title: title,
    icon: null,
    execute: execute,
    disabled: user => !user.isadmin
};
