define([
    'jquery', 'backbone', 'icons', 'specifyform', 'navigation', 'jquery-bbq'
], function($, Backbone, icons, specifyform, navigation) {

    return Backbone.View.extend({
        events: {
            'click a': 'click'
        },
        render: function() {
            var self = this;
            self.undelegateEvents();
            self.$el.empty();
            var model = self.options.parentModel;
            var fieldName = self.$el.data('specify-field-name');
            var viewDef = self.$el.data('specify-viewdef');
            var field = model.getField(fieldName);
            var props = specifyform.parseSpecifyProperties(self.$el.data('specify-initialize'));
            var icon = props.icon ? icons.getIcon(props.icon) :
                icons.getIcon(field.getRelatedModel().name);
            var button = $('<a>').appendTo(self.el);
            self.url = self.model.viewUrl() + fieldName.toLowerCase() + '/';
            if (viewDef)
                self.url = $.param.querystring(self.url, {viewdef: viewDef});
            button.prop('href', self.url);
            button.append($('<img>', {'class': "specify-subviewbutton-icon", src: icon}));
            if (field.type === 'one-to-many') {
                $('<span class="specify-subview-button-count">').appendTo(button);
                self.model.getRelatedObjectCount(fieldName).done(function(count) {
                    self.$('.specify-subview-button-count').text(count);
                });
            }
            button.button();
            self.delegateEvents();
        },
        click: function(evt) {
            navigation.go(this.url);
            evt.preventDefault();
        }
    });
});
