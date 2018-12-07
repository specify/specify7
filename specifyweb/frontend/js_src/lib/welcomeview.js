"use strict";
require('../css/welcome.css');

var $        = require('jquery');
var _        = require('underscore');
var d3       = require('d3');
var Backbone = require('./backbone.js');

var app    = require('./specifyapp.js');
var schema               = require('./schema.js');
var prefs                = require('./remoteprefs.js');
var dataobjectformatters = require('./dataobjformatters.js');
var systemInfo           = require('./systeminfo.js');
var template             = require('./templates/welcome.html');
var aboutspecify         = require('./templates/aboutspecify.html');

    var DO_TAXON_TILES = prefs['sp7.doTaxonTiles'] == "true";

    var ACTION = ['Added', 'Modified', 'Deleted'];

    function format(resource) { return dataobjectformatters.format(resource); }

    var userTables = _.chain(schema.models).where({system: false}).pluck('tableId').value().join(',');

    var LogEntry = Backbone.View.extend({
        __name__: "AuditLogEntryView",
        className: "specify-auditlog-entry",
        render: function() {
            var action = ACTION[this.model.get('action')];

            var specifyModel = schema.getModelById(this.model.get('tablenum'));
            var icon = specifyModel.getIcon();

            var header = $('<h3><a class="intercept-navigation"></a></h3>').appendTo(this.el);

            icon && $('<img>', {src: icon, title: specifyModel.getLocalizedName()})
                .appendTo($('a', header));

            var content = $('<p>-- ' + action + ' by <span/> at '
                            + this.model.get('timestampcreated')
                            + '</p>').appendTo(this.el);

            this.model.rget('createdbyagent').pipe(format).done(function(formatted) {
                $('span', content).text(formatted || 'Unknown');
            });

            var id = this.model.get('recordid');
            if (_.isNumber(id)) {
                var resource = new specifyModel.Resource({ id: id });

                resource.fetch().pipe(
                    function() { return format(resource); },
                    function(jqXHR) {
                        if (jqXHR.status === 404) {
                            jqXHR.errorHandled = true;
                            return '(deleted)';
                        }
                        return jqXHR;
                    }
                ).done(function() {
                    specifyModel.view && $('a', header).attr('href', resource.viewUrl());
                }).always(function(formatted) {
                    $('a', header).append(formatted || specifyModel.getLocalizedName());
                });
            } else {
                $('a', header).append(specifyModel.getLocalizedName());
            }

            return this;
        }
    });

    function makeTreeMap() {
        var width = $('#taxon-treemap').width();
        var height = $('#taxon-treemap').height();

        var color = d3.scale.category20c();

        var treemap = d3.layout.treemap()
                .size([width, height])
                .sort(function(a, b) { return b.id - a.id; })
                .value(function(d) { return d.count; });

        var div = d3.select("#taxon-treemap").append("div")
                .attr("class", "treemap")
                .style("position", "relative")
                .style("width", width + "px")
                .style("height", height + "px");

        var genusTreeDefItem = new schema.models.TaxonTreeDefItem.LazyCollection({
            filters: {name: "Genus"} });

        var getGenusRankID = genusTreeDefItem.fetch({limit: 1}).pipe(function() {
            return genusTreeDefItem.length > 0 ? genusTreeDefItem.at(0).get('rankid') : null;
        });

        var getTreeData = $.getJSON('/barvis/taxon_bar/');

        $.when(getTreeData, getGenusRankID).done(function buildFromData(data, genusRankID) {
            var tree = buildTree(data[0]);
            var root = tree[0];
            var thres = tree[1];
            var makeName;

            if (_.isNull(genusRankID)) {
                makeName = function(d) {
                    return (function recur(d) {
                        return d.parent ? recur(d.parent) + ' ' + d.name : "";
                    })(d.parent) + " " + d.count;
                };
            } else {
                makeName = function(d) {
                    var name = (d.rankId <= genusRankID) ? d.name :
                            (function recur(d) {
                                return (d.parent && d.rankId >= genusRankID) ? recur(d.parent) + ' ' + d.name : "";
                            })(d.parent);

                    name === "" && console.error("empty name for", d, "with rankId", d.rankId);
                    return name + " " + d.count;
                };
            }

            var node = div.selectAll(".node")
                    .data(treemap.nodes(root).filter(function(d) { return !d.children; }))
                    .enter()
                    .append("div")
                    .attr("class", "node")
                    .call(position)
                    .attr("title", makeName)
                    .style("background", function(d) { return d.children ? null : color(d.name); });

            _.defer(function addToolTips() {
                $('.treemap .node').tooltip({track: true, show: false, hide: false});
            });

            $('<p>', { title: "Showing Taxa with " + thres + " or more Collection Objects" })
                .text("Taxon Tiles")
                .appendTo(div[0])
                .tooltip({track: true, show: false, hide: false});
        });
    }


    function position() {
        this.style("left", function(d) { return d.x + "px"; })
            .style("top", function(d) { return d.y + "px"; })
            .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
            .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
    }

    function buildTree(data) {
        var roots = [];
        var nodes = [];
        var histo = [];

        _.each(data, function(datum) {
            var i = 0;
            var node = {
                id: datum[i++],
                rankId: datum[i++],
                parentId: datum[i++],
                name: datum[i++],
                count: datum[i++],
                children:[]
            };

            // node.count > 0 && node.children.push({count: node.count, name: node.name});
            _.isNull(node.parentId) && roots.push(node);
            nodes[node.id] = node;
            histo[node.count] = (histo[node.count] || 0) + 1;
        });

        // This is to try to limit the number of treemap squares to ~1000. For some
        // reason it doesn't quite do that, but since this is just for eye candy
        // anyways, it seems to work well enough.

        var thres = histo.length - 1;
        for (var total = 0; thres > 0; thres--) {
            total += (histo[thres] || 0);
            if (total > 1000) break;
        }

        _.each(nodes, function(node) {
            if (!node || !node.parentId) return;
            var parent = nodes[node.parentId];
            if (parent) {
                parent.children.push(node);
            } else {
                console.warn("taxon node with missing parent:", node);
            }
        });


        function pullUp(node) {
            if (node.children) {
                var children = [];
                var thisCount = node.count;
                var total = node.count;
                _.each(node.children, function(child) {
                    var childCount = pullUp(child);
                    total += childCount;
                    if (childCount < thres) {
                        thisCount += childCount;
                    } else {
                        children.push(child);
                    }
                });
                if (thisCount > thres) {
                    // if (thisCount < thres) {
                    //     children = [{count: total, name: node.name}];
                    // } else {
                        children.push({count: thisCount, name: node.name, rankId: node.rankId});
                    // }
                }
                node.children = children;
                return total;
            } else {
                return node.count;
            }
        }


        var root = roots[0];
        pullUp(root);
        return [root, thres];
    }

    function showRecentActivity(view) {
        var log = new schema.models.SpAuditLog.LazyCollection({
            filters: { parentrecordid__isnull: true,
                       tablenum__in: userTables,
                       orderby: '-timestampcreated' }
        });

        log.fetch({limit: 5}).done(function() {
            log.each(function(entry) {
                new LogEntry({model: entry}).render().$el.appendTo(view.el);
            });
        });
    }

    var WelcomeView = Backbone.View.extend({
        __name__: "WelcomeView",
        className: "specify-welcome",
        events: {
            'click #about-specify': 'showAboutDialog'
        },
        render: function() {
            this.$el.append(template({doTaxonTiles: DO_TAXON_TILES}));
            DO_TAXON_TILES && _.defer(makeTreeMap);

            // showRecentActivity(this);

            return this;
        },
        showAboutDialog: function(evt) {
            evt.preventDefault();
            $(aboutspecify(systemInfo)).dialog({
                title: "About Specify",
                width: 480,
                close: function() { $(this).remove(); }
            });
        }
    });


module.exports = function() {
    app.setCurrentView(new WelcomeView());
    app.setTitle('Welcome');
};
