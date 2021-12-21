"use strict";

const $ = require('jquery');
const Q = require('q');
const Backbone = require('./backbone.js');

const UIPlugin = require('./uiplugin.js');
const schema = require('./schema.js');
const adminText = require('./localization/admin').default;
const commonText = require('./localization/common').default;

const InviteLinkView = Backbone.View.extend({
    __name__: "UserInviteLinkUI",
    initialize({user, link}) {
        this.user = user;
        this.link = link;
    },
    render() {
        this.$el.text(adminText('userInviteLinkDialogText')(this.user.get('name')));
        this.$el.append(
            $("<p>").append(
                $('<input type="text" size="40" readonly>').val(this.link)
            ));
        this.$el.dialog({
            modal: true,
            title: adminText('userInviteLinkDialogTitle'),
            close: function() { $(this).remove(); },
            buttons: {
                [commonText('close')]: function() { $(this).dialog('close'); }
            }
        });
        return this;
    }
});


module.exports =  UIPlugin.extend({
    __name__: "UserInviteLinkPlugin",
    events: {
        'click': 'clicked'
    },
    initialize: function(options) {
        this.user = options.model;
    },
    render: function() {
        this.el.setAttribute('value', adminText('createInviteLink'));
        return this;
    },
    clicked: function(event) {
        $.get(`/accounts/invite_link/${this.user.id}/`).done(link => {
            new InviteLinkView({
                user: this.user,
                link: link,
            }).render();
        });
    }
}, { pluginsProvided: ['UserInviteLinkUI'] });

