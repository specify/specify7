"use strict";

var $        = require('jquery');
var _        = require('underscore');
var Backbone = require('./backbone.js');

var schema             = require('./schema.js');
var FormsDialog        = require('./formsdialog.js');
var EditResourceDialog = require('./editresourcedialog.js');
var navigation         = require('./navigation.js');
var querystring        = require('./querystring.js');
const formsText = require('./localization/forms').default;
const commonText = require('./localization/common').default;


module.exports = Backbone.View.extend({
        __name__: "RecordSetsDialog",
        tagName: 'nav',
        className: "recordsets-dialog table-list-dialog",
        events: {
            'click button.edit': 'edit'
        },
        render: function() {
            this.makeUI();
            this.$el.dialog({
                modal: true,
                close: function() { $(this).remove(); },
                title: formsText('recordSetsDialogTitle')(
                    this.options.recordSets._totalCount
                ),
                minWidth: 400,
                maxHeight: 500,
                buttons: this.buttons()
            });
            this.touchUpUI();
            return this;
        },
        touchUpUI: function() {
            //all done
        },
        makeUI: function() {
            this.makeTable();
        },
        makeTable: function() {
            var table = $('<table class="rs-dlg-tbl">');
            var makeEntry = this.dialogEntry.bind(this);
            this.options.recordSets.each(function(recordSet) {
                table.append(makeEntry(recordSet));
            });
            this.options.recordSets.isComplete() ||
                table.append(`<tr>
                    <td></td>
                    <td>${commonText('listTruncated')}</td>
                </tr>`);
            this.$el.append(table);
        },
        dialogEntry: function(recordSet) {
            const model = schema.getModelById(recordSet.get('dbtableid'));
            const img = $('<img>', {src: model.getIcon(), alt: model.getLocalizedName()});
            var link = this.makeEntryLink(recordSet);
            var entry = $('<tr>').append(
                $('<td>').append(img),
                $('<td>').append(link),
                $('<td class="item-count" style="display:none">'));

            this.options.readOnly || entry.append(`<td><button class="edit ui-icon ui-icon-pencil fake-link">${commonText('edit')}</button></td>`);

            recordSet.get('remarks') && entry.find('a').attr('title', recordSet.get('remarks'));
            recordSet.getRelatedObjectCount('recordsetitems').done(function(count) {
                $('.item-count', entry)
                    .text('(' + count + ')')
                    .attr('title',formsText('recordCount'))
                    .show();
            });
            return entry;
        },
        makeEntryLink: function(recordSet) {
            return $('<a>', { href: "/specify/recordset/" + recordSet.id + "/" })
                .addClass("intercept-navigation")
                .text(recordSet.get('name'));
        },
        buttons: function() {
            var buttons = this.options.readOnly ? [] : [
                { text: commonText('new'), click: this.openFormsDialog.bind(this),
                  title: formsText('createRecordSetButtonDescription') }
            ];
            buttons.push({ text: commonText('cancel'), click: function() { $(this).dialog('close'); }});
            return buttons;
        },
        openFormsDialog: function() {
            new FormsDialog().render().on('selected', function(model) {
                var recordset = new schema.models.RecordSet.Resource();
                recordset.set('dbtableid', model.tableId);
                recordset.set('type', 0);
                new EditResourceDialog({ resource: recordset }).render()
                    .on('savecomplete', this.gotoForm.bind(this, model, recordset));
            }, this);
        },
        gotoForm: function(model, recordset) {
            // TODO: got to be a better way to get the url
            var url = querystring.param(new model.Resource().viewUrl(),
                                        {recordsetid: recordset.id});
            navigation.go(url);
        },
        getIndex: function(evt, selector) {
            evt.preventDefault();
            return this.$(selector).index(evt.currentTarget);
        },
        edit: function(evt) {
            const index = this.getIndex(evt, 'button.edit');
            const recordset = this.options.recordSets.at(index);
            this.$el.dialog('close');
            new EditResourceDialog({
                resource: recordset,
                deleteWarning:formsText('recordSetDeletionWarning')(
                    recordset.get('name')
                ),
            }).render();
        }
    });

