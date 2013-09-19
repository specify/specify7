define([
    'jquery', 'underscore', 'backbone', 'templates', 'schema', 'dataobjformatters'
], function($, _, Backbone, templates, schema, dataobjectformatters) {
    "use strict";
    var ACTION = ['Added', 'Modified', 'Deleted'];

    function format(resource) { return dataobjectformatters.format(resource); }

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

            if (action !== 'Deleted') {
                var resource = new specifyModel.Resource({ id: this.model.get('recordid') });

                resource.fetch().pipe(
                    function() { return format(resource); },
                    function(jqXHR) { jqXHR.errorHandled = true; }
                ).done(function(formatted) {
                    var link = $('a', header).append(formatted || '');
                    specifyModel.view && link.attr('href', resource.viewUrl());
                });
            }
            return this;
        }
    });

    return Backbone.View.extend({
        __name__: "WelcomeView",
        render: function() {
            var _this = this;
            this.$el.append(templates.welcome());

            var log = new schema.models.SpAuditLog.LazyCollection({
                filters: { parentrecordid__isnull: true, orderby: '-timestampcreated' }
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
