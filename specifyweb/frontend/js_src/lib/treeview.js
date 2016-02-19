"use strict";
require('../css/tree.css');

var $         = require('jquery');
var _         = require('underscore');
var Backbone  = require('./backbone.js');

var api          = require('./specifyapi.js');
var schema       = require('./schema.js');
var domain       = require('./domain.js');
var remoteprefs  = require('./remoteprefs.js');
var NotFoundView = require('./notfoundview.js');
var ResourceView = require('./resourceview.js');
var navigation   = require('./navigation.js');
var app          = require('./specifyapp.js');
var populateForm = require('./populateform.js');
var querystring  = require('./querystring.js');

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

    var TreeNodeView = Backbone.View.extend({
        __name__: "TreeNodeView",
        tagName: "tr",
        className: "tree-node",
        events: {
            'keydown .tree-node-name': 'keydown',
            'click a.open': 'openNode',
            'click a.close': 'closeNode',
            'child-added': 'childAdded'
        },
        initialize: function(options) {
            this.table = options.table;
            this.ranks = options.ranks;
            this.path = options.path || [];
            this.baseUrl = options.baseUrl;
            this.treeView = options.treeView;
            this.specifyModel = schema.getModel(this.table);
            this.childNodes = null;
            this.expanded = false;
            this.opened = false;

            // unpack the database row into fields on this object
            var fields = "nodeId name fullName nodeNumber highestNodeNumber rankId children allCOs directCOs".split(' ');
            _(this).extend(_.object(fields, options.row));
        },
        render: function() {
            this.$el.empty();

            var parent = _.last(this.path);
            var foundParentRank = false;
            var foundThisRank = false;
            var cells = _.map(this.ranks, function(rank) {
                if (parent && rank == parent.rankId) foundParentRank = true;
                if (rank == this.rankId) foundThisRank = true;
                var td = $('<td>');
                var ancestor = _.find(this.path, function(node) { return node.rankId == rank; });
                var ancestorPlus1 = this.path[1 + _.indexOf(this.path, ancestor)];
                if (ancestor && !(ancestorPlus1 && ancestorPlus1.isLastChild())) {
                    td.addClass('tree-vertical-edge');
                }
                if (rank == this.rankId) {
                    td.addClass('tree-node-cell').append('<p>');
                }
                if (foundParentRank && !foundThisRank) {
                    td.addClass('tree-horizontal-edge');
                }
                return td[0];
            }, this);
            this.$el.append(cells).data('nodeId', this.nodeId);

            this.$('.tree-node-cell p')
                .append('<a class="ui-icon expander">')
                .append($('<a class="expander tree-node-name" tabindex="2">').text(this.name));

            this.setupExpander();

            if (parent == null) {
                this.treeView.$('tbody').append(this.el);
            } else if (parent.expanded) {
                parent.$el.after(this.el);
            }
            this.expanded && this._openNode();
            this.delegateEvents();
            return this;
        },
        setupExpander: function() {
            var expander = this.$('.expander').removeClass('open close leaf');
            if (this.children > 0) {
                expander.addClass('open').attr('title', "" + this.children + (this.children > 1 ? " children" : " child"));
            } else {
                expander.addClass('leaf').attr('title', "");
            }
        },
        keydown: function(event) {
            if (this.$('.tree-node-name').hasClass('context-menu-active')) return;
            if (!_([13, 37, 38, 39, 40]).contains(event.keyCode)) return;
            event.preventDefault();

            var cells = $('.tree-node-name');
            var index = cells.index(this.$('.tree-node-name'));
            var next = index;

            switch (event.keyCode) {
            case 13: // enter
                this.$('.tree-node-name').contextMenu();
                break;
            case 37: // left
                this.closeNode();
                break;
            case 38: // up
                next = Math.max(0, index - 1);
                break;
            case 39: // right
                this.openNode();
                break;
            case 40: // down
                next = Math.min(cells.length - 1, index + 1);
                break;
            }
            $(cells[next]).focus();
        },
        shouldDoStats: function() {
            var tree = this.specifyModel.name;
            var statsThreshold = remoteprefs['TreeEditor.Rank.Threshold.' + tree];
            return statsThreshold != null && statsThreshold <= this.rankId;
        },
        addStats: function(statsById) {
            var stats = statsById[this.nodeId];
            var childCOs = stats.all - stats.direct;
            this.$('.tree-node-cell p').append(' (' + stats.direct + (childCOs > 0 ? ', ' + childCOs : '') +')');
        },
        openPath: function(path) {
            if (_.first(path) !== this.nodeId) return;


            if (path.length === 1) {
                this.$('.tree-node-name').focus();
                return;
            }

            this.$('.tree-node-name')[0].scrollIntoView(false);

            var opening = this.opened ? $.when(null) : this._openNode();
            opening.done(function() {
                _.invoke(this.childNodes, 'openPath', _.rest(path));
            }.bind(this));
        },
        openNode: function(event) {
            event && event.preventDefault();
            this.children == 0 || this.opened || this._openNode();
        },
        _openNode: function() {
            console.log('openNode', this.name);
            if (this.childNodes) {
                this.renderChildren();
                return $.when(null);
            } else {
                return this.getChildren().done(this.renderChildren.bind(this));
            }
        },
        getChildren: function() {
            console.log('getChildren', this.name);
            this.$('.expander').removeClass('open').addClass('wait');
            return $.getJSON(this.baseUrl + this.nodeId + '/').pipe(this.gotChildren.bind(this));
        },
        gotChildren: function(childRows) {
            this.statsPromise = this.shouldDoStats() ? $.getJSON(this.baseUrl + this.nodeId + '/stats/') : $.when(null);

            return this.childNodes = _.map(childRows, function(row) {
                return new TreeNodeView({
                    treeView: this.treeView,
                    baseUrl: this.baseUrl,
                    table: this.table,
                    row: row,
                    ranks: this.ranks,
                    path: this.path.concat(this)
                });
            }, this);
        },
        isLastChild: function() {
            var parent = _.last(this.path);
            return parent == null || this === _.last(parent.childNodes);
        },
        renderChildren: function(rows) {
            console.log('renderChildren', this.name);
            this.expanded = true;
            this.opened = true;
            this.$('.expander').removeClass('open wait').addClass('close');

            var nodes = this.childNodes.slice();
            // Have to add the nodes in reverse since they are being
            // inserted after the parent.
            nodes.reverse();
            _.each(nodes, function(node) { node.render(); });
            this.treeView.updateConformation();
            this.statsPromise.done(this.renderStats.bind(this));
        },
        renderStats: function(stats) {
            if (stats == null) return;
            var statsById = _.object(_.map(stats, function(stat) { return stat[0]; }), // node id
                                     _.map(stats, function(stat) { return {direct: stat[1], all: stat[2]}; }));
            _.invoke(this.childNodes, 'addStats', statsById);
        },
        closeNode: function(event) {
            event && event.preventDefault();
            this.opened && this._closeNode();
        },
        _closeNode: function() {
            console.log('closeNode', this.name);
            this.expanded = false;
            this.opened = false;
            this.$('.expander').removeClass('close').addClass('open');
            _.invoke(this.childNodes, 'remove');
            this.treeView.updateConformation();
        },
        remove: function() {
            console.log('remove', this.name);
            this.opened = false;
            this.undelegateEvents();
            this.$el.remove();
            _.invoke(this.childNodes, 'remove');
        },
        conformation: function() {
            return [this.nodeId].concat(conformation(this.childNodes));
        },
        applyConformation: function(conformation) {
            if (_.first(conformation) !== this.nodeId) return;

            var opening = this.opened ? $.when(null) : this._openNode();
            opening.done(function() {
                _.each(_.rest(conformation), function(conformation) {
                    _.invoke(this.childNodes, 'applyConformation', conformation);
                }, this);
            }.bind(this));
        },
        childAdded: function(evt) {
            evt.stopPropagation();
            this.children++;
            this.setupExpander();
            this.closeNode();
            this.childNodes = null;
            this._openNode();
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
        },
        render: function() {
            this.$el.data('table', this.table);
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
            try {
                var conformation = JSON.parse(serialized);
            } catch (e) {
                console.error('bad tree conformation:', serialized);
                return;
            }
            _.each(conformation, function(conformation) {
                _.invoke(this.roots, 'applyConformation', conformation);
            }, this);
        },
        updateConformation: function() {
            var serialized = JSON.stringify(conformation(this.roots));
            // Replace reserved url characters to avoid percent
            // escaping.  Also, commas are superfluous since they
            // procede every open bracket that is not itself proceded
            // by an open bracket by nature of the construction.
            var encoded = serialized.replace(/\[/g, '~').replace(/\]/g, '-').replace(/,/g, '');
            navigation.push(querystring.param(window.location.href, {conformation: encoded}));
        }
    });

    function conformation(nodes) {
        return _.invoke(_.where(nodes, {expanded: true}), 'conformation');
    }

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


