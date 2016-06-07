"use strict";

const $ = require('jquery');
const Backbone = require('./backbone.js');
const Q = require('q');

const ResourceView = require('./resourceview.js');
const populateForm = require('./populateform.js');
const schema = require('./schema.js');
const api = require('./specifyapi.js');
const userInfo = require('./userinfo.js');

const ro = userInfo.isReadOnly;

function contextMenuBuilder(treeView) {
    return function ($target, evt) {
        var view = $target.closest('.tree-node').data('view');
        var items = {};
        if (treeView.currentAction != null) {
            items.receive = treeView.currentAction.receiveMenuItem(view);
            items.cancelAction = {name: "Cancel action", icon: "cancel", accesskey: 'c'};
        } else {
            items = {
                'open': {name: ro ? "View" : "Edit", icon: ro ? "view" : "open", accesskey: ro ? "v" : "e"},
                'query': {name: "Query", icon: "query", accesskey: "q"}
            };
            if (!ro) Object.assign(items, {
                'add-child': {
                    name: "Add child",
                    icon: "add-child",
                    accesskey: "a",
                    disabled: view.acceptedId != null
                },
                'move': {name: "Move", icon: "move", accesskey: "m"},
                'merge': {name: "Merge", icon: "merge", accesskey: "g"},
                'synonymize': {
                    name: view.acceptedId != null ? "Undo Synonymy" : "Synonymize",
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
    var specifyModel = schema.getModel(treeView.table);
    switch (key) {
    case 'open':
        window.open(api.makeResourceViewUrl(specifyModel, treeNodeView.nodeId));
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
        const continuation = () => this.execute();
        const reOpenTree = () => this.node.treeView.reOpenTree();
        const cancelAction = () => this.cancel();

        $('<div>').append(this.message()).dialog({
            title: this.title(),
            modal: true,
            open(evt, ui) { $('.ui-dialog-titlebar-close', ui.dialog).hide(); },
            close() { $(this).remove(); },
            buttons: {
                Proceed() {
                    $(this)
                        .dialog('option', 'buttons', [])
                        .empty()
                        .append($('<div>').progressbar({value: false}));

                    cancelAction();
                    continuation().done(() => {
                        $(this).dialog('close');
                        reOpenTree();
                    });
                },
                Cancel() { $(this).dialog('close'); }
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
    <button>Cancel</button>
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
        const objectNode = new this.model.Resource({id: this.node.nodeId });
        const receiverNode = new this.model.Resource({id: this.receivingNode.nodeId});
        return Q(objectNode.fetch()).then(
            () => objectNode.set('parent', receiverNode.url()).save());
    }

    message() {
        const tree = this.model.getLocalizedName().toLowerCase();
        const object = this.node.fullName;
        const receiver = this.receivingNode.fullName;
        return `The ${tree} node <em>${object}</em> will be placed, along with all of
its descendants, under the new parent <em>${receiver}</em>.`;
    }

    title() { return "Move node"; }

    receiveMenuItem(node) {
        return {
            name: "Move " + this.node.name + " here",
            icon: "receive-move",
            accesskey: 'm',
            disabled: node.rankId >= this.node.rankId ||
                node.acceptedId != null
        };
    }

    hintMessage() {
        return `Select a new parent for the node, <em>${this.node.name}</em>.`;
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
        return `All references to ${tree} node <em>${object}</em> will be replaced
with <em>${receiver}</em>, and all descendants of <em>${object}</em>  will be
moved to <em>${receiver}</em> with any descendants matching in name
and rank being themselves merged recursively.`;
    }

    title() { return "Merge node"; }

    receiveMenuItem(node) {
        return {
            name: "Merge " + this.node.name + " here",
            icon: "receive-merge",
            accesskey: 'g',
            disabled: node.nodeId === this.node.nodeId ||
                node.rankId > this.node.rankId ||
                node.acceptedId != null
        };
    }

    hintMessage() {
        return `Select a target for <em>${this.node.name}</em> to be merged into.`;
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
        return `The ${tree} node <em>${object}</em> will be made a synonym of <em>${receiver}</em>.`;
    }

    title() { return "Synonymize node"; }

    receiveMenuItem(node) {
        return {
            name: `Make ${this.node.name} a synonym of ${node.name}`,
            icon: "receive-synonym",
            accesskey: 's',
            disabled: node.nodeId === this.node.nodeId ||
                node.acceptedId != null
        };
    }

    hintMessage() {
        return `Select a target for <em>${this.node.name}</em> to be synonymized to.`;
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
        return `The ${tree} node <em>${object}</em> will no longer be a synonym of <em>${accepted}</em>.`;
    }

    title() { return "Unsynonymize node"; }
}

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
    childSaved: function() {
        this.treeNodeView.treeView.reOpenTree();
        this.$el.dialog('close');
    },
    changeDialogTitle: function(resource, title) {
        this.$el.dialog('option', 'title', title);
    }
});

module.exports = contextMenuBuilder;
