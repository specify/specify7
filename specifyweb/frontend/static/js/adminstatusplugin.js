define(['jquery', 'uiplugin'], function($, UIPlugin) {
    "use strict";

    return UIPlugin.extend({
        __name__: "AdminStatusPlugin",
        events: {
            'click': 'clicked'
        },
        initialize: function(options) {
            this.user = options.model;
            this.isAdmin = this.user.get('isadmin');
        },
        render: function() {
            this.$el.attr('value', this.isAdmin ? 'Remove Admin' : 'Make Admin');
            this.user.isNew() && this.$el.attr('title', 'Save user first.').prop('disabled', true);
            return this;
        },
        clicked: function(event) {
            var _this = this;
            $.post('/api/set_admin_status/' + this.user.id + '/', {admin_status: !this.isAdmin}).done(function(resp) {
                _this.isAdmin = resp == 'true';
                _this.render();
            });
        }
    });
});
