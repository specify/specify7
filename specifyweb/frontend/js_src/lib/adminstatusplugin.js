"use strict";

var $ = require('jquery');
var UIPlugin = require('./uiplugin.js');

const adminText = require('./localization/admin').default;


module.exports =  UIPlugin.extend({
        __name__: "AdminStatusPlugin",
        events: {
            'click': 'clicked'
        },
        initialize: function(options) {
            this.user = options.model;
        },
        render: function() {
            this.user.fetch().done(this._render.bind(this));
            return this;
        },
        _render: function() {
            this.isAdmin = this.user.get('isadmin');
            this.$el.attr(
              'value',
              this.isAdmin ?
                adminText('removeAdmin') :
                adminText('makeAdmin')
            ).prop('disabled', false);
            if(this.user.isNew())
              this.$el.attr(
                'title',
                adminText('saveUserFirst')
              ).prop('disabled', true);
            if (this.user.get('usertype') != 'Manager') {
                this.$el.attr(
                  'title',
                  adminText('mustBeManager')
                ).prop('disabled', true);
            }
        },
        clicked: function(event) {
            var _this = this;
            $.post('/api/set_admin_status/' + this.user.id + '/', {admin_status: !this.isAdmin}).done(function(resp) {
                _this.isAdmin = resp == 'true';
                _this.render();
            });
        }
    }, { pluginsProvided: ['AdminStatusUI'] });

