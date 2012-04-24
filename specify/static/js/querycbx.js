define([
    'jquery', 'underscore', 'backbone', 'specifyapi', 'schema', 'specifyform',
    'dataobjformatters', 'whenall', 'parseselect', 'schemalocalization',
    'text!/static/resources/typesearch_def.xml',
    'text!/static/resources/dialog_defs.xml',
    'text!/static/html/templates/querycbx.html',
    'jquery-ui'
], function ($, _, Backbone, api, schema, specifyform, dataobjformat, whenAll, parseselect, schemalocalization,
             typesearchxml, dialogdefxml, html) {
    var typesearches = $.parseXML(typesearchxml);
    var dialogdefs = $.parseXML(dialogdefxml);

    return Backbone.View.extend({
        events: {
            'click .querycbx-edit': 'nav',
            'click .querycbx-add': 'nav',
            'click .querycbx-search': 'search',
            'autocompleteselect': 'select',
            'blur input': 'fillIn'
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
            control.prop('readonly') && self.$('a').hide();

            var init = specifyform.parseSpecifyProperties(control.data('specify-initialize'));
            self.typesearch = $('[name="'+init.name+'"]', typesearches); // defines the querycbx

            var typesearchTxt = self.typesearch.text().trim();
            var mapF = !typesearchTxt ? function(x) { return x; } :
                _.bind(parseselect.colToField, parseselect, parseselect.parse(typesearchTxt));
            self.displaycols = _(self.typesearch.attr('displaycols').split(',')).map(mapF);

            var field = self.model.specifyModel.getField(self.fieldName);
            self.relatedModel = field.getRelatedModel();
            var searchField = self.relatedModel.getField(self.typesearch.attr('searchfield'));
            control.attr('title', 'Searches: ' + searchField.getLocalizedName());

            control.autocomplete({
                minLength: 3,
                source: function (request, response) {
                    var collection = api.queryCbxSearch(self.relatedModel, searchField.name, request.term);
                    collection.fetch().pipe(function() {
                        var rendering = collection.chain().compact().map(_.bind(self.renderItem, self)).value();
                        return whenAll(rendering).done(response);
                    }).fail(function() { response([]); });
                }
            });

            this.fillIn();
            return this;
        },
        fillIn: function () {
            var self = this;
            self.model.rget(self.fieldName, true).done(function(related) {
                if (related) {
                    self.$('.querycbx-edit').attr('href', related.viewUrl());
                    self.renderItem(related).done(function(item) {
                        self.$('input').val(item.value);
                    });
                }
            });
        },
        renderItem: function (resource) {
            var str = this.typesearch.attr('format');
            var rget = _.bind(resource.rget, resource);
            var buildLabel = str &&
                whenAll(_(this.displaycols).map(rget)).pipe(function(vals) {
                    _(vals).each(function (val) { str = str.replace(/%s/, val); });
                    return str;
                });
            var buildValue = dataobjformat(resource, this.typesearch.attr('dataobjformatter'));
            return $.when(buildLabel, buildValue).pipe(function(label, value) {
                return { label: label || value, value: value, resource: resource };
            });
        },
        search: function(event, ui) {
            event.preventDefault();
            var dialogDef = $('dialog[type="search"][name="' + this.relatedModel.searchDialog + '"]', dialogdefs);
            var form = $(specifyform.buildViewByName(dialogDef.attr('view')));
            schemalocalization.localizeForm(form);
            form.find('.specify-form-header, input[value="Delete"], :submit').remove();
            $('<div title="Search">').append(form).dialog({
                width: 'auto',
                buttons: [
                    { text: "Search", click: function() {} }
                ],
                close: function() {
                    $(this).remove();
                }
            });
        }
    });
});
