"use strict";
import '../css/tree.css';

import $ from 'jquery';
import _ from 'underscore';
import Backbone from './backbone';

import schema from './schema';
import { getTreeDef } from './domain';
import NotFoundView from './notfoundview';
import * as navigation from './navigation';
import * as app from './specifyapp';
import * as querystring from './querystring';
import TreeNodeView from './treenodeview';

import contextMenuBuilder from './treectxmenu';
import userInfo from './userinfo';
import remoteprefs from './remoteprefs';
import { readCookie, createCookie, eraseCookie } from './cookies';
import treeText from './localization/tree';
import commonText from './localization/common';
import autocomplete from './autocomplete';

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
                (tdi, i) => $('<th>', {scope: 'col'}).append(
                    $('<button>', {class:'fake-link'})
                    .append($('<span></span>')
                        .addClass(this.collapsedRanks[i] ? 'tree-header-collapsed' : '')
                        .text(tdi.get('title') || tdi.get('name'))
                    )
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
            'change input': 'search',
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
        title(){
            return treeText('treeViewTitle')(
              schema.getModel(this.table).getLocalizedName()
            );
        },
        render: function() {
            this.$el.data('view', this);
            this.$el.contextMenu({
                selector: ".tree-node .expander",
                build: contextMenuBuilder(this)
            });
            const controls = $('<header class="tree-controls"></header>');
            controls.appendTo(this.el);
            $('<h2>').text(commonText('trees')).appendTo(controls);
            const searchBox = this.makeSearchBox();
            controls.append(searchBox);
            this.configureAutocomplete(searchBox);
            controls.append(this.makeBtns());
            $(`<div class="tree-table"></div>`).append(
                $('<table>')
                    .prop('aria-live','polite')
                    .append(
                        this.header.render().el,
                        $('<tfoot>').append(_.map(this.ranks, function() { return $('<th>')[0]; })),
                        `<tbody><tr class="loading"><td>${commonText('loadingInline')}</td></tr></tbody>`
                    )
            ).appendTo(this.el);
            this.$('tr.loading').append(new Array(this.ranks.length-1).fill('<td>'));
            this.getRows();
            return this;
        },
        remove(){
            this.autocomplete?.();
            Backbone.View.prototype.remove.call(this);
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
            return readCookie(this.getDefaultConformPrefName());
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
            createCookie(this.getDefaultConformPrefName(), encoded);
        },
        forgetDefaultConformation: function() {
            eraseCookie(this.getDefaultConformPrefName());
        },
        search: function(event) {
            this.$('.tree-search').blur();
            var roots = this.roots;
            const nodeId = this.autocompleteResults[event.target.value];
            if(typeof nodeId === 'undefined')
                return;
            $.getJSON('/api/specify_tree/' + this.table + '/' + nodeId + '/path/').done(function(path) {
                var nodeIds = _(path).chain().values()
                        .filter(function(node) { return node.rankid != null; })
                        .sortBy(function(node) { return node.rankid; })
                        .pluck('id').value();
                _.invoke(roots, 'openPath', nodeIds);
            });
        },
        makeSearchBox: function() {
            return $(`<input
                class="tree-search"
                type="search"
                autocomplete="on"
                placeholder="${treeText('searchTreePlaceholder')}"
                title="${treeText('searchTreePlaceholder')}"
                aria-label="${treeText('searchTreePlaceholder')}"
            >`);
        },
        configureAutocomplete(searchBox){
            const tree = schema.getModel(this.table);
            this.autocomplete = autocomplete({
                input: searchBox[0],
                source: (request)=>new Promise(resolve=>{
                    const collection = new tree.LazyCollection({
                        filters: { name__istartswith: request.term, orderby: 'name' },
                        domainfilter: true
                    });
                    collection.fetch().pipe(()=>{
                        this.autocompleteResults = {};
                        const items = Object.fromEntries(collection.map((node)=>{
                            this.autocompleteResults[node.get('fullname')] = node.id;
                            const rankDefinition = this.treeDefItems.find(rank=>
                              rank.get('rankid') === node.get('rankid')
                            );
                            const rankName =
                              rankDefinition?.get('title')
                              ?? rankDefinition?.get('name')
                              ?? node.get('name');
                            return [node.get('fullname'), rankName];
                        }));
                        resolve(items);
                    });
                }),
            });
        },
        makeBtns: function() {
            return $(`
                <button
                    type="button"
                    class="tree-conform-save"
                    title="${treeText('rememberButtonDescription')}"
                >${treeText('remember')}</button>
                <button
                    type="button"
                    class="tree-conform-restore"
                    title="${treeText('restoreButtonDescription')}"
                >${treeText('restore')}</button>
                <button
                    type="button"
                    class="tree-conform-forget"
                    title="${treeText('forgetButtonDescription')}"
                >${treeText('forget')}</button>`);
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

export default function(table) {
    var getTreeDef = getTreeDef(table);
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


