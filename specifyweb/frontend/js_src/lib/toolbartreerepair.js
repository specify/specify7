"use strict";

import $ from 'jquery';
import Backbone from './backbone';
import { getDomainResource} from './domain';
import schema from './schema';
import commonText from './localization/common';

const title = commonText('repairTree');

const treesForAll = ['geography', 'storage', 'taxon'];
const treesForPaleo = ['geologictimeperiod', 'lithostrat'];
const paleoDiscs = 'paleobotany invertpaleo vertpaleo'.split(' ');

const RepairTreeView = Backbone.View.extend({
    __name__: "RepairTreeView",
    className: "repair-tree-dialog table-list-dialog",
    events: {
        'click a': 'selected'
    },
    initialize({trees}) {
        this.trees = trees;
    },
    render() {
        const entries = this.trees.map(tree => this.dialogEntry(tree));
        this.$el.append(
            $('<table>').append(entries)
        ).dialog({
            title: title,
            modal: true,
            close() { $(this).remove(); },
            buttons: { [commonText('cancel')]() { $(this).dialog('close'); }}
        });
        return this;
    },
    dialogEntry(tree) {
        const model = schema.getModel(tree);
        const img = $('<img>', { src: model.getIcon() });
        const link = $('<a>', { text: model.getLocalizedName() });
        return $('<tr>').append(
            $('<td>').append(img),
            $('<td>').append(link))[0];
    },
    selected(evt) {
        const idx = this.$('a').index(evt.currentTarget);
        const tree = this.trees[idx];
        this.$el.dialog('option', 'buttons', []);
        this.$el.empty().append('<div>');
        this.$('div').progressbar({ value: false });
        $.post(`/api/specify_tree/${ tree }/repair/`).done(() => this.$el.dialog('close'));
    }
});

function execute() {
    getDomainResource('discipline').rget('type')
        .pipe(type => [].concat(
            treesForAll,
            paleoDiscs.includes(type) ? treesForPaleo : []))
        .done(trees => new RepairTreeView({trees: trees}).render());
}

export default {
    task: 'repairtree',
    title: title,
    icon: null,
    execute: execute,
    disabled: user => !user.isadmin
};
