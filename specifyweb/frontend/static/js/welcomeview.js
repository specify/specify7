define([
    'jquery', 'underscore', 'backbone', 'templates', 'schema', 'dataobjformatters'
], function($, _, Backbone, templates, schema, dataobjectformatters) {
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

    return Backbone.View.extend({
        __name__: "WelcomeView",
        render: function() {
            var _this = this;
            var bar = $('<div class="specify-barvis">').appendTo(this.el);
            $.get('/barvis/taxon_bar/').done(function(taxonBarData) {
                function f(x) { return x; }
                var total = _.reduce(taxonBarData, function(memo, idAndCount) { return memo + f(idAndCount[1]); }, 0);
                _.each(taxonBarData, function(idAndCount) {
                    var id = idAndCount[0], count = idAndCount[1];
                    var hue = (id % 12) * 30;
                    $('<div class="specify-barvis-bar">').appendTo(bar)
                        .width(f(count)/total*800)
                        .css("background-color", "hsl(" + hue + ",50%,50%)");
                });
            });

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
