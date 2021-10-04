"use strict";

var $ = require('jquery');
var Backbone = require('./backbone.js');

var UIPlugin = require('./uiplugin.js');
var template = require('./templates/passwordchange.html');
const commonText = require('./localization/common').default;
const adminText = require('./localization/admin').default;

    var Dialog = Backbone.View.extend({
        __name__: "PasswordResetDialog",
        events: {
            'submit form' : 'submit'
        },
        render: function() {
            this.$el.append(template({adminText}));
            this.$el.dialog({
                modal: true,
                width: 'auto',
                title: adminText('setPassword'),
                close: function() { $(this).remove(); },
                buttons: [
                    {text: commonText('apply'), click: this.submit.bind(this)},
                    {text: commonText('cancel'), click: function() { $(this).dialog('close'); }}
                ]
            });
            return this;
        },
        submit: function(event) {
            event && event.preventDefault();
            var pass1 = this.$('input#pass1').val();
            var pass2 = this.$('input#pass2').val();

            if (pass1.length < 6) {
                alert(adminText('passwordLengthError'));
                return;
            }
            if (pass1 !== pass2) {
                alert(adminText('passwordsDoNotMatchError'));
                return;
            }
            $.post('/api/set_password/' + this.model.id + '/', {password: pass1});
            this.$el.dialog('close');
        }
    });

module.exports =  UIPlugin.extend({
        __name__: "PasswordUIPlugin",
        events: {
            'click': 'click'
        },
        render: function() {
            this.$el.attr('value', adminText('setPassword'));
            if(this.model.isNew())
                this.$el.attr(
                  'title',
                  adminText('saveUserBeforeSettingPasswordError')
                ).prop('disabled', true);
            return this;
        },
        click: function(event) {
            new Dialog({model: this.model}).render();
        }
    }, { pluginsProvided: ['PasswordUI'] });

