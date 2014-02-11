define([
    'jquery', 'underscore', 'd3', 'backbone', 'templates', 'schema', 'dataobjformatters'
], function($, _, d3, Backbone, templates, schema, dataobjectformatters) {
    "use strict";
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

    function makeTreeMap(parentEl) {
        var margin = {top: 40, right: 10, bottom: 10, left: 10},
            width = 960 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;

        var color = d3.scale.category20c();

        var treemap = d3.layout.treemap()
                .size([width, height])
                .sticky(true)
                .value(function(d) { return d.count; });

        var div = d3.select(parentEl).append("div")
                .attr("class", "treemap")
                .style("position", "relative")
                .style("width", (width + margin.left + margin.right) + "px")
                .style("height", (height + margin.top + margin.bottom) + "px")
                .style("left", margin.left + "px")
                .style("top", margin.top + "px");

        d3.json('/barvis/taxon_bar/', function(error, data) {
            var root = buildTree(data);
            var node = div.datum(root).selectAll(".node")
                    .data(treemap.nodes)
                    .enter().append("div")
                    .attr("class", "node")
                    .call(position)
                    .attr("title", makeName)
                    .style("background", function(d) { return d.children ? color(d.name) : null; });
                    //.text(function(d) { return d.children ? null : d.name; });
            _.defer(function() {
                $('.treemap .node').tooltip({track: true, show: false, hide: false});
            });
        });
    }

    function makeName(d) {
        return (function recur(d) {
            return (d.parent ? recur(d.parent) + ' ' : "") + d.name;
        })(d) + " " + d.count;
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
        _.each(data, function(datum) {
            var i = 0;
            var node = {
                id: datum[i++],
                parentId: datum[i++],
                name: datum[i++],
                count: datum[i++],
                children:[]
            };

            node.count > 0 && node.children.push({count: node.count, name: node.name});
            _.isNull(node.parentId) && roots.push(node);
            nodes[node.id] = node;
        });

        _.each(nodes, function(node) {
            if (!node) return;
            var parent = nodes[node.parentId];
            if (parent) {
                parent.children.push(node);
            } else {
                console.warn("taxon node with missing parent:", node);
            }
        });

        var root = roots[0];


        return root;
    }

    return Backbone.View.extend({
        __name__: "WelcomeView",
        render: function() {
            var _this = this;
            makeTreeMap(this.el);

            this.$el.append(templates.welcome());

            var log = new schema.models.SpAuditLog.LazyCollection({
                filters: { parentrecordid__isnull: true,
                           tablenum__in: userTables,
                           orderby: '-timestampcreated' }
            });

            log.fetch().done(function() {
                log.each(function(entry) {
                    new LogEntry({model: entry}).render().$el.appendTo(_this.el);
                });
            });
            return this;
        }
    });
});
