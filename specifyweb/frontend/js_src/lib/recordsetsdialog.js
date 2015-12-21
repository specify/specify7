"use strict";

var $        = require('jquery');
var _        = require('underscore');
var Backbone = require('./backbone.js');

var schema             = require('./schema.js');
var FormsDialog        = require('./formsdialog.js');
var EditResourceDialog = require('./editresourcedialog.js');
var navigation         = require('./navigation.js');
var querystring        = require('./querystring.js');


module.exports = Backbone.View.extend({
        __name__: "RecordSetsDialog",
        className: "recordsets-dialog table-list-dialog",
        events: {
            'click a.edit': 'edit'
        },
        dlgTitle: function() {
            return  "Record Sets (" + this.options.recordSets._totalCount + ")";
        },
        maxHeight: function() {
            return 400;
        },
        render: function() {
            this.makeUI();
            this.$el.dialog({
                modal: true,
                close: function() { $(this).remove(); },
                title: this.dlgTitle(),
                maxHeight: this.maxHeight(),
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
                table.append('<tr><td></td><td>(list truncated)</td></tr>');
            this.$el.append(table);
        },
        dialogEntry: function(recordSet) {
            var img = $('<img>', {src: schema.getModelById(recordSet.get('dbtableid')).getIcon()});
            var link = this.makeEntryLink(recordSet);
            var entry = $('<tr>').append(
                $('<td>').append(img),
                $('<td>').append(link),
                $('<td class="item-count" style="display:none">'));

            this.options.readOnly || entry.append('<td><a class="edit ui-icon ui-icon-pencil"></a></td>');

            recordSet.get('remarks') && entry.find('a').attr('title', recordSet.get('remarks'));
            recordSet.getRelatedObjectCount('recordsetitems').done(function(count) {
                $('.item-count', entry).text('(' + count + ')').show();
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
                { text: 'New', click: this.openFormsDialog.bind(this),
                  title: 'Create a new record set.' }
            ];
            buttons.push({ text: 'Cancel', click: function() { $(this).dialog('close'); }});
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
            var index = this.getIndex(evt, 'a.edit');
            this.$el.dialog('close');
            new EditResourceDialog({ resource: this.options.recordSets.at(index) }).render();
        }
    });

