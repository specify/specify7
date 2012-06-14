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
            var viewDef = specifyform.getSubViewDef(self.$el);
            var field = model.getField(fieldName);
            var props = specifyform.parseSpecifyProperties(self.$el.data('specify-initialize'));
            var icon = props.icon ? icons.getIcon(props.icon) : field.getRelatedModel().getIcon();
            var button = $('<a>').appendTo(self.el);
            self.url = self.model.viewUrl() + fieldName.toLowerCase() + '/';
            if (viewDef)
                self.url = $.param.querystring(self.url, {viewdef: viewDef.attr('name')});
            button.prop('href', self.url);
            button.append($('<img>', {'class': "specify-subviewbutton-icon", src: icon}));
            button.append('<span class="specify-subview-button-count">');
            if (field.type === 'one-to-many') {
                self.model.getRelatedObjectCount(fieldName).done(function(count) {
                    self.$('.specify-subview-button-count').text(count);
                });
            } else {
                self.model.rget(fieldName).done(function(related) {
                    self.$('.specify-subview-button-count').text(related ? 1 : 0);
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
