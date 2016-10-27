"use strict";
require('../css/notifications.css');

const $        = require('jquery');
const _        = require('underscore');
const Backbone = require('./backbone.js');
const moment = require('moment');

var interval;

const MessageView = Backbone.View.extend({
    className: 'notification-message',
    initialize({message}) {
        this.message = message;
    },
    render() {
        const href = '/static/depository/' + this.message.file;
        this.$el.append(
            `<span>${moment(this.message.timestamp).format('lll')}</span> Query export to CSV completed. `,
            `<a href="${href}" target="_blank">Download.</a>`
        );
        if (!this.message.read) this.$el.addClass('unread-notification');
        return this;
    }
});

module.exports = Backbone.View.extend({
    __name__: "NotificationsUI",
    events: {
        'click': 'openMessages'
    },
    initialize() {
        this.messages = [];
        this.fetchInitial();
    },
    render() {
        this.$el.empty().append(`Notifications: ${this.messages.length}`);
        if (this.messages.filter(m => !m.read).length > 0) {
            this.$el.addClass('unread-notifications');
        } else {
            this.$el.removeClass('unread-notifications');
        }
        return this;
    },
    fetchInitial() {
        $.get('/notifications/messages/').done(messages => {
            this.messages.push(...messages);
            this.render();
            interval = 5000;
            window.setTimeout(() => this.fetchMore(), interval);
        });
    },
    fetchMore() {
        const params = this.messages.length > 0 ? {since: _.last(this.messages).timestamp} : {};
        $.get('/notifications/messages/', params).done(newMessages => {
            this.messages.push(...newMessages);
            this.render();
            window.setTimeout(() => this.fetchMore(), interval);
        }).fail(jqxhr => jqxhr.errorHandled = true);
    },
    openMessages() {
        $('<div>').append(
            this.messages.map(m => new MessageView({message: m}).render().el).reverse()
        ).dialog({
            title: 'Notifications',
            maxHeight: 400
        });
        this.messages.forEach(m => m.read = true);
        this.render();
        $.post('/notifications/mark_read/', {last_seen: _.last(this.messages).timestamp})
            .fail(jqxhr => jqxhr.errorHandled = true);
    }
});
