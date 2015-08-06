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
var contextMenuSetup = false;

function setupContextMenu() {
    if (contextMenuSetup) return;
    contextMenuSetup = true;

    $.contextMenu({
        selector: ".tree-node .expander",
        items: {
            'open': {name: "Edit", icon: "form"},
            'query': {name: "Query", icon: "query"},
            'add-child': {name: "Add child", icon:"add-child"}
        },
        callback: function openForm(key, options) {
            var table = this.closest('.tree-view').data('table');
            var nodeId = this.closest('.tree-node').data('nodeId');
            var specifyModel = schema.getModel(table);
            switch (key) {
            case 'open':
                window.open(api.makeResourceViewUrl(specifyModel, nodeId));
                break;
            case 'query':
                window.open('/specify/query/fromtree/' + table + '/' + nodeId + '/');
                break;
            case 'add-child':
                new AddChildDialog({
                    specifyModel: specifyModel,
                    nodeId: nodeId,
                    nodeEl: this.closest('.tree-node')
                }).render();
                break;
            }
        }
    });
}

    var AddChildDialog = Backbone.View.extend({
        __name__: "AddChildDialog",
        initialize: function(options) {
            this.nodeEl = options.nodeEl;
            this.specifyModel = options.specifyModel;
            this.nodeId = options.nodeId;
        },
        render: function() {
            var parentNode = new this.specifyModel.Resource({id: this.nodeId});
            var newNode = new this.specifyModel.Resource();
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
            this.$el.dialog('close');
            this.nodeEl.trigger({type: 'child-added'});
        },
        changeDialogTitle: function(resource, title) {
            this.$el.dialog('option', 'title', title);
        }
    });


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

    function contextMenuCallback(key, options) {
        var table = this.closest('.tree-view').data('table');
        var nodeId = this.closest('.tree-node').data('nodeId');
        var specifyModel = schema.getModel(table);
        switch (key) {
        case 'open':
            window.open(api.makeResourceViewUrl(specifyModel, nodeId));
            break;
        case 'query':
            window.open('/specify/query/fromtree/' + table + '/' + nodeId + '/');
            break;
        case 'add-child':
            new AddChildDialog({
                specifyModel: specifyModel,
                nodeId: nodeId,
                nodeEl: this.closest('.tree-node')
            }).render();
            break;
        case 'move':
            this.closest('.tree-node').trigger({type: "move-node"});
            break;
        case 'receive':
            this.closest('.tree-node').trigger({type: "receive-node"});
            break;
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
            this.$el.data('table', this.table);
            this.$el.contextMenu({
                selector: ".tree-node .expander",
                build: this.buildContextMenu.bind(this)
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
        buildContextMenu: function() {
            var items = this.currentAction != null ?
                    this.currentAction.type == 'moving' ? {
                        'receive': {name: "Move " + this.currentAction.node.name + " here"},
                        'cancelAction': {name: "Cancel", icon: "cancel"}
                    } : null
                : {
                    'open': {name: "Edit", icon: "form"},
                    'query': {name: "Query", icon: "query"},
                    'add-child': {name: "Add child", icon: "add-child"},
                    'move': {name: "Move", icon: "move"}
                };

            return {
                items: items,
                callback: contextMenuCallback
            };
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
            // procede every open bracket that is not itself proceded
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
            }
            this.currentAction = null;
        }
    });

module.exports = function(table) {
    setupContextMenu();
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


