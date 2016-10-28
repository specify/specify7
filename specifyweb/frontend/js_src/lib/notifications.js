"use strict";
require('../css/notifications.css');

const $        = require('jquery');
const _        = require('underscore');
const Backbone = require('./backbone.js');
const moment = require('moment');

const INTERVAL = 5000;

const Message = Backbone.Model.extend({
    __name__: "NotificationMessage"
});

const MessageCollection = Backbone.Collection.extend({
    __name__: "NotificationMessageCollection",
    model: Message,
    fetch() {
        const params = this.length > 0 ? {since: this.last().get('timestamp')} : {};
        $.get('/notifications/messages/', params).done(newMessages => {
            this.add(newMessages);
            window.setTimeout(() => this.fetch(), INTERVAL);
        }).fail(jqxhr => jqxhr.errorHandled = true);
        return this;
    }
});

const MessageView = Backbone.View.extend({
    __name__: "NotificationMessage",
    className: 'notification-message',
    initialize({message}) {
        this.message = message;
    },
    render() {
        const href = '/static/depository/' + this.message.get('file');
        const time = moment(this.message.get('timestamp')).format('lll');
        this.$el.append(
            `<span>${time}</span><p>Query export to CSV completed. `,
            `<a href="${href}" target="_blank">Download.</a></p>`
        );
        if (!this.message.get('read')) this.$el.addClass('unread-notification');
        return this;
    }
});

const MessageList = Backbone.View.extend({
    __name__: "NotificationMessageList",
    initialize() {
        this.collection.on('add', this.render, this);
    },
    render() {
        this.$el.empty().append(
            this.collection.map(m => new MessageView({message: m}).render().el).reverse()
        );
        return this;
    },
    remove() {
        Backbone.View.prototype.remove.call(this);
        this.collection.off(null, null, this);
        this.collection.each(m => m.set('read', true));
        $.post('/notifications/mark_read/', {last_seen: this.collection.last().get('timestamp')})
            .fail(jqxhr => jqxhr.errorHandled = true);
    }
});

module.exports = Backbone.View.extend({
    __name__: "NotificationsUI",
    events: {
        'click': 'openMessages'
    },
    initialize() {
        this.collection = new MessageCollection();
        this.collection.on('add change', this.render, this).fetch();
        this.dialog = null;
    },
    render() {
        this.$el.empty().append(`Notifications: ${this.collection.length}`);
        if (this.collection.filter(m => !m.get('read')).length > 0) {
            this.$el.addClass('unread-notifications');
        } else {
            this.$el.removeClass('unread-notifications');
        }
        return this;
    },
    openMessages() {
        if (this.dialog != null) return;
        const dialog = this.dialog = new MessageList({collection: this.collection});
        this.dialog.$el.dialog({
            title: 'Notifications',
            maxHeight: 400,
            position: {my: 'center top', at: 'center bottom', of: this.$el},
            close: () => {
                this.dialog.remove();
                this.dialog = null;
            }
        });
        this.dialog.render();
    }
});
