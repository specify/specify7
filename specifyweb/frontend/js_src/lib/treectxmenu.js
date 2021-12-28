"use strict";

import $ from 'jquery';
import Backbone from './backbone';
import Q from 'q';

import ResourceView from './resourceview';
import populateForm from './populateform';
import { getModel } from './schema';
import userInfo from './userinfo';
import treeText from './localization/tree';
import commonText from './localization/common';

const ro = userInfo.isReadOnly;

export default function contextMenuBuilder(treeView) {
    return function ($target, evt) {
        var view = $target.closest('.tree-node').data('view');
        var items = {};
        if (treeView.currentAction != null) {
            items.receive = treeView.currentAction.receiveMenuItem(view);
            items.cancelAction = {name: treeText('cancelAction'), icon: "cancel", accesskey: 'c'};
        } else {
            items = {
                'query': {name: commonText('query'), icon: "query", accesskey: "q"},
                'open': {name: ro ? commonText('view') : commonText('edit'), icon: ro ? "view" : "open", accesskey: ro ? "v" : "e"}
            };
            if (!ro) Object.assign(items, {
                'add-child': {
                    name: commonText('addChild'),
                    icon: "add-child",
                    accesskey: "a",
                    disabled:
                        view.acceptedId != null
                        // Forbid adding children to the lowest rank
                        || view.ranks.slice(-1)[0] === view.rankId
                },
                'move': {name: commonText('move'), icon: "move", accesskey: "m"},
                'merge': {name: treeText('merge'), icon: "merge", accesskey: "g"},
                'synonymize': {
                    name: view.acceptedId != null ? treeText('undoSynonymy') : treeText('synonymize'),
                    icon: "synonymize",
                    accesskey: "s",
                    disabled: view.acceptedId == null && view.children > 0
                }
            });
        }

        return {
            items: items,
            callback: contextMenuCallback,
            position: function(opt) {
                opt.$menu.position({my: 'center top', at: 'center bottom', of: this, offset: "0 5"});
            }
        };
    };
}

function contextMenuCallback(key, options) {
    var treeView = this.closest('.tree-view').data('view');
    var treeNodeView = this.closest('.tree-node').data('view');
    var specifyModel = getModel(treeView.table);
    switch (key) {
    case 'open':
        new EditNodeDialog({treeNodeView: treeNodeView}).render();
        break;
    case 'query':
        window.open('/specify/query/fromtree/' + treeNodeView.table + '/' + treeNodeView.nodeId + '/');
        break;
    case 'add-child':
        new AddChildDialog({treeNodeView: treeNodeView}).render();
        break;
    case 'move':
        treeNodeView.closeNode();
        treeView.currentAction = new MoveNodeAction(specifyModel, treeNodeView);
        break;
    case 'merge':
        treeNodeView.closeNode();
        treeView.currentAction = new MergeNodeAction(specifyModel, treeNodeView);
        break;
    case 'synonymize':
        if (treeNodeView.acceptedId == null) {
            treeView.currentAction = new SynonymizeNodeAction(specifyModel, treeNodeView);
        } else {
            new UnSynonymizeNodeAction(specifyModel, treeNodeView).begin();
        }
        break;
    case 'receive':
        if (treeView.currentAction) {
            treeView.currentAction.receivingNode = treeNodeView;
            treeView.currentAction.begin();
        }
        break;
    case 'cancelAction':
        treeView.currentAction && treeView.currentAction.cancel();
        break;
    default:
        console.error('unknown tree ctxmenu key:', key);
    }

    treeView.currentAction && treeView.currentAction.renderHint();
}

class Action {
    constructor(model, node) {
        this.model = model;
        this.node = node;
        this.table = this.model.name.toLowerCase();
    }

    cancel() {
        this.hint && this.hint.remove();
        this.node.treeView.currentAction = null;
    }

    begin() {
        const proceedAction = () => {
            $dialog.dialog('option', 'buttons', [])
                .empty()
                .append($('<div>').progressbar({value: false}));

            this.cancel();

            this.execute().done(result => {
                if (result.success) {
                    $dialog.dialog('close');
                    this.node.treeView.reOpenTree();
                } else {
                    $dialog.dialog('option', 'buttons', {Close() { $(this).dialog('close'); }})
                        .dialog('option', 'title', treeText('actionFailedDialogTitle'))
                        .empty()
                        .append(
                            treeText('actionFailedDialogHeader'),
                            `<p>${treeText('actionFailedDialogMessage')}</p>`,
                            $('<em>').text(result.error)
                        );
                }
            });
        };

        const $dialog = $('<div>').append(this.message()).dialog({
            title: this.title(),
            modal: true,
            dialogClass: 'ui-dialog-no-close',
            close() { $(this).remove(); },
            buttons: {
                [commonText('start')]: proceedAction,
                [commonText('cancel')]() { $(this).dialog('close'); }
            }
        });
    }

    receiveMenuItem(node) { return {}; }

    renderHint() {
        if (this.hint) return;
        const msg = this.hintMessage();
        if (msg) {
            this.hint = new TreeActionHint({action: this}).render();
        }
    }

    hintMessage() { }
}

const TreeActionHint = Backbone.View.extend({
    __name__: 'TreeActionHint',
    className: 'tree-action-hint',
    events: {
        'click button': 'cancel'
    },
    initialize({action}) {
        this.action = action;
    },
    render() {
        this.$el.append(`
<div class="ui-dialog-titlebar ui-widget-header ui-corner-all">
    <span class="ui-dialog-title">${this.action.hintMessage()}</span>
    <button>${commonText('cancel')}</button>
</div>
`).appendTo('body');

        this.$('button').button({
            icons: {primary: 'ui-icon-closethick'},
            text: false
        });

        return this;
    },
    cancel() {
        this.action.cancel();
    }
});

class MoveNodeAction extends Action {
    execute() {
        return Q($.post(`/api/specify_tree/${this.table}/${this.node.nodeId}/move/`,
                        {target: this.receivingNode.nodeId}));
    }

    message() {
        const tree = this.model.getLocalizedName().toLowerCase();
        const object = this.node.fullName;
        const receiver = this.receivingNode.fullName;
        return treeText('nodeMoveMessage')(tree,object,receiver);
    }

    title() { return treeText('moveNode'); }

    receiveMenuItem(node) {
        return {
            name: treeText('moveNodeHere')(this.node.name),
            icon: "receive-move",
            accesskey: 'm',
            disabled: node.rankId >= this.node.rankId ||
                node.acceptedId != null
        };
    }

    hintMessage() {
        return treeText('nodeMoveHintMessage')(this.node.name);
    }
}

class MergeNodeAction extends Action {
    execute() {
        return Q($.post(`/api/specify_tree/${this.table}/${this.node.nodeId}/merge/`,
                        {target: this.receivingNode.nodeId}));
    }

    message() {
        const tree = this.model.getLocalizedName().toLowerCase();
        const object = this.node.fullName;
        const receiver = this.receivingNode.fullName;
        return treeText('mergeNodeMessage')(tree,object,receiver);
    }

    title() { return treeText('mergeNode'); }

    receiveMenuItem(node) {
        return {
            name: treeText('mergeNodeHere')(this.node.name),
            icon: "receive-merge",
            accesskey: 'g',
            disabled: node.nodeId === this.node.nodeId ||
                node.rankId > this.node.rankId ||
                node.acceptedId != null
        };
    }

    hintMessage() {
        return treeText('mergeNodeHintMessage')(this.node.name);
    }
}

class SynonymizeNodeAction extends Action {
    execute() {
        return Q($.post(`/api/specify_tree/${this.table}/${this.node.nodeId}/synonymize/`,
                        {target: this.receivingNode.nodeId}));
    }

    message() {
        const tree = this.model.getLocalizedName().toLowerCase();
        const object = this.node.fullName;
        const receiver = this.receivingNode.fullName;
        return treeText('synonymizeMessage')(tree,object,receiver);
    }

    title() { return treeText('synonymizeNode'); }

    receiveMenuItem(node) {
        return {
            name: treeText('makeSynonym')(this.node.name,node.name),
            icon: "receive-synonym",
            accesskey: 's',
            disabled: node.nodeId === this.node.nodeId ||
                node.acceptedId != null
        };
    }

    hintMessage() {
        return treeText('synonymizeNodeHintMessage')(this.node.name);
    }
}

class UnSynonymizeNodeAction extends Action {
    execute() {
        return Q($.post(`/api/specify_tree/${this.table}/${this.node.nodeId}/unsynonymize/`));
    }

    message() {
        const tree = this.model.getLocalizedName().toLowerCase();
        const object = this.node.fullName;
        const accepted = this.node.acceptedName;
        return treeText('unsynonymizeNodeMessage')(tree,object,accepted);
    }

    title() { return treeText('unsynonymizeNode'); }
}

const EditNodeDialog = Backbone.View.extend({
    __name__: "EditNodeDialog",
    initialize: function(options) {
        this.treeNodeView = options.treeNodeView;
    },
    render: function() {
        const model = new this.treeNodeView.specifyModel.Resource({id: this.treeNodeView.nodeId});
        new ResourceView({
            populateForm: populateForm,
            el: this.el,
            model,
            mode: 'edit',
            noHeader: true
        }).render()
            .on('saved', this.childSaved, this)
            .on('changetitle', this.changeDialogTitle, this);

        this.$el.dialog({
            width: 'auto',
            close: function() { $(this).remove(); }
        });
        return this;
    },
    dialogIsOpen(){
        return this.$el?.is(':ui-dialog') === true;
    },
    childSaved: function() {
        this.treeNodeView.treeView.reOpenTree();
        this.dialogIsOpen() && this.$el.dialog('close');
    },
    changeDialogTitle: function(resource, title) {
        this.dialogIsOpen() && this.$el.dialog('option', 'title', title);
    }
});

const AddChildDialog = Backbone.View.extend({
    __name__: "AddChildDialog",
    initialize: function(options) {
        this.treeNodeView = options.treeNodeView;
    },
    render: function() {
        var parentNode = new this.treeNodeView.specifyModel.Resource({id: this.treeNodeView.nodeId});
        var newNode = new this.treeNodeView.specifyModel.Resource();
        newNode.set('parent', parentNode.url());
        new ResourceView({
            populateForm: populateForm,
            el: this.el,
            model: newNode,
            mode: 'edit',
            noHeader: true
        }).render()
            .on('saved', this.childSaved, this)
            .on('changetitle', this.changeDialogTitle, this);

        this.$el.dialog({
            width: 'auto',
            close: function() { $(this).remove(); }
        });
        return this;
    },
    dialogIsOpen(){
        return this.$el?.is(':ui-dialog') === true;
    },
    childSaved: function() {
        this.treeNodeView.treeView.reOpenTree();
        this.dialogIsOpen() && this.$el.dialog('close');
    },
    changeDialogTitle: function(resource, title) {
        this.dialogIsOpen() && this.$el.dialog('option', 'title', title);
    }
});
