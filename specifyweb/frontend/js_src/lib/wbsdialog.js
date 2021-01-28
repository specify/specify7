"use strict";

const $        = require('jquery');
const _        = require('underscore');
const Backbone = require('./backbone.js');

const schema              = require('./schema.js');
const navigation          = require('./navigation.js');
const userInfo    = require('./userinfo.js');
const EditResourceDialog  = require('./editresourcedialog.js');
const uniquifyName = require('./wbuniquifyname.js');

module.exports =  Backbone.View.extend({
    __name__: "WbsDialog",
    className: "wbs-dialog table-list-dialog",
    initialize({datasets}) {
        this.datasets = datasets;
    },
    render() {
        const entries = _.map(this.datasets, this.dialogEntry, this);
        $('<table>').append(entries).appendTo(this.el);
        this.$el.dialog({
            title: "Datasets",
            maxHeight: 400,
            modal: true,
            close() { $(this).remove(); },
            buttons: [
                { text: 'Import', click() { navigation.go('/workbench-import/'); } },
                { text: 'Cancel', click() { $(this).dialog('close'); } }
            ]
        });
        return this;
    },
    dialogEntry(ds) {
        const img = $('<img>', { src: '/images/Workbench32x32.png' });
        const href = `/workbench/${ds.id}/`;
        const link = $('<a>', {href: href, 'class': "intercept-navigation"}).text(ds.name);
        return $('<tr>').append(
            $('<td>').append(img),
            $('<td>').append(link),
            $('<td class="item-count" style="display:none">'));
    },
});

