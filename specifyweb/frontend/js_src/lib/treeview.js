"use strict";
require('../css/tree.css');

var $         = require('jquery');
var _         = require('underscore');
var Backbone  = require('./backbone.js');

var schema       = require('./schema.js');
var domain       = require('./domain.js');
var NotFoundView = require('./notfoundview.js');
var navigation   = require('./navigation.js');
var app          = require('./specifyapp.js');
var querystring  = require('./querystring.js');
var TreeNodeView = require('./treenodeview.js');

const contextMenuBuilder = require('./treectxmenu.js');
const userInfo = require('./userinfo.js');
const remoteprefs  = require('./remoteprefs.js');
const cookies = require('./cookies.js');
const treeText = require('./localization/tree').default;
const commonText = require('./localization/common').default;

    var TreeHeader = Backbone.View.extend({
        __name__: "TreeHeader",
        className: "tree-header",
        tagName: "thead",
        events: {
            'click th': 'collapseExpand'
        },
        initialize: function(options) {
            this.treeDefItems = options.treeDefItems;
            this.collapsedRanks = options.collapsedRanks;
        },
        render: function() {
            var headings = this.treeDefItems.map(
                (tdi, i) => $('<th>').append(
                    $('<div>')
                        .addClass(this.collapsedRanks[i] ? 'tree-header-collapsed' : '')
                        .text(tdi.get('title') || tdi.get('name'))
                )[0]
            );

            $('<tr>').append(headings).appendTo(this.$el.empty());
            return this;
        },
        collapseExpand: function(evt) {
            evt.preventDefault();
            const i = this.$('th').index(evt.currentTarget);
            this.collapsedRanks[i] = !this.collapsedRanks[i];
            this.render();
            this.trigger('updateCollapsed', this.collapsedRanks);
        }
    });

    var TreeView = Backbone.View.extend({
        tagName: 'section',
        __name__: "TreeView",
        className: "tree-view content-no-shadow",
        events: {
            'autocompleteselect': 'search',
            'click .tree-conform-save': 'setDefaultConformation',
            'click .tree-conform-restore': 'restoreDefaultConformation',
            'click .tree-conform-forget': 'forgetDefaultConformation'
        },
        initialize: function(options) {
            this.table = options.table;
            this.treeDef = options.treeDef;
            this.treeDefItems = options.treeDefItems.models;

            const storedCollapsedRanks = window.localStorage.getItem(
                `TreeView.ranksCollapsed.${this.table}.${this.treeDef.id}.${userInfo.id}`);
            this.collapsedRanks = storedCollapsedRanks ? JSON.parse(storedCollapsedRanks) : this.treeDefItems.map(() => false);

            this.ranks = _.map(this.treeDefItems, function(tdi) { return tdi.get('rankid'); });
            this.baseUrl = '/api/specify_tree/' + this.table + '/' + this.treeDef.id + '/';
            this.currentAction = null;
            this.header = new TreeHeader({treeDefItems: this.treeDefItems, collapsedRanks: this.collapsedRanks});

            this.header.on('updateCollapsed', this.updateCollapsed, this);

            //node sort order
            this.sortField = typeof remoteprefs[this.table.toLowerCase() + ".treeview_sort_field"] === 'string' ?
                remoteprefs[this.table.toLowerCase() + ".treeview_sort_field"] : 'name';

        },
        render: function() {
            this.$el.data('view', this);
            this.$el.contextMenu({
                selector: ".tree-node .expander",
                build: contextMenuBuilder(this)
            });
            app.setTitle(
                treeText('treeViewTitle')(
                    schema.getModel(this.table).getLocalizedName()
                )
            );
            const controls = $('<header class="tree-controls"></header>');
            controls.appendTo(this.el);
            $('<h1>').text(commonText('trees')).appendTo(controls);
            controls.append(this.makeSearchBox());
            controls.append(this.makeBtns());
            $('<table>').appendTo(this.el).append(
                this.header.render().el,
                $('<tfoot>').append(_.map(this.ranks, function() { return $('<th>')[0]; })),
                `<tbody><tr class="loading"><td>${commonText('loadingInline')}</td></tr></tbody>`
            );
            this.$('tr.loading').append(new Array(this.ranks.length-1).fill('<td>'));
            this.getRows();
            return this;
        },
        getRows: function() {
            $.getJSON(this.baseUrl + 'null/' + this.sortField + '/').done(this.gotRows.bind(this));
        },
        getDefaultConformPrefName: function() {
            return userInfo.id + '.' + this.table.toLowerCase() + '.' + this.treeDef.id + '.default_initial_conformation';
        },
        gotRows: function(rows) {
            this.roots = rows.map(row => new TreeNodeView({
                row: row,
                table: this.table,
                ranks: this.ranks,
                collapsedRanks: this.collapsedRanks,
                baseUrl: this.baseUrl,
                treeView: this
            }));
            this.$('tbody').empty();
            _.invoke(this.roots, 'render');
            var params = querystring.deparam();
            if (!params.conformation) {
                var conformation  = typeof remoteprefs[this.getDefaultConformPrefName()] === 'string' ?
                        remoteprefs[this.getDefaultConformPrefName()] : params.conformation;
            } else {
                conformation = params.conformation;
            }
            conformation && this.applyConformation(conformation);
        },
        getDefaultConformation: function() {
            //return remoteprefs[this.getDefaultConformPrefName()];
            return cookies.readCookie(this.getDefaultConformPrefName());
        },
        restoreDefaultConformation: function() {
            //so that there are no open nodes that are not open in the default...
            //this.applyConformation("~-");
            _.each(this.roots, function(root) {
                _.each(root.childNodes, function(node) {
                    node.remove();
                });
                root.closeNode();
                root.childNodes = null;
            });
            var conformation = this.getDefaultConformation();
            conformation && this.applyConformation(conformation);
        },
        setDefaultConformation: function() {
            var serialized = JSON.stringify(TreeNodeView.conformation(this.roots));
            var encoded = serialized.replace(/\[/g, '~').replace(/\]/g, '-').replace(/,/g, '');
            //remoteprefs[this.getDefaultConformPrefName()] = encoded;
            cookies.createCookie(this.getDefaultConformPrefName(), encoded);
        },
        forgetDefaultConformation: function() {
            cookies.eraseCookie(this.getDefaultConformPrefName());
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
            return $(`<input class="tree-search" type="search" placeholder="${treeText('searchTreePlaceholder')}" tabindex="1">`).autocomplete({
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
        makeBtns: function() {
            return $(`
                <button type="button" class="tree-conform-save" tabindex="2" title="${treeText('rememberButtonDescription')}">${treeText('remember')}</button>
                <button type="button" class="tree-conform-restore" tabindex="3" title="${treeText('restoreButtonDescription')}">${treeText('restore')}</button>
                <button type="button" class="tree-conform-forget" tabindex="4" title="${treeText('forgetButtonDescription')}">${treeText('forget')}</button>`);
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
        reOpenTree: function() {
            this.roots.forEach(root => root.remove());
            this.getRows();
        },
        updateCollapsed: function(collapsedRanks) {
            this.collapsedRanks = collapsedRanks;
            window.localStorage.setItem(`TreeView.ranksCollapsed.${this.table}.${this.treeDef.id}.${userInfo.id}`,
                                        JSON.stringify(collapsedRanks));

            this.roots.forEach(r => r.updateCollapsed(this.collapsedRanks));
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


