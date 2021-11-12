"use strict";

const $ = require('jquery');
const Backbone = require('./backbone.js');
const domain = require('./domain.js');
const schema = require('./schema.js');
const commonText = require('./localization/common').default;

const title = commonText('repairTree');

const treesForAll = ['geography', 'storage', 'taxon'];
const treesForPaleo = ['geologictimeperiod', 'lithostrat'];
const paleoDiscs = 'paleobotany invertpaleo vertpaleo'.split(' ');

const RepairTreeView = Backbone.View.extend({
    __name__: "RepairTreeView",
    className: "repair-tree-dialog",
    events: {
        'click button': 'selected'
    },
    initialize({trees}) {
        this.trees = trees;
    },
    render() {
        const entries = this.trees.map(tree => this.dialogEntry(tree)).join('');
        this.$el.append(
            $('<ul>').css('padding',0).html(entries)
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
        return `<li>
            <button
                type="button"
                class="fake-link intercept-navigation"
                style="font-size: 0.8rem;"
            >
                <img
                    alt=''
                    aria-hidden="true"
                    src="${model.getIcon()}"
                    style="width: var(--table-icon-size);"
                >
                ${model.getLocalizedName()}
            </button>
        </li>`;
    },
    selected(evt) {
        const idx = this.$('button').index(evt.currentTarget);
        const tree = this.trees[idx];
        this.$el.dialog('option', 'buttons', []);
        this.$el.empty().append('<div>');
        this.$('div').progressbar({ value: false });
        $.post(`/api/specify_tree/${ tree }/repair/`).done(() => this.$el.dialog('close'));
    }
});

function execute() {
    domain.getDomainResource('discipline').rget('type')
        .pipe(type => [].concat(
            treesForAll,
            paleoDiscs.includes(type) ? treesForPaleo : []))
        .done(trees => new RepairTreeView({trees: trees}).render());
}

module.exports = {
    task: 'repairtree',
    title: title,
    icon: null,
    execute: execute,
    disabled: user => !user.isadmin
};
