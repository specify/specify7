"use strict";

import $ from 'jquery';
import _ from 'underscore';
import Backbone from './backbone';
import Q from 'q';

import schema from './schema';
import remoteprefs from './remoteprefs';
import treeText from './localization/tree';
import commonText from './localization/common';

var TreeNodeView = Backbone.View.extend({
    __name__: "TreeNodeView",
    tagName: "tr",
    className: "tree-node",
    events: {
        'keydown .tree-node-cell button': 'keydown',
        'click .tree-node-cell button.open': 'openNode',
        'click .tree-node-cell button.close': 'closeNode'
    },
    initialize: function({table, ranks, collapsedRanks, path, baseUrl, treeView, row}) {
        this.table = table;
        this.ranks = ranks;
        this.collapsedRanks = collapsedRanks;
        this.path = path || [];
        this.baseUrl = baseUrl;
        this.treeView = treeView;
        this.specifyModel = schema.getModel(this.table);
        this.childNodes = null;
        this.expanded = false;
        this.opened = false;
        
        // unpack the database row into fields on this object
        [this.nodeId,
         this.name,
         this.fullName,
         this.nodeNumber,
         this.highestNodeNumber,
         this.rankId,
         this.acceptedId,
         this.acceptedName,
         this.children,
         this.allCOs,
         this.directCOs
        ] = row;

        //node sort order
        this.sortField = typeof remoteprefs[this.table.toLowerCase() + ".treeview_sort_field"] === 'string' ?
            remoteprefs[this.table.toLowerCase() + ".treeview_sort_field"] : 'name';
    },
        render: function() {
            this.$el.empty();

            var parent = this.parent();
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
                    td.addClass('tree-node-cell').append('<button>');
                }
                if (foundParentRank && !foundThisRank) {
                    td.addClass('tree-horizontal-edge');
                }
                return td[0];
            }, this);
            this.$el.append(cells).data('view', this);

            this.$('.tree-node-cell button')
                .attr('role','none')
                .attr('aria-pressed',false)
                .attr('class','fake-link')
                .append(`
                    <span class="ui-icon expander"></span>
                    <span class="expander tree-node-name"></span>
                    <span class="stats"></span>
                `);
            this.$('.tree-node-name').text(this.name)
                .addClass(this.acceptedId != null ? 'tree-synonym-node' : '')
                .attr('title', this.acceptedId != null ? `${treeText('acceptedName')} ${this.acceptedName}` : '');

            this.setupExpander();
            this.adjustCollapsed();

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
            this.$('.expander')
                .parent()
                .removeClass('open close leaf')
                .addClass(this.children > 0 ? 'open' : 'leaf')
                .attr('aria-pressed', 'false')
                .attr(
                    'aria-label',
                    this.children > 0 ?
                        treeText('closed') :
                        treeText('leafNode')
                );
        },
    adjustCollapsed: function() {
        const collapsed = this.collapsedRanks[this.ranks.indexOf(this.rankId)];
        this.$('.tree-node-name, .stats')[collapsed ? 'hide' : 'show']();
    },
    updateCollapsed: function(collapsedRanks) {
        this.collapsedRanks = collapsedRanks;
        this.adjustCollapsed();
        this.childNodes && this.childNodes.forEach(n => n.updateCollapsed(collapsedRanks));
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
                if (this.opened) {
                    this.closeNode();
                } else {
                    const parent = this.parent();
                    if(typeof parent === 'undefined')
                        return;
                    next = cells.index(parent.$('.tree-node-name'));
                }
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
        renderStats: function() {
            if (this.stats != null && this.acceptedId == null) {
                const childCOs = this.stats.all - this.stats.direct;
                this.$('.tree-node-cell .stats').text(` (${this.stats.direct + (childCOs > 0 ? ', ' + childCOs : '')})`);
            }
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
            this.children === 0 || this.opened || this._openNode();
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
            this.$('.expander')
                .parent()
                .removeClass('open')
                .addClass('wait')
                .attr('aria-pressed','mixed')
                .attr('aria-label',commonText('loading'));
            return $.getJSON(this.baseUrl + this.nodeId + '/' + this.sortField + '/').pipe(this.gotChildren.bind(this));
        },
        gotChildren: function(childRows) {
            this.loadStats();
            return this.childNodes = childRows.map(row => new TreeNodeView({
                treeView: this.treeView,
                baseUrl: this.baseUrl,
                table: this.table,
                row: row,
                ranks: this.ranks,
                collapsedRanks: this.collapsedRanks,
                path: this.path.concat(this)
            }));
        },
        loadStats: function() {
            this.statsPromise =
                Q(this.shouldDoStats() ? $.getJSON(this.baseUrl + this.nodeId + '/stats/') : [])
                .then(stats =>
                      _.object(stats.map(
                          ([nodeId, directCount, allCount]) => [nodeId, {direct: directCount, all: allCount}])));
        },
        isLastChild: function() {
            var parent = this.parent();
            return parent == null || this === _.last(parent.childNodes);
        },
        renderChildren: function(rows) {
            console.log('renderChildren', this.name);
            this.expanded = true;
            this.opened = true;
            this.$('.expander')
                .parent()
                .removeClass('open wait')
                .addClass('close')
                .attr('aria-pressed','true')
                .attr('aria-label', treeText('opened'));

            var nodes = this.childNodes.slice();
            // Have to add the nodes in reverse since they are being
            // inserted after the parent.
            nodes.reverse();
            _.each(nodes, function(node) { node.render(); });
            this.treeView.updateConformation();

            this.statsPromise.done(
                statsById => this.childNodes.forEach(
                    node => {
                        node.stats = statsById[node.nodeId];
                        node.renderStats();
                    }));
        },
        closeNode: function(event) {
            event && event.preventDefault();
            this.opened && this._closeNode();
        },
        _closeNode: function() {
            console.log('closeNode', this.name);
            this.expanded = false;
            this.opened = false;
            this.$('.expander')
                .parent()
                .removeClass('close')
                .addClass('open')
                .attr('aria-pressed','false')
                .attr('aria-label', treeText('closed'));
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
            return [this.nodeId].concat(TreeNodeView.conformation(this.childNodes));
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
        parent: function() {
            return _.last(this.path);
        }
    });

    TreeNodeView.conformation = function(nodes) {
        return _.invoke(_.where(nodes, {expanded: true}), 'conformation');
    };

export default TreeNodeView;

