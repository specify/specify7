"use strict";
require('../css/tree.css');

var $         = require('jquery');
var _         = require('underscore');
var Backbone  = require('./backbone.js');

var api          = require('./specifyapi.js');
var schema       = require('./schema.js');
var domain       = require('./domain.js');
var NotFoundView = require('./notfoundview.js');
var ResourceView = require('./resourceview.js');
var navigation   = require('./navigation.js');
var app          = require('./specifyapp.js');
var populateForm = require('./populateform.js');
var querystring  = require('./querystring.js');
var TreeNodeView = require('./treenodeview.js');

var setTitle = app.setTitle;

    var TreeHeader = Backbone.View.extend({
        __name__: "TreeHeader",
        className: "tree-header",
        tagName: "thead",
        initialize: function(options) {
            this.treeDefItems = options.treeDefItems;
        },
        render: function() {
            var headings = _.map(this.treeDefItems, function(tdi) {
                return $('<th>').text(tdi.get('name'))[0];
            }, this);
            $('<tr>').append(headings).appendTo(this.el);
            return this;
        }
    });

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
            treeNodeView.openAddChildDialog();
            break;
        case 'move':
            treeNodeView.moveNode();
            break;
        case 'merge':
            treeNodeView.mergeNode();
            break;
        case 'synonymize':
            treeNodeView.synonymizeNode();
            break;
        case 'receive':
            treeNodeView.receiveNode();
            break;
        case 'cancelAction':
            treeView.cancelAction();
            break;
        default:
            console.error('unknown tree ctxmenu key:', key);
        }
    }


    var TreeView = Backbone.View.extend({
        __name__: "TreeView",
        className: "tree-view",
        events: {
            'autocompleteselect': 'search'
        },
        initialize: function(options) {
            this.table = options.table;
            this.treeDef = options.treeDef;
            this.treeDefItems = options.treeDefItems.models;

            this.ranks = _.map(this.treeDefItems, function(tdi) { return tdi.get('rankid'); });
            this.baseUrl = '/api/specify_tree/' + this.table + '/' + this.treeDef.id + '/';
            this.currentAction = null;
        },
        render: function() {
            this.$el.data('view', this);
            this.$el.contextMenu({
                selector: ".tree-node .expander",
                build: contextMenuBuilder(this)
            });
            var title = schema.getModel(this.table).getLocalizedName() + " Tree";
            setTitle(title);
            $('<h1>').text(title).appendTo(this.el);
            this.$el.append(this.makeSearchBox());
            var columnDefs = $('<colgroup>').append(_.map(this.ranks, function() {
                return $('<col>', {width: (100/this.ranks.length) + '%'})[0];
            }, this));
            $('<table>').appendTo(this.el).append(
                columnDefs,
                new TreeHeader({treeDefItems: this.treeDefItems}).render().el,
                $('<tfoot>').append(_.map(this.ranks, function() { return $('<th>')[0]; })),
                '<tbody><tr class="loading"><td>(loading...)</td></tr></tbody>'
            );
            this.$('tr.loading').append(new Array(this.ranks.length-1).fill('<td>'));
            $.getJSON(this.baseUrl + 'null/')
                .done(this.gotRows.bind(this));
            return this;
        },
        gotRows: function(rows) {
            this.roots = _.map(rows, function(row) {
                return new TreeNodeView({ row: row, table: this.table, ranks: this.ranks, baseUrl: this.baseUrl, treeView: this });
            }, this);
            this.$('tbody').empty();
            _.invoke(this.roots, 'render');
            var params = querystring.deparam();
            params.conformation && this.applyConformation(params.conformation);
        },
        search: function(event, ui) {
            this.$('.tree-search').blur();
            var roots = this.roots;
            $.getJSON('/api/specify_tree/' + this.table + '/' + ui.item.nodeId + '/path/').done(function(path) {
                var nodeIds = _(path).chain().values()
                        .filter(function(node) { return node.rankid != null; })
                        .sortBy(function(node) { return node.rankid; })
                        .pluck('id').value();
                _.invoke(roots, 'openPath', nodeIds);
            });
        },
        makeSearchBox: function() {
            var tree = schema.getModel(this.table);
            return $('<input class="tree-search" type="search" placeholder="Search Tree" tabindex="1">').autocomplete({
                source: function(request, response) {
                    var collection = new tree.LazyCollection({
                        filters: { name__istartswith: request.term, orderby: 'name' },
                        domainfilter: true
                    });
                    collection.fetch().pipe(function() {
                        var items = collection.map(function(node) {
                            return { label: node.get('fullname'), value: node.get('name'), nodeId: node.id };
                        });
                        response(items);
                    });
                }
            });
        },
        applyConformation: function(encoded) {
            var serialized = encoded.replace(/([^~])~/g, '$1,~').replace(/~/g, '[').replace(/-/g, ']');
            var conformation;
            try {
                conformation = JSON.parse(serialized);
            } catch (e) {
                console.error('bad tree conformation:', serialized);
                return;
            }
            _.each(conformation, function(conformation) {
                _.invoke(this.roots, 'applyConformation', conformation);
            }, this);
        },
        updateConformation: function() {
            var serialized = JSON.stringify(TreeNodeView.conformation(this.roots));
            // Replace reserved url characters to avoid percent
            // escaping.  Also, commas are superfluous since they
            // precede every open bracket that is not itself preceded
            // by an open bracket by nature of the construction.
            var encoded = serialized.replace(/\[/g, '~').replace(/\]/g, '-').replace(/,/g, '');
            navigation.push(querystring.param(window.location.href, {conformation: encoded}));
        },
        moveNode: function(node) {
            this.currentAction = {
                type: 'moving',
                node: node
            };
        },
        mergeNode: function(node) {
            this.currentAction = {
                type: 'merging',
                node: node
            };
        },
        synonymizeNode: function(node) {
            if (node.acceptedId == null) {
                this.currentAction = {
                    type: 'synonymizing',
                    node: node
                };
            } else {
                $.post(`/api/specify_tree/${this.table}/${node.nodeId}/unsynonymize/`).done(() => node.parent().reOpenNode());
            }
        },
        receiveNode: function(node) {
            this.currentAction.receivingNode = node;
            var model = schema.getModel(this.table);
            var receiver = new model.Resource({id: node.nodeId});
            var target = new model.Resource({id: this.currentAction.node.nodeId });
            $.when(receiver.fetch(), target.fetch())
                .pipe(this.executeAction.bind(this, target, receiver));
        },
        executeAction: function(target, receiver) {
            var action = this.currentAction;
            switch (action.type) {
            case 'moving':
                target.set('parent', receiver.url());
                target.save().done(function() {
                    action.receivingNode.childAdded();
                    action.node.parent().childRemoved();
                });
                break;
            case 'merging':
                $.post(`/api/specify_tree/${this.table}/${action.node.nodeId}/merge/`,
                       {target: receiver.id}).done(() => {
                           action.receivingNode.childAdded();
                           action.node.parent().childRemoved();
                       });
                break;
            case 'synonymizing':
                $.post(`/api/specify_tree/${this.table}/${action.node.nodeId}/synonymize/`,
                       {target: receiver.id}).done(() => action.node.parent().reOpenNode());
                break;
            }
            this.currentAction = null;
        },
        cancelAction: function() {
            this.currentAction = null;
        }
    });

module.exports = function(table) {
    var getTreeDef = domain.getTreeDef(table);
    if (!getTreeDef) {
        app.setCurrentView(new NotFoundView());
        return;
    }
    getTreeDef.done(function(treeDef) {
        treeDef.rget('treedefitems').pipe(function (treeDefItems) {
            return treeDefItems.fetch({limit: 0}).pipe(function() { return treeDefItems; });
        }).done(function(treeDefItems) {
            app.setCurrentView(new TreeView({
                table: table,
                treeDef: treeDef,
                treeDefItems: treeDefItems
            }));
        });
    });
};


