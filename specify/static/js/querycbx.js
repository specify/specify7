define([
    'jquery', 'underscore', 'backbone', 'specifyapi', 'specifyform',
    'text!/static/resources/typesearch_def.xml',
    'text!/static/html/templates/querycbx.html',
    'jquery-ui'
], function ($, _, Backbone, api, specifyform, xml, html) {
    var typesearches = $.parseXML(xml);

    return Backbone.View.extend({
        events: {
            'click .querycbx-edit': 'nav',
            'click .querycbx-add': 'nav',
            'autocompleteselect': 'select'
        },
        nav: function (evt) {
            evt.preventDefault();
            var url = $(evt.currentTarget).attr('href');
            url && Backbone.history.navigate(url.replace('/specify/', ''), true);
        },
        select: function (event, ui) {
            var resource = ui.item.resource;
            this.model.set(this.fieldName, resource.url());
            this.$('.querycbx-edit').attr('href', resource.viewUrl());
        },
        render: function () {
            var self = this;
            var control = self.$el;
            var querycbx = $(html);
            control.replaceWith(querycbx);
            self.setElement(querycbx);
            self.$('input').replaceWith(control);
            self.fieldName = control.attr('name');
            self.$('.querycbx-add').prop('href', self.model.viewUrl() + self.fieldName + '/new/');

            var init = specifyform.parseSpecifyProperties(control.data('specify-initialize')),
            typesearch = $('[name="'+init.name+'"]', typesearches), // defines the querycbx
            searchfield = typesearch.attr('searchfield'),
            displaycols = typesearch.attr('displaycols').split(','),
            format = typesearch.attr('format');

            control.prop('readonly') && self.$('a').hide();

            // format the query results according to formatter in the typesearch
            var formatInterpolate = function (resource) {
                var str = format;
                _.chain(displaycols).map(function(col)  {
                    return resource.get(col);
                }).each(function (val) {
                    str = str.replace(/%s/, val);
                });
                return str;
            };

            control.autocomplete({
                minLength: 3,
                source: function (request, response) {
                    var collection = api.queryCbxSearch(init.name, searchfield, request.term);
                    collection.fetch().done(function() {
                        response(collection.chain().compact().map(function(resource) {
                            var display = formatInterpolate(resource);
                            return { label: display, value: display, resource: resource };
                        }).value());
                    }).fail(function() { response([]); });
                }
            });

            self.model.rget(self.fieldName, true).pipe(function(related) {
                if (related) {
                    self.$('.querycbx-edit').attr('href', related.viewUrl());
                    control.val(formatInterpolate(related));
                }
            });
            return this;
        }
    });
});
