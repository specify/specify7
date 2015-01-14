define([
    'jquery', 'underscore', 'backbone', 'schema', 'domain', 'notfoundview', 'recordselector'
], function($, _, Backbone, schema, domain, NotFoundView, RecordSelector) {
    "use strict";

    var TreeNodeView = Backbone.View.extend({
        __name__: "TreeNodeView",
        tagName: "tr",
        className: "tree-node",
        events: {
            'click a.open': 'openNode',
            'click a.close': 'closeNode',
            'click a.reopen': 'reopenNode',
            'click a.direct-cos': 'showDirectCOs',
            'click a.all-cos': 'showAllCOs'
        },
        filterDefs: function() {
            return {
                taxon: {
                    direct: {
                        determinations__taxon: this.nodeId,
                        determinations__iscurrent: true},
                    all: {
                        determinations__taxon__nodenumber__gte: this.nodeNumber,
                        determinations__taxon__nodenumber__lte: this.highestNodeNumber,
                        determinations__iscurrent: true}},
                geography: {
                    direct: {
                        collectingevent__locality__geography: this.nodeId},
                    all: {
                        collectingevent__locality__geography__nodenumber__gte: this.nodeNumber,
                        collectingevent__locality__geography__nodenumber__lte: this.highestNodeNumber}},
                lithostrat: {
                    direct: {
                        paleocontext__lithostrat: this.nodeId},
                    all: {
                        paleocontext__lithostrat__nodenumber__gte: this.nodeNumber,
                        paleocontext__lithostrat__nodenumber__lte: this.highestNodeNumber}},
                storage: {
                    direct: {
                        preparations__storage: this.nodeId},
                    all: {
                        preparations__storage__nodenumber__gte: this.nodeNumber,
                        preparations__storage__nodenumber__lte: this.highestNodeNumber}},
                geologictimeperiod: {
                    direct: {
                        paleocontext__chronosstrat: this.nodeId},
                    all: {
                        paleocontext__chronosstrat__nodenumber__gte: this.nodeNumber,
                        paleocontext__chronosstrat__nodenumber__lte: this.highestNodeNumber}}
            };
        },
        initialize: function(options) {
            this.table = options.table;
            this.ranks = options.ranks;

            var i = 0;
            this.nodeId              = options.row[i++];
            this.name                = options.row[i++];
            this.fullName            = options.row[i++];
            this.nodeNumber          = options.row[i++];
            this.highestNodeNumber   = options.row[i++];
            this.rankId              = options.row[i++];
            this.children            = options.row[i++];
            this.allCOs              = options.row[i++];
            this.directCOs           = options.row[i++];

            this.path = (options.path || "") + ' nn-' + this.nodeId;
        },
        render: function() {
            var cells = _.map(this.ranks, function(rank) {
                return $('<td>', {'class': (rank == this.rankId) ? 'tree-node-cell' : undefined})[0];
            }, this);
            this.$el.addClass(this.path).append(cells);
            this.$('.tree-node-cell')
                .append('<a class="ui-icon expander">')
                .append($('<span>').text(this.name))
                .append(' (<a class="direct-cos">' + this.directCOs + '</a>,' +
                        ' <a class="all-cos">' + this.allCOs + '</a>)');

            var expander = this.$('.expander');
            if (this.children > 0) {
                expander.addClass('open ui-icon-folder-collapsed')
                    .attr('title', "" + this.children + (this.children > 1 ? " children" : " child"))
                    .text('open');
            } else {
                expander.addClass('leaf ui-icon-bullet').text('leaf');
            }
            return this;
        },
        openNode: function(event) {
            event.stopPropagation();
            this.$('.expander')
                .removeClass('open ui-icon-folder-collapsed')
                .addClass('wait ui-icon-clock')
                .text('wait');
            $.getJSON('/api/specify_tree/' + this.table + '/' + this.nodeId + '/').done(this.addChildNodes.bind(this));
        },
        addChildNodes: function(rows) {
            this.$('.expander')
                .removeClass('wait ui-icon-clock')
                .addClass('close ui-icon-folder-open')
                .text('close');
            this.$el.after(
                _.map(rows, function(row) {
                    return new TreeNodeView({ table: this.table, row: row, ranks: this.ranks, path: this.path })
                        .render().$el[0];
                }, this)
            );
        },
        closeNode: function(event) {
            event.stopPropagation();
            this.$('.expander')
                .removeClass('close ui-icon-folder-open')
                .addClass('reopen ui-icon-folder-collapsed')
                .text('reopen');
            $('.nn-' + this.nodeId).hide();
            this.$el.show();
        },
        reopenNode: function(event) {
            event.stopPropagation();
            this.$('.expander')
                .removeClass('reopen ui-icon-folder-collapsed')
                .addClass('close ui-icon-folder-open')
                .text('close');
            $('.nn-' + this.nodeId).show();
        },
        showDirectCOs: function(event) {
            event.stopPropagation();
            this.showCollectionObjects(this.filterDefs()[this.table]['direct'],
                                       this.fullName + " (" + this.directCOs + ")");
        },
        showAllCOs: function(event) {
            event.stopPropagation();
            this.showCollectionObjects(this.filterDefs()[this.table]['all'],
                                       this.fullName + " (" + this.allCOs + ")");
        },
        showCollectionObjects: function(filters, title) {
            filters.domainfilter = true;
            var collectionObjects = new schema.models.CollectionObject.LazyCollection({ filters: filters });
            new RecordSelector({
                collection: collectionObjects,
                el: $('<div>').data('specify-viewname', schema.models.CollectionObject.view),
                sliderAtTop: true,
                noHeader: true,
                readOnly: true
            }).render().$el.dialog({
                title: title,
                width: 'auto',
                position: { my: "left top", at: "left+60 top+20", of: this.$el.closest('div') },
                close: function() { $(this).remove(); }
            });
        }
    });

    var TreeHeader = Backbone.View.extend({
        __name__: "TreeHeader",
        className: "tree-header",
        tagName: "tr",
        initialize: function(options) {
            this.treeDefItems = options.treeDefItems;
        },
        render: function() {
            var headings = _.map(this.treeDefItems, function(tdi) {
                return $('<th>').text(tdi.get('name'))[0];
            }, this);
            this.$el.append(headings);
            return this;
        }
    });

    var TreeView = Backbone.View.extend({
        __name__: "TreeView",
        className: "tree-view",
        initialize: function(options) {
            this.table = options.table;
            this.treeDef = options.treeDef;
            this.treeDefItems = options.treeDefItems.models;

            this.Collection = schema.getModel(options.table).LazyCollection;
            this.ranks = _.map(this.treeDefItems, function(tdi) { return tdi.get('rankid'); });
        },
        render: function() {
            var title = schema.getModel(this.table).getLocalizedName() + " Tree";
            $('<h1>').text(title).appendTo(this.el);
            var columnDefs = $('<colgroup>').append(_.map(this.ranks, function() {
                return $('<col>', {width: (100/this.ranks.length) + '%'})[0];
            }, this));
            $('<table>').appendTo(this.el).append(
                columnDefs,
                new TreeHeader({treeDefItems: this.treeDefItems}).render().el,
                '<tr class="loading"><td>(loading...)</td></tr>'
            );
            var roots = new this.Collection({filters: {
                parent__isnull: true,
                definition: this.treeDef.id
            }});
            var baseUrl = '/api/specify_tree/' + this.table + '/';
            roots.fetch().pipe(function() {
                return $.getJSON(baseUrl + roots.at(0).id + '/');
            }).done(this.gotRows.bind(this));
            return this;
        },
        gotRows: function(rows) {
            this.$('tr.loading').remove();
            this.$('table').append(
                _.map(rows, function(row) {
                    return new TreeNodeView({ row: row, table: this.table, ranks: this.ranks })
                        .render().$el[0];
                }, this)
            );
        }
    });

    return function(app) {
        app.router.route('tree/:table/', 'tree', function(table) {
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
        });
    };
});
