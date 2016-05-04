"use strict";

const $ = require('jquery');
const Backbone = require('./backbone.js');

const ResourceView = require('./resourceview.js');
const populateForm = require('./populateform.js');
const schema = require('./schema.js');
const api = require('./specifyapi.js');

function contextMenuBuilder(treeView) {
    return function ($target, evt) {
        var view = $target.closest('.tree-node').data('view');
        var items = {};
        if (treeView.currentAction != null) {
            var action = treeView.currentAction;
            switch (treeView.currentAction.type) {
            case 'moving':
                items.receive = {
                    name: "Move " + action.node.name + " here",
                    icon: "receive-move",
                    accesskey: 'm',
                    disabled: view.rankId >= action.node.rankId
                };
                break;
            case 'merging':
                items.receive = {
                    name: "Merge " + action.node.name + " here",
                    icon: "receive-merge",
                    accesskey: 'g',
                    disabled: view.nodeId === action.node.nodeId || view.rankId > action.node.rankId
                };
                break;
            case 'synonymizing':
                items.receive = {
                    name: `Make ${action.node.name} a synonym of ${view.name}`,
                    icon: "receive-synonym",
                    accesskey: 's',
                    disabled: view.nodeId === action.node.nodeId
                };
                break;
            default:
                console.error('unknown tree action:', treeView.currentAction.type);
            }
            items.cancelAction = {name: "Cancel action", icon: "cancel", accesskey: 'c'};
        } else {
            items = {
                'open': {name: "Edit", icon: "open", accesskey: "e"},
                'query': {name: "Query", icon: "query", accesskey: "q"},
                'add-child': {
                    name: "Add child",
                    icon: "add-child",
                    accesskey: "a",
                    disabled: view.acceptedId != null
                },
                'move': {name: "Move", icon: "move", accesskey: "m"},
                'merge': {name: "Merge", icon: "merge", accesskey: "g"},
                'synonymize': {
                    name: view.acceptedId != null ? "Un-Synonymize" : "Synonymize",
                    icon: "synonymize",
                    accesskey: "s",
                    disabled: view.acceptedId == null && view.children > 0
                }
            };
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
        treeView.moveNode(treeNodeView);
        break;
    case 'merge':
        treeNodeView.closeNode();
        treeView.mergeNode(treeNodeView);
        break;
    case 'synonymize':
        treeNodeView.closeNode();
        treeView.synonymizeNode(treeNodeView);
        break;
    case 'receive':
        treeView.receiveNode(treeNodeView);
        break;
    case 'cancelAction':
        treeView.cancelAction();
        break;
    default:
        console.error('unknown tree ctxmenu key:', key);
    }
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
