"use strict";

var $ = require('jquery');
var Backbone = require('./backbone.js');

var UIPlugin = require('./uiplugin.js');
var template = require('./templates/passwordchange.html');

    var Dialog = Backbone.View.extend({
        __name__: "PasswordResetDialog",
        events: {
            'submit form' : 'submit'
        },
        render: function() {
            this.$el.attr('title', "Set Password");
            this.$el.append(template());
            this.$el.dialog({
                modal: true,
                width: 'auto',
                close: function() { $(this).remove(); },
                buttons: [
                    {text: 'Set', click: this.submit.bind(this)},
                    {text: 'Cancel', click: function() { $(this).dialog('close'); }}
                ]
            });
            return this;
        },
        submit: function(event) {
            event && event.preventDefault();
            var pass1 = this.$('input[name="pass1"]').val();
            var pass2 = this.$('input[name="pass2"]').val();

            if (pass1.length < 6) {
                alert("Password must have at least six characters.");
                return;
            }
            if (pass1 !== pass2) {
                alert("Passwords do not match.");
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
            this.$el.attr('value', 'Set Password');
            this.model.isNew() && this.$el.attr('title', 'Save user before setting password.').prop('disabled', true);
            return this;
        },
        click: function(event) {
            new Dialog({model: this.model}).render();
        }
    }, { pluginsProvided: ['PasswordUI'] });

